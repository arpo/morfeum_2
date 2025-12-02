/**
 * Region DNA Generation Prompt
 * 
 * Generates DNA for region nodes (districts, biomes, areas within a host).
 * Region nodes inherit from host and can override climate/biome aspects.
 */

import type { ParentDNAContext } from '../../types';

/**
 * Generate DNA prompt for a region node
 * 
 * @param description - User description of the region
 * @param parentContext - DNA context inherited from parent host
 * @returns Prompt string for LLM
 */
export function regionDNAPrompt(description: string, parentContext?: ParentDNAContext): string {
  const contextSection = parentContext ? `
PARENT HOST CONTEXT (inherit and respect these attributes):
- Genre: ${parentContext.genre || 'Not specified'} (NEVER override genre)
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Dominant Color: ${parentContext.dominant || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}
- Materials Base: ${parentContext.materials_base || 'Not specified'}
- Palette Bias: ${parentContext.palette_bias || 'Not specified'}
` : '';

  return `You are creating the DNA for a REGION node - a district or biome within a larger world.

REGION ROLE:
- A subdivision of a host (e.g., "Camden" within "London", "Industrial District" within "Cyberpunk City")
- Inherits genre and foundational style from parent host
- Can have distinct climate, local culture, or architectural variations
- Children (locations, niches) will inherit and build upon this DNA

USER DESCRIPTION:
${description}
${contextSection}

OUTPUT JSON:
{
  "name": "Evocative name for this district/biome",
  "description": "2-3 sentence description of this area",
  "navigableElements": [],
  "dominantElements": ["3-5 notable features or landmarks in this region"],
  "uniqueIdentifiers": ["3-5 features that distinguish this region from others"],
  "searchDesc": "75-100 char search description",
  "slug": "kebab-case-name",
  "dna": {
    "looks": "2-4 sentences describing the visual character of this district/biome",
    "colorsAndLighting": "1-3 sentences on local color palette and lighting",
    "atmosphere": "2-4 sentences on local climate, air quality, environmental feel",
    "materials": "1-3 sentences on materials common in this area",
    "mood": "1-2 sentences on the emotional tone of this district",
    "sounds": "5-7 words listing ambient sounds specific to this area",
    "spatialLayout": "1-3 sentences on how this region is organized",
    "primary_surfaces": "Main materials in this region",
    "secondary_surfaces": "Supporting materials",
    "accent_features": "Decorative details typical of this region",
    "dominant": "Primary color family",
    "secondary": "Secondary colors",
    "accent": "Accent colors",
    "ambient": "Typical light tone",
    
    "genre": null,
    "architectural_tone": "Local architectural style variations, or null to inherit",
    "cultural_tone": "Local cultural identity, or null to inherit",
    "materials_base": "Regional material preferences, or null to inherit",
    "mood_baseline": "Regional emotional character, or null to inherit",
    "palette_bias": "Regional color preferences, or null to inherit",
    "soundscape_base": "Regional sound character, or null to inherit",
    "flora_base": "Local vegetation, or null to inherit",
    "fauna_base": "Local wildlife, or null to inherit"
  }
}

CRITICAL GUIDELINES:

1. **GENRE is ALWAYS null**: Region NEVER sets genre - it inherits from host.

2. **Sparse Cascading Fields**: Only set cascading fields if this region is DISTINCTLY different from parent.
   - Same as parent? Set to null (it will inherit)
   - Different? Provide specific value

3. **Maintain Consistency**: Even when overriding, stay within the world's genre and overall style.

4. **Regional Character**: Focus on what makes THIS district unique:
   - Local architecture variations
   - Climate/weather differences
   - Cultural/economic character
   - Distinctive landmarks

Return ONLY valid JSON, no markdown or explanations.`;
}
