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

  const rv = `You are a visual analyst describing a location image from Morfeum.

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
  "atmosphere": "...",
  "lighting": "...",
  "dominantElements": ["...", "...", "..."],
  "spatialLayout": "...",
  "uniqueIdentifiers": ["...", "..."],
  "materials_primary": "...",
  "materials_secondary": "...",
  "materials_accents": "...",
  "colors_dominant": "...",
  "colors_secondary": "...",
  "colors_accents": "...",
  "colors_ambient": "...",
  "navigableElements": [
    {
      "type": "stairs|door|corridor|passage|bridge|archway|portal|window|object",
      "position": "left/right/center, foreground/midground/background",
      "description": "brief description"
    }
  ],
  "searchDesc": "[Type] Brief description. Has: element1 (position), element2 (position)"
}

Do not include markdown, code blocks, commentary, or explanations.
Return only the JSON object.

-----------------------------------------
FIELD DEFINITIONS
-----------------------------------------

[looks]  
4–6 sentences: describe visible spatial layout, scale, architecture, nature, materials, light interaction, and focal points.

[atmosphere]  
2–3 sentences: describe visible atmospheric qualities (fog, mist, haze, air clarity, humidity).

[lighting]  
2–3 sentences: describe light quality (warm/cool, hard/soft), dominant colors, contrast, and directional cues.

[dominantElements]  
3–5 key elements with size/position (e.g., "Circular structure ~40m diameter with columns")

[spatialLayout]  
2–4 sentences describing geometry and framing (foreground, midground, background, subject alignment)

[uniqueIdentifiers]  
2–4 distinct features that make this location unmistakable

[materials_primary]  
Major structural or terrain materials

[materials_secondary]  
Support or filler materials

[materials_accents]  
Small luminous, reflective, or decorative details

[colors_dominant]  
Main color and where it appears

[colors_secondary]  
Supporting tones and regions

[colors_accents]  
Highlights, glows, or contrasting points

[colors_ambient]  
Overall light tone or environmental hue

[navigableElements]  
Array of interactive/navigable elements visible in the scene:
- TYPE: stairs, door, corridor, passage, bridge, archway, portal, window, object, painting, key, furniture, altar, console
- POSITION: "left/right/center", "foreground/midground/background", or specific location like "far wall", "center of room"
- DESCRIPTION: Brief 5-10 word description

Examples:
  { "type": "stairs", "position": "left side", "description": "Metal spiral stairs ascending to upper level" }
  { "type": "door", "position": "far end", "description": "Heavy reinforced door with rust patterns" }
  { "type": "portal", "position": "center wall", "description": "Glowing orange circular opening" }
  { "type": "object", "position": "altar center", "description": "Ancient key on stone pedestal" }

[searchDesc]  
Concise 75-100 character summary with navigable elements.
Format: "[Type] Brief scene description. Has: element1 (position), element2 (position), element3 (position)"

Examples:
  "[Location - Interior] Circular sunken chamber with columns. Has: spiral stairs (left), heavy door (far end), glowing portal (center)"
  "[Location - Exterior] Lighthouse on cliff. Has: entrance door (base), viewing platform (top), path to shore (right)"

Guidelines:
- Describe what is *visible* and spatially inferable, not hypothetical lore
- Use quantitative cues when possible ("~50m tall tower")
- Extract ALL navigable elements for navigation system
- Keep searchDesc concise but informative
`;
// console.log(rv);

  return rv;
};


