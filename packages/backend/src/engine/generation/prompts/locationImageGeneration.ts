/**
 * Location image generation from hierarchy nodes
 * Pure function - generates Flux image prompts from node chains
 */

import { qualityPrompt } from '../../../prompts/languages/en/constants';

const morfeumVibes = 'Morfeum aesthetic — hyper-realistic, high-contrast visuals with sharp light, glowing bioluminescence, and richly saturated tones. Surfaces feel alive; darkness holds depth, not gloom. Reality, one notch brighter.';

/**
 * Shot instructions based on node type
 */
function getLocationShotInstructions(nodeType: string) {
  if (nodeType === 'host') {
    // Overview shots for large areas
    return {
      shot: 'elevated oblique, aerial 45° tilt, wide composition with layered depth, diagonal framing, asymmetrical layout',
      light: 'diffused key with parallax through haze, environmental motion (mist, wind, smoke)'
    };
  } else if (nodeType === 'location' || nodeType === 'region') {
    // Exterior ground-level for locations
    return {
      shot: 'elevated oblique 3/4 view, diagonal approach angle, foreground occlusion from natural elements, off-axis composition with cropped edges, layered depth',
      light: 'directional natural light with atmospheric haze, environmental motion (wind-blown mist, drifting clouds)'
    };
  } else {
    // Interior shots for niches
    return {
      shot: 'medium elevated offset angle, diagonal composition through doorway or partial wall, foreground intrusion from architectural elements',
      light: 'hard sidelight cutting through space, atmospheric depth with environmental motion (steam, dust motes)'
    };
  }
}

/**
 * Generate image prompt from hierarchy node chain
 * 
 * @param originalPrompt - Original user input
 * @param nodeChain - Array of nodes from broadest to most specific
 * @returns Image generation prompt string
 */
export function locationImageGeneration(
  originalPrompt: string,
  nodeChain: Array<{
    type: string;
    name: string;
    description: string;
  }>
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
  
  if ((targetNode as any).looks) {
    sceneDescription += `\n\nLooks: ${(targetNode as any).looks}.`;
  }
  if ((targetNode as any).atmosphere) {
    sceneDescription += `\n\nAtmosphere: ${(targetNode as any).atmosphere}.`;
  }
  if ((targetNode as any).mood) {
    sceneDescription += `\n\nMood: ${(targetNode as any).mood}.`;
  }
  
  // Use appropriate shot instructions based on target node type
  const shotInstructions = getLocationShotInstructions(targetNode.type);
  
  return `${morfeumVibes}

Original user description: "${originalPrompt}"

${targetNode.name}, ${shotInstructions.shot}.

[LIGHT:] ${shotInstructions.light}

[SCENE:]
${contextText}${sceneDescription}

[WORLD RULES:] water calm and mirror-still

IMPORTANT: no humans or animals unless specified

${qualityPrompt}`;
}
