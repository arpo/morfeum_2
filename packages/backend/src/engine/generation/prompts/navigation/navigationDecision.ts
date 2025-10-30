/**
 * Navigation Decision Prompt
 * Determines whether to move to existing node, generate new node, or create new view
 */

interface FocusState {
  node_id: string;
  perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
  viewpoint: string;
  distance: 'close' | 'medium' | 'far';
  currentViewId?: string;
}

export interface NavigationDecisionRequest {
  userCommand: string;
  currentFocus: FocusState;
  currentNode: {
    id: string;
    name: string;
    type: string;
    searchDesc?: string;
    navigableElements?: Array<{
      type: string;
      position: string;
      description: string;
    }>;
    profile?: {
      looks?: string;
      atmosphere?: string;
      searchDesc?: string;
    };
  };
  allNodes: Array<{
    id: string;
    name: string;
    type: string;
    searchDesc?: string;
  }>;
}

export interface NavigationDecision {
  action: 'move' | 'generate' | 'look';
  targetNodeId?: string;
  parentNodeId?: string;
  name?: string;
  scale_hint?: 'macro' | 'area' | 'site' | 'interior' | 'detail';
  relation?: 'child' | 'sibling' | 'parent' | 'distant';
  viewpoint?: string;
  perspective?: string;
  reason: string;
}

/**
 * Generate navigation decision prompt
 */
