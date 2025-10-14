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
  dna: any;
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
  
  // Create summarized node list for context
  const nodeSummaries = allNodes.map(node => {
    const looks = node.dna?.location?.profile?.looks || 
                  node.dna?.region?.profile?.colorsAndLighting || 
                  node.dna?.world?.profile?.colorsAndLighting || 
                  'No description available';
    
    return `- ${node.name} (ID: ${node.id}, Depth: ${node.depth_level}): ${looks.substring(0, 100)}...`;
  }).join('\n');

  return `You are the NavigatorAI for Morfeum — an intelligent spatial guide that connects worlds, regions, and locations.

Your job:
Understand where the user wants to go based on their command, and match it to existing world nodes if possible.

Current focus:
- Current location: ${currentNodeName}
- Depth level: ${currentDepth} (0=world, 1=region, 2=location, 3=sub-location)
- Node ID: ${currentFocus.node_id}
- Perspective: ${currentFocus.perspective}
- Viewpoint: ${currentFocus.viewpoint}
- Distance: ${currentFocus.distance}

Known nodes in this world:
${nodeSummaries || '(No nodes available)'}

User command:
"${userCommand}"

Analyze the command and decide:

1. **If the command clearly refers to one of the listed nodes** → Return "move" action with the target node ID
   - Match based on name, description, or spatial context (e.g., "go inside" might mean a sublocation)
   - Consider hierarchy: child nodes are "inside" or "enter", parent/sibling nodes are "back to" or "go to"
   
2. **If no existing node matches** → Return "generate" action with details for creating a new node
   - Infer what kind of location should exist (world/region/location/sublocation)
   - Determine spatial relation to current focus (sublocation, adjacent, nearby, teleport)
   - **CRITICAL**: Generate name using hierarchical syntax:
     * Format: "[Name] ([level]) of [Parent Name] ([parent-level])"
     * Example: "The inner chamber (sub-location) of the Lighthouse (location)"
     * Use flowing, evocative language
     * Always include the level markers in parentheses

Return ONLY valid JSON in this exact format:
{
  "action": "move" | "generate",
  "targetNodeId": "id-of-existing-node" | null,
  "parentNodeId": "id-of-parent-node-for-new-location" | null,
  "name": "descriptive-name-if-generating" | null,
  "relation": "sublocation" | "adjacent" | "nearby" | "parent" | "teleport" | null,
  "reason": "brief 1-sentence explanation of your decision"
}

**Important**: When action is "generate", always include parentNodeId:
- For "sublocation": parentNodeId = current node ID
- For "adjacent": parentNodeId = current node's parent ID
- For "nearby": parentNodeId = current node's parent ID
- For "teleport": parentNodeId = null (disconnected location)

Examples:

User: "go inside"
Current node: Lighthouse (exterior)
Available: Lighthouse Interior (child)
Response: {"action":"move","targetNodeId":"lighthouse-interior-id","parentNodeId":null,"name":null,"relation":null,"reason":"User wants to enter the building, child node exists"}

User: "back to the beach"
Current node: Cave Interior
Available: Moonlit Beach (parent)
Response: {"action":"move","targetNodeId":"beach-id","parentNodeId":null,"name":null,"relation":null,"reason":"User wants to return to parent location"}

User: "explore the hidden tower"
Current node: The Forest Clearing (location), ID: forest-clearing-123
Available: No tower exists
Response: {"action":"generate","targetNodeId":null,"parentNodeId":"forest-clearing-123","name":"The Hidden Tower (location) near the Forest Clearing (location)","relation":"nearby","reason":"No tower exists in known nodes, creating nearby location"}

User: "go inside"
Current node: The Lighthouse of Broken Glass (location), ID: lighthouse-456
Available: No interior exists
Response: {"action":"generate","targetNodeId":null,"parentNodeId":"lighthouse-456","name":"The inner chamber (sub-location) of the Lighthouse of Broken Glass (location)","relation":"sublocation","reason":"User wants to enter, creating interior sub-location"}

User: "teleport to the crystal caves"
Current node: Desert Oasis
Available: Crystal Caves exist
Response: {"action":"move","targetNodeId":"caves-id","parentNodeId":null,"name":null,"relation":null,"reason":"User wants to jump to distant known location"}

Now process the user's command and return your JSON response:`;
};
