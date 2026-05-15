import { Queue } from "bullmq";
import IORedis from "ioredis";
import "dotenv/config";

export const QUEUE_NAME = "validation";

/**
 * Shared Redis connection.
 * `maxRetriesPerRequest: null` is required by BullMQ for blocking commands.
 */
export const connection = new IORedis(
  process.env.REDIS_URL ?? "redis://localhost:6379",
  { maxRetriesPerRequest: null }
);

connection.on("error", (err) => {
  // Log but don't crash — BullMQ handles reconnection internally.
  console.error("[Redis] connection error:", err.message);
});

/**
 * The single validation queue.
 * Producers (listener) add jobs here; the worker consumes them one at a time.
 */
export const validationQueue = new Queue(QUEUE_NAME, { connection });

/**
 * Clone-reply queue — handles AI auto-reply jobs for users in "mode turu".
 * Separate queue so clone replies never block content-validation jobs.
 */
export const CLONE_QUEUE_NAME = "clone-reply";
export const cloneQueue = new Queue(CLONE_QUEUE_NAME, { connection });

/**
 * Likes milestone queue — checks whether a post has crossed 50k likes
 * and dispatches a 0.1 0G native-token reward to the post author.
 * Kept separate so it never interferes with validation or clone jobs.
 */
export const LIKES_QUEUE_NAME = "likes-milestone";
export const likesQueue = new Queue(LIKES_QUEUE_NAME, { connection });

/**
 * Truth score queue — runs AI content analysis on newly created posts
 * to assign a truth_score (0-100) and truth_level (valid/suspicious/hoax).
 * Separate queue so truth scoring never blocks validation or reward jobs.
 */
export const TRUTH_QUEUE_NAME = "truth-score";
export const truthQueue = new Queue(TRUTH_QUEUE_NAME, { connection });
