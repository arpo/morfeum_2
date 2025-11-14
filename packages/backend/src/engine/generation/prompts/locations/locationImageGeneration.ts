/**
 * Location image generation from hierarchy nodes
 * Pure function - generates Flux image prompts from node chains
 * 
 * Uses centralized camera configuration for consistent transitions
 */

import type { HierarchyNode } from '../../../hierarchyAnalysis/types';
import { generalPromptFix } from '../shared/generalPromptFix';
import { OVERVIEW_SHOT, EXTERIOR_SHOT, INTERIOR_SHOT } from '../shared/cameraConfig';

/**
 * Shot instructions based on node type
 * Uses centralized camera configuration
 */
function getLocationShotInstructions(nodeType: string) {
  if (nodeType === 'host') {
    // Overview shots for large areas
    return OVERVIEW_SHOT;
  } else if (nodeType === 'location' || nodeType === 'region') {
    // Exterior ground-level for locations
    return EXTERIOR_SHOT;
  } else {
    // Interior shots for niches
    return INTERIOR_SHOT;
  }
}

/**
 * Generate image prompt from hierarchy node chain
 * 
 * @param originalPrompt - Original user input
 * @param nodeChain - Array of complete hierarchy nodes from broadest to most specific
 * @returns Image generation prompt string
 */
export function locationImageGeneration(
  originalPrompt: string,
  nodeChain: HierarchyNode[]
): string {
  // Last node is the target (what we're generating image for)
  const targetNode = nodeChain[nodeChain.length - 1];
  
  // Parent nodes provide context (all except last)
  const parentNodes = nodeChain.slice(0, -1);
  
  // Build context text by iterating through parents (broadest to most specific)
  let contextText = '';
  for (const node of parentNodes) {
    const nodeType = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    contextText += `${nodeType} ${node.name}: ${node.description}.\n\n`;
  }
  
  // Build scene description with enriched visual fields from deepest node
  let sceneDescription = `Description: ${targetNode.description}.`;
  
  // Add visual enrichment fields if present (from hierarchyCategorization)
  if ('looks' in targetNode && targetNode.looks) {
    sceneDescription += `\n\nLooks: ${targetNode.looks}.`;
  }
  if ('atmosphere' in targetNode && targetNode.atmosphere) {
    sceneDescription += `\n\nAtmosphere: ${targetNode.atmosphere}.`;
  }
  if ('mood' in targetNode && targetNode.mood) {
    sceneDescription += `\n\nMood: ${targetNode.mood}.`;
  }
  
  // Use appropriate shot instructions based on target node type
  const shotInstructions = getLocationShotInstructions(targetNode.type);
  
const prompt = `Original user description: "${originalPrompt}"

${targetNode.name}, ${shotInstructions.shot}.

[LIGHT:] ${shotInstructions.light}
[LENS:] ${shotInstructions.lens}

[SCENE:]
${contextText}${sceneDescription}`;

const rv = generalPromptFix(prompt)
// console.log(rv);
  return rv;
}
