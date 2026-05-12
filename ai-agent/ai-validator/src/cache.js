/**
 * Thin Redis caching layer using the existing ioredis connection.
 *
 * Used by the clone worker to avoid redundant Supabase round-trips.
 * Keys:
 *   clone:user:<authorId>   — user persona + profile (TTL 10 min)
 *   clone:post:<postId>     — post content (TTL 30 min)
 *
 * Set USE_CACHE=false in .env to disable caching entirely (always hit Supabase).
 */
import { connection } from "./queue.js";
import { logger } from "./logger.js";

const TTL_USER = 60 * 10;   // 10 minutes
const TTL_POST = 60 * 30;   // 30 minutes

/** Runtime flag — can be toggled via USE_CACHE env var. */
export const isCacheEnabled = () =>
  (process.env.USE_CACHE ?? "true").toLowerCase() !== "false";

/**
 * Get a cached value. Returns null on miss or error.
 * @param {string} key
 * @returns {Promise<any|null>}
 */
async function get(key) {
  try {
    const raw = await connection.get(key);
    return raw ? JSON.parse(raw) : null;
  } catch (err) {
    logger.warn("cache.get error", { key, error: err.message });
    return null;
  }
}

/**
 * Set a value in cache with TTL (seconds).
 * @param {string} key
 * @param {any}    value
 * @param {number} ttl   seconds
 */
async function set(key, value, ttl) {
  try {
    await connection.set(key, JSON.stringify(value), "EX", ttl);
  } catch (err) {
    logger.warn("cache.set error", { key, error: err.message });
  }
}

/** Delete a cached key (e.g. when user updates persona). */
export async function invalidateUser(authorId) {
  await connection.del(`clone:user:${authorId}`).catch(() => {});
}

/**
 * Flush all clone:* keys from Redis.
 * Called by the cache-reset webhook.
 */
export async function flushCache() {
  try {
    const keys = await connection.keys("clone:*");
    if (keys.length === 0) {
      logger.info("Cache flush: no clone:* keys found");
      return 0;
    }
    await connection.del(...keys);
    logger.info("Cache flush: deleted keys", { count: keys.length });
    return keys.length;
  } catch (err) {
    logger.warn("Cache flush error", { error: err.message });
    throw err;
  }
}

/**
 * Get-or-fetch the user profile needed for clone prompting.
 * @param {string} authorId
 * @param {Function} fetchFn  async () => userData
 */
export async function cachedUser(authorId, fetchFn) {
  const key = `clone:user:${authorId}`;
  if (!isCacheEnabled()) {
    logger.debug("Cache disabled — fetching user directly", { authorId });
    return fetchFn();
  }
  const hit = await get(key);
  if (hit) return hit;
  const data = await fetchFn();
  await set(key, data, TTL_USER);
  return data;
}

/**
 * Get-or-fetch the post content needed for clone prompting.
 * @param {string}   postId
 * @param {Function} fetchFn  async () => postData
 */
export async function cachedPost(postId, fetchFn) {
  const key = `clone:post:${postId}`;
  if (!isCacheEnabled()) {
    logger.debug("Cache disabled — fetching post directly", { postId });
    return fetchFn();
  }
  const hit = await get(key);
  if (hit) return hit;
  const data = await fetchFn();
  await set(key, data, TTL_POST);
  return data;
}
