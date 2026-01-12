/**
 * Location DNA Generation Prompt
 * 
 * V2 World System - Location DNA only (no promptStructure)
 * promptStructure is generated at /DISPLAY time
 */

import { Region, Host } from '../types';

interface CascadedRegion extends Region {
  /** Host DNA for context */
  hostDna?: Host['dna'];
  /** Host name for geographic context */
  hostName?: string;
}

/**
 * Build the prompt for generating a Location node with DNA only
 * @param concept - User's location concept description
 * @param region - The parent region (with host DNA merged)
 */
export function buildLocationDNAPrompt(concept: string, region: CascadedRegion): string {
  // Only include essential context, not full JSON dump
  const regionContext = {
    name: region.name,
    dna: region.dna,
    hostDna: region.hostDna
  };
  
  return `Output ONE valid JSON object. No markdown.

LOCATION in region "${region.name}", host "${region.hostName || 'unknown'}".
Delta-only: Only add DNA that differs from region. Empty arrays if no difference.

{
  "id": "__AUTO__",
  "type": "location",
  "name": "...",
  "slug": "...",
  "spaceType": "exterior",
  "description": "...",
  "dna": { "essence": [], "formsAndMaterials": [], "colorAndLight": [], "atmosphere": [], "banned": [] }
}

RULES: Exact keys. slug=kebab-case. Preserve proper nouns.

spaceType: Default "exterior" (viewing from outside). Use "interior" only for enclosed host environments (space station, underground world, inside a vessel).

REGION DNA: ${JSON.stringify(regionContext.dna)}

CONCEPT: ${concept}`;
}

/**
 * Parse the LLM response into a Location (WorldNode) object
 * Handles the __AUTO__ id replacement
 */
export function parseLocationResponse(jsonString: string, generateId: () => string): {
  id: string;
  type: 'location';
  name: string;
  slug: string;
  spaceType: 'exterior' | 'interior';
  description: string;
  dna: {
    essence: string[];
    formsAndMaterials: string[];
    colorAndLight: string[];
    atmosphere: string[];
    banned: string[];
  };
} {
  // Clean the response - remove markdown code blocks if present
  let cleaned = jsonString.trim();
  if (cleaned.startsWith('```json')) {
    cleaned = cleaned.slice(7);
  } else if (cleaned.startsWith('```')) {
    cleaned = cleaned.slice(3);
  }
  if (cleaned.endsWith('```')) {
    cleaned = cleaned.slice(0, -3);
  }
  cleaned = cleaned.trim();
  
  const parsed = JSON.parse(cleaned);
  
  // Validate required fields
  if (parsed.type !== 'location') {
    throw new Error(`Expected type "location", got "${parsed.type}"`);
  }
  
  if (!parsed.name || !parsed.slug || !parsed.description || !parsed.dna) {
    throw new Error('Missing required fields in location response');
  }
  
  // Validate DNA structure (can be empty arrays for delta-only)
  const dna = parsed.dna;
  const requiredDnaArrays = ['essence', 'formsAndMaterials', 'colorAndLight', 'atmosphere', 'banned'];
  for (const field of requiredDnaArrays) {
    if (!Array.isArray(dna[field])) {
      throw new Error(`dna.${field} must be an array`);
    }
  }
  
  // Validate spaceType - default to exterior if invalid
  if (parsed.spaceType !== 'exterior' && parsed.spaceType !== 'interior') {
    parsed.spaceType = 'exterior';
  }
  
  // Replace __AUTO__ with generated ID
  return {
    id: generateId(),
    type: 'location',
    name: parsed.name,
    slug: parsed.slug,
    spaceType: parsed.spaceType,
    description: parsed.description,
    dna: parsed.dna
  };
}
