/**
 * Intent Classifier Prompt - Optimized
 * For LLM-based /analyze route. Slash commands use buildIntentFromCommand().
 * Only GO_INSIDE is currently implemented.
 */

/**
 * Static content for caching (~400 tokens)
 * Contains intent definitions and output template
 */
export const INTENT_CLASSIFIER_STATIC = `Navigation intent classifier.

INTENTS (only GO_INSIDE implemented):
- GO_INSIDE: enter/inside/step into → buildings, vehicles, caves
- UNKNOWN: anything else

GO_INSIDE RULES:
- Target: buildings/structures with windows/doors. Avoid water, plants, furniture.
- SpaceType: "interior" if entering enclosed space with roof. "exterior" if open-air. "unknown" fallback.

OUTPUT (JSON):
{
  "intent": "GO_INSIDE|UNKNOWN",
  "target": "name or null",
  "direction": null,
  "newRegion": null,
  "relocationType": null,
  "spaceType": "interior|exterior|unknown or null",
  "style": null,
  "confidence": 0.0-1.0
}`;

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
 */
export function intentClassifierPrompt(
  request: IntentClassifierRequest,
  _mode: 'detailed' | 'condensed' = 'condensed'
): string {
  const { userCommand, currentNode } = request;

  // Build compact context
  const contextParts: string[] = [
    `Node: ${currentNode.name} (${currentNode.type})`
  ];
  
  if (currentNode.description) contextParts.push(`Desc: ${currentNode.description}`);
  if (currentNode.searchDesc) contextParts.push(`Tags: ${currentNode.searchDesc}`);
  if (currentNode.uniqueIdentifiers?.length) {
    contextParts.push(`Unique: ${currentNode.uniqueIdentifiers.join(', ')}`);
  }
  if (currentNode.navigableElements?.length) {
    contextParts.push(`Navigable: ${currentNode.navigableElements.slice(0, 5).map(el => `${el.type}(${el.description})`).join(', ')}`);
  }
  if (currentNode.dominantElements?.length) {
    contextParts.push(`Visible: ${currentNode.dominantElements.slice(0, 5).join(', ')}`);
  }

  return `Navigation intent classifier.

CONTEXT:
${contextParts.join('\n')}

COMMAND: "${userCommand}"

INTENTS (only GO_INSIDE implemented):
- GO_INSIDE: enter/inside/step into → buildings, vehicles, caves
- UNKNOWN: anything else

GO_INSIDE RULES:
- Target: buildings/structures with windows/doors. Avoid water, plants, furniture.
- SpaceType: "interior" if entering enclosed space with roof. "exterior" if open-air. "unknown" fallback.

OUTPUT (JSON):
{
  "intent": "GO_INSIDE|UNKNOWN",
  "target": "name or null",
  "direction": null,
  "newRegion": null,
  "relocationType": null,
  "spaceType": "interior|exterior|unknown or null",
  "style": null,
  "confidence": 0.0-1.0
}`;
}
