/**
 * Visual analysis prompt for location images
 */

export const locationVisualAnalysis = (
  name: string,
  looks: string,
  atmosphere: string,
  mood: string
) => `
Analyze location image factually. Describe only what's visible.

Context:
Location: ${name}
Looks: ${looks}
Atmosphere: ${atmosphere}
Mood: ${mood}

Return ONLY valid JSON:
{
  "looks": "4-6 sentences: spatial layout, scale, architecture, materials, light interaction, focal points",
  "colorsAndLighting": "2-4 sentences: dominant colors, contrast, light quality (warm/cool, hard/soft), gradients",
  "atmosphere": "3-5 sentences: fog/mist/haze/clarity, luminosity, motion, depth visibility",
  "vegetation": "2-4 sentences: plants, density, color, interaction with light/architecture (or 'None')",
  "architecture": "2-4 sentences: style, materials, scale, condition (or 'None')",
  "animals": "1-3 sentences: creatures, birds, movement traces (or 'None')",
  "mood": "2-3 sentences: emotional tone from lighting/color/composition",
  "visualAnchors": {
    "dominantElements": ["3-5 key elements with size/position (e.g., 'tower ~80m tall left cliff')"],
    "spatialLayout": "2-4 sentences: geometry, framing (foreground/midground/background)",
    "surfaceMaterialMap": {
      "primary_surfaces": "major structural/terrain materials + locations",
      "secondary_surfaces": "support/filler materials",
      "accent_features": "luminous/reflective/decorative details"
    },
    "colorMapping": {
      "dominant": "main color + coverage area",
      "secondary": "supporting tones + regions",
      "accent": "highlights/glows + placement",
      "ambient": "overall light tone"
    },
    "uniqueIdentifiers": ["2-4 distinctive unmistakable features"]
  },
  "viewContext": {
    "perspective": "exterior|interior|aerial|ground-level|elevated|distant",
    "focusTarget": "main subject viewer faces",
    "distance": "close|medium|far",
    "composition": "viewer position and facing (e.g., 'beach level facing lighthouse and moon')"
  }
}

Guidelines:
• Describe visible/spatially inferable only
• Use quantitative cues (~50m tall, upper right quadrant)
• Factual spatial clarity over prose
• No markdown, code blocks, or commentary
`;
