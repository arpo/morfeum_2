/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

import type { NavigationContext, IntentResult, NavigationDecision } from '../../../navigation/types';

/**
 * Generate prompt for LLM to create FLUX image description
 * for stepping inside a location
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision
): string {
  const prompt = `You are an expert at creating vivid, genre-agnostic image prompts for FLUX image generation.

TASK: Create an image prompt for stepping INSIDE "${context.currentNode.name}".

NAVIGATION INTENT:
${JSON.stringify(intent, null, 2)}

NAVIGATION DECISION:
${JSON.stringify(decision, null, 2)}

CURRENT NODE (location we're entering):
${JSON.stringify(context.currentNode, null, 2)}

PARENT NODE (exterior context):
${JSON.stringify(context.parentNode, null, 2)}

REQUIREMENTS:
1. Imagine what it looks like when we JUST STEPPED INSIDE through the entrance
2. Use first-person interior perspective (medium elevated offset angle, diagonal composition)
3. Include interesting navigation details (doors, stairs, passages, rooms) if suitable based on the data
4. Consider time of day and lighting based on the context
5. Be creative and genre-agnostic (works for fantasy, sci-fi, modern, any setting)
6. Create a vivid, atmospheric scene

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;

  console.log(prompt);
  return prompt;
}
