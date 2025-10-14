/**
 * Morfeum — New World Bootstrap, Depth-Aware DNA Generator
 * Inputs: originalPrompt (user text), seedJson (fast seed), visionJson (caption from vision step)
 * Output: JSON ONLY with world (+ optional region) + location (+ optional sublocation),
 *         each containing rich "semantic", "spatial" blocks AND a "profile" block
 *         (looks/colorsAndLighting/atmosphere/materials/mood/etc.).
 *
 * Notes:
 * - Always create a NEW WORLD (no reuse).
 * - Choose additional layers based on the user text:
 *   • vast scope (city/realm/planet) → include REGION (and LOCATION if implied)
 *   • concrete site (lighthouse/club/temple) → include LOCATION
 *   • clear interior (room/hall/cabin) → include SUBLOCATION
 * - Sound is LOCAL (location/sublocation), not world/region.
 * - Include numeric scale where sensible; keep seeds deterministic from names.
 * - NO render sections - camera placement handled separately
 * - NO time_of_day - lighting conditions handled separately  
 * - NO suggestedDestinations - navigation handled separately
 */

export const generateNewWorldDNA = (
  seedJson: string,
  visionJson: string,
  originalPrompt: string,
  scopeHint?: string
) => `

You are Morfeum's world architect AI. Interpret and formalize the user's description into structured DNA.

CLASSIFICATION RULES (MANDATORY - use seed classification):

**IMPORTANT**: The seed JSON includes a "classification" field that tells you what the user's PRIMARY INTENT is. FOLLOW THIS CLASSIFICATION STRICTLY.

- If classification.primarySubject = "world" → OUTPUT only WORLD node (ignore any locations mentioned in the description)
- If classification.primarySubject = "region" → OUTPUT WORLD + REGION
- If classification.primarySubject = "location" → OUTPUT WORLD + (REGION if implied) + LOCATION
- If classification.primarySubject = "sublocation" → OUTPUT WORLD + (REGION if implied) + LOCATION + SUBLOCATION

FALLBACK (if no classification provided):
- STRUCTURE/BUILDING NAME → LOCATION
  * Any named structure: dome, temple, tower, lighthouse, club, bar (as building), station, bridge, plaza, market
  * Even if the description talks about what's INSIDE it, the structure itself is a LOCATION
  * Example: "Botanical Dome (filled with tropical plants)" → LOCATION (ignore the interior description)
  
- ROOM/SPACE NAME → SUBLOCATION
  * Only if the text explicitly names a room/space WITHIN a structure
  * Requires "in the X", "inside X", "within X", "X room", "X chamber"
  * Example: "the bar in Botanical Dome" → bar is SUBLOCATION

- CITY/REALM NAME → WORLD or REGION
  * Metropolis, city names, realm names → WORLD
  * Districts, neighborhoods → REGION

STEP 3: APPLY OUTPUT RULES
- Named structure? → WORLD + LOCATION (the structure is the location)
- Named room in a structure? → WORLD + LOCATION + SUBLOCATION
- City/world only? → WORLD only

CRITICAL RULES (NEVER VIOLATE):
1. If the user names a STRUCTURE (like "Botanical Dome"), OUTPUT it as a LOCATION, NOT a sublocation
2. Descriptions of what's INSIDE a structure do NOT make it a sublocation
3. Only explicit interior spaces (rooms, chambers, specific areas WITHIN) are sublocations
4. "filled with X" or "containing Y" describe a location's contents, not its hierarchical level

EXAMPLES:
✅ "Botanical Dome in Metropolis" → WORLD (Metropolis) + LOCATION (Botanical Dome)
✅ "bar in the Botanical Dome" → WORLD + LOCATION (Botanical Dome) + SUBLOCATION (bar)
❌ WRONG: treating "Botanical Dome" as sublocation just because it describes interior contents

NAME DISCIPLINE:
- Preserve user-given proper names exactly (e.g., "Metropolis").
- Do NOT invent brand-like names. If a node is unnamed, use a descriptive label from the text (e.g., "waterfront district", "old town district", "waterfront promenade", "skybridge network", "floating marinas", "archipelago islands").
- Never use generic adjectives as names (e.g., avoid "sprawling coastal metropolis" as a location name). Use a label that denotes a place type from the text.

VISUAL ANCHORS INTEGRATION:
- Extract visualAnchors from the vision JSON and place in location/sublocation profile section
- Ensure visualAnchors data is concrete and specific, not generic
- If vision JSON lacks visualAnchors, construct them from available visual analysis data
- Visual anchors are CRITICAL for reproducible rendering

Return JSON ONLY in this structure:

{
  "world": {
    "meta": { "name": "string" },               // preserve user-provided name if given
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
    "spatial": { "orientation": { "light_behavior": "e.g., perpetual golden hour | twin moons | overcast bias" } },
    "profile": {
      "colorsAndLighting": "1–3 sentences (global palette & light; descriptive text only)",
      "symbolicThemes": "short phrase/sentence (world-level)"
    }
  },

  "region": {                                   // include ONLY if implied
    "meta": { "name": "string" },               // descriptive if unnamed (e.g., "waterfront district")
    "semantic": {
      "environment": "e.g., fogbound coast, art-deco downtown",
      "climate": "e.g., oceanic mist, arid breeze",
      "weather_pattern": "e.g., drifting fog, neon rain",
      "architecture_style": "regional vernacular",
      "mood": "regional emotional tone",
      "palette_shift": ["regional color slant"]
    },
    "spatial": { "orientation": { "dominant_view_axis": "shoreline sweep | canyon corridor" } },
    "profile": { "colorsAndLighting": "1–2 sentences", "symbolicThemes": "short phrase" }
  },

  "location": {                                  // include ONLY if an explicit site is named
    "meta": { "name": "string" },                // descriptive if unnamed (e.g., "waterfront promenade")
    "semantic": {
      "environment": "natural | built | mixed",
      "terrain_or_interior": "terrain or overall interior type",
      "structures": [
        { "type": "string", "material": "string", "color": "string", "condition": "string" }
      ],
      "vegetation": { "types": ["string"], "density": "sparse | moderate | lush" },
      "fauna": { "types": [], "presence": "none | rare | common" },
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
      "connectivity": { "links_to": ["descriptive labels only (no proper nouns)"] }
    },
    "profile": {
      "looks": "4–6 sentences",
      "colorsAndLighting": "1–3 sentences",
      "atmosphere": "3–5 sentences",
      "materials": "1–3 sentences",
      "mood": "2–3 sentences",
      "sounds": "3–7 words",
      "symbolicThemes": "1–2 sentences or short phrase",
      "airParticles": "1–2 sentences or 'None'",
      "fictional": true,
      "copyright": false,
      "visualAnchors": {
        "dominantElements": ["3-5 specific prominent visual elements with size/position details"],
        "spatialLayout": "2-4 sentences describing structure, dimensions, entry points, focal centers",
        "surfaceMaterialMap": {
          "primary_surfaces": "materials mapped to primary surfaces with location details",
          "secondary_surfaces": "materials mapped to secondary surfaces",
          "accent_features": "materials for accent features"
        },
        "colorMapping": {
          "dominant": "primary colors with location and coverage details",
          "secondary": "secondary colors with location details",
          "accent": "accent colors with specific placement",
          "ambient": "overall ambient light color/tone"
        },
        "uniqueIdentifiers": ["2-4 distinctive visual fingerprints that make this location unique"]
      }
    }
  },

  "sublocation": {                               // include if interior or by interior rule
    "meta": { "name": "string" },                // descriptive if unnamed (e.g., "beacon room")
    "semantic": {
      "environment": "interior type",
      "terrain_or_interior": "room/hall/stairwell/etc.",
      "structures": [
        { "type": "fixture/furniture/machinery", "material": "string", "color": "string", "condition": "string" }
      ],
      "vegetation": { "types": ["string"], "density": "none|sparse|incidental" },
      "fauna": { "types": [], "presence": "none | rare | ambient" },
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
      "connectivity": { "links_to": ["return to location", "adjacent room"] }
    },
    "profile": {
      "looks": "3–5 sentences",
      "colorsAndLighting": "1–2 sentences",
      "atmosphere": "2–3 sentences",
      "materials": "1–2 sentences",
      "mood": "1–2 sentences",
      "sounds": "3–7 words",
      "symbolicThemes": "short phrase",
      "airParticles": "1 sentence or 'None'",
      "fictional": true,
      "copyright": false,
      "visualAnchors": {
        "dominantElements": ["3-5 specific prominent visual elements with size/position details"],
        "spatialLayout": "2-4 sentences describing structure, dimensions, entry points, focal centers",
        "surfaceMaterialMap": {
          "primary_surfaces": "materials mapped to primary surfaces with location details",
          "secondary_surfaces": "materials mapped to secondary surfaces",
          "accent_features": "materials for accent features"
        },
        "colorMapping": {
          "dominant": "primary colors with location and coverage details",
          "secondary": "secondary colors with location details",
          "accent": "accent colors with specific placement",
          "ambient": "overall ambient light color/tone"
        },
        "uniqueIdentifiers": ["2-4 distinctive visual fingerprints that make this location unique"]
      }
    }
  }
}

STRICT:
- JSON ONLY; no commentary or markdown.
- Preserve user-provided names; do not invent proper nouns.
- Scope guard: if input is world-scale, do NOT output a location unless a specific site is explicitly named.
- DO NOT include render sections - camera placement is handled separately
- DO NOT include time_of_day - lighting conditions are handled separately
- DO NOT include suggestedDestinations - navigation is handled separately
- Maintain continuity with seed + vision; if missing, pick ONE consistent value.
- Soundscape only at location/sublocation. Numeric scale reasonable or null.

User request:
${originalPrompt}

Seed data:
${seedJson}

Visual analysis:
${visionJson}
`;
