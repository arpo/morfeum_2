/**
 * DNA Merge Utility
 * Merges parent and child DNA, with child overriding parent where specified
 * Based on frontend's locationCascading.ts logic
 */

import type { NodeDNA } from './types';

/**
 * Merge parent DNA with child DNA (sparse overrides)
 * Returns a complete DNA object where child values override parent values
 * Null/undefined child values inherit from parent
 */
export function mergeDNA(parentDNA: NodeDNA, childDNA?: Partial<NodeDNA>): NodeDNA {
  if (!childDNA) {
    return parentDNA;
  }

  return {
    // Scene-specific visual fields (always present)
    looks: childDNA.looks || parentDNA.looks,
    colorsAndLighting: childDNA.colorsAndLighting || parentDNA.colorsAndLighting,
    atmosphere: childDNA.atmosphere || parentDNA.atmosphere,
    materials: childDNA.materials || parentDNA.materials,
    mood: childDNA.mood || parentDNA.mood,
    sounds: childDNA.sounds || parentDNA.sounds,
    spatialLayout: childDNA.spatialLayout || parentDNA.spatialLayout,
    primary_surfaces: childDNA.primary_surfaces || parentDNA.primary_surfaces,
    secondary_surfaces: childDNA.secondary_surfaces || parentDNA.secondary_surfaces,
    accent_features: childDNA.accent_features || parentDNA.accent_features,
    dominant: childDNA.dominant || parentDNA.dominant,
    secondary: childDNA.secondary || parentDNA.secondary,
    accent: childDNA.accent || parentDNA.accent,
    ambient: childDNA.ambient || parentDNA.ambient,
    
    // Cascading style attributes (can be sparse/null in children)
    genre: childDNA.genre !== undefined ? childDNA.genre : parentDNA.genre,
    architectural_tone: childDNA.architectural_tone !== undefined ? childDNA.architectural_tone : parentDNA.architectural_tone,
    cultural_tone: childDNA.cultural_tone !== undefined ? childDNA.cultural_tone : parentDNA.cultural_tone,
    materials_base: childDNA.materials_base !== undefined ? childDNA.materials_base : parentDNA.materials_base,
    mood_baseline: childDNA.mood_baseline !== undefined ? childDNA.mood_baseline : parentDNA.mood_baseline,
    palette_bias: childDNA.palette_bias !== undefined ? childDNA.palette_bias : parentDNA.palette_bias,
    soundscape_base: childDNA.soundscape_base !== undefined ? childDNA.soundscape_base : parentDNA.soundscape_base,
    flora_base: childDNA.flora_base !== undefined ? childDNA.flora_base : parentDNA.flora_base,
    fauna_base: childDNA.fauna_base !== undefined ? childDNA.fauna_base : parentDNA.fauna_base
  };
}

/**
 * Convert complete NodeDNA to JSON string for LLM context
 * Formats in a clean, readable way for the LLM to reference
 */
export function formatDNAForContext(dna: NodeDNA): string {
  return JSON.stringify(dna, null, 2);
}
