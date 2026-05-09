import { ZgFile, Indexer, MemData, EncryptionHeader } from '@0gfoundation/0g-storage-ts-sdk';
import type { UploadOption, EncryptionOption } from '@0gfoundation/0g-storage-ts-sdk';
import fs from 'fs';
import path from 'path';
import {
  AppConfig,
  EncryptionConfig,
  DecryptionConfig,
  createSigner,
  createIndexer,
} from './config.js';

interface RetryOpts {
  Retries: number;
  Interval: number;
  MaxGasPrice: number;
}

// --- Result Types ---

export interface UploadResult {
  rootHash: string;
  txHash: string;
}

export interface DownloadResult {
  outputPath: string;
}

// --- Error Classes ---

export class StorageError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class UploadError extends StorageError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'UploadError';
  }
}

export class DownloadError extends StorageError {
  constructor(message: string, cause?: unknown) {
    super(message, cause);
    this.name = 'DownloadError';
  }
}

// --- Validation ---

const ROOT_HASH_REGEX = /^0x[0-9a-fA-F]{64}$/;

function validateRootHash(rootHash: string): void {
  if (!ROOT_HASH_REGEX.test(rootHash)) {
    throw new DownloadError(
      `Invalid root hash format: "${rootHash}". Expected 0x followed by 64 hex characters.`,
    );
  }
}

// --- Helpers ---

function buildRetryOpts(config: AppConfig): RetryOpts | undefined {
  if (!config.maxRetries) return undefined;
  return {
    Retries: config.maxRetries,
    Interval: 5,
    MaxGasPrice: config.maxGasPrice ? Number(config.maxGasPrice) : 0,
  };
}

function buildTxOpts(config: AppConfig) {
  const opts: { gasPrice?: bigint; gasLimit?: bigint } = {};
  if (config.gasPrice) opts.gasPrice = config.gasPrice;
  if (config.gasLimit) opts.gasLimit = config.gasLimit;
  return Object.keys(opts).length > 0 ? opts : undefined;
}

function buildUploadOpts(enc?: EncryptionConfig): UploadOption | undefined {
  if (!enc) return undefined;
  const encryption: EncryptionOption =
    enc.type === 'aes256'
      ? { type: 'aes256', key: enc.key }
      : { type: 'ecies', recipientPubKey: enc.recipientPubKey };
  return { encryption };
}

function normalizeDecryption(d: DecryptionConfig) {
  return {
    symmetricKey: d.symmetricKey,
    privateKey: d.privateKey,
  };
}

// --- Core Functions ---

/**
 * Upload a file from the filesystem to 0G Storage.
 * Returns the rootHash (permanent file identifier) and txHash.
 */
export async function uploadFile(
  filePath: string,
  config: AppConfig,
): Promise<UploadResult> {
  const resolvedPath = path.resolve(filePath);
  if (!fs.existsSync(resolvedPath)) {
    throw new UploadError(`File not found: "${resolvedPath}"`);
  }
  if (fs.statSync(resolvedPath).isDirectory()) {
    throw new UploadError(
      `Path is a directory, not a file: "${resolvedPath}"\n` +
      `  Hint: check for accidental spaces in the path, e.g. use "./file.txt" not "./ file.txt"`,
    );
  }

  const signer = createSigner(config);
  const indexer = createIndexer(config);
  const zgFile = await ZgFile.fromFilePath(resolvedPath);

  try {
    const [, treeErr] = await zgFile.merkleTree();
    if (treeErr !== null) {
      throw new UploadError(`Merkle tree generation failed: ${treeErr}`);
    }

    const [tx, uploadErr] = await indexer.upload(
      zgFile,
      config.network.rpcUrl,
      signer as any, // ethers v6 / SDK type mismatch — runtime compatible
      buildUploadOpts(config.encryption),
      buildRetryOpts(config),
      buildTxOpts(config),
    );

    if (uploadErr !== null) {
      throw new UploadError(`Upload failed: ${uploadErr}`);
    }

    if ('rootHash' in tx) {
      return { rootHash: tx.rootHash, txHash: tx.txHash };
    } else {
      return { rootHash: tx.rootHashes[0], txHash: tx.txHashes[0] };
    }
  } finally {
    await zgFile.close();
  }
}

