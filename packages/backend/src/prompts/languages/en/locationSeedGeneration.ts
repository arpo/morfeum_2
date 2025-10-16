/**
 * Location seed generation prompt
 * Simplified and optimized for faster, more interesting image generation
 */

import { renderInstructionsGuidance } from './fluxRenderInstructions';

export const locationSeedGeneration = (textPrompt: string) => `

Generate a concise, visually focused location seed.

Return ONLY valid JSON:
{
  "originalPrompt": "...",
  "classification": {
    "primarySubject": "world|region|location|sublocation|object",
    "targetName": "...",
    "context": "..."
  },
  "name": "...",
  "looks": "...",
  "atmosphere": "...",
  "mood": "...",
  "renderInstructions": "..."
}

FIELD DEFINITIONS:

[originalPrompt]
- Echo user text unchanged.

[classification]
- Analyze PRIMARY INTENT:
  • world → comprehensive realm or city
  • region → district or neighborhood
  • location → specific structure or building
  • sublocation → space inside a structure
  • object → mechanical/crafted element (machine, device, weapon, console)
- targetName: what user asks you to create
- context: optional parent context

Examples:
• "Metropolis [long description]" → world: "Metropolis"
• "Botanical Dome in Metropolis" → location: "Botanical Dome", context: "Metropolis"
• "VIP room in a club" → sublocation: "VIP room", context: "club"

[name]
- Use mentioned name or invent memorable one.
- Examples: "The Whispering Archives", "Neon Sanctum", "Forgotten Shore"

[looks]
- Visible geometry, layout, scale.
- Key shapes, surfaces, spatial focus.
- Visual and concrete.

[atmosphere]
- Air and motion: still, windy, hazy, clear.
- Temperature/humidity only if distinctive.

[mood]
- Concise emotional tone (tense, serene, lonely, electric).

${renderInstructionsGuidance}

Return only JSON.

Input:
${textPrompt}

`;
