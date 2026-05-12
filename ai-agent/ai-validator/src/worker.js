import { Worker } from "bullmq";
import "dotenv/config";
import { QUEUE_NAME, connection } from "./queue.js";
import {
  getAdContent,
  getUserPosts,
  setAdProcessing,
  setUserProcessing,
  updateAdStatus,
  updateUserStatus,
} from "./supabase.js";
import { checkSARA } from "./ai.js";
import { sendDecision } from "./operator.js";
import { logger } from "./logger.js";

/**
 * Core job processor.
 *
 * Jobs are serialised (concurrency = 1) to prevent wallet nonce collisions.
 * BullMQ retries the job automatically on failure (up to `attempts` times).
 *
 * Job shape:
 *   { type: 'AD',           user: string, campaignId: string }
 *   { type: 'SUBSCRIPTION', user: string }
 */
async function processJob(job) {
  const { type, user, campaignId } = job.data;
  logger.info("Job started", { jobId: job.id, type, user, campaignId });

  // ── Step 1: mark as processing ──────────────────────────────
  if (type === "AD") {
    await setAdProcessing(campaignId);
  } else {
    await setUserProcessing(user);
  }

  // ── Step 2: retrieve content from Supabase ──────────────────
  let textToCheck;

  if (type === "AD") {
    const ad = await getAdContent(campaignId);
    textToCheck = `Title: ${ad.title}\n\nObjective: ${ad.objective}`;
  } else {
    const posts = await getUserPosts(user);

    if (posts.length === 0) {
      // New account with no posts — approve by default.
      logger.info("No posts found, approving new account", { user });
      const txHash = await sendDecision(user, true, "SUBSCRIPTION");
      await updateUserStatus(user, true, "No posts to review — new account", txHash);
      return;
    }

    textToCheck = posts.map((p) => p.content).join("\n---\n");
  }

  // ── Step 3: AI moderation ────────────────────────────────────
  // If the AI service errors out (network, timeout, parse failure),
  // we default to is_safe=false so the contract can issue a refund.
  // This prevents the user's fee being locked indefinitely.
  let is_safe, reason;
  try {
    ({ is_safe, reason } = await checkSARA(textToCheck));
    logger.info("AI decision", { type, user, is_safe, reason: reason || "(safe)" });
  } catch (err) {
    logger.error("AI moderation failed — defaulting to rejected (fee will be refunded)", {
      type, user, error: err.message,
    });
    is_safe = false;
    reason = `AI moderation error: ${err.message}`;
  }

  // ── Step 4: on-chain execution ───────────────────────────────
  const txHash = await sendDecision(user, is_safe, type);

  // ── Step 5: sync result back to Supabase ────────────────────
  if (type === "AD") {
    await updateAdStatus(campaignId, is_safe, reason, txHash);
  } else {
    await updateUserStatus(user, is_safe, reason, txHash);
  }

  logger.info("Job complete", { jobId: job.id, type, is_safe, txHash });
}

/**
 * Start the BullMQ worker.
 *
 * concurrency = 1  →  one job at a time, safe nonce ordering.
 * limiter        →  max 5 on-chain txs per 10 s (0G rate limit buffer).
 */
export function startWorker() {
  const worker = new Worker(QUEUE_NAME, processJob, {
    connection,
    concurrency: 1,
    limiter: { max: 5, duration: 10_000 },
  });

  worker.on("completed", (job) =>
    logger.info("Job completed", { jobId: job.id })
  );
  worker.on("failed", (job, err) =>
    logger.error("Job failed", { jobId: job?.id, error: err.message })
  );
  worker.on("error", (err) =>
    logger.error("Worker error", { error: err.message })
  );

  logger.info("Validation worker started (concurrency=1)");
  return worker;
}
