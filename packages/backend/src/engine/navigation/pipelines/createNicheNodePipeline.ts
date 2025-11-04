/**
 * Create Niche Node Pipeline
 * Generates image for stepping inside a location (GO_INSIDE intent)
 */

import { generateText, generateImage } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { nicheImagePrompt } from '../../generation/prompts/navigation/nicheImagePrompt';
import type { NavigationDecision, NavigationContext } from '../types';

/**
 * Generate image prompt for stepping inside using LLM
 */
async function generateNicheImagePrompt(
  currentNodeName: string,
  currentNodeDescription: string,
  parentNodeInfo: string | null,
  apiKey: string
): Promise<string> {
  const prompt = nicheImagePrompt(currentNodeName, currentNodeDescription, parentNodeInfo);

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate image prompt for stepping inside: ${currentNodeName}` }
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
  apiKey: string
): Promise<{ imageUrl: string; imagePrompt: string }> {
  // Step 1: Gather context
  const currentNodeName = context.currentNode.name;
  const currentNodeDescription = context.currentNode.data.description || 
                                  context.currentNode.data.looks || 
                                  'No description available';
  
  // Get parent context if available
  let parentNodeInfo: string | null = null;
  if (context.parentNode) {
    parentNodeInfo = `${context.parentNode.name}: ${context.parentNode.data?.description || context.parentNode.data?.looks || ''}`;
  }

  // Step 2: Generate image prompt using LLM
  const imagePrompt = await generateNicheImagePrompt(
    currentNodeName,
    currentNodeDescription,
    parentNodeInfo,
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
