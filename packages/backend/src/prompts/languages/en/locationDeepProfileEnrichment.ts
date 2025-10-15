/**
 * Morfeum — Simplified Node DNA Generator
 * Inputs: originalPrompt, seedJson, visionJson
 * Output: Flat NodeDNA structure (~15 fields)
 * 
 * Removes: Hierarchical world/region/location/sublocation nesting
 * Keeps: Visual anchors detailed for consistency
 * Speed: ~5-10 seconds vs 15-20 seconds
 */

export const generateNewWorldDNA = (
  seedJson: string,
  visionJson: string,
  originalPrompt: string,
  scopeHint?: string
) => `

Interpret the user's description into a simplified, flat DNA structure.

OBJECTIVE: Create a single unified node profile that captures the essential visual and atmospheric qualities without hierarchical complexity.

INPUTS:
User: ${originalPrompt}
Seed: ${seedJson}
Vision: ${visionJson}

OUTPUT JSON STRUCTURE:

{
  "looks": "4-6 sentences describing what you see - the visual scene, key structures, spatial arrangement, notable features. Be concrete and specific.",
  
  "colorsAndLighting": "2-4 sentences about color palette and lighting behavior. Include dominant colors, light sources, shadows, ambient tone.",
  
  "atmosphere": "3-5 sentences capturing the environmental feel - temperature, humidity, air movement, density, weather effects, sensory qualities beyond sight.",
  
  "architectural_tone": "10-20 characters describing the architectural style/character (e.g., 'organic crystalline', 'weathered ancient stone', 'sleek futuristic metal')",
  
  "materials": "1-3 sentences identifying primary surface materials and textures - what things are made of, their condition and finish.",
  
  "mood": "2-3 sentences describing the emotional tone and psychological atmosphere. What feeling does this place evoke?",
  
  "sounds": "5-7 words listing ambient sounds in this location",
  
  "visualAnchors": {
    "dominantElements": [
      "Element 1 with size and position (e.g., 'massive oak door on north wall, 3m tall')",
      "Element 2 with size and position",
      "Element 3 with size and position",
      "3-5 total elements"
    ],
    "spatialLayout": "2-4 sentences describing the shape, dimensions, entry points, focal centers, and overall spatial organization of this place.",
    "surfaceMaterialMap": {
      "primary_surfaces": "Main materials with their locations (walls, floors, ceiling)",
      "secondary_surfaces": "Supporting materials (furniture, fixtures, structural elements)",
      "accent_features": "Decorative details and highlights"
    },
    "colorMapping": {
      "dominant": "Primary color family with coverage area",
      "secondary": "Secondary color with location",
      "accent": "Accent colors with specific placement",
      "ambient": "Overall light tone (warm/cool/neutral)"
    },
    "uniqueIdentifiers": [
      "Distinctive feature 1 that makes this place visually unique",
      "Distinctive feature 2",
      "2-4 total visual fingerprints"
    ]
  },
  
  "searchDesc": "75-100 characters describing this place for semantic search. Be concise but descriptive. Capture type, function, and key visual features.",
  
  "viewContext": {
    "perspective": "exterior | interior | aerial | ground-level | elevated | distant",
    "focusTarget": "The main subject being viewed (e.g., 'lighthouse tower', 'stone archway', 'mountain peak')",
    "distance": "close | medium | far",
    "composition": "Viewer position and facing direction (e.g., 'standing at entrance looking inward', 'aerial view from northwest')"
  },
  
  "fictional": true,
  "copyright": false
}

CRITICAL GUIDELINES:

1. **Visual Anchors Are Sacred**
   - Extract directly from vision JSON
   - Be specific about sizes and positions
   - Include enough detail for regenerating the scene
   - These anchors ensure visual consistency across re-renders

2. **Concise But Complete**
   - Focus on observable details
   - Avoid redundant descriptions
   - Each field serves a specific purpose
   - No nested hierarchies or complex metadata

3. **Preserve User Intent**
   - Keep user's names exactly as given
   - Honor the scale and scope from seed
   - Maintain genre and mood from vision analysis

4. **searchDesc Format**
   - 75-100 characters maximum
   - Start with type/function
   - Include 1-2 distinctive features
   - Example: "Weathered stone lighthouse on rocky cliff with spiral interior stairs"

5. **JSON Only**
   - No markdown formatting
   - No code blocks
   - Pure JSON output
   - All fields required

REASONING:
- This flat structure captures everything needed for rendering and navigation
- Visual anchors remain detailed for consistency
- Eliminated redundant semantic/spatial metadata
- Faster generation without nested branching logic
- Single unified profile instead of multiple layers

Now generate the JSON:
`;
