/**
 * MZOO Cache Service
 * Manages Gemini Explicit Caching for static prompt content
 */

import { mzooPost, mzooGet, mzooDelete, mzooPatch } from '../client/httpClient';
import { CACHE_GROUPS, type CacheGroupId } from '../../../engine/generation/prompts/cacheContent';

const CACHE_ENDPOINT = 'https://www.mzoo.app/api/v1/ai/gemini';

// Default TTL configurable via environment variable (default: 4 hours)
const DEFAULT_CACHE_TTL = process.env.MZOO_CACHE_TTL || '14400s';

/**
 * Cache info returned from MZOO API
 */
export interface CacheInfo {
  cacheId: string;
  displayName: string;
  tokenCount: number;
  expiresAt: string;
  model: string;
}

/**
 * In-memory cache ID storage
 * Maps cache group IDs to their cache IDs and expiry times
 */
const cacheIdStore: Map<CacheGroupId, { cacheId: string; expiresAt: Date }> = new Map();

/**
 * Ensure a cache exists for the given group, creating if needed
 * @param apiKey - MZOO API key
 * @param groupId - Cache group identifier
 * @returns Cache ID
 */
export async function ensureCache(
  apiKey: string,
  groupId: CacheGroupId
): Promise<string> {
  // Check in-memory store first
  const cached = cacheIdStore.get(groupId);
  if (cached && cached.expiresAt > new Date()) {
    return cached.cacheId;
  }

  // Check if cache exists on server
  const existing = await findCacheByDisplayName(apiKey, groupId);
  if (existing) {
    cacheIdStore.set(groupId, {
      cacheId: existing.cacheId,
      expiresAt: new Date(existing.expiresAt)
    });
    return existing.cacheId;
  }

  // Create new cache
  const content = CACHE_GROUPS[groupId];
  const response = await mzooPost<any, any>(
    `${CACHE_ENDPOINT}/cache`,
    apiKey,
    {
      displayName: groupId,
      model: 'gemini-2.5-flash-lite',
      staticContent: content,
      ttl: DEFAULT_CACHE_TTL
    }
  );

  if (response.data?.cacheId) {
    cacheIdStore.set(groupId, {
      cacheId: response.data.cacheId,
      expiresAt: new Date(response.data.expiresAt)
    });
    return response.data.cacheId;
  }

  throw new Error(`Failed to create cache for ${groupId}: ${response.error || 'Unknown error'}`);
}

/**
 * Find cache by display name
 * @param apiKey - MZOO API key
 * @param displayName - Cache display name to search for
 * @returns Cache info if found, null otherwise
 */
async function findCacheByDisplayName(
  apiKey: string,
  displayName: string
): Promise<CacheInfo | null> {
  try {
    const response = await mzooGet<{ caches: CacheInfo[] }>(
      `${CACHE_ENDPOINT}/caches`,
      apiKey
    );
    return response.data?.caches?.find(c => c.displayName === displayName) || null;
  } catch {
    return null;
  }
}

/**
 * Invalidate cache (call when prompts are updated)
 * @param apiKey - MZOO API key
 * @param groupId - Cache group identifier
 */
export async function invalidateCache(
  apiKey: string,
  groupId: CacheGroupId
): Promise<void> {
  const cached = cacheIdStore.get(groupId);
  if (cached) {
    await mzooDelete(
      `${CACHE_ENDPOINT}/cache/${encodeURIComponent(cached.cacheId)}`,
      apiKey
    );
    cacheIdStore.delete(groupId);
  }
}

/**
 * Invalidate all caches
 * @param apiKey - MZOO API key
 */
export async function invalidateAllCaches(apiKey: string): Promise<void> {
  const groupIds = Object.keys(CACHE_GROUPS) as CacheGroupId[];
  for (const groupId of groupIds) {
    await invalidateCache(apiKey, groupId);
  }
}

/**
 * Refresh cache TTL
 * @param apiKey - MZOO API key
 * @param groupId - Cache group identifier
 * @param ttl - New TTL (e.g., '14400s' for 4 hours)
 * @returns Updated cache info
 */
export async function refreshCacheTTL(
  apiKey: string,
  groupId: CacheGroupId,
  ttl: string = DEFAULT_CACHE_TTL
): Promise<CacheInfo | null> {
  const cached = cacheIdStore.get(groupId);
  if (!cached) {
    return null;
  }

  const response = await mzooPatch<{ ttl: string }, CacheInfo>(
    `${CACHE_ENDPOINT}/cache/${encodeURIComponent(cached.cacheId)}`,
    apiKey,
    { ttl }
  );

  if (response.data) {
    cacheIdStore.set(groupId, {
      cacheId: response.data.cacheId,
      expiresAt: new Date(response.data.expiresAt)
    });
    return response.data;
  }

  return null;
}

/**
 * List all caches
 * @param apiKey - MZOO API key
 * @returns List of cache info objects
 */
export async function listCaches(apiKey: string): Promise<CacheInfo[]> {
  const response = await mzooGet<{ caches: CacheInfo[] }>(
    `${CACHE_ENDPOINT}/caches`,
    apiKey
  );
  return response.data?.caches || [];
}

/**
 * Clear in-memory cache store (useful for testing)
 */
export function clearCacheStore(): void {
  cacheIdStore.clear();
}
