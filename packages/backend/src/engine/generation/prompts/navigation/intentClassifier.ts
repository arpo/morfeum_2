/**
 * Intent Classifier Prompt
 * LLM-based classification of user navigation commands
 */

import type { NavigationIntent } from '../../../navigation/types';

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
 * Condensed version of intent classifier prompt (~45% shorter)
 */
function buildCondensedPrompt(contextString: string, userCommand: string, styleOptions: string): string {
  return `Navigation intent classifier. Return JSON only.

${contextString}

User: "${userCommand}"

INTENTS:
1. GO_INSIDE: enter/inside/step into → buildings, vehicles, caves, structures
2. GO_OUTSIDE: exit/leave/go out → leaving enclosed spaces
3. GO_TO_ROOM: go to [room] → rooms, chambers, areas within structure
4. GO_TO_PLACE: go to [place] → locations, landmarks, structures
5. LOOK_AT: look at/examine → objects, details, features
6. LOOK_THROUGH: look through/out → windows, openings, viewports
7. CHANGE_VIEW: turn/look [dir] → up, down, left, right, behind
8. GO_UP_DOWN: climb/descend → stairs, ladders, elevators, ramps
9. ENTER_PORTAL: enter [portal] → portals, doors, gateways, passages
10. APPROACH: move toward/closer → any object/location
11. EXPLORE_FEATURE: follow/continue → paths, corridors, rivers, roads
12. RELOCATE: go to [place] in [area] → travel to different region
13. UNKNOWN: unclear intent

OUTPUT: {"intent":"TYPE","target":"name or null","direction":"dir or null","newRegion":"region or null","relocationType":"macro/micro or null","spaceType":"interior/exterior/unknown or null","style":"style_name or null","confidence":0.0-1.0}

${styleOptions}

GO_INSIDE RULES:
- Pick buildings/structures with windows/doors from Unique Identifiers or Visible Elements
- Avoid water features, vegetation, furniture, decorative elements
- spaceType: "interior" if enclosed/roofed, "exterior" if open-air, "unknown" if unclear

EXAMPLES:
"enter" + Visible="Classical resort buildings with balconies" → {"intent":"GO_INSIDE","target":"Classical resort buildings with balconies and columns","spaceType":"interior","confidence":0.95}
"look at painting" → {"intent":"LOOK_AT","target":"painting","confidence":0.95}
"go to kitchen" → {"intent":"GO_TO_ROOM","target":"kitchen","confidence":1.0}
"turn around" → {"intent":"CHANGE_VIEW","direction":"behind","confidence":1.0}

Classify: "${userCommand}"`;
}

/**
 * Build style selection section for prompt
 */
function buildStyleSection(): string {
  return '';
}

/**
 * Generate intent classification prompt
 * Returns a focused prompt that asks LLM to classify navigation intent
 */
