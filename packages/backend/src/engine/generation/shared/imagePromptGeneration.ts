/**
 * Shared Image Prompt Generation Module
 * Generates LLM prompts for image creation across different node types
 */

import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { nicheImagePrompt } from '../prompts/navigation/nicheImagePrompt';
import type { NavigationDecision, NavigationContext, IntentResult } from '../../navigation/types';

export interface ImagePromptOptions {
  nodeType?: 'niche' | 'feature' | 'detail' | 'location' | 'host' | 'region';
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
  
  // Select appropriate prompt template based on node type
  let systemPrompt: string;
  
  switch (nodeType) {
    case 'niche':
      systemPrompt = nicheImagePrompt(context, intent, decision);
      break;
    
    case 'feature':
      // TODO: Add feature-specific prompt when implementing EXPLORE_FEATURE
      systemPrompt = nicheImagePrompt(context, intent, decision);
      break;
    
    case 'detail':
      // TODO: Add detail-specific prompt when implementing APPROACH
      systemPrompt = nicheImagePrompt(context, intent, decision);
      break;
    
    case 'location':
      // TODO: Add location-specific prompt for other intents
      systemPrompt = nicheImagePrompt(context, intent, decision);
      break;
    
    default:
      systemPrompt = nicheImagePrompt(context, intent, decision);
  }

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
