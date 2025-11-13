/**
 * Shared Image Generation Module
 * Centralized image generation for all location nodes
 */

import { generateImage } from '../../../services/mzoo';
import { generalPromptFix } from '../prompts/shared/generalPromptFix';

export interface ImageGenerationOptions {
  aspectRatio?: string;
  numImages?: number;
  safetyFilter?: string;
  spaceType?: 'interior' | 'exterior' | 'unknown';
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
    safetyFilter = 'none',
    spaceType = 'unknown'
  } = options || {};

 
  // Apply general prompt fixes (space-type aware)
  const fixedPrompt = generalPromptFix(imagePrompt, spaceType);
  console.log('......... fixedPrompt..........');
  console.log(fixedPrompt);
  console.log('..............');

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
