/**
 * MZOO Image Upscale Service
 * SeedVR - AI-powered image upscaling
 */

import { mzooPost } from '../client/httpClient';
import { ENDPOINTS, DEFAULT_IMAGE_UPSCALE_SETTINGS } from '../config/endpoints';
import { MzooResponse, ImageUpscaleResponse } from '../types';

/**
 * Upscale image using MZOO SeedVR Upscale API
 * @param apiKey - MZOO API key
 * @param inputImage - Image URL or base64 data URL to upscale
 * @param upscale_mode - 'factor' or 'resolution' mode (default: factor)
 * @param upscale_factor - Scale factor: 2 or 4 (default: 2)
 * @param target_resolution - Target resolution: 1080p, 2k, 4k (default: 1080p)
 * @param noise_scale - Noise reduction scale 0-1 (default: 0.1)
 * @param output_format - Output format: jpg or png (default: jpg)
 * @returns Response with upscaled image URL and metadata
 */
export async function upscaleImage(
  apiKey: string,
  inputImage: string,
  upscale_mode: 'factor' | 'resolution' = DEFAULT_IMAGE_UPSCALE_SETTINGS.UPSCALE_MODE as 'factor',
  upscale_factor: 2 | 4 = DEFAULT_IMAGE_UPSCALE_SETTINGS.UPSCALE_FACTOR as 2,
  target_resolution: '1080p' | '2k' | '4k' = DEFAULT_IMAGE_UPSCALE_SETTINGS.TARGET_RESOLUTION as '1080p',
  noise_scale: number = DEFAULT_IMAGE_UPSCALE_SETTINGS.NOISE_SCALE,
  output_format: 'jpg' | 'png' = DEFAULT_IMAGE_UPSCALE_SETTINGS.OUTPUT_FORMAT as 'jpg'
): Promise<MzooResponse<ImageUpscaleResponse>> {
  return mzooPost<
    {
      inputImage: string;
      upscale_mode: string;
      upscale_factor: number;
      target_resolution: string;
      noise_scale: number;
      output_format: string;
    },
    ImageUpscaleResponse
  >(
    ENDPOINTS.IMAGE_UPSCALE,
    apiKey,
    {
      inputImage,
      upscale_mode,
      upscale_factor,
      target_resolution,
      noise_scale,
      output_format
    }
  );
}
