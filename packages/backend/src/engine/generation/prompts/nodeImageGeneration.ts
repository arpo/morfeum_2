/**
 * Node-based image generation prompt
 * Generates image prompts based on node type and DNA
 * 
 * Host/Region → Overview (aerial, panoramic)
 * Location/Niche → First-person (immersive)
 */

import { morfeumVibes, qualityPrompt } from '../../../prompts/languages/en/constants';
import type { HierarchyNode, NodeDNA } from '../../hierarchyAnalysis/types';

/**
 * Stripped-down render instructions for overview shots (Host/Region)
 */
const overviewRenderInstructions = `
Elevated oblique view, aerial 45° tilt, wide composition with layered depth.
Favor diagonal framing, asymmetrical layout, foreground occlusion.
Light: diffused with parallax through haze.
Environmental: subtle motion (mist, wind, smoke).
Avoid symmetry and ground-level perspectives.
`;

/**
 * Stripped-down render instructions for first-person shots (Location/Niche)
 */
const firstPersonRenderInstructions = `
Mid-angle view, subject-centered with depth.
Framing: slightly off-axis, partial occlusion from nearby objects.
Light: directional with atmospheric depth.
Environmental: ambient motion (steam, flicker).
Favor immersive perspective over symmetrical composition.
`;

/**
 * Build DNA-based image prompt using all fields except searchDesc and sounds
 */
function buildDNAPrompt(
  name: string,
  dna: NodeDNA,
  renderInstructions: string,
  originalPrompt?: string
): string {
  return `${morfeumVibes}

${name}

${renderInstructions}

${originalPrompt ? `Original user description: "${originalPrompt}"` : ''}

VISUAL DESCRIPTION:
${dna.looks}

COLORS & LIGHTING:
${dna.colorsAndLighting}

ATMOSPHERE:
${dna.atmosphere}

ARCHITECTURAL TONE:
${dna.architectural_tone}

CULTURAL TONE:
${dna.cultural_tone}

MATERIALS:
${dna.materials}

MOOD:
${dna.mood}

DOMINANT ELEMENTS:
${dna.dominantElementsDescriptors}

SPATIAL LAYOUT:
${dna.spatialLayout}

SURFACE MATERIALS:
Primary: ${dna.primary_surfaces}
Secondary: ${dna.secondary_surfaces}
Accents: ${dna.accent_features}

COLOR PALETTE:
Dominant: ${dna.dominant}
Secondary: ${dna.secondary}
Accent: ${dna.accent}
Ambient light: ${dna.ambient}

UNIQUE IDENTIFIERS:
${dna.uniqueIdentifiers}

[WORLD RULES:]
No human or animal figures appear unless explicitly mentioned.
Water, when visible, is calm and mirror-still, reflecting light softly.

${qualityPrompt}
`;
}

/**
 * Fallback prompt when DNA is not available (unlikely scenario)
 */
function buildBasicPrompt(
  name: string,
  description: string,
  renderInstructions: string,
  originalPrompt?: string
): string {
  return `${morfeumVibes}

${name}

${renderInstructions}

${originalPrompt ? `Original user description: "${originalPrompt}"` : ''}

${description}

[WORLD RULES:]
No human or animal figures appear unless explicitly mentioned.
Water, when visible, is calm and mirror-still, reflecting light softly.

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
  const renderInstructions = isOverview 
    ? overviewRenderInstructions 
    : firstPersonRenderInstructions;
  
  // Build prompt from DNA (if exists) or fallback to name + description
  if (!node.dna) {
    // Fallback for missing DNA (unlikely but handle gracefully)
    return buildBasicPrompt(node.name, node.description, renderInstructions, originalPrompt);
  }
  
  // Build rich DNA-based prompt
  return buildDNAPrompt(node.name, node.dna, renderInstructions, originalPrompt);
}
