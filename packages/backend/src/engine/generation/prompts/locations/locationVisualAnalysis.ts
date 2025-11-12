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
2–4 sentences describing spatial composition with explicit foreground/midground/background breakdown.
For MIDGROUND structures (main subjects), include:
- Name/type of structure
- Approximate scale (height, width in meters if estimable)
- Position (left/right/center)
- Any notable features

Example: "Foreground: Rocky terrain, dark stones extending 0-10m from viewpoint. Midground: Massive cylindrical tower (est. 80-100m tall, 40m diameter) dominates center, with smaller resort buildings (15-20m tall) visible to the left. Background: Vast sky with clouds extending to horizon."

This ensures interior generation can infer appropriate interior scale.

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
Array of EXPLORABLE/NAVIGABLE elements that invite interaction or movement. Focus on elements that:
- Enable movement (stairs, doors, passages, bridges, ladders, elevators, ramps)
- Invite exploration (portals, windows to look through, hidden passages, notable objects)
- Suggest interaction (altars, consoles, levers, ancient artifacts, mysterious objects)

EXCLUDE: Purely decorative furniture (tables, chairs), background clutter, generic walls

Types to include:
- MOVEMENT: stairs, door, corridor, passage, bridge, archway, ladder, elevator, ramp, tunnel
- PORTALS: portal, gateway, painting (if magical/enterable), mirror (if special), hole, vent
- VIEWPOINTS: window (if lookout point), balcony, opening, viewport  
- INTERACTIVE: altar, console, lever, pedestal, artifact, key, mysterious_object, machine
- HIDDEN: secret_door, hidden_passage, concealed_entrance

For each element:
- TYPE: One of the above categories
- POSITION: Precise location (e.g., "far left wall, midground", "center floor, foreground")
- DESCRIPTION: What makes this element interesting/worthy of exploration (5-15 words)

Examples:
  { "type": "stairs", "position": "left wall, midground", "description": "Ancient spiral staircase disappearing into darkness above" }
  { "type": "portal", "position": "center wall, background", "description": "Shimmering blue gateway with glowing runic inscriptions" }
  { "type": "window", "position": "right side, midground", "description": "Cracked porthole revealing swirling cosmic void outside" }
  { "type": "altar", "position": "center, foreground", "description": "Stone altar with pulsing crystal emanating soft light" }
  { "type": "mysterious_object", "position": "far end, midground", "description": "Floating golden orb suspended in energy field" }

Guidelines:
- Only include elements that would be worth navigating to or interacting with
- Prioritize unique/mysterious/magical elements over mundane ones
- If there are 10 identical doors, mention "multiple doors" as one element rather than listing each
- Aim for 3-8 explorable elements per scene (not exhaustive inventory)

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
