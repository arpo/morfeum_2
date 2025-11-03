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

INTENT TYPES:

1. GO_INSIDE - User wants to enter/go inside something
   Keywords: "go inside", "enter", "step into", "go in", "step under"

2. GO_OUTSIDE - User wants to exit/leave/go outside
   Keywords: "go outside", "go out", "leave", "exit"

3. GO_TO_ROOM - User wants to go to a specific room/space in same building
   Keywords: "go to the [room]", "take me to the [space]"
   Examples: kitchen, bathroom, roof, basement, bedroom

4. GO_TO_PLACE - User wants to go to a location/structure
   Keywords: "go to the [place]", "take me to [location]"
   Examples: bridge, plaza, harbor, marketplace, tower

5. LOOK_AT - User wants to look at/examine something specific
   Keywords: "look at", "examine", "inspect", "look closer at"

6. LOOK_THROUGH - User wants to look through/out/in a window or opening
   Keywords: "look out", "look in", "look through"

7. CHANGE_VIEW - User wants to change perspective (turn around, look direction)
   Keywords: "look behind", "turn around", "look up", "look down", "look left", "look right"

8. GO_UP_DOWN - User wants to go up/down stairs/elevator
   Keywords: "go up", "go down", "climb", "ascend", "descend", "stairs"

9. ENTER_PORTAL - User wants to enter painting/portal/magical doorway
   Keywords: "enter the [painting/portal]", "step through", "step into [artwork]"

10. APPROACH - User wants to get closer to something
    Keywords: "go closer", "step forward", "approach", "move toward", "get near"

11. UNKNOWN - Cannot determine clear intent

OUTPUT FORMAT (JSON only, no markdown, no explanation):
{
  "intent": "INTENT_TYPE",
  "target": "extracted object/place name or null",
  "direction": "up/down/left/right/behind/forward or null",
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
