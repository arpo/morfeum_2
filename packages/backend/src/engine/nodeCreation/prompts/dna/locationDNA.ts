/**
 * Location DNA Generation Prompt
 * 
 * Generates DNA for location nodes (buildings, sites, specific places).
 * Location nodes inherit from region and define site-specific attributes.
 */

import type { ParentDNAContext } from '../../types';

/**
 * Generate DNA prompt for a location node
 * 
 * @param description - User description of the location
 * @param parentContext - DNA context inherited from parent region
 * @returns Prompt string for LLM
 */
export function locationDNAPrompt(description: string, parentContext?: ParentDNAContext): string {
  const contextSection = parentContext ? `
PARENT REGION/HOST CONTEXT (inherit and respect these attributes):
- Genre: ${parentContext.genre || 'Not specified'} (NEVER override genre)
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Dominant Color: ${parentContext.dominant || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}
- Materials Base: ${parentContext.materials_base || 'Not specified'}
- Palette Bias: ${parentContext.palette_bias || 'Not specified'}
` : '';

  return `You are creating the DNA for a LOCATION node - a specific building or site within a region.

LOCATION ROLE:
- A specific place (e.g., "The Anchor Pub" in "Camden", "Central Tower" in "Industrial District")
- Inherits style from parent region/host
- Defines the exterior appearance of a building/site
- NavigableElements are CRITICAL here - doors, passages, stairs that lead inside
- Children (niches) represent spaces within this location

USER DESCRIPTION:
${description}
${contextSection}

OUTPUT JSON:
{
  "name": "Evocative, memorable name for this location",
  "description": "2-3 sentence description of this building/site",
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window|balcony|gate", "position": "location in scene (left, center, right, foreground, background)", "description": "brief description of what it is and where it leads"}
  ],
  "dominantElements": ["3-5 major visual features of this location's exterior"],
  "uniqueIdentifiers": ["3-5 distinctive features that make this building recognizable"],
  "searchDesc": "75-100 char search description with type and key features",
  "slug": "kebab-case-name",
  "dna": {
    "looks": "2-4 sentences describing the building's exterior appearance, architecture, scale",
    "colorsAndLighting": "1-3 sentences on the building's colors and how light interacts with it",
    "atmosphere": "2-4 sentences on the immediate surroundings, weather, environmental context",
    "materials": "1-3 sentences on construction materials visible on the exterior",
    "mood": "1-2 sentences on the emotional tone this building evokes",
    "sounds": "5-7 words listing sounds near this location",
    "spatialLayout": "1-3 sentences on the building's form, entrances, orientation",
    "primary_surfaces": "Main exterior materials (facade, roof)",
    "secondary_surfaces": "Supporting materials (trim, windows)",
    "accent_features": "Decorative exterior details (signs, ornaments)",
    "dominant": "Primary color of the building",
    "secondary": "Secondary colors",
    "accent": "Accent colors (lights, signs)",
    "ambient": "Light tone at this location",
    
    "genre": null,
    "architectural_tone": "Building-specific architectural style, or null to inherit",
    "cultural_tone": "Building's cultural identity/purpose, or null to inherit",
    "materials_base": "Building's material aesthetic, or null to inherit",
    "mood_baseline": "Building's emotional character, or null to inherit",
    "palette_bias": "Building's color scheme, or null to inherit",
    "soundscape_base": "Sounds typical near this building, or null to inherit",
    "flora_base": "Vegetation around/on the building, or null to inherit",
    "fauna_base": "Wildlife near this building, or null to inherit"
  }
}

CRITICAL GUIDELINES:

1. **GENRE is ALWAYS null**: Location NEVER sets genre - it inherits from ancestors.

2. **NavigableElements are ESSENTIAL**: These define how users can explore further:
   - List ALL visible entrances, passages, stairs, windows, etc.
   - Specify POSITION (left, center, right, foreground, midground, background)
   - Describe where each element leads or what it reveals
   
3. **Exterior Focus**: Location DNA describes the OUTSIDE of a building. Interiors are handled by niche nodes.

4. **Sparse Cascading Fields**: Only override if this building is distinctly different from the regional style.

5. **Memorable Names**: Give locations evocative names, not generic ones:
   - ❌ "The Pub"
   - ✅ "The Rustic Anchor"

Return ONLY valid JSON, no markdown or explanations.`;
}