export function intentClassifierPrompt(
  request: IntentClassifierRequest,
  mode: 'detailed' | 'condensed' = 'condensed'
): string {
  const { userCommand, currentNode } = request;

  // Build context string with optional navigable elements
  let contextString = `Current Context:
- Node Type: ${currentNode.type}
- Node Name: "${currentNode.name}"`;

  // Add description for space type classification context
  if (currentNode.description) {
    contextString += `\n- Description: ${currentNode.description}`;
  }
  
  // Add searchDesc if available (contains interior/exterior hints)
  if (currentNode.searchDesc) {
    contextString += `\n- Search Description: ${currentNode.searchDesc}`;
  }

  // Add unique identifiers if available
  if (currentNode.uniqueIdentifiers && currentNode.uniqueIdentifiers.length > 0) {
    const identifiers = currentNode.uniqueIdentifiers.join(', ');
    contextString += `\n- Unique Identifiers: ${identifiers}`;
  }

  // Add navigable elements with full details if available
  if (currentNode.navigableElements && currentNode.navigableElements.length > 0) {
    const elements = currentNode.navigableElements
      .slice(0, 8) // Limit to 8 to keep prompt concise
      .map(el => `${el.type}: ${el.description} (${el.position})`)
      .join('; ');
    
    contextString += `\n- Navigable Elements: ${elements}`;
  }

  // Add dominant elements if available (helps with LOOK_AT disambiguation)
  if (currentNode.dominantElements && currentNode.dominantElements.length > 0) {
    const elements = currentNode.dominantElements
      .slice(0, 5) // Limit to 5 most dominant
      .join(', ');
    
    contextString += `\n- Visible Elements: ${elements}`;
  }

  if (mode === 'condensed') {
    return buildCondensedPrompt(contextString, userCommand, '');
  }

  return `You are a navigation intent classifier. Analyze the user's command and return ONLY a JSON object.

${contextString}

User Command: "${userCommand}"
       
INTENT TYPES (genre-agnostic):

1. GO_INSIDE - User wants to enter an enclosed space
   Keywords: "go inside", "enter", "step into", "go in", "step through", "go under"
   Applies to: buildings, vehicles, caves, structures, containers

2. GO_OUTSIDE - User wants to exit to an exterior space
   Keywords: "go outside", "go out", "leave", "exit", "step out"
   Applies to: leaving any enclosed space

3. GO_TO_ROOM - User wants to navigate to a specific enclosed space within current structure
   Keywords: "go to [space]", "take me to [area]", "[space] please"
   Applies to: rooms, chambers, sections, compartments, areas within a structure

4. GO_TO_PLACE - User wants to navigate to a distinct location/structure
   Keywords: "go to [place]", "take me to [location]", "head to [structure]"
   Applies to: buildings, landmarks, structures, areas, zones

5. LOOK_AT - User wants to examine something specific more closely
   Keywords: "look at", "examine", "inspect", "observe", "study", "check out"
   Applies to: objects, details, features, entities

6. LOOK_THROUGH - User wants to look through an opening or transparent surface
   Keywords: "look through", "look out", "look in", "peer through", "gaze through"
   Applies to: windows, openings, viewports, transparent surfaces, gaps

7. CHANGE_VIEW - User wants to change their viewing direction or perspective
   Keywords: "turn", "look [direction]", "face [direction]", "glance [direction]"
   Directions: up, down, left, right, behind, around, north, south, east, west

8. GO_UP_DOWN - User wants to change elevation
   Keywords: "go up", "go down", "climb", "descend", "ascend", "rise", "lower"
   Applies to: stairs, ladders, elevators, ramps, hills, platforms, levels

9. ENTER_PORTAL - User wants to use a special passage or transition point
   Keywords: "enter [portal]", "step through", "step into", "use [portal]"
   Applies to: portals, gateways, doors, passages, paintings, mirrors, teleporters

10. APPROACH - User wants to move closer to something
    Keywords: "go closer", "approach", "move toward", "get near", "step forward", "advance"
    Applies to: any object, entity, or location

11. EXPLORE_FEATURE - User wants to follow or continue along a linear feature
    Keywords: "follow", "go further", "continue", "move ahead", "keep going", "walk along"
    Extract target: the feature being followed
    Applies to: paths, corridors, rivers, roads, trails, passages, routes, channels

12. RELOCATE - User wants to travel to a different area/district/region
    Keywords: "go to [place] in [area]", "take me to [place] instead", "[place] in [district]"
    Extract:
      - target: destination type
      - newRegion: area/district/region name if mentioned (null if not specified)
      - relocationType: "macro" if area/district mentioned, "micro" if nearby without area

13. UNKNOWN - Cannot determine clear spatial intent

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "intent": "INTENT_TYPE",
  "target": "extracted object/place name or null",
  "direction": "up/down/left/right/behind/forward or null",
  "newRegion": "district/region name or null (RELOCATE only)",
  "relocationType": "macro or micro or null (RELOCATE only)",
  "spaceType": "interior or exterior or unknown or null (GO_INSIDE only)",
  "style": "style_name or null (if styles available for this intent)",
  "confidence": 0.0-1.0
}

SMART ELEMENT SELECTION (for GO_INSIDE intent only):
When intent is GO_INSIDE, you must select the MOST APPROPRIATE element to enter.

PRIORITIZE (in order):
1. Buildings, structures from Unique Identifiers or Visible Elements
2. Elements with Navigable Elements type="window" or "door" (implies building with interior)
3. Elements containing keywords: building, structure, room, house, tower, hall, chamber, temple, cabin, dwelling, resort, facility

AVOID as primary entry points:
- Water features (pool, fountain, stream, pond) - not enterable interior spaces
- Vegetation (trees, plants, foliage, palms) - cannot enter these
- Small objects (furniture, chairs, umbrellas, loungers) - not spaces
- Purely decorative foreground elements
- Terraces, patios, pathways (unless specifically entering an enclosed structure on them)

EXAMPLE:
Unique Identifiers: "Overgrown resort architecture with classical elements", "Freeform swimming pool with bright turquoise underwater lighting"
Visible Elements: "Curving swimming pool with turquoise illumination (foreground/midground)", "Classical resort buildings with balconies and columns (midground/background)"
Navigable Elements: window: Illuminated windows in resort structures (midground buildings)

User: "enter"
Analysis: 
- Pool = water feature, NOT enterable interior
- Resort buildings = actual structures with windows, CAN enter
Result: {"intent":"GO_INSIDE","target":"Classical resort buildings with balconies and columns","spaceType":"interior","confidence":0.95}

Return the selected element description in the "target" field.

SPACE TYPE CLASSIFICATION (for GO_INSIDE intent only):
When intent is GO_INSIDE, analyze the description and search description to determine what type of space the user will be entering:

**Analysis Process:**
1. Check Search Description for hints (e.g., "[Location - Exterior]" means current space is outside)
2. Look at what structures/objects are available to enter (from Description and Visible Elements)
3. Determine if entering those structures leads to interior or exterior space

**Classification:**
- "interior" = Entering an enclosed/roofed space with ceiling overhead
  * Examples: inside a building, inside a vehicle, inside a cave, inside a structure, inside a room
  * Keywords: building, structure, house, hall, chamber, room, vehicle, cylinder, vent, cave, temple, cabin
  
- "exterior" = Entering an open-air space (no ceiling, sky visible)
  * Examples: entering a park, entering a courtyard, entering a garden, entering a plaza
  * Keywords: park, garden, courtyard, plaza, yard, field, grounds, square, open terrace
  
- "unknown" = Cannot determine from available context

- null = For all other intent types (not GO_INSIDE)

**Example Reasoning:**
- Current: "The Pollen Vents" (exterior view of cylindrical structures)
- Command: "enter"
- Description mentions: "cylindrical structures" with "openings" and "vents"
- Analysis: User wants to go INSIDE the cylindrical structures → entering enclosed space with ceiling
- Result: spaceType = "interior"

EXAMPLES:

User: "Go inside"
{"intent":"GO_INSIDE","target":null,"direction":null,"spaceType":"unknown","confidence":1.0}

User: "enter"
Context: Unique Identifiers contains "Overgrown resort architecture", Visible Elements contains "Classical resort buildings with balconies and columns (midground/background)", Navigable Elements contains "window: Illuminated windows in resort structures"
{"intent":"GO_INSIDE","target":"Classical resort buildings with balconies and columns","direction":null,"spaceType":"interior","confidence":0.95}

User: "Look at the painting on the wall"
{"intent":"LOOK_AT","target":"painting","direction":null,"confidence":0.95}

User: "Go to the kitchen"
{"intent":"GO_TO_ROOM","target":"kitchen","direction":null,"confidence":1.0}

User: "Turn around"
{"intent":"CHANGE_VIEW","target":null,"direction":"behind","confidence":1.0}

User: "Go up the stairs to the left"
{"intent":"GO_UP_DOWN","target":"stairs","direction":"up","confidence":1.0}

User: "Step closer to the machine"
{"intent":"APPROACH","target":"machine","direction":"forward","confidence":0.95}

User: "Take me to the bridge"
{"intent":"GO_TO_PLACE","target":"bridge","direction":null,"confidence":0.9}

User: "Look out the window"
{"intent":"LOOK_THROUGH","target":"window","direction":"out","confidence":1.0}

Now classify this command and return JSON only: "${userCommand}"`;
}
