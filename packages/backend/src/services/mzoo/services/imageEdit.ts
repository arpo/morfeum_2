/**
 * MZOO Image Edit Service
 * FAL Flux 2 Turbo Edit - fast image editing with text prompts
 */

import { mzooPost } from '../client/httpClient';
import { ENDPOINTS, DEFAULT_IMAGE_EDIT_SETTINGS } from '../config/endpoints';
import { MzooResponse, ImageEditResponse } from '../types';

/**
 * Edit image using MZOO FAL Flux 2 Turbo Edit API
 * @param apiKey - MZOO API key
 * @param prompt - Describe the edit you want to apply to the image
 * @param inputImage - Image URL or base64 data URL to edit (optional)
 * @param num_images - Number of images to generate (1-4, default: 1)
 * @param image_size - Output image aspect ratio (default: landscape_16_9)
 * @param guidance_scale - How closely to follow the prompt (1-20, default: 2.5)
 * @param output_format - Output format: jpeg or png (default: jpeg)
 * @param enable_safety_checker - Filter unsafe content (default: false)
 * @returns Response with edited image URLs
 */
export async function editImage(
  apiKey: string,
  prompt: string,
  inputImage?: string,
  num_images: number = DEFAULT_IMAGE_EDIT_SETTINGS.NUM_IMAGES,
  image_size: string = DEFAULT_IMAGE_EDIT_SETTINGS.IMAGE_SIZE,
  guidance_scale: number = DEFAULT_IMAGE_EDIT_SETTINGS.GUIDANCE_SCALE,
  output_format: string = DEFAULT_IMAGE_EDIT_SETTINGS.OUTPUT_FORMAT,
  enable_safety_checker: boolean = DEFAULT_IMAGE_EDIT_SETTINGS.ENABLE_SAFETY_CHECKER
): Promise<MzooResponse<ImageEditResponse>> {
  return mzooPost<
    {
      prompt: string;
      inputImage?: string;
      num_images: number;
      image_size: string;
      guidance_scale: number;
      output_format: string;
      enable_safety_checker: boolean;
    },
    ImageEditResponse
  >(
    ENDPOINTS.IMAGE_EDIT,
    apiKey,
    {
      prompt,
      inputImage,
      num_images,
      image_size,
      guidance_scale,
      output_format,
      enable_safety_checker
    }
  );
}
