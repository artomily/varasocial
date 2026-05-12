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
