/**
 * Host DNA Generation Prompt
 * 
 * V2 World System - Simplified DNA structure
 * TODO: Remove when V2 is stable and old system is removed
 */

/**
 * Build the prompt for generating a Host node with DNA
 * @param concept - User's world concept description
 */
export function buildHostDNAPrompt(concept: string): string {
  return `You must output ONE valid JSON object and NOTHING ELSE.

Output must match EXACTLY this shape (same keys, no extras, no missing keys, keep this order):

{
  "id": "__AUTO__",
  "type": "host",
  "name": "<HOST_NAME>",
  "slug": "<slug>",
  "description": "<short, high-level description of the world>",
  "genre": "<genre label, e.g. Steampunk, Gothic, Urban Metropole, Carnival, etc.>",
  "dna": {
    "essence": [
      "<core idea 1>",
      "<core idea 2>"
    ],
    "formsAndMaterials": [
      "<dominant forms/material families>",
      "<secondary forms/material families>"
    ],
    "colorAndLight": [
      "<palette tendency>",
      "<light behavior>"
    ],
    "atmosphere": [
      "<emotional tone>",
      "<experiential quality>"
    ],
    "banned": [
      "<genre drift ban 1>",
      "<genre drift ban 2>"
    ]
  }
}

STRICT RULES:
- Output JSON only. No markdown. No comments. No trailing commas.
- Do not add, remove, rename, or reorder keys.
- "type" must be exactly "host".
- id MUST be exactly "__AUTO__".
- slug must be lowercase kebab-case.

BANNED (important):
- Only include consistency-breaking visual motifs/styles (genre drift).
- Do NOT ban behaviors/conditions (silence, cleanliness, wilderness).
- Do NOT ban broad palette constraints (monochromatic, muted, dark).
- Avoid vague bans like "clean lines" or "excessive modernism" for real cities.
- Use bans like: "fantasy magic props", "cyberpunk neon overload", "retro-futuristic spectacle tech", "single-era theming" (only if relevant).

HOST CONCEPT:
${concept}`;
}

/**
 * Parse the LLM response into a Host object
 * Handles the __AUTO__ id replacement
 */
export function parseHostResponse(jsonString: string, generateId: () => string): {
  id: string;
  type: 'host';
  name: string;
  slug: string;
  description: string;
  genre: string;
  spaceType: 'exterior';
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
  if (parsed.type !== 'host') {
    throw new Error(`Expected type "host", got "${parsed.type}"`);
  }
  
  if (!parsed.name || !parsed.slug || !parsed.description || !parsed.dna) {
    throw new Error('Missing required fields in host response');
  }
  
  // Validate DNA structure
  const dna = parsed.dna;
  const requiredArrays = ['essence', 'formsAndMaterials', 'colorAndLight', 'atmosphere', 'banned'];
  for (const field of requiredArrays) {
    if (!Array.isArray(dna[field])) {
      throw new Error(`dna.${field} must be an array`);
    }
  }
  
  // Replace __AUTO__ with generated ID and add spaceType
  return {
    ...parsed,
    id: generateId(),
    spaceType: 'exterior' as const // Hosts are always exterior
  };
}
