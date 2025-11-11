/**
 * Intent Classifier Prompt
 * LLM-based classification of user navigation commands
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
  };
}

/**
 * Generate intent classification prompt
 * Returns a focused prompt that asks LLM to classify navigation intent
 */
export function intentClassifierPrompt(request: IntentClassifierRequest): string {
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

  // Add navigable elements if available
  if (currentNode.navigableElements && currentNode.navigableElements.length > 0) {
    const spaces = currentNode.navigableElements
      .map(el => el.type)
      .filter(Boolean)
      .slice(0, 8) // Limit to 8 to keep prompt concise
      .join(', ');
    
    if (spaces) {
      contextString += `\n- Available Spaces: ${spaces}`;
    }
  }

  // Add dominant elements if available (helps with LOOK_AT disambiguation)
  if (currentNode.dominantElements && currentNode.dominantElements.length > 0) {
    const elements = currentNode.dominantElements
      .slice(0, 5) // Limit to 5 most dominant
      .join(', ');
    
    contextString += `\n- Visible Elements: ${elements}`;
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
  "confidence": 0.0-1.0
}

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
Context: Search Description contains "[Location - Exterior]", Description mentions "cylindrical structures" with "openings"
{"intent":"GO_INSIDE","target":null,"direction":null,"spaceType":"interior","confidence":1.0}

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
