import { Worker } from "bullmq";
import "dotenv/config";
import { CLONE_QUEUE_NAME, connection } from "./queue.js";
import { getCloneUser, getClonePost, getCommentContent, getThreadContext, insertAiReply } from "./supabase.js";
import { cachedUser, cachedPost } from "./cache.js";
import { generateCloneReply } from "./clone-ai.js";
import { logger } from "./logger.js";

/**
 * Process a single clone-reply job.
 *
 * Job shape (minimal — producer just sends IDs):
 * {
 *   post_id:      string,   // UUID of the post
 *   comment_id:   string,   // UUID of the triggering comment
 *   commenter_id: string    // UUID of the commenter (used to skip self-replies)
 * }
 *
 * The worker fetches all necessary context from Supabase (with Redis caching).
 */
async function processCloneJob(job) {
  const { post_id, comment_id, commenter_id } = job.data;

  logger.info("Clone job started", { jobId: job.id, post_id, comment_id });

  // ── Step 1: Get post (cached) ────────────────────────────────────────────
  const post = await cachedPost(post_id, () => getClonePost(post_id));
  if (!post) {
    logger.warn("Clone job: post not found, skipping", { post_id });
    return;
  }

  // ── Step 2: Get post author profile (cached) ─────────────────────────────
  const user = await cachedUser(post.author_id, () => getCloneUser(post.author_id));
  if (!user) {
    logger.warn("Clone job: author not found, skipping", { author_id: post.author_id });
    return;
  }

  // ── Step 3: Guard — mode turu must be on ─────────────────────────────────
  if (!user.is_turu) {
    logger.info("Clone job: is_turu is off, skipping", { user: user.handle });
    return;
  }

  // ── Step 4: Guard — don't reply to the post owner's own comment ──────────
  if (commenter_id === post.author_id) {
    logger.info("Clone job: commenter is post owner, skipping", { user: user.handle });
    return;
  }

  // ── Step 5: Fetch the triggering comment content ──────────────────────────
  const commentRow = await getCommentContent(comment_id);
  if (!commentRow) {
    logger.warn("Clone job: comment not found, skipping", { comment_id });
    return;
  }

  // ── Step 6: Fetch thread context (last 5 comments, excluding new one) ────
  const threadComments = await getThreadContext(post_id, comment_id);

  // ── Step 7: Generate AI reply ─────────────────────────────────────────────
  const replyText = await generateCloneReply(
    user,
    post.content,
    threadComments,
    commentRow.content
  );

  // ── Step 8: Insert AI reply ───────────────────────────────────────────────
  await insertAiReply(post_id, post.author_id, replyText);

  logger.info("Clone job complete", {
    jobId: job.id,
    post_id,
    comment_id,
    user: user.handle,
    replyPreview: replyText.slice(0, 80),
  });
}

/**
 * Start the BullMQ clone-reply worker.
 *
 * concurrency = 1  →  safe on 2GB RAM; AI calls are the bottleneck anyway.
 * limiter         →  max 10 AI calls per minute as a rate-limit buffer.
 */
export function startCloneWorker() {
  const worker = new Worker(CLONE_QUEUE_NAME, processCloneJob, {
    connection,
    concurrency: 1,
    limiter: { max: 10, duration: 60_000 },
  });

  worker.on("completed", (job) => {
    logger.info("Clone worker: job completed", { jobId: job.id });
  });

  worker.on("failed", (job, err) => {
    logger.error("Clone worker: job failed", {
      jobId: job?.id,
      error: err.message,
    });
  });

  logger.info("Clone worker started", { queue: CLONE_QUEUE_NAME, concurrency: 1 });
  return worker;
}

