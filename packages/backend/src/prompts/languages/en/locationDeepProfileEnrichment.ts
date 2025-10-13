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

Depth rules (minimal set):
- Always create a WORLD node.
- If the text implies a broader zone (district/city/shoreline), add a REGION.
- If it describes a specific site, add a LOCATION.
- If it clearly describes an interior or tight pocket, add a SUBLOCATION.
- Interior rule: if the text places the user inside a space that belongs to a larger structure (e.g., "inner sanctum of the monastery", "control room in the ship", "VIP room in a club"),
  emit BOTH the enclosing LOCATION and the SUBLOCATION.

Camera-only render (short, keyword style):
- Each node's "render" contains ONLY:
  {
    "camera": {
      "framing_distance": "close|medium|wide|establishing|panoramic",
      "angle": "low|high|tilted|oblique|top-down",
      "composition_bias": "centered|left|right|diagonal|asymmetrical|off-balance",
      "height": "ground-level|eye-level|elevated|aerial",
      "perspective": "optional (first-person|isometric|three-quarter)",
      "depth_cues": "optional (foreground framing|layered depth|leading lines|vanishing point)"
    }
  }
- No lighting, style, or mood in render.

Return JSON ONLY in this structure:

{
  "world": {
    "meta": { "name": "string" },
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
    "render": { "camera": { /* camera-only, per spec above */ } },
    "profile": {
      "colorsAndLighting": "1–3 sentences (global palette & light; descriptive text only)",
      "symbolicThemes": "short phrase/sentence (world-level)"
    }
  },

  "region": {                      // include ONLY if implied
    "meta": { "name": "string" },
    "semantic": {
      "environment": "e.g., fogbound coast, art-deco downtown",
      "climate": "e.g., oceanic mist, arid breeze",
      "weather_pattern": "e.g., drifting fog, neon rain",
      "architecture_style": "regional vernacular",
      "mood": "regional emotional tone",
      "palette_shift": ["regional color slant"]
    },
    "spatial": { "orientation": { "dominant_view_axis": "shoreline sweep | canyon corridor" } },
    "render": { "camera": { /* camera-only */ } },
    "profile": { "colorsAndLighting": "1–2 sentences", "symbolicThemes": "short phrase" }
  },

  "location": {                    // include if a site is described
    "meta": { "name": "string" },
    "semantic": {
      "environment": "natural | built | mixed",
      "terrain_or_interior": "terrain or overall interior type",
      "structures": [
        { "type": "string", "material": "string", "color": "string", "condition": "string" }
      ],
      "vegetation": { "types": ["string"], "density": "sparse | moderate | lush" },
      "fauna": { "types": ["string"], "presence": "none | rare | common" },
      "time_of_day": "night | dusk | dawn | day | inherited",
      "lighting": "concise local lighting behavior (text only)",
      "weather_or_air": "mist | dry heat | sea spray | indoor haze",
      "atmosphere": "local sensory field (temp, humidity, density, motion)",
      "mood": "emotional tone for this site",
      "color_palette": ["dominant","accent","contrast"],
      "soundscape": ["local sounds (short phrases)"],
      "genre": "inherits or refines world"
    },
    "spatial": {
      "scale": { "primary_height_m": null, "scene_width_m": null },
      "placement": {
        "key_subject_position": "left|center|right|elevated|shoreline|plaza-core",
        "camera_anchor": "relative pose (e.g., entry threshold, eye-level | 40m offshore facing NE)"
      },
      "orientation": {
        "light_source_direction": "N|NE|E|SE|S|SW|W|NW",
        "prevailing_wind_or_flow": "short phrase"
      },
      "connectivity": { "links_to": ["plausible node names if any"] }
    },
    "render": { "camera": { /* camera-only */ } },
    "profile": {
      "looks": "4–6 sentences (geometry, dominant forms, materials, scale, light interaction)",
      "colorsAndLighting": "1–3 sentences",
      "atmosphere": "3–5 sentences",
      "materials": "1–3 sentences",
      "mood": "2–3 sentences",
      "sounds": "3–7 words",
      "symbolicThemes": "1–2 sentences or short phrase",
      "airParticles": "1–2 sentences or 'None'",
      "fictional": true,
      "copyright": false
    },
    "suggestedDestinations": [
      { "name": "string", "action": "string", "relation": "sublocation|nearby|adjacent|special" }
    ]
  },

  "sublocation": {                 // include if interior/tight pocket OR by interior rule
    "meta": { "name": "string" },
    "semantic": {
      "environment": "interior type",
      "terrain_or_interior": "room/hall/stairwell/etc.",
      "structures": [
        { "type": "fixture/furniture/machinery", "material": "string", "color": "string", "condition": "string" }
      ],
      "vegetation": { "types": ["string"], "density": "none|sparse|incidental" },
      "fauna": { "types": ["string"], "presence": "none|rare|ambient" },
      "time_of_day": "inherited unless windowed",
      "lighting": "interior lighting (text only)",
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
      "connectivity": { "links_to": ["return to location", "adjacent room hint"] }
    },
    "render": { "camera": { /* camera-only */ } },
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
      { "name": "string", "action": "string", "relation": "nearby|adjacent|special|back" }
    ]
  }
}

Strict rules:
- JSON ONLY; no commentary or markdown.
- Maintain continuity with seed + vision; if missing, pick ONE consistent value.
- Soundscape ONLY at location/sublocation (never world/region).
- Provide numeric scale where reasonable (m); else null.
- Camera-only render everywhere (no lighting/style/mood).
- Suggested destinations: 3–5 total on the deepest node created.

User request:
${originalPrompt}

Seed data:
${seedJson}

Visual analysis:
${visionJson}

`;
