/**
 * Node-based image generation prompt
 * Generates image prompts based on node type and DNA
 * 
 * Host/Region → Overview (aerial, panoramic)
 * Location/Niche → First-person (immersive)
 * 
 * Uses centralized camera configuration for consistent transitions
 */

import { qualityPrompt } from '../shared';
import { OVERVIEW_SHOT, EXTERIOR_SHOT, INTERIOR_SHOT } from '../shared/cameraConfig';
import type { HierarchyNode, NodeDNA } from '../../../hierarchyAnalysis/types';

/**
 * Overview shot instructions (Host/Region)
 * Imported from centralized camera config
 */
const overviewShotInstructions = OVERVIEW_SHOT;

/**
 * First-person EXTERIOR shot instructions (Location)
 * Centered outdoor perspective with balanced composition
 * Imported from centralized camera config
 */
const firstPersonExteriorInstructions = EXTERIOR_SHOT;

/**
 * First-person INTERIOR shot instructions (Niche)
 * Centered indoor perspective with balanced composition
 * Imported from centralized camera config
 */
const firstPersonInteriorInstructions = INTERIOR_SHOT;

/**
 * Build DNA-based image prompt using all fields except searchDesc and sounds
 */
function buildDNAPrompt(
  name: string,
  dna: NodeDNA,
  shotInstructions: { shot: string; light: string; lens?: string },
  originalPrompt?: string
): string {
  return `${name}

[SHOT:] ${shotInstructions.shot}
[LIGHT:] ${shotInstructions.light}
${shotInstructions.lens ? `[LENS:] ${shotInstructions.lens}` : ''}

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
  shotInstructions: { shot: string; light: string; lens?: string },
  originalPrompt?: string
): string {
  return `${name}

[SHOT:] ${shotInstructions.shot}
[LIGHT:] ${shotInstructions.light}
${shotInstructions.lens ? `[LENS:] ${shotInstructions.lens}` : ''}

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
