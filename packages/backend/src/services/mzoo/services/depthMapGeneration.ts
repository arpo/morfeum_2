/**
 * MZOO Depth Map Generation Service
 */

import { mzooPost } from '../client/httpClient';
import { ENDPOINTS } from '../config/endpoints';
import { MzooResponse, DepthMapResponse } from '../types';

/**
 * Generate depth map using MZOO FAL Depth Anything V2 API
 * @param apiKey - MZOO API key
 * @param image_url - URL of the image to process for depth estimation
 * @param output_format - Output format: png (default), jpeg
 * @param high_quality - High quality mode: false (default), true (slower but better quality)
 * @returns Response with generated depth map URL
 */
export async function generateDepthMap(
  apiKey: string,
  image_url: string,
  output_format: 'png' | 'jpeg' = 'jpeg',
  high_quality: boolean = false
): Promise<MzooResponse<DepthMapResponse>> {
  return mzooPost<
    {
      image_url: string;
      output_format: 'png' | 'jpeg';
      high_quality: boolean;
    },
    DepthMapResponse
  >(
    ENDPOINTS.DEPTH_MAP,
    apiKey,
    {
      image_url,
      output_format,
      high_quality
    }
  );
}
