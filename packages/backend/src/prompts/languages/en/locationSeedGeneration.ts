/**
 * Location seed generation prompt
 */

export const locationSeedGeneration = (textPrompt: string) => `
Generate visually focused location seed. Return ONLY valid JSON.

JSON Structure:
{
  "originalPrompt": "exact user text",
  "classification": {
    "primarySubject": "world|region|location|sublocation|object",
    "targetName": "what user wants to create",
    "context": "optional parent context"
  },
  "name": "short memorable name",
  "looks": "visible geometry, layout, scale - what lens captures",
  "atmosphere": "air/motion: still/windy/hazy/clear",
  "mood": "emotional tone: tense/serene/lonely/electric",
  "renderInstructions": "camera geometry only - no lighting/mood"
}

CLASSIFICATION RULES:
• world → comprehensive realm/city
• region → district/neighborhood
• location → specific structure/building
• sublocation → space inside structure
• object → mechanical/crafted element (machine, device, weapon, console, etc.)

KEY: Long city descriptions = "world" even if mentioning specific locations inside.

Examples:
• "Metropolis [long desc with Dome]" → world, "Metropolis"
• "Botanical Dome in Metropolis" → location, "Botanical Dome", context: "Metropolis"
• "VIP room in club" → sublocation, "VIP room", context: "club"

renderInstructions - Dynamic Cinematic Composition:
Write ONE sentence with camera geometry only.

Include: framing (close/medium/wide/macro), angle (low/high/tilted/oblique/three-quarter), composition (left/right/diagonal/offset), height (ground/elevated/aerial), depth cues (foreground framing/occlusion/parallax/leading lines)

**Avoid:** centered or perfectly symmetric framing, directly facing or eye-level balance.

**Favor:** diagonals, partial obstructions, asymmetry, near-far contrast, environmental intrusion (vines, railings, shadows), lens compression or expansion, skewed horizons, uneven lighting falloff.

**For machines, devices, or weapons:** emphasize tactile geometry —

* tight or macro framing on mechanisms and contours
* oblique or three-quarter angles showing depth and overlap
* strong surface occlusion, shallow depth cues, layered components
* avoid wide pulls or excess background context

**Camera geometry examples:**
• “macro detail, three-quarter angle, diagonal composition, shallow depth with surface occlusion”
• “tight close-up, oblique overhead, right-weighted frame, compressed depth through layered components”
• “medium detail, ground-level offset, diagonal axis through chassis or structure”
• “low three-quarter, diagonal layout, strong foreground occlusion with receding arches”
• “elevated side vantage, wide framing, asymmetrical tunnel of trees toward distant portal”
• “ground-level oblique shot, right-weighted composition, glowing elements leading into depth”
• “medium-wide, slight tilt, framed between trunks with diagonal rhythm”
• “aerial 45° off-axis, sweeping lines converging into mist”
• “wide architectural, skewed symmetry broken by foreground branches and light falloff”
• “telephoto compression, layered columns forming rhythmic parallax, off-center horizon”

Input: ${textPrompt}
`;
