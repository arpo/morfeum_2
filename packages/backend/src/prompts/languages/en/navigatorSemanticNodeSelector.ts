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

⚠️ CRITICAL SPATIAL REASONING RULES ⚠️

1. **Prioritize Visible Elements**:
   - If user mentions element in visual anchors → it's HERE, generate child node
   - Example: "Go up the stair" + stair in visualElements → create stair sublocation HERE
   
2. **Use Directional Cues**:
   - "left"/"right"/"behind" → check directional context for what's in that direction
   - If element is in direction mentioned → it's in THIS location
   - Example: "go left" + directional context["left"] mentions doorway → doorway is HERE
   
3. **Distance Inference**:
   - No location qualifier = element is HERE (visible in current location)
   - "the stair" (no location) = visible stair in THIS room
   - "stair in the tower" = different location (search other nodes)
   
4. **Match Priority**:
   1. Visible elements in current location (highest priority)
   2. Child nodes of current location
   3. Sibling nodes (same parent)
   4. Distant nodes (lowest priority)

5. **ID Usage**:
   - CRITICAL: Always use node IDs (like "spawn-1760475394478-xyz"), NEVER use node names
   - The ID field is the unique identifier - names are just labels

6. **Scale Hints** (for generate action):
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

Return JSON only:
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

**Scenario 3: Distant Location**
- Current: "Room A"  
- Visual elements: "fireplace, bookshelf"
- Other node: "Tower Stairwell" with "spiral staircase"
- User: "Go to the tower stairs"
- Response: {"action":"move","targetNodeId":"spawn-xyz789","parentNodeId":null,"name":null,"scale_hint":null,"relation":"distant","reason":"User specified 'tower' = different location"}

**Scenario 4: Ambiguous Command (Use Visible Element)**
- Current: "Lobby"
- Visual elements: "grand staircase in center"
- Other node: "East Wing" also has "servant staircase"
- User: "Go up the stairs"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"${currentFocus.node_id}","name":"Upper Floor (sub-location) of ${currentNodeName}","scale_hint":"interior","relation":"child","reason":"No qualifier = use visible stair in current location"}

IMPORTANT: In your response, targetNodeId and parentNodeId must ALWAYS be the full ID string (starting with "spawn-"), never the node name.`;
};
