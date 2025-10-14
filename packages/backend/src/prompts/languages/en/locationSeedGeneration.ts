/**
 * Location seed generation prompt
 */

export const locationSeedGeneration = (textPrompt: string) => `

Generate a concise, visually focused location seed based on the description below.

Return ONLY valid JSON with these exact fields:
{
  "originalPrompt": "...",
  "classification": {
    "primarySubject": "world|region|location|sublocation",
    "targetName": "...",
    "context": "..."  // optional, parent context if applicable
  },
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

- [classification]:
  - Analyze the user's PRIMARY INTENT:
    • primarySubject: What is the user asking you to CREATE?
      → "world" if it's a comprehensive city/realm description (even if it mentions specific locations)
      → "region" if it's a district/neighborhood within a larger area
      → "location" if it's explicitly requesting a specific structure/building (e.g., "Botanical Dome", "lighthouse")
      → "sublocation" if it's explicitly requesting a space INSIDE a structure (e.g., "bar in the dome", "VIP room")
    • targetName: The name of what they're asking you to create
    • context: Optional parent context (e.g., if asking for "Botanical Dome in Metropolis", context = "Metropolis")
  
  - KEY RULE: If the user provides a long, comprehensive description of a city/world, classify it as "world" even if specific locations are mentioned within the description.
  - Examples:
    • "Metropolis [long description mentioning Botanical Dome]" → primarySubject: "world", targetName: "Metropolis"
    • "Botanical Dome in Metropolis" → primarySubject: "location", targetName: "Botanical Dome", context: "Metropolis"
    • "VIP room in a club in Berlin" → primarySubject: "sublocation", targetName: "VIP room", context: "club in Berlin"
    • "A cliffside monastery" → primarySubject: "location", targetName: "[generated name]"

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

✦ [renderInstructions] — Revised for Dynamic Composition

Goal: Generate camera geometry that feels lived-in and cinematic — prioritizing tension, diagonal flow, and spatial rhythm over symmetry or centering.

Write one short, precise sentence describing only the camera geometry:
Include:
• framing distance (close / medium / wide / establishing / panoramic)
• camera angle (low / high / tilted / oblique / off-axis)
• composition bias (left / right / diagonal / offset / foreground-weighted)
• relative height or perspective (ground-level / elevated / aerial / eye-level)
• optional depth cues (foreground framing / occlusion / parallax / leading lines / layered planes)

Avoid: phrases like centered, perfect symmetry, directly facing, or eye-level balance.

Favor: diagonals, partial obstructions, asymmetrical framing, near/far contrasts, lens compression or expansion, and environmental intrusion (vines, railings, shadows).

✦ Updated Camera Geometry Examples

• “low three-quarter angle, diagonal layout with strong foreground occlusion and receding arches”
• “elevated side vantage, wide framing, layered trees forming asymmetrical tunnel toward distant portal”
• “ground-level shot, oblique axis, right-weighted composition with glowing crystals leading into depth”
• “medium-wide view, slight tilt, framed between trunks with diagonal rhythm through walkway”
• “aerial 45° off-axis angle, sweeping lines converging into misty focal point”
• “wide architectural view, skewed symmetry broken by foreground branches and uneven lighting falloff”
• “telephoto compression, layered columns creating rhythmic parallax, off-center horizon line”

✦ Practical Prompts for Variation

When you want to break the static frame, add:

“off-axis” or “three-quarter angle”

“foreground obstruction” or “partial frame intrusion”

“diagonal vanishing line”

“lens compression” (for telephoto) or “expanded perspective” (for wide)

“handheld feel” or “imperfect horizon” (for natural energy)


If details are missing, infer cinematic defaults.

Do NOT include markdown, code blocks, or commentary.
Return only the JSON object.

Input description:
${textPrompt}

`;
