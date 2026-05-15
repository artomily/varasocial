/**
 * sync-scheduler.js
 *
 * Periodic scheduler that syncs every active user's data to 0G Storage
 * and anchors the resulting root hash on-chain via setHashFor().
 *
 * Flow per user:
 *   1. Skip if user has already claimed self-management (isSelfManaged = true)
 *   2. Fetch profile, posts, and ad campaigns from Supabase
 *   3. Serialise as JSON and upload to 0G Storage (MemData — no disk I/O)
 *   4. Call setHashFor(walletAddress, rootHash) on StorageGatekeeper
 *
 * Schedule: runs once on startup, then every SYNC_INTERVAL_HOURS (default 6).
 */

import { MemData, Indexer } from "@0gfoundation/0g-storage-ts-sdk";
import { ethers } from "ethers";
import "dotenv/config";
import { logger } from "./logger.js";
import { setHashFor } from "./operator.js";
import { ABI } from "./abi.js";
import { supabase } from "./supabase.js";

// ── Configuration ─────────────────────────────────────────────────────────────

const SYNC_INTERVAL_HOURS = Number(process.env.SYNC_INTERVAL_HOURS ?? 6);
const SYNC_INTERVAL_MS = SYNC_INTERVAL_HOURS * 60 * 60 * 1_000;

// Turbo indexer for 0G testnet — fastest upload path
const OG_INDEXER_RPC =
  process.env.OG_INDEXER_RPC ?? "https://indexer-storage-testnet-turbo.0g.ai";

// Delay (ms) between individual user uploads to avoid RPC rate-limiting
const USER_DELAY_MS = Number(process.env.SYNC_USER_DELAY_MS ?? 2_000);

// ── Helpers ───────────────────────────────────────────────────────────────────

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Check whether the user has claimed self-management on-chain.
 * If true, the operator must not call setHashFor for that user.
 */
async function isSelfManaged(walletAddress) {
  try {
    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL, undefined, {
      staticNetwork: true,
    });
    const contract = new ethers.Contract(process.env.CONTRACT_ADDRESS, ABI, provider);
    return await contract.isSelfManaged(walletAddress);
  } catch (err) {
    // Network hiccup — treat as not self-managed so we don't silently skip
    logger.warn("isSelfManaged check failed, assuming false", {
      walletAddress,
      error: err.message,
    });
    return false;
  }
}

/**
 * Fetch everything we want to snapshot for a given user:
 *   - public profile fields
 *   - up to 200 most-recent posts (id, content, media, timestamps, scores)
 *   - ad campaigns (id, title, objective, status)
 *
 * @param {string} userId        Supabase UUID of the user row
 * @param {string} walletAddress On-chain wallet address
 * @returns {object} JSON-serialisable snapshot
 */
async function fetchUserSnapshot(userId, walletAddress) {
  const [profileResult, postsResult, adsResult] = await Promise.all([
    supabase
      .from("users")
      .select(
        "id, handle, display_name, avatar_url, bio, wallet_address, verified, followers, following, created_at, updated_at"
      )
      .eq("id", userId)
      .single(),

    supabase
      .from("posts")
      .select(
        "id, content, media, truth_score, truth_level, virality_score, vara_reward, likes_count, reposts_count, replies_count, created_at"
      )
      .eq("author_id", userId)
      .order("created_at", { ascending: false })
      .limit(200),

    supabase
      .from("ad_campaigns")
      .select("id, title, objective, status, created_at")
      .eq("advertiser_id", userId)
      .order("created_at", { ascending: false })
      .limit(50),
  ]);

  if (profileResult.error) {
    throw new Error(`supabase profile fetch: ${profileResult.error.message}`);
  }

  return {
    schemaVersion: 1,
    wallet: walletAddress,
    profile: profileResult.data,
    posts: postsResult.data ?? [],
    adCampaigns: adsResult.data ?? [],
    syncedAt: new Date().toISOString(),
  };
}

