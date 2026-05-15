import { Worker } from "bullmq";
import "dotenv/config";
import { TRUTH_QUEUE_NAME, connection } from "./queue.js";
import { getPostContent, updatePostTruthScore } from "./supabase.js";
import { assessTruthScore } from "./ai.js";
import { logger } from "./logger.js";

/**
 * Process a single truth-score job.
 *
 * Job shape:
 *   { post_id: string }   — UUID of the newly created post
 *
 * Business logic:
 *   1. Fetch the post content from Supabase.
 *   2. Send the content to the AI to get truth_score (0-100) and truth_level.
 *   3. Persist the result back to the posts table.
 *
 * On AI failure the job defaults to truth_score=50 / truth_level="suspicious"
 * so posts are never silently approved. BullMQ retries the job automatically
 * on thrown errors (up to `attempts` times).
 */
async function processTruthJob(job) {
  const { post_id } = job.data;
  logger.info("Truth score job started", { jobId: job.id, post_id });

  // ── Step 1: Fetch post content ───────────────────────────────────────────
  const post = await getPostContent(post_id);
  if (!post) {
    logger.warn("Truth score job: post not found, skipping", { post_id });
    return;
  }

  if (!post.content?.trim()) {
    logger.warn("Truth score job: post has no content, skipping", { post_id });
    return;
  }

  // ── Step 2: AI assessment ────────────────────────────────────────────────
  let truth_score, truth_level, reason;
  try {
    ({ truth_score, truth_level, reason } = await assessTruthScore(post.content));
    logger.info("Truth score AI result", {
      post_id,
      truth_score,
      truth_level,
      reason: reason || "(none)",
    });
  } catch (err) {
    logger.error("Truth score AI call failed — defaulting to suspicious", {
      post_id,
      error: err.message,
    });
    truth_score = 50;
    truth_level = "suspicious";
    reason = `AI assessment error: ${err.message}`;
  }

  // ── Step 3: Persist result ───────────────────────────────────────────────
  await updatePostTruthScore(post_id, truth_score, truth_level, reason);

  logger.info("Truth score job complete", {
    jobId: job.id,
    post_id,
    truth_score,
    truth_level,
  });
}

/**
 * Start the BullMQ truth-score worker.
 *
 * concurrency = 3  →  AI calls are I/O-bound and don't touch the wallet,
 *                     so we can safely run a few in parallel.
 * limiter        →  cap OpenRouter calls to avoid rate-limit errors.
 *
 * @returns {import("bullmq").Worker}
 */
export function startTruthWorker() {
  const worker = new Worker(TRUTH_QUEUE_NAME, processTruthJob, {
    connection,
    concurrency: 3,
    limiter: { max: 10, duration: 10_000 },
  });

  worker.on("completed", (job) =>
    logger.info("Truth score job completed", { jobId: job.id })
  );

  worker.on("failed", (job, err) =>
    logger.error("Truth score job failed", { jobId: job?.id, error: err.message })
  );

  logger.info("Truth score worker started");
  return worker;
}
