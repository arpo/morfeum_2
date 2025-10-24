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
    looks: childDNA.looks || parentDNA.looks,
    colorsAndLighting: childDNA.colorsAndLighting || parentDNA.colorsAndLighting,
    atmosphere: childDNA.atmosphere || parentDNA.atmosphere,
    architectural_tone: childDNA.architectural_tone || parentDNA.architectural_tone,
    cultural_tone: childDNA.cultural_tone || parentDNA.cultural_tone,
    materials: childDNA.materials || parentDNA.materials,
    mood: childDNA.mood || parentDNA.mood,
    sounds: childDNA.sounds || parentDNA.sounds,
    dominantElementsDescriptors: childDNA.dominantElementsDescriptors || parentDNA.dominantElementsDescriptors,
    spatialLayout: childDNA.spatialLayout || parentDNA.spatialLayout,
    primary_surfaces: childDNA.primary_surfaces || parentDNA.primary_surfaces,
    secondary_surfaces: childDNA.secondary_surfaces || parentDNA.secondary_surfaces,
    accent_features: childDNA.accent_features || parentDNA.accent_features,
    dominant: childDNA.dominant || parentDNA.dominant,
    secondary: childDNA.secondary || parentDNA.secondary,
    accent: childDNA.accent || parentDNA.accent,
    ambient: childDNA.ambient || parentDNA.ambient,
    uniqueIdentifiers: childDNA.uniqueIdentifiers || parentDNA.uniqueIdentifiers,
    searchDesc: childDNA.searchDesc || parentDNA.searchDesc
  };
}

/**
 * Convert complete NodeDNA to JSON string for LLM context
 * Formats in a clean, readable way for the LLM to reference
 */
export function formatDNAForContext(dna: NodeDNA): string {
  return JSON.stringify(dna, null, 2);
}
