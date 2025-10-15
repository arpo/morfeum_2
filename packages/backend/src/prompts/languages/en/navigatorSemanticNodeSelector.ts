/**
 * NavigatorAI Semantic Node Selector Prompt
 * LLM-based spatial navigation system for Morfeum worlds
 */

interface FocusContext {
  node_id: string;
  perspective: string;
  viewpoint: string;
  distance: string;
}

interface WorldNode {
  id: string;
  name: string;
  searchDesc?: string;
  depth_level: number;
  parent_location_id: string | null;
}

interface CurrentLocationDetails {
  node_id: string;
  name: string;
  searchDesc: string;
  visualAnchors: {
    dominantElements: string[];
    uniqueIdentifiers: string[];
  };
  viewDescriptions?: {
    [viewKey: string]: {
      looks: string;
      focusTarget: string;
    };
  };
  currentView: {
    viewKey: string;
    focusTarget: string;
  };
}

/**
 * Generate prompt for semantic node selection with visual context awareness
 * Returns JSON with action (move/generate/look) and target details
 */
export const navigatorSemanticNodeSelector = (
  userCommand: string,
  currentFocus: FocusContext,
  currentLocationDetails: CurrentLocationDetails,
  allNodes: WorldNode[]
): string => {
  // Find current node to get its full context
  const currentNode = allNodes.find(n => n.id === currentFocus.node_id);
  const currentNodeName = currentNode?.name || 'Unknown location';
  const currentDepth = currentNode?.depth_level || 0;
  
  // Create node list with search descriptions for context
  const nodeSummaries = allNodes.map(node => {
    const desc = node.searchDesc ? `: ${node.searchDesc}` : '';
    return `- ${node.name}${desc} (ID: ${node.id}, Depth: ${node.depth_level}, Parent: ${node.parent_location_id || 'none'})`;
  }).join('\n');

  // Build visual context section
  const visualElements = currentLocationDetails.visualAnchors.dominantElements.join(', ');
  const currentViewTarget = currentLocationDetails.currentView.focusTarget;
  
  // Build directional context if available
  let directionalContext = '';
  if (currentLocationDetails.viewDescriptions) {
    directionalContext = Object.entries(currentLocationDetails.viewDescriptions)
      .map(([dir, view]) => `- ${dir}: ${view.focusTarget}`)
      .join('\n');
  }

  return `NavigatorAI: Match user's navigation command using VISUAL CONTEXT FIRST.

Current Location: ${currentNodeName} (ID: ${currentFocus.node_id}, Depth: ${currentDepth})
Current View: Looking at ${currentViewTarget}

Visual Elements in This Location:
${visualElements}

${directionalContext ? `Directional Context:\n${directionalContext}\n` : ''}
Available Nodes in World:
${nodeSummaries || '(none)'}

User Command: "${userCommand}"

⚠️ CRITICAL ACTION SELECTION RULES ⚠️

**DECISION TREE** (follow in order):

1. **Element visible in current location's visualAnchors**
   → action: "generate" (child of current location)
   → Use current location ID as parentNodeId
   
2. **Element matches an existing node in the list**
   → action: "move" (to that node)
   → Use matched node's ID as targetNodeId
   → **MUST have valid targetNodeId**
   
3. **Element NOT visible AND no matching node**
   → action: "generate" (new location related to current)
   → Use current location ID or appropriate parent as parentNodeId
   → Choose appropriate scale_hint based on context
   
4. **NEVER use action: "move" with targetNodeId: null**
   → If no matching node exists, use action: "generate"
   → Every "move" action requires a valid targetNodeId

⚠️ SPATIAL REASONING RULES ⚠️

1. **Self-Move Prevention (CRITICAL)**:
   - NEVER return action: "move" with targetNodeId equal to current node ID
   - If matched node is current location → use action: "generate" instead

2. **Inside/Outside Navigation (CRITICAL)**:
   - **"Go inside X" / "Enter X"**: If current node name contains X or matches X
     → action: "generate", scale_hint: "interior", relation: "child"
     → name: "Interior of {current node name}"
     → parentNodeId: current node ID
   - **"Go outside" / "Exit" / "Leave"**: Move to parent node
     → action: "move", relation: "parent"
     → targetNodeId: current node's parent_location_id
     → Only works if parent exists (parent_location_id is not null)

3. **Prioritize Visible Elements**:
   - If user mentions element in visual anchors → it's HERE, generate child node
   - Example: "Go up the stair" + stair in visualElements → create stair sublocation HERE
   
4. **Use Directional Cues**:
   - "left"/"right"/"behind" → check directional context for what's in that direction
   - If element is in direction mentioned → it's in THIS location
   - Example: "go left" + directional context["left"] mentions doorway → doorway is HERE
   
5. **Distance Inference**:
   - No location qualifier = element is HERE (visible in current location)
   - "the stair" (no location) = visible stair in THIS room
   - "stair in the tower" = different location (search other nodes)
   
6. **Match Priority**:
   1. Visible elements in current location (highest priority)
   2. Child nodes of current location
   3. Sibling nodes (same parent)
   4. Distant nodes (lowest priority)

7. **ID Usage**:
   - CRITICAL: Always use node IDs (like "spawn-1760475394478-xyz"), NEVER use node names
   - The ID field is the unique identifier - names are just labels

8. **Scale Hints** (for generate action):
   - macro: Vast landscapes, worlds, continents
   - area: Regions, districts, large outdoor spaces
   - site: Buildings, locations, specific places
   - interior: Rooms, chambers, indoor spaces
   - detail: Specific objects, alcoves, tiny spaces

⚠️ CRITICAL REQUIREMENT ⚠️
When specifying targetNodeId or parentNodeId in your JSON response:
- MUST use the full ID from the node list (starts with "spawn-")
- DO NOT use the node name (like "The Garden", "Upstairs", etc.)
- Example: If the node is listed as "The Garden (ID: spawn-abc123...)", use "spawn-abc123..." in your response

🚨 CRITICAL OUTPUT FORMAT 🚨

You MUST return valid JSON. NO explanations, NO text, ONLY the JSON object below.
Even if the request seems impossible, you MUST return JSON with action: "generate".
NEVER refuse a request - always provide a JSON response.

{
  "action": "move" | "generate" | "look",
  "targetNodeId": "spawn-..." | null,
  "parentNodeId": "spawn-..." | null,
  "name": "hierarchical name" | null,
  "scale_hint": "macro" | "area" | "site" | "interior" | "detail" | null,
  "relation": "child" | "sibling" | "parent" | "distant" | null,
  "reason": "brief spatial reasoning explanation"
}

Examples with Visual Context:

**Scenario 1: Element Visible in Current Location**
- Current: "Room A"
- Visual elements: "stone staircase on left wall, window on right"
- User: "Go up the stair"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"${currentFocus.node_id}","name":"Upstairs (sub-location) of ${currentNodeName}","scale_hint":"interior","relation":"child","reason":"Stair is visible HERE in visual elements, not elsewhere"}

**Scenario 2: Directional Cue**
- Current: "Room A"
- Directional context["left"]: { focusTarget: "doorway leading to garden" }
- User: "Go through the door on the left"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"${currentFocus.node_id}","name":"Garden Doorway (sub-location) of ${currentNodeName}","scale_hint":"interior","relation":"child","reason":"Door is to the left in THIS room per directional context"}

**Scenario 3: Distant Location Match**
- Current: "Room A"  
- Visual elements: "fireplace, bookshelf"
- Other node: "Tower Stairwell" with "spiral staircase" (ID: spawn-xyz789)
- User: "Go to the tower stairs"
- Response: {"action":"move","targetNodeId":"spawn-xyz789","parentNodeId":null,"name":null,"scale_hint":null,"relation":"distant","reason":"User specified 'tower' which matches existing 'Tower Stairwell' node"}

**Scenario 3b: New Distant Location (No Match)**
- Current: "Underwater Canyon"
- Visual elements: "giant jellyfish, rocky walls"
- User: "Take me to a shipwreck"
- No matching node in list
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"${currentFocus.node_id}","name":"Shipwreck (location) near ${currentNodeName}","scale_hint":"site","relation":"sibling","reason":"'Shipwreck' not visible in current location and no matching node exists. Generating new location."}

**Scenario 4: Ambiguous Command (Use Visible Element)**
- Current: "Lobby"
- Visual elements: "grand staircase in center"
- Other node: "East Wing" also has "servant staircase"
- User: "Go up the stairs"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"${currentFocus.node_id}","name":"Upper Floor (sub-location) of ${currentNodeName}","scale_hint":"interior","relation":"child","reason":"No qualifier = use visible stair in current location"}

**Scenario 5: Go Inside (When Current Node Matches)**
- Current: "Shipwreck" (ID: subloc-123)
- User: "Go inside the shipwreck"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"subloc-123","name":"Interior of Shipwreck","scale_hint":"interior","relation":"child","reason":"User wants to go inside current location. Generating interior sublocation."}

**Scenario 6: Go Outside (Parent Navigation)**
- Current: "Interior of Shipwreck" (ID: subloc-456, Parent: subloc-123)
- User: "Go outside" or "Exit" or "Leave"
- Response: {"action":"move","targetNodeId":"subloc-123","parentNodeId":null,"name":null,"scale_hint":null,"relation":"parent","reason":"User wants to exit current location. Moving to parent node."}

IMPORTANT: In your response, targetNodeId and parentNodeId must ALWAYS be the full ID string (starting with "spawn-"), never the node name.`;
};
