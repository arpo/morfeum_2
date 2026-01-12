/**
 * MZOO Vision Analysis Service
 * 
 * Analyzes images using the mzoo vision API.
 * Note: Caching is now handled internally by mzoo - no client-side cache management needed.
 */

import { analyzeImage } from './visionAnalysis';
import type { MzooResponse, VisionAnalysisResponse } from '../types';

/**
 * Response from vision analysis (maintained for backward compatibility)
 */
export interface CachedVisionResponse {
  text: string;  // Kept as 'text' for backward compatibility with callers
  usage: {
    promptTokens: number;
    cachedTokens: number;
    completionTokens: number;
  };
  cacheHit: boolean;
}

/**
 * Analyze image using MZOO Vision API
 * 
 * Note: This function maintains backward compatibility by returning 'text' 
 * in the response, even though the underlying API now returns 'analysis'.
 * Caching is handled internally by mzoo.
 * 
 * @param apiKey - MZOO API key
 * @param base64Image - Base64 encoded image data
 * @param mimeType - Image MIME type (default: image/png)
 * @returns Analysis response with text field
 */
export async function analyzeImageCached(
  apiKey: string,
  base64Image: string,
  mimeType: string = 'image/png'
): Promise<CachedVisionResponse> {
  // Import the vision description prompt
  const { VISION_DESCRIPTION_STATIC } = await import('../../../engine/generation/prompts/shared/visionDescription');
  
  const result = await analyzeImage(apiKey, base64Image, VISION_DESCRIPTION_STATIC, mimeType);
  
  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to analyze image');
  }
  
  return {
    text: result.data.analysis,  // Map 'analysis' to 'text' for backward compatibility
    usage: {
      promptTokens: 0,
      cachedTokens: 0,  // Caching is now internal to mzoo
      completionTokens: 0
    },
    cacheHit: false  // We don't know if mzoo used cache, but it handles it internally
  };
}