/**
 * Download a file from 0G Storage by its root hash.
 * When config.decryption is set, uses downloadToBlob for decryption support.
 */
export async function downloadFile(
  rootHash: string,
  outputPath: string,
  config: AppConfig,
): Promise<DownloadResult> {
  validateRootHash(rootHash);
  const resolvedOutput = path.resolve(outputPath);
  const outputDir = path.dirname(resolvedOutput);
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const indexer = createIndexer(config);

  if (config.decryption) {
    const [blob, err] = await indexer.downloadToBlob(rootHash, {
      proof: true,
      decryption: normalizeDecryption(config.decryption),
    });
    if (err !== null) {
      throw new DownloadError(`Download failed: ${err}`);
    }
    const bytes = new Uint8Array(await blob.arrayBuffer());
    fs.writeFileSync(resolvedOutput, bytes);
    return { outputPath: resolvedOutput };
  }

  const err = await indexer.download(rootHash, resolvedOutput, true);
  if (err !== null) {
    throw new DownloadError(`Download failed: ${err}`);
  }

  return { outputPath: resolvedOutput };
}

/**
 * Upload raw data (string or Uint8Array) to 0G Storage using MemData.
 * Useful for uploading strings or buffers without writing to disk first.
 */
export async function uploadData(
  data: Uint8Array | string,
  config: AppConfig,
): Promise<UploadResult> {
  const bytes = typeof data === 'string' ? new TextEncoder().encode(data) : data;

  if (bytes.length === 0) {
    throw new UploadError('Cannot upload empty data');
  }

  const signer = createSigner(config);
  const indexer = createIndexer(config);
  const memData = new MemData(bytes);

  const [, treeErr] = await memData.merkleTree();
  if (treeErr !== null) {
    throw new UploadError(`Merkle tree generation failed: ${treeErr}`);
  }

  const [tx, uploadErr] = await indexer.upload(
    memData,
    config.network.rpcUrl,
    signer as any,
    buildUploadOpts(config.encryption),
    buildRetryOpts(config),
    buildTxOpts(config),
  );

  if (uploadErr !== null) {
    throw new UploadError(`Upload failed: ${uploadErr}`);
  }

  if ('rootHash' in tx) {
    return { rootHash: tx.rootHash, txHash: tx.txHash };
  } else {
    return { rootHash: tx.rootHashes[0], txHash: tx.txHashes[0] };
  }
}

/**
 * Upload multiple files sequentially to 0G Storage.
 */
export async function batchUpload(
  filePaths: string[],
  config: AppConfig,
): Promise<UploadResult[]> {
  if (filePaths.length === 0) {
    throw new UploadError('No files provided for batch upload');
  }

  for (const fp of filePaths) {
    const resolved = path.resolve(fp);
    if (!fs.existsSync(resolved)) {
      throw new UploadError(`File not found: ${resolved}`);
    }
  }

  const results: UploadResult[] = [];
  for (const fp of filePaths) {
    results.push(await uploadFile(fp, config));
  }

  return results;
}

/**
 * Peek the encryption header of a stored file without downloading the body.
 * Returns null if the file is not encrypted.
 */
export async function peekHeader(
  rootHash: string,
  config: AppConfig,
): Promise<EncryptionHeader | null> {
  validateRootHash(rootHash);
  const indexer = createIndexer(config);
  const [header, err] = await indexer.peekHeader(rootHash);
  if (err !== null) {
    throw new DownloadError(`peekHeader failed: ${err}`);
  }
  return header;
}
