/**
 * MZOO Cached Text Generation Service
 * Generates text using Gemini Explicit Caching for 90% token cost reduction
 */

import { mzooPost } from '../client/httpClient';
import { ensureCache, type CacheInfo } from './cacheService';
import { generateText } from './textGeneration';
import type { CacheGroupId } from '../../../engine/generation/prompts/cacheContent';

const CACHE_ENDPOINT = 'https://www.mzoo.app/api/v1/ai/gemini';

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
  try {
    // Ensure cache exists
    const cacheId = await ensureCache(apiKey, cacheGroup);

    // Make cached generation request
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

    if (response.error) {
      // If cache-related error, fall back to non-cached generation
      if (response.error.includes('CACHE_NOT_FOUND') || 
          response.error.includes('CACHE_EXPIRED')) {
        return fallbackToNonCached(apiKey, cacheGroup, dynamicPrompt);
      }
      throw new Error(response.error);
    }

    if (!response.data) {
      throw new Error('No data returned from cached text generation');
    }

    return response.data;
  } catch (error) {
    // Fall back to non-cached generation on any error
    console.error('[CachedTextGeneration] Cache failed, falling back to non-cached:', error);
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
  // Import cache groups to get the static content
  const { CACHE_GROUPS } = await import('../../../engine/generation/prompts/cacheContent');
  
  const staticContent = CACHE_GROUPS[cacheGroup];
  const fullPrompt = `${staticContent}\n\n${dynamicPrompt}`;
  
  const messages = [
    { role: 'user', content: fullPrompt }
  ];
  
  const result = await generateText(apiKey, messages);
  
  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate text');
  }
  
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
