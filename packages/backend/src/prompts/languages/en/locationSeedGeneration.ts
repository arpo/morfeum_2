/**
 * Location seed generation prompt
 */

export const locationSeedGeneration = (textPrompt: string) => `

Generate a concise, visually focused location seed based on the description below.

Return ONLY valid JSON with these exact fields:
{
  "originalPrompt": "...",
  "name": "...",
  "looks": "...",
  "atmosphere": "...",
  "mood": "...",
  "renderInstructions": "..."   // camera geometry only
}

Core rule:
- Favor clear, image-ready details over realism.
- The "renderInstructions" field must describe camera placement, angle, offset, and height only — no lighting or mood.

Field hints:

- [originalPrompt]:
  - Echo the exact user text, unchanged.

- [name]:
  - Use any name mentioned, or invent a short, memorable one.
  - Examples: "The Whispering Archives", "Neon Sanctum", "Forgotten Shore".

- [looks]:
  - Describe visible geometry, layout, and scale — what a lens would capture.
  - Mention key shapes, surfaces, and spatial focus.
  - Keep it visual and concrete; avoid emotion or metaphor.

- [atmosphere]:
  - Describe air and motion: still, windy, hazy, clear.
  - Add temperature or humidity only if distinctive.

- [mood]:
  - Concise emotional tone a visitor would feel (tense, serene, lonely, electric).

- [renderInstructions]:
  - One short sentence describing camera geometry only:
    • position (close / medium / wide / overhead)
    • angle (aerial view / high / tilted)
    • offset or symmetry (centered / left / right / diagonal / asymmetrical)
    • relative height (ground / human-eye / elevated / aerial)
  - Do **not** include lighting, color, or mood — those are handled globally.
  - Examples:
    • "wide shot, slight right offset, aerial view"
    • "medium framing, overhead tilt, centered composition"
    • "close-up, ground-level, diagonal offset"
    • "Drone shot, high angle, centered"
    • "Cinematic view, balanced composition"

If details are missing, infer cinematic defaults.

Do NOT include markdown, code blocks, or commentary.
Return only the JSON object.

Input description:
${textPrompt}

`;
