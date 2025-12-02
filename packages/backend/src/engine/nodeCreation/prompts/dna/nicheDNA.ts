/**
 * Niche DNA Generation Prompt
 * 
 * Generates DNA for niche nodes (spaces within locations - rooms, areas, etc.).
 * Niche nodes can be interior or exterior and represent the deepest navigable level.
 */

import type { ParentDNAContext, ScenePerspective } from '../../types';

/**
 * Generate DNA prompt for a niche node
 * 
 * @param description - User description of the niche
 * @param perspective - Interior or exterior
 * @param parentContext - DNA context inherited from parent location
 * @returns Prompt string for LLM
 */
export function nicheDNAPrompt(
  description: string, 
  perspective: ScenePerspective = 'interior',
  parentContext?: ParentDNAContext
): string {
  const contextSection = parentContext ? `
PARENT LOCATION CONTEXT (inherit and respect these attributes):
- Genre: ${parentContext.genre || 'Not specified'} (NEVER override genre)
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Dominant Color: ${parentContext.dominant || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}
- Materials Base: ${parentContext.materials_base || 'Not specified'}
- Palette Bias: ${parentContext.palette_bias || 'Not specified'}
` : '';

  const perspectiveGuidance = perspective === 'interior' 
    ? `
PERSPECTIVE: INTERIOR
- This is an indoor space (room, hall, chamber, etc.)
- Focus on walls, floor, ceiling, furniture, lighting fixtures
- Describe the enclosed feeling, how light enters
- NavigableElements: doors leading to other rooms, stairs, windows with views`
    : `
PERSPECTIVE: EXTERIOR
- This is an outdoor space attached to the location (balcony, terrace, garden, rooftop)
- Focus on the view, surrounding elements, relationship to the building
- Describe open-air feeling, weather, sky visibility
- NavigableElements: doors back inside, paths, stairs, other access points`;

  return `You are creating the DNA for a NICHE node - a specific space within or attached to a location.

NICHE ROLE:
- The deepest level of the hierarchy (e.g., "Main Bar Room" in "The Anchor Pub")
- Can be INTERIOR (room, chamber, hall) or EXTERIOR (balcony, terrace, rooftop)
- This is where the user IS - the most detailed, immersive description
- Inherits style from parent location but describes the specific space
${perspectiveGuidance}

USER DESCRIPTION:
${description}
${contextSection}

OUTPUT JSON:
{
  "name": "Evocative name for this specific space",
  "description": "2-3 sentence immersive description of this space",
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window|balcony|bridge", "position": "specific position in this space", "description": "where it leads and what's visible through it"}
  ],
  "dominantElements": ["3-5 major objects/features in this space"],
  "uniqueIdentifiers": ["3-5 distinctive features that make this space memorable"],
  "searchDesc": "75-100 char search description",
  "slug": "kebab-case-name",
  "dna": {
    "looks": "2-4 sentences describing what you SEE in this space - layout, objects, focal points",
    "colorsAndLighting": "1-3 sentences on lighting sources, light quality, color of surfaces",
    "atmosphere": "2-4 sentences on air quality, temperature, scent, the feel of being in this space",
    "materials": "1-3 sentences on materials you can touch - floors, walls, furniture, objects",
    "mood": "1-2 sentences on the emotional feeling of being here",
    "sounds": "5-7 words listing sounds you'd hear in this space",
    "spatialLayout": "1-3 sentences on the shape of the space, where things are positioned",
    "primary_surfaces": "Main materials (floor, walls, ceiling)",
    "secondary_surfaces": "Supporting materials (furniture, fixtures)",
    "accent_features": "Decorative details and objects",
    "dominant": "Primary color in this space",
    "secondary": "Secondary colors",
    "accent": "Accent colors (lights, objects, art)",
    "ambient": "Light quality in this space",
    
    "genre": null,
    "architectural_tone": null,
    "cultural_tone": null,
    "materials_base": null,
    "mood_baseline": null,
    "palette_bias": null,
    "soundscape_base": null,
    "flora_base": null,
    "fauna_base": null
  }
}

CRITICAL GUIDELINES:

1. **GENRE is ALWAYS null**: Niche NEVER sets genre - it inherits from ancestors.

2. **ALL CASCADING FIELDS are null**: Niche is the deepest level - it only describes THIS space.
   It fully inherits parent style attributes.

3. **IMMERSIVE DETAIL**: Since this is where the user "is", be highly specific:
   - Name actual objects (not just "furniture" but "worn leather armchair")
   - Describe positions ("by the window", "centered on the far wall")
   - Include sensory details (sounds, temperature, smell)

4. **NavigableElements for Expansion**: These enable future exploration:
   - What doors/passages lead elsewhere?
   - What can be seen through windows?
   - What stairs or passages connect to other spaces?

5. **Perspective Matters**: Interior and exterior niches feel different:
   - Interior: enclosed, intimate, focused inward
   - Exterior: open, connected to environment, weather-affected

Return ONLY valid JSON, no markdown or explanations.`;
}
