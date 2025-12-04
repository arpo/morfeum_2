/**
 * Shared Image Generation Utilities
 * Used by all pipelines that need to generate and fetch images
 */

import * as mzooService from '../../../services/mzoo';
import { morfeumVibes, NoCreatures, qualityPrompt } from '../../generation/prompts/shared/constants';

export interface ImageGenerationOptions {
  aspectRatio?: string;
  numImages?: number;
  safetyFilter?: string;
  applyPromptFix?: boolean;
  excludeCreatures?: boolean;
}

export interface ImageGenerationResult {
  imageUrl: string;
  imagePrompt: string;
}

/**
 * Fetch image as base64
 * Used by character and world tree pipelines for visual analysis
 */
export async function fetchImageAsBase64(imageUrl: string): Promise<string> {
  const response = await fetch(imageUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  return buffer.toString('base64');
}

/**
 * Apply prompt enhancements for image generation
 * Adds styling, quality terms, and optionally creature filtering
 */
function applyPromptEnhancements(
  prompt: string,
  excludeCreatures: boolean = false
): string {
  let result = `${morfeumVibes}\n\n${prompt}\n\n`;
  
  if (excludeCreatures) {
    result += `${NoCreatures}\n\n`;
  }
  
  result += qualityPrompt;
  
  return result;
}

/**
 * Generate image using MZOO service
 * Returns image URL and the final prompt used
 * 
 * @param apiKey - MZOO API key
 * @param prompt - Raw image prompt
 * @param numImages - Number of images to generate (default: 1)
 * @param aspectRatio - Image aspect ratio (default: 'landscape_16_9')
 * @param safety - Safety filter level (default: 'none')
 * @param options - Additional options for prompt enhancement
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  numImages: number = 1,
  aspectRatio: string = 'landscape_16_9',
  safety: string = 'none',
  options?: Pick<ImageGenerationOptions, 'applyPromptFix' | 'excludeCreatures'>
): Promise<{ imageUrl: string; imagePrompt: string }> {
  const { applyPromptFix = false, excludeCreatures = false } = options || {};
  
  // Apply prompt enhancements if requested
  const finalPrompt = applyPromptFix 
    ? applyPromptEnhancements(prompt, excludeCreatures)
    : prompt;

  const result = await mzooService.generateImage(
    apiKey,
    finalPrompt,
    numImages,
    aspectRatio,
    safety
  );

  if (result.error) {
    throw new Error(result.error);
  }

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Image URL not found in response');
  }

  return { imageUrl, imagePrompt: finalPrompt };
}

/**
 * Generate image and immediately fetch as base64
 * Convenient for pipelines that need both
 */
export async function generateAndFetchImage(
  apiKey: string,
  prompt: string,
  aspectRatio: string = 'landscape_16_9'
): Promise<{ imageUrl: string; base64: string }> {
  const { imageUrl } = await generateImage(apiKey, prompt, 1, aspectRatio, 'none');
  const base64 = await fetchImageAsBase64(imageUrl);
  
  return { imageUrl, base64 };
}
