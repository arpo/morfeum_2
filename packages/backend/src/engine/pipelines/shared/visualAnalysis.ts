/**
 * Shared Visual Analysis Utilities
 * Used by pipelines that need to analyze generated images
 */

import * as mzooService from '../../../services/mzoo';
import { parseJSON } from '../../utils/parseJSON';
import { fetchImageAsBase64 } from './imageGeneration';

/**
 * Analyze image with custom prompt
 * Returns parsed JSON result
 */
export async function analyzeImageWithPrompt<T = any>(
  apiKey: string,
  imageUrl: string,
  analysisPrompt: string,
  model: string
): Promise<T> {
  const base64Image = await fetchImageAsBase64(imageUrl);
  
  const result = await mzooService.analyzeImage(
    apiKey,
    base64Image,
    analysisPrompt,
    'image/jpeg',
    model
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No visual analysis data returned');
  }

  const analysis = parseJSON<T>(result.data.text);
  return analysis;
}
