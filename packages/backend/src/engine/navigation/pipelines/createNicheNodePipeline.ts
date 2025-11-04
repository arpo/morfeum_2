/**
 * Create Niche Node Pipeline
 * Generates image for stepping inside a location (GO_INSIDE intent)
 */

import { generateText, generateImage } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { nicheImagePrompt } from '../../generation/prompts/navigation/nicheImagePrompt';
import type { NavigationDecision, NavigationContext, IntentResult } from '../types';

/**
 * Generate image prompt for stepping inside using LLM
 */
async function generateNicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  apiKey: string
): Promise<string> {
  const prompt = nicheImagePrompt(context, intent, decision);

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate image prompt for stepping inside: ${context.currentNode.name}` }
  ];

  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No image prompt returned from LLM');
  }

  return result.data.text.trim();
}

/**
 * Run the complete niche image generation pipeline
 */
export async function runCreateNichePipeline(
  decision: NavigationDecision,
  context: NavigationContext,
  intent: IntentResult,
  apiKey: string
): Promise<{ imageUrl: string; imagePrompt: string }> {
  // Generate image prompt using LLM with full context
  const imagePrompt = await generateNicheImagePrompt(
    context,
    intent,
    decision,
    apiKey
  );

  // Step 3: Generate FLUX image
  const result = await generateImage(
    apiKey,
    imagePrompt,
    1,
    'landscape_16_9',
    'none'
  );

  if (result.error) {
    throw new Error(result.error);
  }

  const imageUrl = result.data?.images?.[0]?.url;
  if (!imageUrl) {
    throw new Error('Image URL not found in response');
  }

  return {
    imageUrl,
    imagePrompt
  };
}
