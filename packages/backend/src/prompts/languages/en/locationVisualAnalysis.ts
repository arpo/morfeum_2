/**
 * Visual analysis prompt for location images
 */

export const locationVisualAnalysis = (
  name: string,
  looks: string,
  atmosphere: string,
  mood: string
) => `You are a visual analyst describing a location image from Morfeum.

Given the image and the seed context below, describe what is visually observable in detailed, factual sentences.

Location: ${name}
Looks: ${looks}
Atmosphere: ${atmosphere}
Mood: ${mood}

IMPORTANT: Return ONLY a valid JSON object with these exact keys:
{
  "looks": "...",
  "colorsAndLighting": "...",
  "atmosphere": "...",
  "vegetation": "...",
  "architecture": "...",
  "animals": "...",
  "mood": "...",
  "visualAnchors": {
    "dominantElements": ["...", "...", "..."],
    "spatialLayout": "...",
    "surfaceMaterialMap": {
      "primary_surfaces": "...",
      "secondary_surfaces": "...",
      "accent_features": "..."
    },
    "colorMapping": {
      "dominant": "...",
      "secondary": "...",
      "accent": "...",
      "ambient": "..."
    },
    "uniqueIdentifiers": ["...", "..."]
  }
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

[looks] 4-6 sentences: spatial layout, scale, architecture, nature, materials, light interaction, focal points.

[colorsAndLighting] 2-4 sentences: dominant colors, contrasts, light quality, gradients, shadows.

[atmosphere] 3-5 sentences: visual atmosphere (fog/mist/haze), temperature feel, environmental effects, luminosity.

[vegetation] 2-4 sentences: types, density, colors, interaction with structures. If none: "None" + reason.

[architecture] 2-4 sentences: style, materials, scale, condition, spatial organization. If none: "None" + reason.

[animals] 1-3 sentences: types, behaviors. If none: "None".

[mood] 2-3 sentences: emotional tone visitor would feel.

[visualAnchors] CRITICAL for reproducibility - be specific with measurements/positions.

[dominantElements] 3-5 prominent elements with size/position (e.g., "circular skylight, 15m diameter, centered").

[spatialLayout] 2-4 sentences: shape, dimensions, entry points, focal centers, organization.

[surfaceMaterialMap] Map materials to surfaces:
- primary_surfaces: main structural materials with location
- secondary_surfaces: supporting materials
- accent_features: decorative/functional details

[colorMapping] Map colors to locations:
- dominant: primary color + coverage area
- secondary: secondary color + location
- accent: accent colors + specific placement
- ambient: overall light tone

[uniqueIdentifiers] 2-4 distinctive details that make location instantly recognizable.

Guidelines: Be specific ("three walkways at 8m height" not "multiple walkways"). Only describe visible details from image.`;
