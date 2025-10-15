/**
 * MZOO Image Generation Service
 */

import { mzooPost } from '../client/httpClient';
import { ENDPOINTS, DEFAULT_IMAGE_SETTINGS } from '../config/endpoints';
import { MzooResponse, ImageGenerationResponse } from '../types';

/**
 * Generate image using MZOO FAL Flux API
 * @param apiKey - MZOO API key
 * @param prompt - Image generation prompt
 * @param num_images - Number of images to generate (default: 1)
 * @param image_size - Image size preset (default: landscape_16_9)
 * @param acceleration - Acceleration mode (default: high)
 * @returns Response with generated image URLs
 */
export async function generateImage(
  apiKey: string,
  prompt: string,
  num_images: number = DEFAULT_IMAGE_SETTINGS.NUM_IMAGES,
  image_size: string = DEFAULT_IMAGE_SETTINGS.IMAGE_SIZE,
  acceleration: string = DEFAULT_IMAGE_SETTINGS.ACCELERATION
): Promise<MzooResponse<ImageGenerationResponse>> {
  return mzooPost<
    {
      prompt: string;
      num_images: number;
      image_size: string;
      acceleration: string;
    },
    ImageGenerationResponse
  >(
    ENDPOINTS.IMAGE_GENERATION,
    apiKey,
    {
      prompt,
      num_images,
      image_size,
      acceleration
    }
  );
}
