import { createClient } from "@supabase/supabase-js";
import ws from "ws";
import "dotenv/config";
import { logger } from "./logger.js";

// Service-role client bypasses RLS — never expose this key client-side.
export const supabase = createClient(
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
 * Clears ai_report and ai_status so the frontend poll waits for the fresh result.
 */
export async function setUserProcessing(walletAddress) {
  const { error } = await supabase
    .from("users")
    .update({ verified: false, ai_status: "processing", ai_report: null })
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
      ai_status: isSafe ? "approved" : "rejected",
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

// ── Likes Milestone helpers ────────────────────────────────────────────────

/**
 * Fetch the data needed to evaluate the 50k likes milestone for a post.
 * Returns the post's current likes_count, reward state, and the author's
 * wallet address (null if the author has not connected a wallet yet).
 *
 * @param {string} postId  — UUID of the post
 * @returns {{ likes_count: number, likes_milestone_rewarded: boolean, author_id: string, wallet_address: string|null } | null}
 */
export async function getPostForLikesCheck(postId) {
  const { data: post, error: postErr } = await supabase
    .from("posts")
    .select("id, likes_count, likes_milestone_rewarded, author_id")
    .eq("id", postId)
    .single();

  if (postErr) {
    throw new Error(`supabase.getPostForLikesCheck: ${postErr.message}`);
  }
  if (!post) return null;

  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("wallet_address")
    .eq("id", post.author_id)
    .single();

  if (userErr) {
    throw new Error(`supabase.getPostForLikesCheck (user): ${userErr.message}`);
  }

  return {
    likes_count: post.likes_count,
    likes_milestone_rewarded: post.likes_milestone_rewarded,
    author_id: post.author_id,
    wallet_address: user?.wallet_address ?? null,
  };
}

/**
 * Atomically claim the 50k likes milestone reward for a post.
 * Sets likes_milestone_rewarded = true only when it is currently false,
 * preventing double-payment even if multiple jobs arrive concurrently.
 *
 * @param {string} postId
 * @returns {Promise<boolean>}  true if we claimed it; false if already rewarded
 */
export async function claimLikesMilestone(postId) {
  const { data, error } = await supabase
    .from("posts")
    .update({ likes_milestone_rewarded: true })
    .eq("id", postId)
    .eq("likes_milestone_rewarded", false)
    .select("id");

  if (error) {
    throw new Error(`supabase.claimLikesMilestone: ${error.message}`);
  }
  return (data ?? []).length > 0;
}

/**
 * Persist the on-chain transaction hash after the reward transfer is confirmed.
 *
 * @param {string} postId
 * @param {string} txHash
 */
export async function setLikesMilestoneTx(postId, txHash) {
  const { error } = await supabase
    .from("posts")
    .update({ likes_milestone_tx: txHash })
    .eq("id", postId);

  if (error) {
    logger.warn("supabase.setLikesMilestoneTx failed", { postId, error: error.message });
  }
}

/**
 * Roll back a failed milestone claim so the job can be retried by BullMQ.
 * Called when the on-chain transfer throws after we already set the flag.
 *
 * @param {string} postId
 */
export async function rollbackLikesMilestone(postId) {
  const { error } = await supabase
    .from("posts")
    .update({ likes_milestone_rewarded: false })
    .eq("id", postId);

  if (error) {
    logger.warn("supabase.rollbackLikesMilestone failed", { postId, error: error.message });
  }
}

// ── Truth Score helpers ────────────────────────────────────────────────────

/**
 * Fetch post content for truth-score analysis.
 *
 * @param {string} postId
 * @returns {{ id: string, content: string } | null}
 */
export async function getPostContent(postId) {
  const { data, error } = await supabase
    .from("posts")
    .select("id, content")
    .eq("id", postId)
    .single();

  if (error) {
    throw new Error(`supabase.getPostContent: ${error.message}`);
  }
  return data ?? null;
}

/**
 * Persist the AI-generated truth score and truth level on a post.
 *
 * @param {string} postId
 * @param {number} truthScore   0-100
 * @param {"valid"|"suspicious"|"hoax"} truthLevel
 * @param {string} reason       AI explanation
 */
export async function updatePostTruthScore(postId, truthScore, truthLevel, reason) {
  const { error } = await supabase
    .from("posts")
    .update({
      truth_score: truthScore,
      truth_level: truthLevel,
      ai_report: reason ?? null,
    })
    .eq("id", postId);

  if (error) {
    throw new Error(`supabase.updatePostTruthScore: ${error.message}`);
  }
}