export function navigationDecisionPrompt(request: NavigationDecisionRequest): string {
  const { userCommand, currentFocus, currentNode, allNodes } = request;

  // Build navigable elements context
  let navigableContext = '';
  if (currentNode.navigableElements && currentNode.navigableElements.length > 0) {
    navigableContext = '\n\nNavigable Elements in Current Node:\n' +
      currentNode.navigableElements
        .map(el => `- ${el.description} (${el.position})`)
        .join('\n');
  }

  // Build all nodes context
  const nodesContext = allNodes
    .map(node => {
      const desc = node.searchDesc ? ` - ${node.searchDesc}` : '';
      return `- ${node.name} (ID: ${node.id}, Type: ${node.type})${desc}`;
    })
    .join('\n');

  // Current location description
  const currentDesc = currentNode.profile?.looks || currentNode.searchDesc || 'No description available';

  return `NavigatorAI: Analyze user's travel command and determine the correct action.

## Current Context

**Current Node:** ${currentNode.name} (ID: ${currentNode.id}, Type: ${currentNode.type})
**Current Focus:** ${currentFocus.perspective} view, looking at ${currentFocus.viewpoint}, distance: ${currentFocus.distance}

**Current Node Description:**
${currentDesc}
${navigableContext}

**All Available Nodes:**
${nodesContext || '(no other nodes)'}

**User Command:** "${userCommand}"

## Decision Rules

### 1. ACTION: "move" (Navigate to Existing Node)
Use when:
- User wants to go to a node that exists in the "All Available Nodes" list
- Must match node by name or description
- MUST provide targetNodeId (the ID of the existing node)

Example Response:
\`\`\`json
{
  "action": "move",
  "targetNodeId": "spawn-abc123",
  "relation": "sibling",
  "reason": "User wants to navigate to existing node X"
}
\`\`\`

### 2. ACTION: "generate" (Create New Node)
Use when:
- User wants to go somewhere that doesn't exist yet
- User references location not in the node list
- MUST provide parentNodeId (where to create the new node)
- MUST provide name (name of the new node)
- MUST provide scale_hint

**Scale Hints:**
- "macro" → Host-level (entire continents, planets, worlds)
- "area" → Region-level (districts, neighborhoods, large outdoor spaces)
- "site" → Location-level (buildings, specific outdoor places)
- "interior" → Inside a location (rooms, indoor spaces)
- "detail" → Niche level (specific objects, alcoves, close-ups, small spaces)

**Relation Types:**
- "child" → New node is inside/part of current node
- "sibling" → New node is adjacent/parallel to current node
- "parent" → Moving up the hierarchy

**Interior vs Exterior Detection:**
- If user says "go inside", "enter", "step into" → scale_hint: "interior"
- If user mentions outdoor spaces like "harbor", "plaza", "square", "rooftop" → scale_hint: "site" or "area"
- If user wants to go to a building/structure without "inside" keyword → scale_hint: "site" (exterior view)
- If user wants a specific room/space → scale_hint: "interior"
- If user wants detail view ("look at", "go closer to", "examine") → scale_hint: "detail"

Example Response:
\`\`\`json
{
  "action": "generate",
  "parentNodeId": "spawn-xyz789",
  "name": "Toilet",
  "scale_hint": "detail",
  "relation": "child",
  "reason": "User wants to go to toilet, which is a small room inside current location"
}
\`\`\`

### 3. ACTION: "look" (Change Viewpoint in Current Node)
Use when:
- User wants to change perspective within the same node
- User wants to look at something visible in navigableElements
- User says "look at", "look out", "look behind", "turn around"
- This changes the view but stays in the same node

Example Response:
\`\`\`json
{
  "action": "look",
  "viewpoint": "out the window",
  "perspective": "exterior",
  "reason": "User wants to look at window visible in current node's navigableElements"
}
\`\`\`

## Important Guidelines

1. **Use Node IDs, Not Names**: Always use the full ID (like "spawn-abc123"), never use node names in targetNodeId or parentNodeId
2. **Check Existing Nodes First**: Before generating, check if destination already exists in the node list
3. **Consider navigableElements**: If user mentions something in navigableElements, it might be a "look" action or "generate" a detail node
4. **Prioritize Visible Elements**: If element is in navigableElements, prefer "look" or generate "detail" child node
5. **Parent/Child Relationships**: 
   - Going "inside" current node → generate with parentNodeId = current node ID, relation = "child"
   - Going to adjacent place → generate with parentNodeId = current node's parent, relation = "sibling"
   - Going "outside" or "exit" → move to parent node (if exists)

## Output Format

You MUST return ONLY valid JSON with NO preamble or explanation.
Start your response with the opening brace { immediately.

\`\`\`json
{
  "action": "move" | "generate" | "look",
  "targetNodeId": "spawn-..." | null,
  "parentNodeId": "spawn-..." | null,
  "name": "..." | null,
  "scale_hint": "macro" | "area" | "site" | "interior" | "detail" | null,
  "relation": "child" | "sibling" | "parent" | "distant" | null,
  "viewpoint": "..." | null,
  "perspective": "..." | null,
  "reason": "brief explanation"
}
\`\`\`

## Examples

**Example 1: Generate New Detail Node**
User: "Go to the toilet"
Current: Inside "The Artisan's Loft" (location)
Response:
\`\`\`json
{
  "action": "generate",
  "targetNodeId": null,
  "parentNodeId": "spawn-loft-123",
  "name": "Toilet",
  "scale_hint": "detail",
  "relation": "child",
  "viewpoint": null,
  "perspective": null,
  "reason": "Toilet is a small space inside the current location, scale_hint is detail"
}
\`\`\`

**Example 2: Look at Navigable Element**
User: "Look out the window"
Current: "The Artisan's Loft" with window in navigableElements
Response:
\`\`\`json
{
  "action": "look",
  "targetNodeId": null,
  "parentNodeId": null,
  "name": null,
  "scale_hint": null,
  "relation": null,
  "viewpoint": "out the window",
  "perspective": "exterior",
  "reason": "Window is visible in current node's navigableElements, user wants to change viewpoint"
}
\`\`\`

**Example 3: Generate New Location**
User: "Go to the cafe next door"
Current: "The Artisan's Loft" (inside Ringön region)
Response:
\`\`\`json
{
  "action": "generate",
  "targetNodeId": null,
  "parentNodeId": "spawn-ringon-456",
  "name": "Cafe Next Door",
  "scale_hint": "site",
  "relation": "sibling",
  "viewpoint": null,
  "perspective": null,
  "reason": "Cafe is a new location adjacent to current one, same region level"
}
\`\`\`

**Example 4: Move to Existing Node**
User: "Go back to the marketplace"
Existing node: "Ringön Marketplace" (ID: spawn-market-789)
Response:
\`\`\`json
{
  "action": "move",
  "targetNodeId": "spawn-market-789",
  "parentNodeId": null,
  "name": null,
  "scale_hint": null,
  "relation": "sibling",
  "viewpoint": null,
  "perspective": null,
  "reason": "Marketplace exists in node list, navigating to existing node"
}
\`\`\`

**Example 5: Generate Detail View**
User: "Look at the canvas leaning against the wall"
Current: "The Artisan's Loft"
Canvas in navigableElements
Response:
\`\`\`json
{
  "action": "generate",
  "targetNodeId": null,
  "parentNodeId": "spawn-loft-123",
  "name": "Canvas Detail View",
  "scale_hint": "detail",
  "relation": "child",
  "viewpoint": null,
  "perspective": null,
  "reason": "User wants close-up detail of canvas visible in current location"
}
\`\`\`

**Example 6: Generate New Region + Location**
User: "Go to the city's main square"
Current: Inside Ringön region of Göteborg world
Response:
\`\`\`json
{
  "action": "generate",
  "targetNodeId": null,
  "parentNodeId": "spawn-goteborg-001",
  "name": "Main Square",
  "scale_hint": "site",
  "relation": "sibling",
  "viewpoint": null,
  "perspective": null,
  "reason": "Main square is a new location, use parent world as parentNodeId for new location"
}
\`\`\`

Now analyze the user's command and provide your decision in JSON format.`;
}
