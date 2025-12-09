/**
 * Location DNA Generation Prompt
 * 
 * Generates DNA for location nodes (buildings, sites, specific places).
 * Location nodes inherit from region and define site-specific attributes.
 */

import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../../../generation/prompts/shared/dnaSchema';
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
  "name": "If a REAL landmark is mentioned (e.g., 'Big Ben', 'The British Museum'), use the EXACT name. For generic descriptions (e.g., 'a pub', 'a shop'), create an evocative, memorable name.",
  "description": "2-3 sentence description of this building/site",
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window|balcony|gate", "position": "location in scene (left, center, right, foreground, background)", "description": "brief description of what it is and where it leads"}
  ],
  "dominantElements": ["3-5 major visual features of this location's exterior"],
  "uniqueIdentifiers": ["3-5 distinctive features that make this building recognizable"],
  "searchDesc": "75-100 char search description with type and key features",
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
    
    "genre": null,
    "architectural_tone": "${DNA_CASCADING_FIELDS.architectural_tone} OR null to inherit",
    "cultural_tone": "${DNA_CASCADING_FIELDS.cultural_tone} OR null to inherit",
    "materials_base": "${DNA_CASCADING_FIELDS.materials_base} OR null to inherit",
    "mood_baseline": "${DNA_CASCADING_FIELDS.mood_baseline} OR null to inherit",
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias} OR null to inherit",
    "soundscape_base": "${DNA_CASCADING_FIELDS.soundscape_base} OR null to inherit",
    "flora_base": "${DNA_CASCADING_FIELDS.flora_base} OR null to inherit",
    "fauna_base": "${DNA_CASCADING_FIELDS.fauna_base} OR null to inherit"
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
