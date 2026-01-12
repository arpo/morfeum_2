/**
 * Shared DNA Schema and Rules
 * 
 * Single source of truth for DNA structure across all prompts
 * Used by: hostDNA, regionDNA, locationDNA, worldLocationFull
 */

/**
 * DNA JSON schema for prompts
 */
export const DNA_SCHEMA = `"dna": {
    "essence": ["core idea 1", "core idea 2"],
    "formsAndMaterials": ["dominant", "secondary"],
    "colorAndLight": ["palette", "light behavior"],
    "atmosphere": ["emotional tone", "experiential quality"],
    "banned": ["genre-drift visual 1", "genre-drift visual 2"]
  }`;

/**
 * DNA field explanations for prompts
 */
export const DNA_FIELD_RULES = `- essence: Core visual identity of the world (3-5 terms)
- formsAndMaterials: Dominant architectural shapes and materials
- colorAndLight: Color palette and lighting characteristics
- atmosphere: Mood, feeling, and experiential quality
- banned: Visual motifs that would cause genre drift (NOT behaviors/palette constraints)`;

/**
 * Delta DNA rules for child nodes (regions, locations)
 */
export const DNA_DELTA_RULES = `Delta-only DNA: Only add values that DIFFER from parent. Empty arrays if no difference.
Child nodes inherit parent DNA - only specify what changes.`;

/**
 * Host node JSON schema
 */
export const HOST_SCHEMA = `{
  "id": "__AUTO__",
  "type": "host",
  "name": "...",
  "slug": "...",
  "description": "...",
  "genre": "...",
  "weather": "...",
  "timeOfDay": "...",
  ${DNA_SCHEMA}
}`;

/**
 * Region node JSON schema
 */
export const REGION_SCHEMA = `{
  "id": "__AUTO__",
  "type": "region",
  "name": "...",
  "slug": "...",
  "description": "...",
  ${DNA_SCHEMA}
}`;

/**
 * Location node JSON schema
 */
export const LOCATION_SCHEMA = `{
  "id": "__AUTO__",
  "type": "location",
  "name": "...",
  "slug": "...",
  "spaceType": "exterior",
  "description": "...",
  ${DNA_SCHEMA}
}`;

/**
 * Host-specific rules
 */
export const HOST_RULES = `HOST RULES:
- name: Use EXACT name for real places. Do NOT embellish.
- genre: For real places use neutral genres (Urban, Rural, Coastal). Only stylized genres if user specifies.
- description: For real places, describe as they exist TODAY unless user specifies otherwise.
- weather: Current conditions (e.g., "overcast with light drizzle", "clear and sunny")
- timeOfDay: One of: pre_dawn, dawn, morning, midday, afternoon, golden_hour, sunset, dusk, night, midnight`;

/**
 * Region-specific rules
 */
export const REGION_RULES = `REGION RULES:
- ${DNA_DELTA_RULES}
- Preserve proper nouns from concept.
- slug = kebab-case`;

/**
 * Location-specific rules
 */
export const LOCATION_RULES = `LOCATION RULES:
- ${DNA_DELTA_RULES}
- spaceType: Default "exterior". Use "interior" only for enclosed environments.
- Preserve proper nouns from concept.
- slug = kebab-case`;

/**
 * Atmosphere extraction guidance for categorization
 */
export const ATMOSPHERE_EXTRACTION = `Extract ALL mood/style/feeling adjectives from the description:
whimsical, fantastical, ethereal, surreal, otherworldly, serene, cozy, mysterious, dreamlike, 
magical, futuristic, ancient, alien, organic, mechanical, elegant, gothic, romantic, dystopian, 
utopian, haunting, vibrant, melancholic, playful, majestic, etc.`;

/**
 * Visual constraints enforcement for host DNA
 */
export const VISUAL_CONSTRAINTS_RULES = `MANDATORY DNA REQUIREMENTS when visual constraints provided:
1. dna.colorAndLight MUST include ALL colors from constraints
2. dna.atmosphere MUST include ALL atmosphere values from constraints
3. dna.essence MUST include key style/mood terms from atmosphere (e.g., "whimsical design")`;
