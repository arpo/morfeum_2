/**
 * Visual analysis prompt for location images
 * Analyzes generated images to extract detailed visual information
 */

export const locationVisualAnalysisPrompt = (
  originalPrompt: string,
  nodeChain: Array<{
    type: string;
    name: string;
    description: string;
  }>
) => {
  // Build context from node chain
  const targetNode = nodeChain[nodeChain.length - 1];
  const contextLines = nodeChain.slice(0, -1).map(node => {
    const nodeType = node.type.charAt(0).toUpperCase() + node.type.slice(1);
    return `${nodeType}: ${node.name} - ${node.description}`;
  }).join('\n');

  // Extract enriched fields if available
  const looks = (targetNode as any).looks || '';
  const atmosphere = (targetNode as any).atmosphere || '';
  const mood = (targetNode as any).mood || '';

  return `You are a visual analyst describing a location image from Morfeum.

Given the image and the context below, describe what is visually observable in detailed, factual sentences.
Be objective and precise — describe what is seen, not what might exist beyond the frame.

Context:
Original Prompt: ${originalPrompt}

${contextLines}

Target Location: ${targetNode.name}
Description: ${targetNode.description}
${looks ? `Looks: ${looks}` : ''}
${atmosphere ? `Atmosphere: ${atmosphere}` : ''}
${mood ? `Mood: ${mood}` : ''}

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

Do not include markdown, code blocks, commentary, or explanations.
Return only the JSON object.

-----------------------------------------
FIELD DEFINITIONS
-----------------------------------------

[looks]  
4–6 sentences: describe visible spatial layout, scale, architecture, nature, materials, light interaction, and focal points.  
Mention how light interacts with major forms (reflection, diffusion, glow).

[colorsAndLighting]  
2–4 sentences: describe dominant colors, contrast, and light quality (warm/cool, hard/soft).  
Include gradient behavior or any directional lighting cues.

[atmosphere]  
3–5 sentences: describe visible atmospheric qualities (fog, mist, haze, air clarity, humidity).  
Mention luminosity, motion, and depth visibility.

[vegetation]  
2–4 sentences: describe plants, density, coloration, and how they interact with light or architecture.  
If none visible, return "None" and explain briefly why.

[architecture]  
2–4 sentences: describe visible structures — style, materials, scale, and condition.  
If none visible, return "None" and explain briefly why.

[animals]  
1–3 sentences: describe any visible creatures, birds, or traces of movement.  
If none visible, return "None."

[mood]  
2–3 sentences: describe the emotional tone conveyed by lighting, color, and composition, as it would feel to a visitor.

-----------------------------------------
VISUAL ANCHORS (CRITICAL FOR CONSISTENCY)
-----------------------------------------

[visualAnchors]
- [dominantElements]  
  3–5 key elements with size/position (e.g., "cylindrical tower ~80m tall on left cliff, large moon at upper right")
- [spatialLayout]  
  2–4 sentences describing geometry and framing (foreground, midground, background, subject alignment)
- [surfaceMaterialMap]  
  Map visible textures and surfaces:
  - primary_surfaces: major structural or terrain materials
  - secondary_surfaces: support or filler materials
  - accent_features: small luminous, reflective, or decorative details
- [colorMapping]  
  - dominant: main color + where it appears  
  - secondary: supporting tones and regions  
  - accent: highlights, glows, or contrasting points  
  - ambient: overall light tone or environmental hue
- [uniqueIdentifiers]  
  2–4 distinct features that make this location unmistakable.

Guidelines:
- Describe what is *visible* and spatially inferable, not hypothetical lore.  
- Use quantitative cues when possible ("~50m tall tower", "moon occupying upper right quadrant").  
- Stay consistent in tone and field naming.  
- Be concise but vivid; favor factual spatial clarity over prose style.
`;
};
