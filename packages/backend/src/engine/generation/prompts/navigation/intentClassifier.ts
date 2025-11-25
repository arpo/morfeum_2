/**
 * Intent Classifier Prompt
 * Optimized for Gemini 2.5 Flash Lite
 * 
 * NOTE: This file is kept for the LLM-based /analyze route.
 * For slash commands, we use buildIntentFromCommand() instead.
 * Only GO_INSIDE is currently implemented - other intents will return "not_implemented"
 */

export interface IntentClassifierRequest {
  userCommand: string;
  currentNode: {
    type: 'host' | 'region' | 'location' | 'niche' | 'detail' | 'view';
    name: string;
    description?: string;
    searchDesc?: string;
    navigableElements?: Array<{
      type: string;
      position: string;
      description: string;
    }>;
    dominantElements?: string[];
    uniqueIdentifiers?: string[];
  };
}

/**
 * Generate intent classification prompt
 * Returns a focused prompt that asks LLM to classify navigation intent
 */
export function intentClassifierPrompt(
  request: IntentClassifierRequest,
  _mode: 'detailed' | 'condensed' = 'condensed' // parameter kept for backward compat, but unused
): string {
  const { userCommand, currentNode } = request;

  // 1. Build Context
  let context = `CONTEXT:
Node: ${currentNode.name} (${currentNode.type})
${currentNode.description ? `Desc: ${currentNode.description}` : ''}
${currentNode.searchDesc ? `SearchTags: ${currentNode.searchDesc}` : ''}`;

  if (currentNode.uniqueIdentifiers?.length) {
    context += `\nUnique: ${currentNode.uniqueIdentifiers.join(', ')}`;
  }

  if (currentNode.navigableElements?.length) {
    context += `\nNavigable: ${currentNode.navigableElements
      .slice(0, 8)
      .map(el => `${el.type}(${el.description})`)
      .join(', ')}`;
  }

  if (currentNode.dominantElements?.length) {
    context += `\nVisible: ${currentNode.dominantElements.slice(0, 5).join(', ')}`;
  }

  // 2. Build Instructions
  // NOTE: Only GO_INSIDE is implemented. Other intents will return "not_implemented" at runtime.
  return `Act as a navigation intent classifier. Analyze the USER COMMAND relative to the CONTEXT and return a JSON object.

${context}

USER COMMAND: "${userCommand}"

INTENT TYPES (Only GO_INSIDE is currently implemented):
1. GO_INSIDE: enter/inside/step into → buildings, vehicles, caves.
2. UNKNOWN: anything else.

GO_INSIDE RULES (Logic Priority):
1. Target Selection: Pick buildings/structures with windows/doors from Context. Avoid water, plants, furniture.
2. SpaceType:
   - "interior": if SearchTags has "[Interior]" OR entering enclosed space with roof/ceiling (building, cave).
   - "exterior": if SearchTags has "[Exterior]" OR entering open-air space (park, courtyard, archway).
   - "unknown": fallback.

RESPONSE FORMAT (JSON Only):
{
  "intent": "GO_INSIDE or UNKNOWN",
  "target": "name string or null",
  "direction": null,
  "newRegion": null,
  "relocationType": null,
  "spaceType": "interior|exterior|unknown or null (GO_INSIDE only)",
  "style": null,
  "confidence": 0.0-1.0
}`;
}
