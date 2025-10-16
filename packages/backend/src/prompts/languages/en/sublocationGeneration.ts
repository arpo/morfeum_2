/**
 * Sublocation DNA Generator
 * Generates sublocation DNA using cascaded visual context from parent hierarchy
 * Can generate both interior and exterior sublocations based on scale_hint
 */

export const generateSublocationDNA = (
  sublocationName: string,
  cascadedContext: any,
  scaleHint: 'macro' | 'area' | 'site' | 'interior' | 'detail' = 'interior'
) => {
  const isExterior = scaleHint === 'site' || scaleHint === 'area' || scaleHint === 'macro';
  const perspectiveType = isExterior ? 'exterior' : 'interior';
  const terrainLabel = isExterior ? 'terrain_type' : 'terrain_or_interior';
  const terrainExample = isExterior ? 'plaza/courtyard/pier/open area' : 'room/hall/stairwell/chamber';
  const environmentType = isExterior ? 'outdoor type' : 'interior type';
  const searchPrefix = isExterior ? '[Sublocation - Exterior]' : '[Sublocation - Interior]';
  
  return `
Generate a ${perspectiveType} sublocation: "${sublocationName}"

INHERITED VISUAL CONTEXT (cascaded from world → region → location):

Genre: ${cascadedContext.genre}
Architectural Tone: ${cascadedContext.architectural_tone}
Mood: ${cascadedContext.mood}
Atmosphere: ${cascadedContext.atmosphere}
Materials: ${cascadedContext.materials}
Palette: ${cascadedContext.palette.join(', ')}
Lighting: ${cascadedContext.lighting}
Architecture Style: ${cascadedContext.architecture || 'not specified'}
Weather/Air: ${cascadedContext.weather}
Soundscape: ${cascadedContext.soundscape.join(', ')}
Colors & Lighting: ${cascadedContext.colorsAndLighting}

Parent Location: ${cascadedContext.parentLocationName}
Parent Structures: ${JSON.stringify(cascadedContext.structures)}

TASK: Generate detailed sublocation DNA maintaining consistency with inherited context.

OUTPUT: JSON matching this exact structure:
{
  "meta": {
    "name": "${sublocationName}"
  },
  "semantic": {
    "environment": "${environmentType}",
    "${terrainLabel}": "${terrainExample}",
    "structures": [
      {
        "type": "fixture/furniture/architectural element",
        "material": "string",
        "color": "string",
        "condition": "string"
      }
    ],
    "vegetation": {
      "types": ["if any"],
      "density": "none|sparse|incidental"
    },
    "fauna": {
      "types": [],
      "presence": "none|rare|ambient"
    },
    "lighting": "${isExterior ? 'outdoor lighting (natural/artificial)' : 'interior lighting description'}",
    "weather_or_air": "${isExterior ? 'weather conditions/wind' : 'indoor air quality/particles'}",
    "atmosphere": "${isExterior ? 'open/exposed/sheltered/etc' : 'claustrophobic/airy/echoing/etc'}",
    "mood": "emotional tone inheriting from parent",
    "color_palette": ["dominant", "accent", "contrast"],
    "soundscape": ["${isExterior ? 'outdoor ambient sounds' : 'interior sounds'}"]
  },
  "spatial": {
    "scale": {
      "ceiling_height_m": number or null,
      "room_length_m": number or null,
      "room_width_m": number or null
    },
    "placement": {
      "key_subject_position": "describe focal point position",
      "camera_anchor": "entry threshold/center/etc"
    },
    "orientation": {
      "dominant_view_axis": "axial/spiral/circular/etc"
    },
    "connectivity": {
      "links_to": ["return to parent location", "other connected spaces"]
    }
  },
  "profile": {
    "looks": "3-5 sentences describing visual appearance",
    "colorsAndLighting": "1-2 sentences inheriting parent palette",
    "atmosphere": "2-3 sentences about spatial feel",
    "materials": "1-2 sentences consistent with parent materials",
    "mood": "1-2 sentences",
    "sounds": "3-7 words",
    "symbolicThemes": "short phrase",
    "airParticles": "1 sentence or None",
    "fictional": true,
    "copyright": false,
    "visualAnchors": {
      "dominantElements": [
        "3-5 key elements with size/position"
      ],
      "spatialLayout": "2-4 sentences describing room shape, dimensions, entry points, focal centers",
      "surfaceMaterialMap": {
        "primary_surfaces": "materials with location (walls, floor, ceiling)",
        "secondary_surfaces": "supporting materials",
        "accent_features": "decorative details"
      },
      "colorMapping": {
        "dominant": "primary color + coverage area",
        "secondary": "secondary color + location",
        "accent": "accent colors + placement",
        "ambient": "overall light tone"
      },
      "uniqueIdentifiers": [
        "2-4 distinctive visual fingerprints that make this space memorable"
      ]
    },
    "searchDesc": "${searchPrefix} concise 75-100 char description of what this ${perspectiveType} space contains"
  }
}

CRITICAL RULES:
- Maintain visual consistency with inherited context (genre, mood, materials, palette)
- ${isExterior ? 'Exterior space must feel like it belongs adjacent to/within parent location' : 'Interior space must feel like it belongs inside parent location'}
- Use inherited color palette as base, ${isExterior ? 'adapt for outdoor lighting' : 'refine for interior'}
- Lighting should be ${isExterior ? 'natural outdoor lighting influenced by parent atmosphere' : 'interior version of parent lighting'}
- Soundscape should be ${isExterior ? 'outdoor ambient sounds influenced by location' : 'interior interpretation (muffled exterior sounds + interior sounds)'}
- searchDesc MUST start with "${searchPrefix}" prefix
- ${isExterior ? 'For exterior spaces: describe open-air environments, outdoor structures, exterior views' : 'For interior spaces: describe enclosed rooms, indoor fixtures, contained atmospheres'}
- JSON only, no markdown
- Be specific and detailed in visualAnchors

Generate the JSON now:
`;
};
