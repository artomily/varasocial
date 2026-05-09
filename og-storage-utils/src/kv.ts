import { Batcher, KvClient, getFlowContract } from '@0gfoundation/0g-storage-ts-sdk';
import { ethers } from 'ethers';
import { AppConfig, createSigner, createIndexer } from './config.js';

// --- Result Types ---

export interface KvSetResult {
  txHash: string;
  rootHash: string;
}

const DEFAULT_KV_TIMEOUT_MS = 15_000;

export interface KvGetResult {
  value: string | null;
  size: number;
  version: number;
}

// --- Error Class ---

export class KvError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'KvError';
  }
}

// --- Helpers ---

/** Encode a UTF-8 string to a Uint8Array. */
function toBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

/**
 * Normalize and validate a streamId string.
 * Accepts 0x-prefixed 32-byte hex (64 hex chars) and returns it as-is.
 */
export function parseStreamId(streamId: string): string {
  const normalized = streamId.startsWith('0x') || streamId.startsWith('0X')
    ? streamId
    : `0x${streamId}`;
  const hex = normalized.slice(2);
  if (hex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new KvError(`Invalid streamId: must be a 0x-prefixed 32-byte hex string (64 hex chars). Got "${streamId}"`);
  }
  return normalized;
}

// --- Core KV Functions ---

/**
 * Write a key-value pair to a 0G-KV stream.
 *
 * @param streamId - 0x-prefixed 32-byte hex string identifying the KV stream
 * @param key      - UTF-8 string key
 * @param value    - UTF-8 string value
 * @param config   - AppConfig (requires privateKey; kvRpcUrl not needed for writes)
 */
export async function kvSet(
  streamId: string,
  key: string,
  value: string,
  config: AppConfig,
): Promise<KvSetResult> {
  const signer = createSigner(config);
  const indexer = createIndexer(config);

  const [nodes, selectErr] = await indexer.selectNodes(1);
  if (selectErr !== null) {
    throw new KvError(`Failed to select storage nodes: ${selectErr}`);
  }

  const provider = new ethers.JsonRpcProvider(config.network.rpcUrl);
  const flow = getFlowContract(config.network.flowContractAddress, signer.connect(provider) as any);

  const batcher = new Batcher(1, nodes, flow, config.network.rpcUrl);

  const streamIdHex = parseStreamId(streamId);
  const keyBytes = toBytes(key);
  const valueBytes = toBytes(value);
  batcher.streamDataBuilder.set(streamIdHex, keyBytes, valueBytes);

  const [tx, batchErr] = await batcher.exec();
  if (batchErr !== null) {
    throw new KvError(`KV write failed: ${batchErr}`);
  }

  return { txHash: tx.txHash, rootHash: tx.rootHash };
}

/**
 * Read a value from a 0G-KV stream by key.
 *
 * @param streamId - 0x-prefixed 32-byte hex string identifying the KV stream
 * @param key      - UTF-8 string key
 * @param config   - AppConfig (requires kvRpcUrl to be set)
 * @param version  - Optional specific version to read
 */
export async function kvGet(
  streamId: string,
  key: string,
  config: AppConfig,
  version?: number,
): Promise<KvGetResult> {
  if (!config.kvRpcUrl) {
    throw new KvError('KV RPC URL is required for reads. Set KV_RPC_URL in .env or pass kvRpcUrl in config.');
  }

  const kvClient = new KvClient(config.kvRpcUrl);
  const streamIdHex = parseStreamId(streamId);
  const keyBytes = toBytes(key);

  const timeoutMs = DEFAULT_KV_TIMEOUT_MS;
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new KvError(
      `KV read timed out after ${timeoutMs / 1000}s. The KV node at "${config.kvRpcUrl}" is unreachable or not responding.\n` +
      `  Check that KV_RPC_URL in .env points to an active 0G-KV node.`
    )), timeoutMs)
  );

  const result = await Promise.race([
    kvClient.getValue(streamIdHex, keyBytes, version),
    timeout,
  ]);

  if (result === null) {
    return { value: null, size: 0, version: 0 };
  }

  // result.data is base64-encoded; decode to UTF-8 string
  const decoded = Buffer.from(result.data, 'base64').toString('utf-8');
  return {
    value: decoded,
    size: result.size,
    version: result.version,
  };
}
