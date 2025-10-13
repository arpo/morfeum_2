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

- [renderInstructions]:
  - Write one short, precise sentence describing only the **camera geometry**:
    • framing distance (close / medium / wide / establishing / panoramic)
    • camera angle (low / high / tilted / oblique / top-down)
    • composition bias (centered / left / right / diagonal / asymmetrical / off-balance)
    • relative height or perspective (ground-level / eye-level / elevated / aerial)
    • optional depth cues (foreground framing / layered depth / leading lines / vanishing point)
  - Do not include lighting, color, or mood — those are defined elsewhere.
  - Prioritize spatial depth, rhythm, and perspective over symmetry.

  ✦ Updated Camera Geometry Prompts  
  Keep them short, one sentence each.

  • "wide landscape shot, low vantage, diagonal composition with strong leading lines"  
  • "aerial 45° oblique view, layered terrain with sweeping diagonal layout"  
  • "elevated perspective, centered vanishing point, receding depth through valley"  
  • "ground-level framing, slight upward tilt, asymmetrical composition with foreground foliage"  
  • "interior wide shot, low angle, right offset through doorway framing"  
  • "panoramic view, gentle horizon curve, balanced asymmetry"  
  • "medium-wide interior view, diagonal depth through repeating columns"  
  • "drone shot, angled 30° down, dynamic layout with crossing lines"  
  • "wide establishing frame, off-center balance, layered architecture depth"  
  • "low three-quarter angle, diagonal layout guiding eye through midground"

  ✦ Tips for Keeping Shots Alive  
  • Use diagonals, layering, or framing elements (doorways, trees, railings) to add dimension.  
  • Avoid static symmetry unless shooting formal architecture.  
  • Alternate between compressed (telephoto) and expanded (wide) perspectives to create visual rhythm.


If details are missing, infer cinematic defaults.

Do NOT include markdown, code blocks, or commentary.
Return only the JSON object.

Input description:
${textPrompt}

`;
