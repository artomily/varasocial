import { ethers } from "ethers";
import "dotenv/config";
import { ABI } from "./abi.js";
import { validationQueue } from "./queue.js";
import { logger } from "./logger.js";

// Default BullMQ job options applied to every enqueued validation.
const JOB_OPTIONS = {
  attempts: 3,
  backoff: { type: "exponential", delay: 5_000 },
  removeOnComplete: { age: 86_400 },  // keep 24 h
  removeOnFail: { age: 604_800 },     // keep 7 days
};

/**
 * Connect to the 0G node, attach event listeners, and enqueue validation jobs
 * whenever the smart contract emits AdRequested or SubscriptionRequested.
 *
 * The function also wires a provider-level error handler that logs disconnects
 * so PM2 can restart the process if the provider becomes unresponsive.
 */
export async function startListener() {
  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);

  // ── AdRequested ─────────────────────────────────────────────────────────
  contract.on("AdRequested", async (user, adRootHash, amount, event) => {
    logger.info("Event: AdRequested", {
      user,
      adRootHash,
      amount: amount.toString(),
      block: event.log?.blockNumber,
    });

    await validationQueue.add(
      "ad-validation",
      { type: "AD", user, rootHash: adRootHash },
      JOB_OPTIONS
    );
  });

  // ── SubscriptionRequested ────────────────────────────────────────────────
  contract.on("SubscriptionRequested", async (user, amount, event) => {
    logger.info("Event: SubscriptionRequested", {
      user,
      amount: amount.toString(),
      block: event.log?.blockNumber,
    });

    await validationQueue.add(
      "subscription-validation",
      { type: "SUBSCRIPTION", user, rootHash: null },
      JOB_OPTIONS
    );
  });

  // ── Provider-level error (e.g. RPC disconnect) ───────────────────────────
  provider.on("error", (err) => {
    logger.error("Provider error — process will be restarted by PM2", {
      error: err.message,
    });
    // Exit so PM2 auto-restarts and re-establishes the WebSocket/HTTP connection.
    process.exit(1);
  });

  logger.info("Blockchain listener started", {
    rpc: process.env.RPC_URL,
    contract: process.env.CONTRACT_ADDRESS,
  });

  return contract;
}
