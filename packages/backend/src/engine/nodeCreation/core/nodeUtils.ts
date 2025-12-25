/**
 * Node Creation Utilities
 * Helper functions for node creation operations
 */

import type { ScenePerspective } from '../types';

/**
 * Clean up unwanted/leftover DNA fields that LLM sometimes adds
 * Removes: semantic, visual, profile (duplicates/empty)
 */
export function cleanDNAFields(dna: any): any {
  const cleaned = { ...dna };
  
  // Remove leftover empty/duplicate fields
  delete cleaned.semantic;
  delete cleaned.visual;
  delete cleaned.profile;
  
  return cleaned;
}

/**
 * Generate a slug from a name
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Detect perspective from description
 */
export function detectPerspective(description: string): ScenePerspective {
  const lowerDesc = description.toLowerCase();
  
  // Interior indicators
  const interiorWords = ['inside', 'interior', 'room', 'hall', 'chamber', 'within', 'indoor'];
  if (interiorWords.some(word => lowerDesc.includes(word))) {
    return 'interior';
  }

  // Exterior indicators
  const exteriorWords = ['outside', 'exterior', 'street', 'garden', 'rooftop', 'terrace', 'outdoor'];
  if (exteriorWords.some(word => lowerDesc.includes(word))) {
    return 'exterior';
  }

  // Default to exterior for most cases
  return 'exterior';
}
