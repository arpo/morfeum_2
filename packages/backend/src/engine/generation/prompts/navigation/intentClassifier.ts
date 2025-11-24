/**
 * Intent Classifier Prompt
 * Optimized for Gemini 2.5 Flash Lite
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
  return `Act as a navigation intent classifier. Analyze the USER COMMAND relative to the CONTEXT and return a JSON object.

${context}

USER COMMAND: "${userCommand}"

INTENT TYPES:
1. GO_INSIDE: enter/inside/step into → buildings, vehicles, caves.
2. GO_OUTSIDE: exit/leave/go out → leaving enclosed spaces.
3. GO_TO_ROOM: go to [room] → specific room/area within current structure.
4. GO_TO_PLACE: go to [place] → distinct location/landmark/building.
5. LOOK_AT: look at/examine/inspect → objects, details.
6. LOOK_THROUGH: look through/out → windows, portals, openings.
7. CHANGE_VIEW: turn/look [dir] → orientation change (left, right, behind).
8. GO_UP_DOWN: climb/descend → stairs, ladders, elevators.
9. ENTER_PORTAL: enter [portal] → magic portals, paintings, mirrors.
10. APPROACH: move closer/approach → object/location.
11. EXPLORE_FEATURE: follow/continue → path, river, road.
12. RELOCATE: go to [place] in [area] → travel to different region.
13. UNKNOWN: unclear intent.

GO_INSIDE RULES (Logic Priority):
1. Target Selection: Pick buildings/structures with windows/doors from Context. Avoid water, plants, furniture.
2. SpaceType:
   - "interior": if SearchTags has "[Interior]" OR entering enclosed space with roof/ceiling (building, cave).
   - "exterior": if SearchTags has "[Exterior]" OR entering open-air space (park, courtyard, archway).
   - "unknown": fallback.

RESPONSE FORMAT (JSON Only):
{
  "intent": "INTENT_TYPE",
  "target": "name string or null",
  "direction": "up|down|left|right|behind|forward or null",
  "newRegion": "region name or null (RELOCATE only)",
  "relocationType": "macro|micro or null (RELOCATE only)",
  "spaceType": "interior|exterior|unknown or null (GO_INSIDE only)",
  "style": null,
  "confidence": 0.0-1.0
}`;
}
