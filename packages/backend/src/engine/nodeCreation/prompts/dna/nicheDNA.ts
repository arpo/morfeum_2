/**
 * Niche DNA Generation Prompt
 * 
 * Generates DNA for niche nodes (spaces within locations - rooms, areas, etc.).
 * Niche nodes can be interior or exterior and represent the deepest navigable level.
 * 
 * Now supports containerType for vehicle/boat/tent-specific DNA guidance.
 */

import { DNA_SCENE_FIELDS } from '../../../generation/prompts/shared/dnaSchema';
import { 
  DOMINANT_ELEMENTS_FORMAT,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE 
} from '../../../generation/prompts/shared/elementRules';
import { 
  getDNAGuidance,
  type ContainerType,
  type SpacePerspective 
} from '../../../generation/shared/spaceTypeRegistry';
import type { ParentDNAContext, ScenePerspective } from '../../types';

/**
 * Generate DNA prompt for a niche node
 * 
 * @param description - User description of the niche
 * @param perspective - Interior, exterior, or open-air
 * @param parentContext - DNA context inherited from parent location
 * @param containerType - Type of container (building, vehicle-car, vehicle-boat, etc.)
 * @returns Prompt string for LLM
 */
export function nicheDNAPrompt(
  description: string, 
  perspective: ScenePerspective = 'interior',
  parentContext?: ParentDNAContext,
  containerType: ContainerType = 'building'
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

  // Get perspective guidance from registry (handles vehicles, boats, tents, etc.)
  // For non-building container types, use the registry's specialized guidance
  const registryGuidance = getDNAGuidance(containerType, perspective as SpacePerspective);
  
  // Use registry guidance if available, otherwise fall back to standard building guidance
  const perspectiveGuidance = containerType !== 'building' 
    ? registryGuidance
    : perspective === 'interior' 
    ? `
PERSPECTIVE: INTERIOR
- This is an enclosed indoor space (room, hall, chamber, cave, etc.)
- Focus on walls, floor, ceiling, furniture, lighting fixtures
- Describe the enclosed feeling, how light enters
- NavigableElements: doors leading to other rooms, stairs, windows with views`
    : perspective === 'open-air'
    ? `
PERSPECTIVE: OPEN-AIR
- This is a semi-enclosed space with open sky (balcony, terrace, rooftop, covered patio, pergola)
- Has partial walls/railings but NO ceiling - sky is directly visible above
- Focus on the view, railing/edge details, relationship to building AND sky/weather
- Describe the blend of shelter and exposure - protected from some elements but open to sky
- NavigableElements: doors back inside, stairs to other levels, overlook points`
    : `
PERSPECTIVE: EXTERIOR
- This is a fully open outdoor space (park path, plaza, garden, forest clearing, sculpture area)
- NO walls, NO ceiling - completely open to the environment
- Focus on natural features, pathways, zones, landmarks, sky/weather
- Describe spatial flow, vegetation, terrain, points of interest
- NavigableElements: paths to other areas, entrances to structures, viewpoints, gathering spots`;

  return `You are creating the DNA for a NICHE node - a specific space within or attached to a location.

NICHE ROLE:
- The deepest level of the hierarchy (e.g., "Main Bar Room" in "The Anchor Pub")
- Can be INTERIOR (room, chamber, hall), EXTERIOR (park, plaza, clearing), or OPEN-AIR (balcony, terrace, rooftop)
- This is where the user IS - the most detailed, immersive description
- Inherits style from parent location but describes the specific space
${perspectiveGuidance}

USER DESCRIPTION:
${description}
${contextSection}

${NAVIGABLE_ELEMENTS_RULES}

DOMINANT ELEMENTS (for niches):
- Major objects/features visible in this space (NOT enterable structures)
- List ${DOMINANT_ELEMENTS_FORMAT.niche}
- Focus on furniture, fixtures, decorations, natural features

OUTPUT JSON:
{
  "name": "Evocative name for this specific space",
  "description": "2-3 sentence immersive description of this space",
  "navigableElements": [${NAVIGABLE_ELEMENTS_EXAMPLE}],
  "dominantElements": [${DOMINANT_ELEMENTS_FORMAT.niche}],
  "uniqueIdentifiers": ["3-5 distinctive features that make this space memorable"],
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

5. **Perspective Matters**: Each perspective type feels different:
   - Interior: enclosed, intimate, focused inward, climate-controlled
   - Open-air: semi-enclosed, dramatic views, partial weather exposure, blend of shelter and openness
   - Exterior: fully open, connected to environment, weather-affected, spatial flow

Return ONLY valid JSON, no markdown or explanations.`;
}
