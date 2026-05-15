import { Worker } from "bullmq";
import "dotenv/config";
import { LIKES_QUEUE_NAME, connection } from "./queue.js";
import {
  getPostForLikesCheck,
  claimLikesMilestone,
  setLikesMilestoneTx,
  rollbackLikesMilestone,
} from "./supabase.js";
import { sendNativeTransfer } from "./operator.js";
import { logger } from "./logger.js";

/** Likes count that triggers the one-time 0G reward. */
const LIKES_MILESTONE = 50_000;

/** Amount of native 0G token sent to the post author on milestone. */
const REWARD_AMOUNT_OG = "0.1";

/**
 * Process a single likes-milestone job.
 *
 * Job shape:
 *   { post_id: string }   — UUID of the post that just received a like
 *
 * Business logic:
 *   1. Fetch post data (likes_count, milestone state, author wallet).
 *   2. Bail early if the milestone was already rewarded or not yet reached.
 *   3. Atomically claim the milestone to prevent double-payment.
 *   4. Transfer 0.1 0G to the post author's wallet.
 *   5. Record the tx hash; roll back the claim on failure so BullMQ retries.
 */
async function processLikesJob(job) {
  const { post_id } = job.data;
  logger.info("Likes milestone job started", { jobId: job.id, post_id });

  // ── Step 1: Fetch post + author info ────────────────────────────────────
  const post = await getPostForLikesCheck(post_id);
  if (!post) {
    logger.warn("Likes milestone: post not found, skipping", { post_id });
    return;
  }

  // ── Step 2a: Already rewarded? ───────────────────────────────────────────
  if (post.likes_milestone_rewarded) {
    logger.info("Likes milestone: already rewarded, skipping", {
      post_id,
      likes_count: post.likes_count,
    });
    return;
  }

  // ── Step 2b: Threshold not yet reached? ──────────────────────────────────
  if (post.likes_count < LIKES_MILESTONE) {
    logger.info("Likes milestone: threshold not reached", {
      post_id,
      likes_count: post.likes_count,
      required: LIKES_MILESTONE,
    });
    return;
  }

  // ── Step 2c: Author has no wallet? ───────────────────────────────────────
  if (!post.wallet_address) {
    logger.warn("Likes milestone: author has no wallet address, skipping", {
      post_id,
      author_id: post.author_id,
    });
    return;
  }

  // ── Step 3: Atomically claim the milestone ───────────────────────────────
  // This conditional update (WHERE likes_milestone_rewarded = false) prevents
  // double-payment even when multiple like events arrive in quick succession.
  const claimed = await claimLikesMilestone(post_id);
  if (!claimed) {
    logger.info("Likes milestone: already claimed by a concurrent job, skipping", { post_id });
    return;
  }

  // ── Step 4: Send 0.1 0G to post author ──────────────────────────────────
  let txHash;
  try {
    txHash = await sendNativeTransfer(post.wallet_address, REWARD_AMOUNT_OG);
  } catch (err) {
    // Roll back the claim flag so BullMQ can retry the job cleanly.
    await rollbackLikesMilestone(post_id);
    logger.error("Likes milestone: native transfer failed, claim rolled back", {
      post_id,
      to: post.wallet_address,
      error: err.message,
    });
    throw err;
  }

  // ── Step 5: Persist tx hash ──────────────────────────────────────────────
  await setLikesMilestoneTx(post_id, txHash);

  logger.info("Likes milestone reward sent ✓", {
    post_id,
    to: post.wallet_address,
    amount: REWARD_AMOUNT_OG + " 0G",
    likes_count: post.likes_count,
    txHash,
  });
}

/**
 * Start the BullMQ likes-milestone worker.
 *
 * concurrency = 1  →  one job at a time; safe nonce ordering on the wallet.
 * limiter        →  max 5 on-chain txs per 10 s (0G rate-limit buffer).
 *
 * @returns {import("bullmq").Worker}
 */
export function startLikesWorker() {
  const worker = new Worker(LIKES_QUEUE_NAME, processLikesJob, {
    connection,
    concurrency: 1,
    limiter: { max: 5, duration: 10_000 },
  });

  worker.on("completed", (job) =>
    logger.info("Likes job completed", { jobId: job.id })
  );

  worker.on("failed", (job, err) =>
    logger.error("Likes job failed", { jobId: job?.id, error: err.message })
  );

  logger.info("Likes milestone worker started");
  return worker;
}
