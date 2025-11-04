/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

/**
 * Generate prompt for LLM to create FLUX image description
 * for stepping inside a location
 */
export function nicheImagePrompt(
  currentNodeName: string,
  currentNodeDescription: string,
  parentNodeInfo: string | null
): string {
  return `You are an expert at creating vivid, genre-agnostic image prompts for FLUX image generation.

TASK: Create an image prompt for stepping INSIDE "${currentNodeName}".

CONTEXT:
Current Location: ${currentNodeName}
Description: ${currentNodeDescription}
${parentNodeInfo ? `Parent Context: ${parentNodeInfo}` : ''}

REQUIREMENTS:
1. Imagine what it looks like when we JUST STEPPED INSIDE through the entrance
2. Use first-person interior perspective (medium elevated offset angle, diagonal composition)
3. Include interesting navigation details (doors, stairs, passages, rooms) if suitable
4. Consider time of day and lighting based on the context
5. Be creative and genre-agnostic (works for fantasy, sci-fi, modern, any setting)
6. Create a vivid, atmospheric scene

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`;
}
