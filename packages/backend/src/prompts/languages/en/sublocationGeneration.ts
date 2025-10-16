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
Generate ${perspectiveType} sublocation: "${sublocationName}"

INHERITED CONTEXT:
Genre: ${cascadedContext.genre} | Arch: ${cascadedContext.architectural_tone} | Mood: ${cascadedContext.mood}
Atmosphere: ${cascadedContext.atmosphere} | Materials: ${cascadedContext.materials}
Palette: ${cascadedContext.palette.join(', ')} | Lighting: ${cascadedContext.lighting}
Style: ${cascadedContext.architecture || 'not specified'} | Weather/Air: ${cascadedContext.weather}
Soundscape: ${cascadedContext.soundscape.join(', ')}
Parent: ${cascadedContext.parentLocationName}

TASK: Generate sublocation DNA consistent with inherited context.

JSON Structure:
{
  "meta": {"name": "${sublocationName}"},
  "semantic": {
    "environment": "${environmentType}",
    "${terrainLabel}": "${terrainExample}",
    "structures": [{"type": "...", "material": "...", "color": "...", "condition": "..."}],
    "vegetation": {"types": ["..."], "density": "none|sparse|incidental"},
    "fauna": {"types": [], "presence": "none|rare|ambient"},
    "lighting": "${isExterior ? 'outdoor (natural/artificial)' : 'interior description'}",
    "weather_or_air": "${isExterior ? 'weather/wind' : 'air quality/particles'}",
    "atmosphere": "${isExterior ? 'open/exposed/sheltered' : 'claustrophobic/airy/echoing'}",
    "mood": "inherit from parent",
    "color_palette": ["dominant", "accent", "contrast"],
    "soundscape": ["${isExterior ? 'outdoor sounds' : 'interior sounds'}"]
  },
  "spatial": {
    "scale": {"ceiling_height_m": null, "room_length_m": null, "room_width_m": null},
    "placement": {"key_subject_position": "...", "camera_anchor": "entry/center/etc"},
    "orientation": {"dominant_view_axis": "axial/spiral/circular"},
    "connectivity": {"links_to": ["parent", "other spaces"]}
  },
  "profile": {
    "looks": "3-5 sentences visual appearance",
    "colorsAndLighting": "1-2 sentences inherit parent palette",
    "atmosphere": "2-3 sentences spatial feel",
    "materials": "1-2 sentences consistent with parent",
    "mood": "1-2 sentences",
    "sounds": "3-7 words",
    "symbolicThemes": "short phrase",
    "airParticles": "1 sentence or None",
    "fictional": true,
    "copyright": false,
    "visualAnchors": {
      "dominantElements": ["3-5 key elements with size/position"],
      "spatialLayout": "2-4 sentences: shape, dimensions, entries, focal centers",
      "surfaceMaterialMap": {
        "primary_surfaces": "walls/floor/ceiling materials",
        "secondary_surfaces": "support materials",
        "accent_features": "decorative details"
      },
      "colorMapping": {
        "dominant": "primary color + area",
        "secondary": "secondary + location",
        "accent": "accents + placement",
        "ambient": "light tone"
      },
      "uniqueIdentifiers": ["2-4 memorable distinctive features"]
    },
    "viewContext": {
      "perspective": "${perspectiveType}",
      "focusTarget": "main subject",
      "distance": "close|medium|far",
      "composition": "viewer position and facing"
    },
    "searchDesc": "${searchPrefix} 75-100 char description"
  }
}

RULES:
• Maintain consistency: genre, mood, materials, palette from parent
• ${isExterior ? 'Exterior: belongs adjacent/within parent' : 'Interior: belongs inside parent'}
• Use inherited palette, ${isExterior ? 'adapt for outdoor light' : 'refine for interior'}
• Lighting: ${isExterior ? 'outdoor influenced by parent atmosphere' : 'interior version of parent'}
• Soundscape: ${isExterior ? 'outdoor ambient' : 'muffled exterior + interior sounds'}
• searchDesc starts with "${searchPrefix}"
• Specific detailed visualAnchors
• JSON only, no markdown
`;
};
