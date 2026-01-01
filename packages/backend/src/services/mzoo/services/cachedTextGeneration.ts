/**
 * MZOO Cached Text Generation Service
 * Generates text using Gemini Explicit Caching for 90% token cost reduction
 * 
 * Set DISABLE_CACHING=true environment variable to bypass caching during development
 */

import { mzooPost } from '../client/httpClient';
import { ensureCache, type CacheInfo } from './cacheService';
import { generateText } from './textGeneration';
import type { CacheGroupId } from '../../../engine/generation/prompts/cacheContent';

const CACHE_ENDPOINT = 'https://www.mzoo.app/api/v1/ai/gemini';

/**
 * Check if caching is disabled via environment variable
 */
const isCachingDisabled = (): boolean => {
  return process.env.DISABLE_CACHING === 'true';
};

/**
 * Thinking mode configuration
 */
export interface ThinkingConfig {
  includeThoughts?: boolean;
  thinkingBudget?: number;  // 0 = off, 512-24576 = on
}

/**
 * Response from cached text generation
 */
export interface CachedTextResponse {
  text: string;
  thoughts?: string;
  usage: {
    promptTokens: number;
    cachedTokens: number;
    completionTokens: number;
    thinkingTokens?: number;
  };
  cacheHit: boolean;
}

/**
 * Generate text using cached context
 * Falls back to non-cached generation if cache fails
 * 
 * @param apiKey - MZOO API key
 * @param cacheGroup - Cache group to use
 * @param dynamicPrompt - Dynamic portion of the prompt
 * @param thinkingConfig - Optional thinking mode configuration
 * @returns Generated text response
 */
export async function generateCachedText(
  apiKey: string,
  cacheGroup: CacheGroupId,
  dynamicPrompt: string,
  thinkingConfig?: ThinkingConfig
): Promise<CachedTextResponse> {
  console.log(`[CachedTextGen] Starting cached generation for group: ${cacheGroup}`);
  console.log(`[CachedTextGen] Dynamic prompt length: ${dynamicPrompt.length} chars`);
  
  // Check if caching is disabled via environment variable
  if (isCachingDisabled()) {
    console.log(`[CachedTextGen] ⚠️ CACHING DISABLED via DISABLE_CACHING env variable`);
    return fallbackToNonCached(apiKey, cacheGroup, dynamicPrompt);
  }
  
  try {
    // Ensure cache exists
    console.log(`[CachedTextGen] Ensuring cache exists...`);
    const cacheId = await ensureCache(apiKey, cacheGroup);
    console.log(`[CachedTextGen] Got cacheId: ${cacheId}`);

    // Make cached generation request
    console.log(`[CachedTextGen] Calling MZOO cached-text endpoint...`);
    const response = await mzooPost<any, CachedTextResponse>(
      `${CACHE_ENDPOINT}/cached-text`,
      apiKey,
      {
        cacheId,
        prompt: dynamicPrompt,
        model: 'gemini-2.5-flash-lite',
        thinkingConfig: thinkingConfig || { includeThoughts: false, thinkingBudget: 0 }
      }
    );

    console.log(`[CachedTextGen] Response received:`, JSON.stringify({
      hasData: !!response.data,
      hasError: !!response.error,
      error: response.error,
      cacheHit: response.data?.cacheHit,
      usage: response.data?.usage
    }, null, 2));

    if (response.error) {
      console.error(`[CachedTextGen] ❌ API returned error: ${response.error}`);
      // If cache-related error, fall back to non-cached generation
      if (response.error.includes('CACHE_NOT_FOUND') || 
          response.error.includes('CACHE_EXPIRED')) {
        console.log(`[CachedTextGen] Cache-related error, falling back...`);
        return fallbackToNonCached(apiKey, cacheGroup, dynamicPrompt);
      }
      throw new Error(response.error);
    }

    if (!response.data) {
      console.error(`[CachedTextGen] ❌ No data in response`);
      throw new Error('No data returned from cached text generation');
    }

    console.log(`[CachedTextGen] ✅ SUCCESS - cacheHit: ${response.data.cacheHit}, cachedTokens: ${response.data.usage?.cachedTokens || 0}`);
    return response.data;
  } catch (error) {
    // Fall back to non-cached generation on any error
    console.error('[CachedTextGen] ❌ Exception caught, falling back to non-cached:', error);
    return fallbackToNonCached(apiKey, cacheGroup, dynamicPrompt);
  }
}

/**
 * Generate text with thinking enabled
 * 
 * @param apiKey - MZOO API key
 * @param cacheGroup - Cache group to use
 * @param dynamicPrompt - Dynamic portion of the prompt
 * @param thinkingBudget - Thinking budget (512-24576)
 * @returns Generated text response with thoughts
 */
export async function generateCachedTextWithThinking(
  apiKey: string,
  cacheGroup: CacheGroupId,
  dynamicPrompt: string,
  thinkingBudget: number = 2048
): Promise<CachedTextResponse> {
  return generateCachedText(apiKey, cacheGroup, dynamicPrompt, {
    includeThoughts: true,
    thinkingBudget
  });
}

/**
 * Fall back to non-cached generation
 * Uses the full prompt (static + dynamic) via standard text generation
 */
async function fallbackToNonCached(
  apiKey: string,
  cacheGroup: CacheGroupId,
  dynamicPrompt: string
): Promise<CachedTextResponse> {
  console.log(`[CachedTextGen] ⚠️ FALLBACK: Using non-cached generation for ${cacheGroup}`);
  
  // Import cache groups to get the static content
  const { CACHE_GROUPS } = await import('../../../engine/generation/prompts/cacheContent');
  
  const staticContent = CACHE_GROUPS[cacheGroup];
  const fullPrompt = `${staticContent}\n\n${dynamicPrompt}`;
  
  console.log(`[CachedTextGen] Fallback prompt size: ${fullPrompt.length} chars (~${Math.ceil(fullPrompt.length / 4)} tokens)`);
  
  const messages = [
    { role: 'user', content: fullPrompt }
  ];
  
  const result = await generateText(apiKey, messages);
  
  if (result.error || !result.data) {
    console.error(`[CachedTextGen] ❌ Fallback also failed:`, result.error);
    throw new Error(result.error || 'Failed to generate text');
  }
  
  console.log(`[CachedTextGen] ⚠️ Fallback completed (NO CACHING USED)`);
  
  return {
    text: result.data.text,
    usage: {
      promptTokens: 0, // Not available from standard generation
      cachedTokens: 0,
      completionTokens: 0
    },
    cacheHit: false
  };
}
