/**
 * Node-based image generation prompt
 * Generates image prompts based on node type and DNA
 * 
 * Host/Region → Overview (aerial, panoramic)
 * Location/Niche → First-person (immersive)
 */

import { qualityPrompt } from '../../../../prompts/languages/en/constants';
import type { HierarchyNode, NodeDNA } from '../../../hierarchyAnalysis/types';

/**
 * Overview shot instructions (Host/Region)
 */
const overviewShotInstructions = {
  shot: 'elevated oblique, aerial 45° tilt, wide composition with layered depth, diagonal framing, asymmetrical layout, foreground occlusion (not symmetrical)',
  light: 'diffused key with parallax through haze, environmental motion (mist, wind, smoke)'
};

/**
 * First-person EXTERIOR shot instructions (Location)
 * Dynamic outdoor perspective with depth and asymmetry
 */
const firstPersonExteriorInstructions = {
  shot: 'elevated oblique 3/4 view, diagonal approach angle, foreground occlusion from natural elements (branches, rocks, structures), off-axis composition with cropped edges, layered depth showing near/mid/far, asymmetrical framing (not centered, not symmetrical)',
  light: 'directional natural light with atmospheric haze, environmental motion (wind-blown mist, drifting clouds, shifting shadows), parallax depth through weather conditions'
};

/**
 * First-person INTERIOR shot instructions (Niche)
 * Dynamic indoor perspective with depth and asymmetry
 */
const firstPersonInteriorInstructions = {
  shot: 'medium elevated offset angle, diagonal composition through doorway or partial wall, foreground intrusion from architectural elements (beams, pillars, furniture edges), off-axis framing with cropped geometry, layered depth (not corridor symmetry)',
  light: 'hard sidelight cutting through space, atmospheric depth with environmental motion (steam, dust motes, flickering sources), mixed lighting temperature creating visual texture'
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

[WORLD RULES:] water calm and mirror-still

IMPORTANT: no humans or animals unless specified
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
  let shotInstructions;
  
  if (node.type === 'host' || node.type === 'region') {
    // Overview: Aerial/elevated shots
    shotInstructions = overviewShotInstructions;
  } else if (node.type === 'location') {
    // Location: First-person EXTERIOR (outside, ground level)
    shotInstructions = firstPersonExteriorInstructions;
  } else {
    // Niche: First-person INTERIOR (inside, enclosed)
    shotInstructions = firstPersonInteriorInstructions;
  }
  
  // Build prompt from DNA (if exists) or fallback to name + description
  if (!node.dna) {
    // Fallback for missing DNA (unlikely but handle gracefully)
    return buildBasicPrompt(node.name, node.description, shotInstructions, originalPrompt);
  }
  
  // Build rich DNA-based prompt
  return buildDNAPrompt(node.name, node.dna, shotInstructions, originalPrompt);
}
