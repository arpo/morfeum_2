/**
 * Shared Image Generation Module
 * Centralized image generation for all location nodes
 */

import { generateImage } from '../../../services/mzoo';
import { applyMorfeumStyle } from './applyMorfeumStyle';

export interface ImageGenerationOptions {
  aspectRatio?: string;
  numImages?: number;
  safetyFilter?: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  imagePrompt: string;
}

/**
 * Generate image for location node
 * Applies prompt fixes and handles errors consistently
 * 
 * @param apiKey - MZOO API key
 * @param imagePrompt - Raw image prompt from LLM
 * @param options - Optional image generation parameters
 * @returns Image URL and prompt
 */
export async function generateLocationImage(
  apiKey: string,
  imagePrompt: string,
  options?: ImageGenerationOptions
): Promise<ImageGenerationResult> {
  const {
    aspectRatio = 'landscape_16_9',
    numImages = 1,
    safetyFilter = 'none'
  } = options || {};

 
  // Check if Morfeum style has already been applied (indicated by markers like [POPULATE:], [FILTER:], or style prefix)
  const styleAlreadyApplied = imagePrompt.includes('[POPULATE:]') || 
                               imagePrompt.includes('[FILTER:') || 
                               imagePrompt.includes('living-surface sheen');
  
  // Apply general prompt fixes only if not already applied
  const fixedPrompt = styleAlreadyApplied ? imagePrompt : applyMorfeumStyle(imagePrompt);
  // console.log('\n\n##################### ACTUAL NICHE IMAGE PROMPT  #####################');
  // console.log(fixedPrompt);
  // console.log('##################### ACTUAL NICHE IMAGE PROMPT END  #####################\n\n');

  // Generate image via MZOO service
  const result = await generateImage(
    apiKey,
    fixedPrompt,
    numImages,
    aspectRatio,
    safetyFilter
  );

  if (result.error) {
    throw new Error(`Image generation failed: ${result.error}`);
  }

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Image URL not found in response');
  }

  return {
    imageUrl,
    imagePrompt: fixedPrompt
  };
}
