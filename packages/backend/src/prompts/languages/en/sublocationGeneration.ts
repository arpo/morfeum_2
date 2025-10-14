/**
 * Sublocation DNA Generator
 * Generates interior sublocation DNA using cascaded visual context from parent hierarchy
 */

export const generateSublocationDNA = (
  sublocationName: string,
  cascadedContext: any
) => `
Generate an interior sublocation: "${sublocationName}"

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
    "environment": "interior type",
    "terrain_or_interior": "room/hall/stairwell/chamber",
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
    "lighting": "interior lighting description",
    "weather_or_air": "indoor air quality/particles",
    "atmosphere": "claustrophobic/airy/echoing/etc",
    "mood": "emotional tone inheriting from parent",
    "color_palette": ["dominant", "accent", "contrast"],
    "soundscape": ["interior sounds"]
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
    "viewContext": {
      "perspective": "interior",
      "focusTarget": "main subject being viewed",
      "distance": "close|medium|far",
      "composition": "viewer position and facing direction"
    },
    "searchDesc": "[Sublocation - Interior] concise 75-100 char description of what this interior space contains"
  }
}

CRITICAL RULES:
- Maintain visual consistency with inherited context (genre, mood, materials, palette)
- Interior space must feel like it belongs inside parent location
- Use inherited color palette as base, refine for interior
- Lighting should be interior version of parent lighting
- Soundscape should be interior interpretation (muffled exterior sounds + interior sounds)
- searchDesc MUST start with "[Sublocation - Interior]" prefix
- JSON only, no markdown
- Be specific and detailed in visualAnchors

Generate the JSON now:
`;
