/**
 * MZOO Vision Analysis Service
 */

import { mzooPost } from '../client/httpClient';
import { ENDPOINTS, DEFAULT_MODELS } from '../config/endpoints';
import { MzooResponse, VisionAnalysisResponse } from '../types';

/**
 * Analyze image using MZOO Vision API
 * @param apiKey - MZOO API key
 * @param base64Image - Base64 encoded image data
 * @param prompt - Analysis prompt/instructions
 * @param mimeType - Image MIME type (default: image/png)
 * @param model - AI model to use (default: gemini-2.5-flash)
 * @returns Response with analysis text
 */
export async function analyzeImage(
  apiKey: string,
  base64Image: string,
  prompt: string,
  mimeType: string = 'image/png',
  model: string = DEFAULT_MODELS.VISION
): Promise<MzooResponse<VisionAnalysisResponse>> {
  return mzooPost<
    {
      model: string;
      prompt: string;
      image: {
        mimeType: string;
        data: string;
      };
    },
    VisionAnalysisResponse
  >(
    ENDPOINTS.VISION_ANALYSIS,
    apiKey,
    {
      model,
      prompt,
      image: {
        mimeType,
        data: base64Image
      }
    }
  );
}
