/**
 * Style Lock Compiler
 * 
 * Compiles DNA into style lock text for image prompts.
 * Simple: DNA in → style lock out. No additions, no assumptions.
 */

import type { DNA } from '../types';
import type { SpaceType } from '../prompts/goInside';

/**
 * Build style lock text from DNA
 * 
 * Generic function - only outputs what's in the DNA arrays.
 * Used by image generation and image editing prompts.
 */
export function buildStyleLock(dna: DNA): string {
  const sections: string[] = [];
  
  if (dna.essence.length > 0)
    sections.push(`Identity:\n${dna.essence.map(e => `* ${e}`).join('\n')}`);
  
  if (dna.formsAndMaterials.length > 0)
    sections.push(`Materials:\n${dna.formsAndMaterials.map(m => `* ${m}`).join('\n')}`);
  
  if (dna.colorAndLight.length > 0)
    sections.push(`Color & Light:\n${dna.colorAndLight.map(c => `* ${c}`).join('\n')}`);
  
  if (dna.atmosphere.length > 0)
    sections.push(`Atmosphere:\n${dna.atmosphere.map(a => `* ${a}`).join('\n')}`);
  
  if (dna.banned.length > 0)
    sections.push(`Banned:\n${dna.banned.map(b => `* ${b}`).join('\n')}`);
  
  return sections.join('\n\n');
}

/**
 * Compile DNA into style lock with prohibitions
 * 
 * Uses dna.banned array for prohibitions - no hardcoded defaults.
 */
export function compileStyleLock(dna: DNA): { styleLockText: string; prohibitionsText: string } {
  const styleLockText = buildStyleLock(dna);
  
  const prohibitionsText = dna.banned.length > 0
    ? dna.banned.map(p => `* Do not ${p.toLowerCase()}`).join('\n')
    : '';

  return { styleLockText, prohibitionsText };
}

/**
 * Filter DNA elements that are inappropriate for the space type
 * 
 * Removes inherited elements that don't make spatial sense:
 * - Outdoor features (pools, gardens) in underground/indoor spaces
 * - Spatially-separate features (pools) in semi-enclosed/elevated spaces
 * - Exterior architectural elements in interior spaces
 */
function filterInappropriateElements(elements: string[], spaceType: SpaceType): string[] {
  // Patterns for fully outdoor/exterior features (don't belong in fully enclosed spaces)
  const outdoorPatterns = [
    /\bpool\b/i,
    /\bbougainvillea\b/i,
    /\bflora\b/i,
    /\bgarden\b/i,
    /\bplaza\b/i,
    /\boutdoor\b/i,
    /\bexterior\b/i,
    /\bsky\b/i,
    /\bsunlight\b/i,
    /\bcliff/i,
    /\bseascape\b/i,
    /\bcoastline\b/i
  ];

  // Patterns for spatially-separate features (don't belong on terraces/balconies/rooftops)
  const separateFeaturePatterns = [
    /\bpool\b/i,
    /\bpool water\b/i,
    /\bswimming pool\b/i,
    /\binfinity.*pool\b/i
  ];

  // For underground and indoor spaces, filter out ALL outdoor elements
  if (spaceType === 'underground' || spaceType === 'indoor') {
    return elements.filter(element => {
      return !outdoorPatterns.some(pattern => pattern.test(element));
    });
  }

  // For semi-enclosed and elevated spaces (terraces, balconies, rooftops):
  // Keep outdoor ambiance (bougainvillea, sky, sunlight) but remove spatially-separate features (pools)
  if (spaceType === 'semi-enclosed' || spaceType === 'elevated') {
    return elements.filter(element => {
      return !separateFeaturePatterns.some(pattern => pattern.test(element));
    });
  }

  // For outdoor spaces, keep all elements (no filtering needed)
  return elements;
}

/**
 * Build style lock for GO_INSIDE2 with space-type-aware filtering
 * 
 * Filters out spatially inappropriate inherited elements based on space type.
 * For example: removes outdoor features when entering underground/indoor spaces.
 */
export function buildStyleLockForSpace(dna: DNA, spaceType: SpaceType): string {
  const sections: string[] = [];
  
  // Essence and atmosphere are usually fine to inherit
  if (dna.essence.length > 0)
    sections.push(`Identity:\n${dna.essence.map(e => `* ${e}`).join('\n')}`);
  
  // Materials might need filtering but are usually contextual
  if (dna.formsAndMaterials.length > 0)
    sections.push(`Materials:\n${dna.formsAndMaterials.map(m => `* ${m}`).join('\n')}`);
  
  // Color & Light needs the most filtering for spatial transitions
  if (dna.colorAndLight.length > 0) {
    const filteredColors = filterInappropriateElements(dna.colorAndLight, spaceType);
    if (filteredColors.length > 0) {
      sections.push(`Color & Light:\n${filteredColors.map(c => `* ${c}`).join('\n')}`);
    }
  }
  
  if (dna.atmosphere.length > 0)
    sections.push(`Atmosphere:\n${dna.atmosphere.map(a => `* ${a}`).join('\n')}`);
  
  if (dna.banned.length > 0)
    sections.push(`Banned:\n${dna.banned.map(b => `* ${b}`).join('\n')}`);
  
  return sections.join('\n\n');
}
