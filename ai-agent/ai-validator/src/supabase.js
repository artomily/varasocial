import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import "dotenv/config";
import { logger } from "./logger.js";

// Service-role client bypasses RLS — never expose this key client-side.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  { auth: { persistSession: false }, realtime: { transport: ws } }
);

// ── Read helpers ───────────────────────────────────────────────────────────

/**
 * Fetch ad campaign content by its UUID (primary key).
 * @param {string} campaignId  — UUID from ad_campaigns.id
 * @returns {{ id: string, title: string, objective: string }}
 */
export async function getAdContent(campaignId) {
  const { data, error } = await supabase
    .from("ad_campaigns")
    .select("id, title, objective")
    .eq("id", campaignId)
    .single();

  if (error) {
    throw new Error(`supabase.getAdContent: ${error.message}`);
  }
  return data;
}

/**
 * Fetch the 10 most-recent posts for a user identified by their wallet address.
 * Used to assess content history for subscription (blue-check) validation.
 * @param {string} walletAddress  — checksummed or lowercase wallet address
 * @returns {{ content: string }[]}
 */
export async function getUserPosts(walletAddress) {
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id")
    .ilike("wallet_address", walletAddress)
    .single();

  if (userErr) {
    throw new Error(`supabase.getUserPosts (user lookup): ${userErr.message}`);
  }

  const { data: posts, error: postsErr } = await supabase
    .from("posts")
    .select("content")
    .eq("author_id", user.id)
    .order("created_at", { ascending: false })
    .limit(10);

  if (postsErr) {
    throw new Error(`supabase.getUserPosts (posts): ${postsErr.message}`);
  }

  return posts ?? [];
}

// ── Write helpers ──────────────────────────────────────────────────────────

/**
 * Mark an ad campaign as 'processing' when the job starts.
 * @param {string} campaignId  — UUID from ad_campaigns.id
 */
export async function setAdProcessing(campaignId) {
  const { error } = await supabase
    .from("ad_campaigns")
    .update({ status: "processing" })
    .eq("id", campaignId);

  if (error) {
    logger.warn("supabase.setAdProcessing failed", {
      campaignId,
      error: error.message,
    });
  }
}

/**
 * Finalise ad campaign row after the AI + on-chain decision.
 * @param {string} campaignId  — UUID from ad_campaigns.id
 */
export async function updateAdStatus(campaignId, isSafe, reason, txHash) {
  const { error } = await supabase
    .from("ad_campaigns")
    .update({
      status: isSafe ? "active" : "rejected",
      verified: isSafe ? true : false,
      ai_report: reason ?? null,
      tx_hash: txHash,
    })
    .eq("id", campaignId);

  if (error) {
    logger.error("supabase.updateAdStatus failed", {
      campaignId,
      error: error.message,
    });
  }
}

/**
 * Mark a user as 'processing' when their subscription validation job starts.
 */
export async function setUserProcessing(walletAddress) {
  const { error } = await supabase
    .from("users")
    .update({ verified: false })
    .ilike("wallet_address", walletAddress);

  if (error) {
    logger.warn("supabase.setUserProcessing failed", {
      walletAddress,
      error: error.message,
    });
  }
}

/**
 * Finalise user row after the subscription AI + on-chain decision.
 */
export async function updateUserStatus(walletAddress, isSafe, reason, txHash) {
  const { error } = await supabase
    .from("users")
    .update({
      verified: isSafe ? true : false,
      ai_report: reason ?? null,
      tx_hash: txHash,
    })
    .ilike("wallet_address", walletAddress);

  if (error) {
    logger.error("supabase.updateUserStatus failed", {
      walletAddress,
      error: error.message,
    });
  }
}

// ── Clone / Mode-Turu helpers ──────────────────────────────────────────────

/**
 * Fetch the post author's profile needed for clone prompting.
 * Includes is_turu flag so the worker can bail out early if mode is off.
 *
 * @param {string} authorId  UUID
 * @returns {{ id: string, display_name: string, handle: string, persona: string|null, is_turu: boolean } | null}
 */
export async function getCloneUser(authorId) {
  const { data, error } = await supabase
    .from("users")
    .select("id, display_name, handle, persona, is_turu")
    .eq("id", authorId)
    .single();

  if (error) {
    logger.warn("supabase.getCloneUser failed", { authorId, error: error.message });
    return null;
  }
  return data;
}

/**
 * Fetch the post content by id.
 *
 * @param {string} postId
 * @returns {{ id: string, content: string, author_id: string } | null}
 */
export async function getClonePost(postId) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, content, author_id")
    .eq("id", postId)
    .single();

  if (error) {
    logger.warn("supabase.getClonePost failed", { postId, error: error.message });
    return null;
  }
  return data;
}

/**
 * Fetch the 5 most-recent comments on a post (excluding the trigger comment)
 * to use as thread context in the AI prompt.
 *
 * @param {string} postId
 * @param {string} excludeCommentId  The new comment that triggered the job
 * @returns {{ author_handle: string, content: string }[]}
 */
export async function getThreadContext(postId, excludeCommentId) {
  const { data, error } = await supabase
    .from("comments")
    .select("content, author:users!author_id(handle)")
    .eq("post_id", postId)
    .neq("id", excludeCommentId)
    .order("created_at", { ascending: false })
    .limit(5);

  if (error) {
    logger.warn("supabase.getThreadContext failed", { postId, error: error.message });
    return [];
  }

  // Reverse so oldest → newest (natural reading order)
  return (data ?? [])
    .reverse()
    .map((c) => ({ author_handle: c.author?.handle ?? "unknown", content: c.content }));
}

/**
 * Fetch a single comment's content by id.
 * Internal helper used by the clone worker to retrieve the triggering comment.
 *
 * @param {string} commentId
 * @returns {{ content: string } | null}
 */
export async function getCommentContent(commentId) {
  const { data, error } = await supabase
    .from("comments")
    .select("content")
    .eq("id", commentId)
    .single();

  if (error) {
    logger.warn("supabase.getCommentContent failed", { commentId, error: error.message });
    return null;
  }
  return data;
}

/**
 * Insert an AI-generated reply comment on behalf of the post author.
 * Uses service-role client → bypasses RLS.
 *
 * @param {string} postId     Post being replied to
 * @param {string} authorId   User whose clone is replying
 * @param {string} content    Generated reply text
 * @returns {Promise<void>}
 */
export async function insertAiReply(postId, authorId, content) {
  const { error } = await supabase.from("comments").insert({
    post_id: postId,
    author_id: authorId,
    content,
    is_ai: true,
  });

  if (error) {
    throw new Error(`supabase.insertAiReply: ${error.message}`);
  }
}
