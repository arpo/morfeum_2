/**
 * Shared Image Generation Utilities
 * Used by all pipelines that need to generate and fetch images
 */

import * as mzooService from '../../../services/mzoo';
import { generalPromptFix } from '../../generation/prompts/shared/generalPromptFix';

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
 * Generate image using MZOO service
 * Returns image URL
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  numImages: number = 1,
  aspectRatio: string = 'landscape_16_9',
  safety: string = 'none'
): Promise<{ imageUrl: string }> {
  const result = await mzooService.generateImage(
    apiKey,
    prompt,
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

  return { imageUrl };
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

  // Apply general prompt fixes
  const fixedPrompt = generalPromptFix(imagePrompt);

  // Generate image via MZOO service
  const result = await mzooService.generateImage(
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
