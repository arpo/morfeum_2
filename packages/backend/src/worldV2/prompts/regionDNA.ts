/**
 * Region DNA Generation Prompt
 * 
 * V2 World System - Delta-only DNA inheritance from host
 */

import { Host } from '../types';

/**
 * Build the prompt for generating a Region node with delta-only DNA
 * @param concept - User's region concept description
 * @param hostJSON - The parent host's complete JSON
 */
export function buildRegionDNAPrompt(concept: string, host: Host): string {
  const hostJSON = JSON.stringify(host, null, 2);
  
  return `You must output ONE valid JSON object and NOTHING ELSE.

You are generating a Morfeum REGION node using:
1) a REGION CONCEPT (user text)
2) a CASCADED HOST JSON (already includes the inherited vibe/style constraints)

A region is a sub-area of the host world.
A region must ONLY add information that is meaningfully DIFFERENT from the host (delta-only).
Do NOT restate host DNA. If it's not clearly different, leave that region dna array empty.

OUTPUT SHAPE (exact keys, no extras, no missing keys, keep this order):

{
  "id": "__AUTO__",
  "type": "region",
  "name": "<REGION_NAME>",
  "slug": "<regionSlug>",
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
- "type" must be exactly "region".
- id MUST be exactly "__AUTO__".
- regionSlug must be lowercase kebab-case.

NAME:
- If input is a proper noun (Camden, City of London), keep it exactly (title-case).
- Otherwise create a concise title-case name.

REGION CONCEPT:
${concept}

CASCADED HOST JSON:
${hostJSON}`;
}

/**
 * Parse the LLM response into a Region object
 * Handles the __AUTO__ id replacement
 */
export function parseRegionResponse(jsonString: string, generateId: () => string): {
  id: string;
  type: 'region';
  name: string;
  slug: string;
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
  if (parsed.type !== 'region') {
    throw new Error(`Expected type "region", got "${parsed.type}"`);
  }
  
  if (!parsed.name || !parsed.slug || !parsed.description || !parsed.dna) {
    throw new Error('Missing required fields in region response');
  }
  
  // Validate DNA structure (can be empty arrays for delta-only)
  const dna = parsed.dna;
  const requiredArrays = ['essence', 'formsAndMaterials', 'colorAndLight', 'atmosphere', 'banned'];
  for (const field of requiredArrays) {
    if (!Array.isArray(dna[field])) {
      throw new Error(`dna.${field} must be an array`);
    }
  }
  
  // Replace __AUTO__ with generated ID
  return {
    ...parsed,
    id: generateId()
  };
}