/**
 * Serialise the snapshot as JSON, upload to 0G Storage in-memory (no temp file),
 * and return the root hash.
 *
 * @param {object} snapshot
 * @returns {Promise<string>} 0x-prefixed root hash
 */
async function uploadSnapshotToZeroG(snapshot) {
  const bytes = new TextEncoder().encode(JSON.stringify(snapshot));
  const memData = new MemData(bytes);

  const [, treeErr] = await memData.merkleTree();
  if (treeErr !== null) {
    throw new Error(`Merkle tree generation failed: ${treeErr}`);
  }

  const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
  const signer = new ethers.Wallet(process.env.OPERATOR_PRIVATE_KEY, provider);
  const indexer = new Indexer(OG_INDEXER_RPC);

  const [tx, uploadErr] = await indexer.upload(
    memData,
    process.env.RPC_URL,
    signer,
    undefined, // no encryption
    { Retries: 3, Interval: 5, MaxGasPrice: 0 },
    undefined
  );

  if (uploadErr !== null) {
    throw new Error(`0G Storage upload failed: ${uploadErr}`);
  }

  return "rootHash" in tx ? tx.rootHash : tx.rootHashes[0];
}

// ── Per-user sync ─────────────────────────────────────────────────────────────

async function syncUser(userId, walletAddress) {
  // 1. Skip self-managed users — they control their own hash
  if (await isSelfManaged(walletAddress)) {
    logger.info("syncUser: skipping self-managed user", { walletAddress });
    return;
  }

  // 2. Build the snapshot
  const snapshot = await fetchUserSnapshot(userId, walletAddress);

  // 3. Upload to 0G Storage
  const rootHash = await uploadSnapshotToZeroG(snapshot);
  logger.info("syncUser: uploaded to 0G Storage", { walletAddress, rootHash });

  // 4. Anchor on-chain
  const txHash = await setHashFor(walletAddress, rootHash);
  logger.info("syncUser: setHashFor confirmed", { walletAddress, rootHash, txHash });
}

// ── Full sync cycle ───────────────────────────────────────────────────────────

async function runSyncCycle() {
  logger.info("Sync cycle: starting");

  // Fetch all users that have a connected wallet
  const { data: users, error } = await supabase
    .from("users")
    .select("id, wallet_address")
    .not("wallet_address", "is", null);

  if (error) {
    logger.error("Sync cycle: failed to fetch users", { error: error.message });
    return;
  }

  logger.info(`Sync cycle: processing ${users.length} wallet-linked users`);

  let succeeded = 0;
  let failed = 0;

  for (const user of users) {
    try {
      await syncUser(user.id, user.wallet_address);
      succeeded++;
    } catch (err) {
      failed++;
      logger.error("Sync cycle: syncUser failed", {
        userId: user.id,
        walletAddress: user.wallet_address,
        error: err.message,
      });
    }

    // Throttle to avoid hammering RPC / Supabase
    if (USER_DELAY_MS > 0) await sleep(USER_DELAY_MS);
  }

  logger.info("Sync cycle: complete", { succeeded, failed, total: users.length });
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Start the periodic sync scheduler.
 * Runs one cycle immediately on startup, then every SYNC_INTERVAL_HOURS.
 */
export function startSyncScheduler() {
  logger.info("Sync scheduler: starting", {
    intervalHours: SYNC_INTERVAL_HOURS,
    ogIndexer: OG_INDEXER_RPC,
  });

  // Run immediately so the first sync doesn't wait SYNC_INTERVAL_HOURS
  runSyncCycle().catch((err) =>
    logger.error("Sync scheduler: initial cycle failed", { error: err.message })
  );

  setInterval(
    () =>
      runSyncCycle().catch((err) =>
        logger.error("Sync scheduler: scheduled cycle failed", { error: err.message })
      ),
    SYNC_INTERVAL_MS
  );
}
