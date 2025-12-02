/**
 * Host DNA Generation Prompt
 * 
 * Generates DNA for host nodes (worlds, settings, top-level places).
 * Host nodes define the genre and foundational style attributes.
 */

import type { ParentDNAContext } from '../../types';

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
    "looks": "2-4 sentences describing the overall visual character - architecture, scale, key visual motifs",
    "colorsAndLighting": "1-3 sentences on the dominant color palette and typical lighting conditions",
    "atmosphere": "2-4 sentences on climate, weather patterns, air quality, general environmental feel",
    "materials": "1-3 sentences on the predominant materials used in construction and nature",
    "mood": "1-2 sentences on the emotional tone this world evokes",
    "sounds": "5-7 words listing typical ambient sounds",
    "spatialLayout": "1-3 sentences on how this world is organized spatially",
    "primary_surfaces": "Main construction/natural materials",
    "secondary_surfaces": "Supporting materials",
    "accent_features": "Decorative or striking details typical of this world",
    "dominant": "Primary color family",
    "secondary": "Secondary colors",
    "accent": "Accent colors",
    "ambient": "Typical light tone (warm/cool/neutral)",
    
    "genre": "REQUIRED: The genre/setting type (fantasy, sci-fi, post-apocalyptic, historical, modern, steampunk, etc.)",
    "architectural_tone": "REQUIRED: Detailed architectural style description (e.g., 'neo-gothic industrial with brass fixtures and arched windows')",
    "cultural_tone": "REQUIRED: Social/cultural identity of this world",
    "materials_base": "REQUIRED: Material palette that defines this world's aesthetic",
    "mood_baseline": "REQUIRED: Emotional baseline that permeates this world",
    "palette_bias": "REQUIRED: Color style/families that characterize this world",
    "soundscape_base": "REQUIRED: Ambient sound character of this world",
    "flora_base": "Plant life types typical of this world, or 'None' if barren",
    "fauna_base": "Animal life types typical of this world, or 'None' if lifeless"
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
