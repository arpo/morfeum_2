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
}

/**
 * Build the prompt for generating a Location node with DNA only
 * @param concept - User's location concept description
 * @param region - The parent region (with host DNA merged)
 */
export function buildLocationDNAPrompt(concept: string, region: CascadedRegion): string {
  const regionJSON = JSON.stringify(region, null, 2);
  
  return `You must output ONE valid JSON object and NOTHING ELSE.

You are generating a Morfeum LOCATION node using:
1) a LOCATION CONCEPT (user text)
2) a CASCADED REGION JSON (already includes the inherited vibe/style constraints)

A location is a concrete traversal start point.
By default it is EXTERIOR: outside a place that can be entered.

IMPORTANT: The REGION JSON is already the context.
Do NOT copy region DNA into location DNA.
Location DNA must be DELTA-ONLY (what is new/specific at this location).

OUTPUT SHAPE (exact keys, no extras, no missing keys, keep this order):

{
  "id": "__AUTO__",
  "type": "location",
  "name": "<LOCATION_NAME>",
  "slug": "<locationSlug>",
  "spaceType": "exterior",
  "description": "<one short sentence>",
  "dna": {
    "essence": [],
    "formsAndMaterials": [],
    "colorAndLight": [],
    "atmosphere": [],
    "banned": []
  }
}

STRICT RULES:
- Output JSON only. No markdown. No comments. No trailing commas.
- Do not add, remove, rename, or reorder keys.
- "type" must be exactly "location".
- id MUST be exactly "__AUTO__".
- locationSlug must be lowercase kebab-case.
- spaceType must be "exterior" by default. Use "interior" ONLY if the concept clearly implies interior.

SPACE TYPE RULE:
- If spaceType = "exterior": the location represents an exterior view of a place that can be entered.
- If spaceType = "interior": the location represents an interior space.

DELTA RULE:
- dna.* arrays must only include what is new/specific at this location vs the cascaded region.
- If not clearly new, leave that dna array empty.

NAME RULES:
- If concept is a proper noun (e.g., "Camden", "The Crown pub"), preserve it exactly.
- Otherwise, invent a fitting name that captures the concept's identity.

LOCATION CONCEPT:
${concept}

CASCADED REGION JSON:
${regionJSON}`;
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
  
  // Validate spaceType
  if (parsed.spaceType !== 'exterior' && parsed.spaceType !== 'interior') {
    parsed.spaceType = 'exterior'; // Default to exterior
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
