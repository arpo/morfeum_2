/**
 * MZOO Text Generation Service
 */

import { mzooPost } from '../client/httpClient';
import { ENDPOINTS, DEFAULT_MODELS } from '../config/endpoints';
import { MzooResponse, TextGenerationResponse } from '../types';

/**
 * Generate text using MZOO Gemini API
 * @param apiKey - MZOO API key
 * @param messages - Array of chat messages
 * @param model - AI model to use (default: gemini-2.5-flash)
 * @returns Response with generated text
 */
export async function generateText(
  apiKey: string,
  messages: any[],
  model: string = DEFAULT_MODELS.TEXT
): Promise<MzooResponse<TextGenerationResponse>> {
  // Format messages array into a single prompt with conversation history
  const prompt = messages.map((msg: any) => {
    const role = msg.role === 'system' ? 'System' : msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n\n');

  return mzooPost<{ prompt: string; model: string }, TextGenerationResponse>(
    ENDPOINTS.TEXT_GENERATION,
    apiKey,
    { prompt, model }
  );
}
