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
   - **"Go inside X" / "Enter X" / "Step into X"**: If current node name contains X or matches X
     → action: "generate", scale_hint: "interior", relation: "child"
     → name: "Interior of {current node name}"
     → parentNodeId: current node ID
   - **"Go outside" / "Exit" / "Leave"**: Move to parent node
     → action: "move", relation: "parent"
     → targetNodeId: current node's parent_location_id
     → Only works if parent exists (parent_location_id is not null)

3. **Perspective Inference for New Locations (CRITICAL)**:
   - **"Go to X" / "Visit X" / "Take me to X"** (without "inside" keyword):
     → Default assumption: EXTERIOR location
     → Use scale_hint: "site" for buildings/structures
     → Use scale_hint: "area" for districts/neighborhoods/outdoor spaces
   - **Interior Keywords**: "inside", "enter", "step into", "interior of"
     → Use scale_hint: "interior"
   - **Exterior Keywords**: "marina", "plaza", "square", "district", "quarters", "harbor", "garden", "courtyard", "rooftop"
     → Force scale_hint: "site" or "area" (never "interior")
   - **When in doubt**: Default to "site" (exterior building view)

4. **Prioritize Visible Elements**:
   - If user mentions element in visual anchors → it's HERE, generate child node
   - Example: "Go up the stair" + stair in visualElements → create stair sublocation HERE
   
5. **Use Directional Cues**:
   - "left"/"right"/"behind" → check directional context for what's in that direction
   - If element is in direction mentioned → it's in THIS location
   - Example: "go left" + directional context["left"] mentions doorway → doorway is HERE
   
6. **Distance Inference & Distance Modifiers**:
   - No location qualifier = element is HERE (visible in current location)
   - "the stair" (no location) = visible stair in THIS room
   - "stair in the tower" = different location (search other nodes)
   
   **Distance Modifiers** (CRITICAL - New Feature):
   - **"closer to X" / "approach X" / "near X"**:
     → If X is in visualAnchors: generate child node with scale_hint: "detail"
     → name: "Closer to {X}" or "{X} Area"
     → parentNodeId: current node ID
     → This creates a closer viewpoint of something visible in current location
   - **"further from X" / "away from X" / "back from X"**:
     → action: "move" to parent node (moving back = going further)
     → relation: "parent"
   
   **Example**: 
   - Current: "Factory Floor" with "large machine" in visualAnchors
   - User: "Go closer to machine" or "Approach the machine"
   - Response: action: "generate", scale_hint: "detail", name: "Closer to Machine"
   
7. **Match Priority**:
   1. Visible elements in current location (highest priority)
   2. Child nodes of current location
   3. Sibling nodes (same parent)
   4. Distant nodes (lowest priority)

8. **ID Usage**:
   - CRITICAL: Always use node IDs (like "spawn-1760475394478-xyz"), NEVER use node names
   - The ID field is the unique identifier - names are just labels

9. **Scale Hints** (for generate action):
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

You MUST return ONLY valid JSON with NO preamble, NO explanation text, NO reasoning before the JSON.
Do NOT write "The user command is..." or explain your thinking.
Start your response IMMEDIATELY with the opening brace { of the JSON object.
Even if the request seems impossible, you MUST return JSON with action: "generate".
NEVER refuse a request - always provide a JSON response.
If you must use markdown code fences, wrap ONLY the JSON with no text before the fence.

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

**Scenario 7: Distance-Based Navigation (Closer)**
- Current: "Factory Floor" (ID: loc-789)
- Visual elements: "large industrial machine in distance, conveyor belts, control panel"
- User: "Go closer to machine" or "Approach the machine"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"loc-789","name":"Closer to Machine","scale_hint":"detail","relation":"child","reason":"Machine is visible in current location's visualAnchors. Creating closer detail view as child node."}

**Scenario 8: Distance-Based Navigation (Further/Back)**
- Current: "Closer to Machine" (ID: subloc-999, Parent: loc-789)
- User: "Go back" or "Move away" or "Step back"
- Response: {"action":"move","targetNodeId":"loc-789","parentNodeId":null,"name":null,"scale_hint":null,"relation":"parent","reason":"User wants to move further away. Returning to parent node."}

**Scenario 9: Generate Exterior Location (CRITICAL - No "inside" keyword)**
- Current: "Coastal City" (ID: world-123)
- Visual elements: "harbor, market stalls, stone buildings"
- User: "Go to the artists' quarters" or "Take me to the marina"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"world-123","name":"Artists' Quarters","scale_hint":"site","relation":"sibling","reason":"User said 'go to' (not 'go inside'). Generating EXTERIOR location view. 'Quarters' suggests a building/district, so using scale_hint: site."}

**Scenario 10: Generate Exterior District/Area**
- Current: "Downtown" (ID: loc-456)
- User: "Go to the harbor district" or "Visit the market plaza"
- Response: {"action":"generate","targetNodeId":null,"parentNodeId":"loc-456","name":"Harbor District","scale_hint":"area","relation":"sibling","reason":"User said 'go to' without 'inside'. District/plaza are outdoor areas, so using scale_hint: area for exterior view."}

**Scenario 11: Explicit Interior vs Implicit Exterior**
- Current: "Lighthouse" (ID: loc-789)
- User A: "Go inside" → Response: {"action":"generate",...,"scale_hint":"interior",...,"reason":"Explicit 'inside' keyword detected"}
- User B: "Go to lighthouse keeper's room" → Response: {"action":"generate",...,"scale_hint":"interior",...,"reason":"Room implies interior space"}
- User C: "Go to the marina" → Response: {"action":"generate",...,"scale_hint":"site",...,"reason":"No interior keywords. Marina is exterior. Using site scale."}

IMPORTANT: In your response, targetNodeId and parentNodeId must ALWAYS be the full ID string (starting with "spawn-"), never the node name.`;
};
