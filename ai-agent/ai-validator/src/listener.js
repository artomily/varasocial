import { ethers } from "ethers";
import "dotenv/config";
import { ABI } from "./abi.js";
import { validationQueue } from "./queue.js";
import { logger } from "./logger.js";

/**
 * Decode a UUID from a bytes32 value encoded by the browser.
 *
 * Encoding convention (browser):
 *   const uuidToBytes32 = (uuid) => '0x' + uuid.replace(/-/g, '').padEnd(64, '0');
 *
 * The UUID occupies the first 16 bytes (32 hex chars); the rest are zero-padded.
 *
 * @param {string} bytes32Hex  — 0x-prefixed hex string from the contract event
 * @returns {string}           — standard UUID format (xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx)
 */
function bytes32ToUuid(bytes32Hex) {
  const hex = bytes32Hex.replace(/^0x/, "").slice(0, 32).toLowerCase();
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32),
  ].join("-");
}

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
  //
  // Convention: browser encodes ad_campaigns.id (UUID) as bytes32 before
  // calling requestAdPlacement(). The contract stores it as-is and emits it
  // back here. We decode directly — no Supabase round-trip needed.
  contract.on("AdRequested", async (user, rawCampaignId, amount, event) => {
    const campaignId = bytes32ToUuid(rawCampaignId);

    logger.info("Event: AdRequested", {
      user,
      campaignId,
      amount: amount.toString(),
      block: event.log?.blockNumber,
    });

    await validationQueue.add(
      "ad-validation",
      { type: "AD", user, campaignId },
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
      { type: "SUBSCRIPTION", user },
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
