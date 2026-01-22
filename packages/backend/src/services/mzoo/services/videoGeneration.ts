/**
 * MZOO Video Generation Service
 * Uses Seedance 1.0 Pro Fast for video loop generation
 */

import { mzooPost } from '../client/httpClient';
import { ENDPOINTS, DEFAULT_VIDEO_SETTINGS } from '../config/endpoints';
import { MzooResponse, VideoGenerationResponse } from '../types';

/**
 * Generate video using MZOO Seedance API
 * @param apiKey - MZOO API key
 * @param positivePrompt - Video generation prompt
 * @param options - Optional video generation settings
 * @returns Response with generated video URL
 */
export async function generateVideo(
  apiKey: string,
  positivePrompt: string,
  options: {
    provider?: 'atlascloud' | 'runware' | 'replicate';
    negativePrompt?: string;
    inputImage?: string;
    aspectRatio?: '16:9' | '9:16' | '1:1';
    resolution?: '480p' | '720p';
    size?: string;
    duration?: number;
    fps?: number;
    cameraFixed?: boolean;
    outputFormat?: 'mp4';
    outputQuality?: number;
  } = {}
): Promise<MzooResponse<VideoGenerationResponse>> {
  const {
    provider = DEFAULT_VIDEO_SETTINGS.PROVIDER,
    negativePrompt,
    inputImage,
    aspectRatio = DEFAULT_VIDEO_SETTINGS.ASPECT_RATIO,
    resolution = DEFAULT_VIDEO_SETTINGS.RESOLUTION,
    size,
    duration = DEFAULT_VIDEO_SETTINGS.DURATION,
    fps = DEFAULT_VIDEO_SETTINGS.FPS,
    cameraFixed = DEFAULT_VIDEO_SETTINGS.CAMERA_FIXED,
    outputFormat = DEFAULT_VIDEO_SETTINGS.OUTPUT_FORMAT,
    outputQuality = DEFAULT_VIDEO_SETTINGS.OUTPUT_QUALITY
  } = options;

  const body: Record<string, unknown> = {
    provider,
    positivePrompt,
    aspectRatio,
    resolution,
    duration,
    fps,
    cameraFixed,
    outputFormat,
    outputQuality
  };

  if (negativePrompt) {
    body.negativePrompt = negativePrompt;
  }

  if (inputImage) {
    body.inputImage = inputImage;
  }

  if (size) {
    body.size = size;
  }

  return mzooPost<Record<string, unknown>, VideoGenerationResponse>(
    ENDPOINTS.VIDEO_GENERATION,
    apiKey,
    body
  );
}
