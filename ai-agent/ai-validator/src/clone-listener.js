import { createServer } from "node:http";
import "dotenv/config";
import { cloneQueue } from "./queue.js";
import { flushCache, isCacheEnabled } from "./cache.js";
import { logger } from "./logger.js";

const PORT = parseInt(process.env.WEBHOOK_PORT ?? "3100", 10);
const SECRET = process.env.WEBHOOK_SECRET ?? "";

/**
 * Minimal job options for clone-reply jobs.
 * The worker handles retries with exponential backoff.
 */
const CLONE_JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: { age: 86_400 },
  removeOnFail: { age: 604_800 },
};

/**
 * Parse and validate the incoming webhook body.
 * Expected JSON shape (sent by Supabase Database Webhook or Next.js API):
 * {
 *   post_id:    string,   // UUID of the post that received a comment
 *   comment_id: string,   // UUID of the new comment
 *   author_id:  string    // UUID of the commenter (NOT the post owner)
 * }
 *
 * @param {Buffer} body
 * @returns {{ post_id: string, comment_id: string, author_id: string } | null}
 */
function parseBody(body) {
  try {
    const obj = JSON.parse(body.toString("utf8"));
    if (
      typeof obj.post_id === "string" &&
      typeof obj.comment_id === "string" &&
      typeof obj.author_id === "string"
    ) {
      return { post_id: obj.post_id, comment_id: obj.comment_id, author_id: obj.author_id };
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Start the webhook HTTP server.
 *
 * Only accepts POST /webhook/comment.
 * Optional shared-secret validation via Authorization header or
 * `x-webhook-secret` header.
 *
 * @returns {import("node:http").Server}
 */
export function startCloneWebhook() {
  const server = createServer(async (req, res) => {
    // ── Route guard ──────────────────────────────────────────────────────────
    if (req.method !== "POST" || ![ "/webhook/comment", "/webhook/cache-reset" ].includes(req.url)) {
      res.writeHead(404).end("Not Found");
      return;
    }

    // ── Optional secret check ────────────────────────────────────────────────
    if (SECRET) {
      const incoming =
        req.headers["x-webhook-secret"] ??
        (req.headers["authorization"] ?? "").replace(/^Bearer\s+/i, "");
      if (incoming !== SECRET) {
        logger.warn("Webhook: invalid secret", { ip: req.socket.remoteAddress });
        res.writeHead(401).end("Unauthorized");
        return;
      }
    }

    // ── Route: POST /webhook/cache-reset ─────────────────────────────────────
    if (req.url === "/webhook/cache-reset") {
      if (!isCacheEnabled()) {
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ flushed: 0, message: "Cache is disabled (USE_CACHE=false)" }));
        return;
      }
      try {
        const count = await flushCache();
        logger.info("Webhook: cache reset triggered", { keysDeleted: count });
        res.writeHead(200, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ flushed: count }));
      } catch (err) {
        logger.error("Webhook: cache reset failed", { error: err.message });
        res.writeHead(500).end("Internal Server Error");
      }
      return;
    }

    // ── Read body (only for /webhook/comment) ────────────────────────────────
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const payload = parseBody(Buffer.concat(chunks));

    if (!payload) {
      res.writeHead(400).end("Bad Request");
      return;
    }

    // ── Enqueue — this is all the webhook does ───────────────────────────────
    try {
      await cloneQueue.add(
        "clone-reply",
        {
          post_id: payload.post_id,
          comment_id: payload.comment_id,
          commenter_id: payload.author_id,
        },
        CLONE_JOB_OPTIONS
      );

      logger.info("Webhook: job enqueued", {
        post_id: payload.post_id,
        comment_id: payload.comment_id,
      });

      res.writeHead(202, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ queued: true }));
    } catch (err) {
      logger.error("Webhook: failed to enqueue job", { error: err.message });
      res.writeHead(500).end("Internal Server Error");
    }
  });

  server.listen(PORT, () => {
    logger.info(`Clone webhook listening on :${PORT} — POST /webhook/comment`);
  });

  server.on("error", (err) => {
    logger.error("Clone webhook server error", { error: err.message });
  });

  return server;
}

