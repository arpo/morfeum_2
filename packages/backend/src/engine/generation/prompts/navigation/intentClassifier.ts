/**
 * Intent Classifier Prompt
 * LLM-based classification of user navigation commands
 */

export interface IntentClassifierRequest {
  userCommand: string;
  currentNode: {
    type: 'host' | 'region' | 'location' | 'niche' | 'detail' | 'view';
    name: string;
  };
}

/**
 * Generate intent classification prompt
 * Returns a focused prompt that asks LLM to classify navigation intent
 */
export function intentClassifierPrompt(request: IntentClassifierRequest): string {
  const { userCommand, currentNode } = request;

  return `You are a navigation intent classifier. Analyze the user's command and return ONLY a JSON object.

Current Context:
- Node Type: ${currentNode.type}
- Node Name: "${currentNode.name}"

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
  "confidence": 0.0-1.0
}

EXAMPLES:

User: "Go inside"
{"intent":"GO_INSIDE","target":null,"direction":null,"confidence":1.0}

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
