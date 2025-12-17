/**
 * Host DNA Generation Prompt
 * 
 * Generates DNA for host nodes (worlds, settings, top-level places).
 * Host nodes define the genre and foundational style attributes.
 */

import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../../../generation/prompts/shared/dnaSchema';

/**
 * Generate DNA prompt for a host node
 * 
 * @param description - User description of the host
 * @returns Prompt string for LLM
 */
export function hostDNAPrompt(description: string): string {
  return `You are creating the DNA for a HOST node - the top level of a world hierarchy.

HOST ROLE:
- Defines the world/setting (e.g., "London", "Cyberpunk Metropolis", "Fantasy Kingdom")
- Sets the GENRE which all children inherit
- Establishes foundational style attributes (architectural tone, cultural tone, etc.)
- Children (regions, locations, niches) will inherit and build upon this DNA

USER DESCRIPTION:
${description}

OUTPUT JSON:
{
  "name": "The EXACT place name if a real location is mentioned (e.g., 'London' stays 'London', 'Paris' stays 'Paris'). Only create evocative names for fictional/fantasy places.",
  "description": "2-3 sentence description of this place as a whole",
  "navigableElements": [],
  "dominantElements": ["3-5 major landmarks or features that define this world"],
  "uniqueIdentifiers": ["3-5 distinctive features that make this setting recognizable"],
  "searchDesc": "75-100 char search description",
  "slug": "kebab-case-name",
  "dna": {
    "looks": "${DNA_SCENE_FIELDS.looks}",
    "colorsAndLighting": "${DNA_SCENE_FIELDS.colorsAndLighting}",
    "atmosphere": "${DNA_SCENE_FIELDS.atmosphere}",
    "materials": "${DNA_SCENE_FIELDS.materials}",
    "mood": "${DNA_SCENE_FIELDS.mood}",
    "sounds": "${DNA_SCENE_FIELDS.sounds}",
    "spatialLayout": "${DNA_SCENE_FIELDS.spatialLayout}",
    "primary_surfaces": "${DNA_SCENE_FIELDS.primary_surfaces}",
    "secondary_surfaces": "${DNA_SCENE_FIELDS.secondary_surfaces}",
    "accent_features": "${DNA_SCENE_FIELDS.accent_features}",
    "dominant": "${DNA_SCENE_FIELDS.dominant}",
    "secondary": "${DNA_SCENE_FIELDS.secondary}",
    "accent": "${DNA_SCENE_FIELDS.accent}",
    "ambient": "${DNA_SCENE_FIELDS.ambient}",
    
    "genre": "REQUIRED: ${DNA_CASCADING_FIELDS.genre}",
    "architectural_tone": "REQUIRED: ${DNA_CASCADING_FIELDS.architectural_tone}",
    "cultural_tone": "REQUIRED: ${DNA_CASCADING_FIELDS.cultural_tone}",
    "palette_bias": "REQUIRED: ${DNA_CASCADING_FIELDS.palette_bias}",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base}",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base}"
  }
}

CRITICAL GUIDELINES:

1. **GENRE is REQUIRED**: Host is the ONLY node that sets genre. All children inherit it.

2. **All cascading fields are REQUIRED**: Unlike child nodes, host must define ALL style attributes.

3. **Be Foundational**: These attributes will cascade to all children. Make them broad enough to allow variety but specific enough to maintain consistency.

4. **Architectural Tone Detail**: Be very specific about architectural style. Include:
   - Era/period influence
   - Material preferences
   - Structural characteristics
   - Decorative elements

5. **Think Scale**: Host represents the largest scope. Describe what unifies the entire world.

Return ONLY valid JSON, no markdown or explanations.`;
}
