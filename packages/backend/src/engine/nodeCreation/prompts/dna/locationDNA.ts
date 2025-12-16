/**
 * Location DNA Generation Prompt
 * 
 * Generates DNA for location nodes (buildings, sites, points of interest, OR outdoor areas).
 * Location nodes inherit from region/host and focus on architectural details or natural features.
 */

import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS } from '../../../generation/prompts/shared/dnaSchema';
import type { ParentDNAContext, ScenePerspective } from '../../types';

/**
 * Detect if description suggests an outdoor/natural area rather than a building
 */
function isOutdoorArea(description: string): boolean {
  const lowerDesc = description.toLowerCase();
  const outdoorKeywords = [
    'forest', 'woods', 'grove', 'clearing', 'trail', 'path',
    'park', 'garden', 'meadow', 'field', 'plains',
    'beach', 'shore', 'coast', 'bay', 'cove',
    'mountain', 'hill', 'cliff', 'canyon', 'valley',
    'lake', 'river', 'stream', 'waterfall', 'pond',
    'desert', 'dunes', 'oasis',
    'swamp', 'marsh', 'wetland', 'bog',
    'plaza', 'square', 'courtyard', 'marketplace',
    'ruins', 'cemetery', 'graveyard',
    'jungle', 'rainforest', 'savanna', 'tundra'
  ];
  return outdoorKeywords.some(keyword => lowerDesc.includes(keyword));
}

/**
 * Generate DNA prompt for a location node
 * 
 * @param description - User description of the location
 * @param parentContext - FULL DNA context inherited from parent region
 * @param perspective - Scene perspective (exterior, interior, open-air)
 * @returns Prompt string for LLM
 */
export function locationDNAPrompt(description: string, parentContext?: ParentDNAContext, perspective?: ScenePerspective): string {
  const isOutdoor = isOutdoorArea(description);
  const isExteriorPerspective = perspective === 'exterior' || perspective === 'open-air';
  // Build rich parent context with name, description, and full DNA
  const contextSection = parentContext ? `
PARENT REGION: ${parentContext.name || 'Unknown'} (${parentContext.type || 'region'})
${parentContext.description ? `PARENT DESCRIPTION: ${parentContext.description}` : ''}

PARENT VISUAL DNA (inherit and respect these attributes):
- Looks: ${parentContext.looks || 'Not specified'}
- Colors & Lighting: ${parentContext.colorsAndLighting || 'Not specified'}
- Atmosphere: ${parentContext.atmosphere || 'Not specified'}
- Materials: ${parentContext.materials || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}
- Sounds: ${parentContext.sounds || 'Not specified'}

PARENT STYLE DNA:
- Genre: ${parentContext.genre || 'Not specified'} (NEVER override genre)
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Dominant Color: ${parentContext.dominant || 'Not specified'}
- Palette Bias: ${parentContext.palette_bias || 'Not specified'}
- Materials Base: ${parentContext.materials_base || 'Not specified'}

PARENT STRUCTURE:
- Dominant Elements: ${parentContext.dominantElements?.join(', ') || 'Not specified'}
- Unique Identifiers: ${parentContext.uniqueIdentifiers?.join(', ') || 'Not specified'}
` : '';

  // Determine if this should be treated as an outdoor location
  const treatAsOutdoor = isOutdoor && isExteriorPerspective;
  
  // Different role description based on location type
  const roleSection = treatAsOutdoor ? `You are creating the DNA for an OUTDOOR LOCATION node - a natural area, park, plaza, or outdoor point of interest.

OUTDOOR LOCATION ROLE:
- A specific outdoor area (e.g., "Black Forest Clearing", "Central Park", "Harbor Plaza", "Misty Falls")
- Inherits style from parent region/host
- Describes the outdoor environment itself - NOT a building within it
- NavigableElements are paths, trails, clearings, or structures WITHIN the area
- Children (niches) represent specific spots or structures within this outdoor location

IMPORTANT: Create the outdoor area ITSELF, not a building inside it.
- "black forest" → Create a forest clearing/area named something like "The Whispering Pines" or "Blackwood Grove"
- "beach" → Create a beach area named something like "Moonlit Shore" or "Driftwood Cove"
- "park" → Create the park itself, not a building in the park` 
  : `You are creating the DNA for a LOCATION node - a specific building or site within a region.

LOCATION ROLE:
- A specific place (e.g., "The Anchor Pub" in "Camden", "Central Tower" in "Industrial District")
- Inherits style from parent region/host
- Defines the exterior appearance of a building/site
- NavigableElements are CRITICAL here - doors, passages, stairs that lead inside
- Children (niches) represent spaces within this location`;

  // Different navigable elements guidance
  const navigableGuidance = treatAsOutdoor 
    ? `"navigableElements": [
    {"type": "path|trail|clearing|bridge|cave|structure|ruins|shore", "position": "location in scene (left, center, right, foreground, background)", "description": "brief description of what it is and where it leads"}
  ],
  NOTE: NavigableElements for outdoor areas are paths, trails, clearings, caves, or small structures.`
    : `"navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window|balcony|gate", "position": "location in scene (left, center, right, foreground, background)", "description": "brief description of what it is and where it leads"}
  ],
  NOTE: FIRST navigableElement should be the MAIN ENTRANCE used for GO_INSIDE command.`;

  // Different dominant elements guidance  
  const dominantGuidance = treatAsOutdoor
    ? `"dominantElements": ["Major natural features like ancient trees, rock formations, water features, clearings"]`
    : `"dominantElements": ["FIRST: main enterable building/structure if any, then 3-4 other major features"]`;

  return `${roleSection}

USER DESCRIPTION:
${description}
${contextSection}

OUTPUT JSON:
{
  "name": "If a REAL landmark is mentioned (e.g., 'Big Ben', 'Central Park'), use the EXACT name. For generic descriptions, create an evocative, memorable name that matches the type (forest, beach, park, building, etc.).",
  "description": "2-3 sentence description of this ${treatAsOutdoor ? 'outdoor area' : 'building/site'}",
  ${navigableGuidance}
  ${dominantGuidance},
  "uniqueIdentifiers": ["3-5 distinctive features that make this ${treatAsOutdoor ? 'area' : 'building'} recognizable"],
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
    "palette_bias": "${DNA_CASCADING_FIELDS.palette_bias} OR null to inherit",
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
