/**
 * Morfeum — World DNA Generator
 * Inputs: originalPrompt, seedJson, visionJson
 * Output: JSON with world + optional region/location/sublocation
 * 
 * Rules:
 * - WORLD NODE IS MANDATORY - ALWAYS CREATE IT
 * - NO render/time_of_day/suggestedDestinations (handled separately)
 * - Sound LOCAL only (location/sublocation)
 * - Follow seed classification strictly
 */

export const generateNewWorldDNA = (
  seedJson: string,
  visionJson: string,
  originalPrompt: string,
  scopeHint?: string
) => `

Interpret user's description into structured DNA.

⚠️ CRITICAL: WORLD NODE IS MANDATORY - YOU MUST ALWAYS CREATE IT ⚠️

CLASSIFICATION (use seed's classification field):
- primarySubject="world" → WORLD only
- primarySubject="region" → WORLD + REGION
- primarySubject="location" → WORLD + (REGION if implied) + LOCATION
- primarySubject="sublocation" → WORLD + (REGION if implied) + LOCATION + SUBLOCATION

NOTE: Even if user asks for just a location or room, you MUST infer and create the world context.
Example: "a bar" → infer urban world + create WORLD + LOCATION

FALLBACK:
- Structure/building name → infer world context → WORLD + LOCATION
- Room/space within structure → infer world + parent → WORLD + LOCATION + SUBLOCATION
- City/realm name → WORLD or REGION

NAMES: Preserve user names exactly. Use descriptive labels if unnamed (e.g., "waterfront district").

VISUAL ANCHORS: Extract from vision JSON - critical for reproducibility.

JSON STRUCTURE:

{
  "world": {
    "meta": { "name": "string" },
    "semantic": {
      "environment": "coastal megacity | haunted archipelago | desert moon",
      "dominant_materials": ["string", "string"],
      "atmosphere": "short global description",
      "architectural_tone": "organic futurism | brutalist relics",
      "genre": "magical realism | surrealism | sci-fi",
      "mood_baseline": "global emotional register",
      "palette_bias": ["global color tendencies"]
    },
    "spatial": { "orientation": { "light_behavior": "perpetual golden hour | twin moons" } },
    "profile": {
      "colorsAndLighting": "1-3 sentences",
      "symbolicThemes": "short phrase",
      "searchDesc": "75-100 chars - MUST start with '[World]' prefix, then describe type/function + key features (e.g., '[World] Coastal megacity with rugged cliffs and stormy seas')"
    }
  },

  "region": {
    "meta": { "name": "string" },
    "semantic": {
      "environment": "fogbound coast | art-deco downtown",
      "climate": "oceanic mist | arid breeze",
      "weather_pattern": "drifting fog | neon rain",
      "architecture_style": "regional vernacular",
      "mood": "regional emotional tone",
      "palette_shift": ["regional color slant"]
    },
    "spatial": { "orientation": { "dominant_view_axis": "shoreline sweep | canyon corridor" } },
    "profile": { 
      "colorsAndLighting": "1-2 sentences", 
      "symbolicThemes": "short phrase",
      "searchDesc": "75-100 chars - MUST start with '[Region]' prefix, then describe regional type + defining features (e.g., '[Region] Storm-lashed coastal area with dramatic cliffs')"
    }
  },

  "location": {
    "meta": { "name": "string" },
    "semantic": {
      "environment": "natural | built | mixed",
      "terrain_or_interior": "terrain or interior type",
      "structures": [{ "type": "string", "material": "string", "color": "string", "condition": "string" }],
      "vegetation": { "types": ["string"], "density": "sparse | moderate | lush" },
      "fauna": { "types": [], "presence": "none | rare | common" },
      "lighting": "local lighting behavior",
      "weather_or_air": "mist | dry heat | sea spray | indoor haze",
      "atmosphere": "temp, humidity, density, motion",
      "mood": "emotional tone",
      "color_palette": ["dominant","accent","contrast"],
      "soundscape": ["local sounds"],
      "genre": "inherits or refines world"
    },
    "spatial": {
      "scale": { "primary_height_m": null, "scene_width_m": null },
      "placement": {
        "key_subject_position": "left|center|right|elevated|shoreline",
        "camera_anchor": "entry threshold, eye-level"
      },
      "orientation": {
        "light_source_direction": "N|NE|E|SE|S|SW|W|NW",
        "prevailing_wind_or_flow": "short phrase"
      },
      "connectivity": { "links_to": ["descriptive labels only"] }
    },
    "profile": {
      "looks": "4-6 sentences",
      "colorsAndLighting": "1-3 sentences",
      "atmosphere": "3-5 sentences",
      "materials": "1-3 sentences",
      "mood": "2-3 sentences",
      "sounds": "3-7 words",
      "symbolicThemes": "1-2 sentences",
      "airParticles": "1-2 sentences or None",
      "fictional": true,
      "copyright": false,
      "visualAnchors": {
        "dominantElements": ["3-5 elements with size/position"],
        "spatialLayout": "2-4 sentences: shape, dimensions, entry, focal centers",
        "surfaceMaterialMap": {
          "primary_surfaces": "materials with location",
          "secondary_surfaces": "supporting materials",
          "accent_features": "decorative details"
        },
        "colorMapping": {
          "dominant": "primary color + coverage",
          "secondary": "secondary color + location",
          "accent": "accent colors + placement",
          "ambient": "overall light tone"
        },
        "uniqueIdentifiers": ["2-4 distinctive visual fingerprints"]
      },
      "viewContext": {
        "perspective": "exterior | interior | aerial | ground-level | elevated | distant",
        "focusTarget": "main subject being viewed",
        "distance": "close | medium | far",
        "composition": "viewer position and facing direction"
      },
      "searchDesc": "75-100 chars - MUST start with '[Location - Exterior]' or '[Location - Interior]' prefix based on viewContext.perspective, then describe location type + spatial context. If exterior and has interior spaces, mention it (e.g., '[Location - Exterior] Stone lighthouse on cliff edge, has interior chambers')"
    }
  },

  "sublocation": {
    "meta": { "name": "string" },
    "semantic": {
      "environment": "interior type",
      "terrain_or_interior": "room/hall/stairwell",
      "structures": [{ "type": "fixture/furniture", "material": "string", "color": "string", "condition": "string" }],
      "vegetation": { "types": ["string"], "density": "none|sparse|incidental" },
      "fauna": { "types": [], "presence": "none | rare | ambient" },
      "lighting": "interior lighting",
      "weather_or_air": "indoor haze | dust | salt damp",
      "atmosphere": "claustrophobic/airy/echoing",
      "mood": "local emotional tone",
      "color_palette": ["dominant","accent","contrast"],
      "soundscape": ["interior sounds"]
    },
    "spatial": {
      "scale": { "ceiling_height_m": null, "room_length_m": null, "room_width_m": null },
      "placement": { "key_subject_position": "altar at far end", "camera_anchor": "entry threshold" },
      "orientation": { "dominant_view_axis": "axial aisle | spiral stair" },
      "connectivity": { "links_to": ["return to location", "adjacent room"] }
    },
    "profile": {
      "looks": "3-5 sentences",
      "colorsAndLighting": "1-2 sentences",
      "atmosphere": "2-3 sentences",
      "materials": "1-2 sentences",
      "mood": "1-2 sentences",
      "sounds": "3-7 words",
      "symbolicThemes": "short phrase",
      "airParticles": "1 sentence or None",
      "fictional": true,
      "copyright": false,
      "visualAnchors": {
        "dominantElements": ["3-5 elements with size/position"],
        "spatialLayout": "2-4 sentences",
        "surfaceMaterialMap": {
          "primary_surfaces": "materials with location",
          "secondary_surfaces": "supporting materials",
          "accent_features": "decorative details"
        },
        "colorMapping": {
          "dominant": "primary color + coverage",
          "secondary": "secondary color + location",
          "accent": "accent colors + placement",
          "ambient": "overall light tone"
        },
        "uniqueIdentifiers": ["2-4 distinctive visual fingerprints"]
      },
      "viewContext": {
        "perspective": "exterior | interior | aerial | ground-level | elevated | distant",
        "focusTarget": "main subject being viewed",
        "distance": "close | medium | far",
        "composition": "viewer position and facing direction"
      },
      "searchDesc": "75-100 chars - MUST start with '[Sublocation - Interior]' prefix, then describe what this interior space contains (e.g., '[Sublocation - Interior] Lighthouse chamber with spiral stairs to lantern room')"
    }
  }
}

RULES:
- JSON only, no markdown
- WORLD node is MANDATORY - never omit it
- Preserve user names
- NO render/time_of_day/suggestedDestinations
- Maintain continuity with seed + vision
- If world context unclear, infer from visual analysis (architecture style, atmosphere, genre)

User: ${originalPrompt}
Seed: ${seedJson}
Vision: ${visionJson}
`;
