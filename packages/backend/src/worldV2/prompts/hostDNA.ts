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
  return `Output ONE valid JSON object. No markdown, no comments.

{
  "id": "__AUTO__",
  "type": "host",
  "name": "...",
  "slug": "...",
  "description": "...",
  "genre": "...",
  "dna": {
    "essence": ["core idea 1", "core idea 2"],
    "formsAndMaterials": ["dominant", "secondary"],
    "colorAndLight": ["palette", "light behavior"],
    "atmosphere": ["emotional tone", "experiential quality"],
    "banned": ["genre-drift visual 1", "genre-drift visual 2"]
  }
}

RULES:
- Exact keys, exact order. slug=kebab-case.
- banned: Only visual motifs causing genre drift (e.g. "cyberpunk neon", "fantasy magic props"). NOT behaviors, NOT palette constraints.

CONCEPT: ${concept}`;
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
