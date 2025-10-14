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

/**
 * Generate prompt for semantic node selection
 * Returns JSON with action (move/generate) and target details
 */
export const navigatorSemanticNodeSelector = (
  userCommand: string,
  currentFocus: FocusContext,
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

  return `NavigatorAI: Match user's navigation command to existing nodes or suggest generating a new one.

Current: ${currentNodeName} (ID: ${currentFocus.node_id}, Depth: ${currentDepth})

Available nodes:
${nodeSummaries || '(none)'}

User: "${userCommand}"

Node Type Prefixes:
- [World] = depth 0, top-level world
- [Region] = depth 1, area within world
- [Location - Exterior] = depth 2, outside view of place
- [Location - Interior] = depth 2, inside view of place
- [Sublocation - Interior] = depth 3+, room/space within location

Rules:
- If command matches an existing node → action: "move", include targetNodeId (use the node's ID field, NOT name)
- If no match → action: "generate", include parentNodeId and hierarchical name
- Use node type prefixes to understand hierarchy
- "into/inside/enter" commands → look for Interior nodes or generate sublocation
- "outside/exit/back" commands → look for parent or Exterior nodes
- Name format: "[Name] ([level]) of [Parent] ([parent-level])"
- parentNodeId rules: sublocation = current ID, adjacent/nearby = parent ID, teleport = null
- CRITICAL: Always use node IDs (like "spawn-1760475394478-xyz"), NEVER use node names (like "Upstairs")
- The ID field is the unique identifier - names are just labels

Return JSON only:
{
  "action": "move" | "generate",
  "targetNodeId": "id" | null,
  "parentNodeId": "id" | null,
  "name": "hierarchical name" | null,
  "relation": "sublocation" | "adjacent" | "nearby" | "parent" | "teleport" | null,
  "reason": "brief explanation"
}

Examples:
1. User at exterior, child exists: {"action":"move","targetNodeId":"spawn-abc123","parentNodeId":null,"name":null,"relation":null,"reason":"Found interior sublocation"}
2. User wants interior, none exists: {"action":"generate","targetNodeId":null,"parentNodeId":"${currentFocus.node_id}","name":"The Inner Chamber (sub-location) of ${currentNodeName} (location)","relation":"sublocation","reason":"Creating interior space"}
3. User wants to go to "Upstairs" node (id: spawn-xyz789): {"action":"move","targetNodeId":"spawn-xyz789","parentNodeId":null,"name":null,"relation":null,"reason":"Moving to existing Upstairs location"}

IMPORTANT: In your response, targetNodeId and parentNodeId must ALWAYS be the full ID string (starting with "spawn-"), never the node name.`;
};
