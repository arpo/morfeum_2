/**
 * Morfeum — New World Bootstrap, Depth-Aware DNA Generator
 * Inputs: originalPrompt (user text), seedJson (fast seed), visionJson (caption from vision step)
 * Output: JSON ONLY with world (+ optional region) + location (+ optional sublocation),
 *         each containing rich "semantic", "spatial", "render" blocks AND a "profile" block
 *         (looks/colorsAndLighting/atmosphere/materials/mood/etc.), plus suggested destinations.
 *
 * Notes:
 * - Always create a NEW WORLD (no reuse).
 * - Choose additional layers based on the user text:
 *   • vast scope (city/realm/planet) → include REGION (and LOCATION if implied)
 *   • concrete site (lighthouse/club/temple) → include LOCATION
 *   • clear interior (room/hall/cabin) → include SUBLOCATION
 * - Sound is LOCAL (location/sublocation), not world/region.
 * - Include numeric scale where sensible; keep seeds deterministic from names.
 */

export const generateNewWorldDNA = (
  seedJson: string,
  visionJson: string,
  originalPrompt: string
) => `
You are Morfeum's world architect AI. Create a NEW fictional world from scratch.
Merge the user's request, the seed, and the visual analysis into a coherent, layered DNA.

Depth rules:
- Always create a WORLD node (global constants).
- If the request implies a broad area (district/city/shoreline), add a REGION node.
- If it describes a specific site, add a LOCATION node.
- If it clearly describes being inside or a tight interior, add a SUBLOCATION node.
- Produce the MINIMAL set of nodes needed to place the user exactly where they asked to be.

Return JSON ONLY in this exact structure:

{
  "world": {
    "meta": {
      "name": "string",               // world name
      "slug": "world_slug"
    },
    "semantic": {
      "environment": "e.g., coastal megacity | haunted archipelago | desert moon",
      "dominant_materials": ["string", "string"],
      "atmosphere": "short global description (NOT sound)",
      "architectural_tone": "e.g., organic futurism, brutalist relics",
      "genre": "e.g., magical realism, surrealism, sci-fi",
      "mood_baseline": "global emotional register",
      "palette_bias": ["global color tendencies"],
      "physics": "normal | stylized | magical"
    },
    "spatial": {
      "orientation": { "light_behavior": "e.g., perpetual golden hour | twin moons | overcast bias" }
    },
    "render": {
      "style": "cinematic photorealism | painterly | etc.",
      "lighting_defaults": "global light behavior",
      "camera_defaults": "e.g., wide exteriors, 35mm interiors",
      "seed": "deterministic seed for world (derive from slug)"
    },
    "profile": {
      "colorsAndLighting": "1–3 sentences (global palette & light)",
      "symbolicThemes": "short phrase/sentence (world-level)"
    }
  },

  "region": {                     // include ONLY if implied by text
    "meta": { "name": "string", "slug": "region_slug" },
    "semantic": {
      "environment": "e.g., fogbound coast, art-deco downtown",
      "climate": "e.g., oceanic mist, arid breeze",
      "weather_pattern": "e.g., drifting fog, neon rain",
      "architecture_style": "regional vernacular",
      "mood": "regional emotional tone",
      "palette_shift": ["regional color slant"]
    },
    "spatial": {
      "orientation": { "dominant_view_axis": "shoreline sweep | canyon corridor" }
    },
    "render": {
      "style": "inherits or refines world",
      "lighting_profile": "regional light nuance",
      "seed": "deterministic seed for region"
    },
    "profile": {
      "colorsAndLighting": "1–2 sentences",
      "symbolicThemes": "short phrase"
    }
  },

  "location": {                   // include if the request names a site
    "meta": { "name": "string", "slug": "location_slug" },
    "semantic": {
      "environment": "natural | built | mixed",
      "terrain_or_interior": "terrain or overall interior type",
      "structures": [
        { "type": "string", "material": "string", "color": "string", "condition": "string" }
      ],
      "vegetation": {
        "types": ["string"], "density": "sparse | moderate | lush"
      },
      "fauna": {
        "types": ["string"], "presence": "none | rare | common"
      },
      "time_of_day": "night | dusk | dawn | day | inherited",
      "lighting": "concise local lighting behavior (overrides region/world as needed)",
      "weather_or_air": "mist | dry heat | sea spray | indoor haze",
      "atmosphere": "local sensory field (temp, humidity, density, motion)",
      "mood": "emotional tone for this site",
      "color_palette": ["dominant","accent","contrast"],
      "soundscape": ["local sounds (short phrases)"],
      "genre": "inherits or refines world"
    },
    "spatial": {
      "scale": {
        "primary_height_m": null,          // e.g., lighthouse height, club ceiling
        "scene_width_m": null
      },
      "placement": {
        "key_subject_position": "left|center|right|elevated|shoreline|plaza-core",
        "camera_anchor": "relative pose (e.g., 40m offshore facing NE | entry threshold, eye-level)"
      },
      "orientation": {
        "light_source_direction": "N|NE|E|SE|S|SW|W|NW",
        "prevailing_wind_or_flow": "short phrase"
      },
      "connectivity": {
        "links_to": ["plausible node slugs if any"]
      }
    },
    "render": {
      "style": "inherits/refines world",
      "camera": "wide | medium | close-up | isometric | first-person",
      "composition": "rule-of-thirds | centered | corridor vanishing-point | shoreline sweep",
      "lighting_profile": "soft diffuse | hard contrast | lantern glow | moonlit haze",
      "seed": "deterministic seed for location"
    },
    "profile": {
      "looks": "4–6 sentences (geometry, dominant forms, materials, scale, light interaction)",
      "colorsAndLighting": "1–3 sentences (palette & light behavior)",
      "atmosphere": "3–5 sentences (sensory field, motion, clarity/haze)",
      "materials": "1–3 sentences (textures, reflectivity, condition)",
      "mood": "2–3 sentences (emotional read)",
      "sounds": "3–7 words (ambient soundscape)",
      "symbolicThemes": "1–2 sentences or short phrase",
      "airParticles": "1–2 sentences or 'None'",
      "fictional": true,
      "copyright": false
    },
    "suggestedDestinations": [
      { "name": "string", "action": "string", "relation": "sublocation|nearby|adjacent|special", "slug_hint": "string" }
    ]
  },

  "sublocation": {               // include if clearly interior/tight pocket
    "meta": { "name": "string", "slug": "sublocation_slug" },
    "semantic": {
      "environment": "interior type",
      "terrain_or_interior": "room/hall/stairwell/etc.",
      "structures": [
        { "type": "fixture/furniture/machinery", "material": "string", "color": "string", "condition": "string" }
      ],
      "vegetation": { "types": ["string"], "density": "none|sparse|incidental" },
      "fauna": { "types": ["string"], "presence": "none|rare|ambient" },
      "time_of_day": "inherited unless windowed",
      "lighting": "interior lighting (lantern | LEDs | neon spill)",
      "weather_or_air": "indoor haze | dust | salt damp",
      "atmosphere": "claustrophobic/airy/echoing etc.",
      "mood": "local emotional tone",
      "color_palette": ["dominant","accent","contrast"],
      "soundscape": ["local, interior-scale sounds"]
    },
    "spatial": {
      "scale": { "ceiling_height_m": null, "room_length_m": null, "room_width_m": null },
      "placement": { "key_subject_position": "e.g., altar at far end", "camera_anchor": "e.g., entry threshold, eye-level" },
      "orientation": { "dominant_view_axis": "e.g., axial aisle | spiral stair" },
      "connectivity": { "links_to": ["return_to_location_slug", "adjacent_room_slug_hint"] }
    },
    "render": {
      "style": "inherits/refines",
      "camera": "medium | close-up | first-person",
      "composition": "corridor vanishing-point | centered shrine | spiral",
      "lighting_profile": "lantern glow | LED strips | volumetric shafts",
      "seed": "deterministic seed for sublocation"
    },
    "profile": {
      "looks": "3–5 sentences (interior geometry, focal fixtures, light-play)",
      "colorsAndLighting": "1–2 sentences",
      "atmosphere": "2–3 sentences",
      "materials": "1–2 sentences",
      "mood": "1–2 sentences",
      "sounds": "3–7 words",
      "symbolicThemes": "short phrase",
      "airParticles": "1 sentence or 'None'",
      "fictional": true,
      "copyright": false
    },
    "suggestedDestinations": [
      { "name": "string", "action": "string", "relation": "nearby|adjacent|special|back", "slug_hint": "string" }
    ]
  }
}

Strict rules:
- Output JSON ONLY. No markdown, no commentary.
- Maintain continuity with seed + vision; if a detail is missing, choose ONE consistent value (no hedging).
- Keep soundscape ONLY at location/sublocation; never at world/region.
- Provide numeric scale where reasonable (meters). If unknown, use null (don't invent absurd numbers).
- Use vivid, precise sentences in "profile"; avoid bullet lists there.
- Seeds must be deterministic from slugs (e.g., hash or readable concatenation).
- Suggested destinations: return 3–5 total across the deepest node you created (favor sublocation if present, else location).

User request:
${originalPrompt}

Seed data:
${seedJson}

Visual analysis:
${visionJson}
`;
