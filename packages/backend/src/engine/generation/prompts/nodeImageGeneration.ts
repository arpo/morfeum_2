/**
 * Node-based image generation prompt
 * Generates image prompts based on node type and DNA
 * 
 * Host/Region → Overview (aerial, panoramic)
 * Location/Niche → First-person (immersive)
 */

import { qualityPrompt } from '../../../prompts/languages/en/constants';
import type { HierarchyNode, NodeDNA } from '../../hierarchyAnalysis/types';

/**
 * Overview shot instructions (Host/Region)
 */
const overviewShotInstructions = {
  shot: 'elevated oblique, aerial 45° tilt, wide composition with layered depth, diagonal framing, asymmetrical layout, foreground occlusion (not symmetrical)',
  light: 'diffused key with parallax through haze, environmental motion (mist, wind, smoke)'
};

/**
 * First-person shot instructions (Location/Niche)
 */
const firstPersonShotInstructions = {
  shot: 'mid-angle, subject-centered with depth, slightly off-axis, partial occlusion from nearby objects, immersive perspective (not symmetrical)',
  light: 'directional key, atmospheric depth, environmental motion (steam, flicker)'
};

/**
 * Build DNA-based image prompt using all fields except searchDesc and sounds
 */
function buildDNAPrompt(
  name: string,
  dna: NodeDNA,
  shotInstructions: { shot: string; light: string },
  originalPrompt?: string
): string {
  return `${name}

[SHOT:] ${shotInstructions.shot}
[LIGHT:] ${shotInstructions.light}

[SCENE:]
${originalPrompt ? `Original user description: "${originalPrompt}"` : ''}

[LOOK:] ${dna.looks}
[COLORS & LIGHT:] ${dna.colorsAndLighting}
[ATMOSPHERE:] ${dna.atmosphere}
[ARCHITECTURE:] ${dna.architectural_tone}
[CULTURE:] ${dna.cultural_tone}
[MATERIALS:] ${dna.materials}
[MOOD:] ${dna.mood}
[DOMINANT ELEMENTS:] ${dna.dominantElementsDescriptors}
[SPATIAL LAYOUT:] ${dna.spatialLayout}
[SURFACES:] primary ${dna.primary_surfaces}; secondary ${dna.secondary_surfaces}; accents ${dna.accent_features}
[COLOR PALETTE:] dominant ${dna.dominant}; secondary ${dna.secondary}; accent ${dna.accent}; ambient ${dna.ambient}
[IDENTIFIERS:] ${dna.uniqueIdentifiers}

[WORLD RULES:] no humans or animals unless specified; water calm and mirror-still

${qualityPrompt}
`;
}

/**
 * Fallback prompt when DNA is not available (unlikely scenario)
 */
function buildBasicPrompt(
  name: string,
  description: string,
  shotInstructions: { shot: string; light: string },
  originalPrompt?: string
): string {
  return `${name}

[SHOT:] ${shotInstructions.shot}
[LIGHT:] ${shotInstructions.light}

[SCENE:]
${originalPrompt ? `Original user description: "${originalPrompt}"` : ''}

${description}

[WORLD RULES:] no humans or animals unless specified; water calm and mirror-still

${qualityPrompt}
`;
}

/**
 * Generate image prompt based on node type and DNA
 * 
 * @param node - Hierarchy node (Host, Region, Location, or Niche)
 * @param originalPrompt - Optional original user prompt for context
 * @returns Image generation prompt string
 */
export function nodeImageGeneration(
  node: HierarchyNode,
  originalPrompt?: string
): string {
  // Determine camera angle based on node type
  const isOverview = node.type === 'host' || node.type === 'region';
  const shotInstructions = isOverview 
    ? overviewShotInstructions 
    : firstPersonShotInstructions;
  
  // Build prompt from DNA (if exists) or fallback to name + description
  if (!node.dna) {
    // Fallback for missing DNA (unlikely but handle gracefully)
    return buildBasicPrompt(node.name, node.description, shotInstructions, originalPrompt);
  }
  
  // Build rich DNA-based prompt
  return buildDNAPrompt(node.name, node.dna, shotInstructions, originalPrompt);
}
