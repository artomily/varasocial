import "dotenv/config";
import { logger } from "./logger.js";
import { checkBalance } from "./operator.js";
import { startListener } from "./listener.js";
import { startWorker } from "./worker.js";
import { startCloneWebhook } from "./clone-listener.js";
import { startCloneWorker } from "./clone-worker.js";

// ── Required environment variables ──────────────────────────────────────────
const REQUIRED_ENV = [
  "RPC_URL",
  "CONTRACT_ADDRESS",
  "OPERATOR_PRIVATE_KEY",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_KEY",
  "OPENROUTER_API_KEY",
];

function validateEnv() {
  const missing = REQUIRED_ENV.filter((k) => !process.env[k]);
  if (missing.length > 0) {
    logger.error("Missing required environment variables", { missing });
    process.exit(1);
  }
}

// ── Graceful shutdown ────────────────────────────────────────────────────────
function onShutdown(signal) {
  logger.info(`Received ${signal} — shutting down gracefully`);
  process.exit(0);
}

process.on("SIGINT", () => onShutdown("SIGINT"));
process.on("SIGTERM", () => onShutdown("SIGTERM"));

// ── Startup ──────────────────────────────────────────────────────────────────
async function main() {
  logger.info("━━━ VaraSocial AI Validator ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");

  validateEnv();

  // Check operator wallet balance on startup
  await checkBalance().catch((err) =>
    logger.warn("Could not check operator balance", { error: err.message })
  );

  // Start the queue worker (concurrency=1 keeps nonce ordering safe)
  startWorker();

  // Start the clone worker (auto-replies for mode-turu users)
  startCloneWorker();

  // Start the blockchain event listener
  await startListener();

  // Start the Supabase Realtime clone listener
  startCloneWebhook();

  logger.info("AI Validator + AI Clone are live — listening for events");

  // Schedule periodic balance check every 6 hours
  setInterval(
    () =>
      checkBalance().catch((err) =>
        logger.warn("Periodic balance check failed", { error: err.message })
      ),
    6 * 60 * 60 * 1_000
  );
}

main().catch((err) => {
  logger.error("Fatal startup error", { error: err.message, stack: err.stack });
  process.exit(1);
});
