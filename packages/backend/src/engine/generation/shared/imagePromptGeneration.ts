/**
 * Shared Image Prompt Generation Module
 * Generates LLM prompts for image creation across different node types
 */

import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { nicheImagePrompt } from '../prompts/navigation/nicheImagePrompt';
import { getStylePrompt } from '../prompts/navigation/styles/registry';
import type { NavigationDecision, NavigationContext, IntentResult } from '../../navigation/types';

export interface ImagePromptOptions {
  nodeType?: 'niche' | 'feature' | 'detail' | 'location' | 'host' | 'region';
  style?: string;        // NEW: Visual style from registry
  perspective?: string;  // NEW: Perspective (interior/exterior)
}

/**
 * Generate image prompt for any node type using LLM
 * Currently supports niche nodes, can be extended for other types
 * 
 * @param context - Navigation context with current node
 * @param intent - Classified user intent
 * @param decision - Navigation decision
 * @param apiKey - MZOO API key
 * @param options - Optional configuration
 * @returns LLM-generated image prompt
 */
export async function generateImagePromptForNode(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  apiKey: string,
  options?: ImagePromptOptions
): Promise<string> {
  const nodeType = options?.nodeType || 'niche';
  
  // Use spaceType/perspective to select adaptation (not style!)
  // perspective comes from intent.spaceType via pipeline options
  const perspective = options?.perspective || 'interior';
  
  // Map perspective to adaptation name
  const adaptationName = perspective === 'exterior' ? 'exterior' : 'default';
  
  // Get adaptation prompt function from registry
  // 'default' = interior adaptation, 'exterior' = exterior adaptation
  const promptFunction = getStylePrompt(intent.intent, adaptationName);
  
  // Generate system prompt using the registered prompt function
  const systemPrompt = promptFunction(context, intent, decision);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: `Generate image prompt for ${nodeType}: ${context.currentNode.name}` }
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
