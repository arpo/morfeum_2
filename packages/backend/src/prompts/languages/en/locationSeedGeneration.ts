/**
 * Location seed generation prompt
 */

export const locationSeedGeneration = (textPrompt: string) => `

Generate a concise, visually focused location seed based on the description below.

⚠️ SPECIAL CASE - DETAIL/CLOSE-UP VIEWS:
If the user prompt contains phrases like "Closer to", "Approach", or similar proximity modifiers:
- This is a DETAIL VIEW of an existing element (structure or object)
-The named subject MUST fill most of the frame (≈70%+)
- Use TIGHT FRAMING: close-up, macro, or intimate perspective
- INHERIT parent environment’s atmosphere, mood, and material language
- MINIMIZE new invention — emphasize existing design logic and material continuity
- Treat the subject as tactile: reveal surface, mechanics, or craft
- Camera positioned extremely near the object’s geometry (focus on contour, interface, or mechanism)

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
      
   - "world" → comprehensive realm or city  
    - "region" → district or neighborhood  
    - "location" → specific structure or building  
    - "sublocation" → defined space inside a structure  
    - "object" → mechanical, crafted, or technological element  
      *(machine, device, vehicle, weapon, console, control panel, tool, etc.)*

  - If the prompt includes clear mechanical or crafted nouns  
    *(e.g., "engine core", "weapon", "machine", "device", "console", "gear")*,  
    classify it as "object".

  - When “Closer to” or similar phrasing references such an item,  
    it becomes "object" with the parent "context" drawn from its environment.


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


**Include:**
• framing distance — close / medium / wide / establishing / panoramic / macro
• camera angle — low / high / tilted / oblique / off-axis / three-quarter
• composition bias — left / right / diagonal / offset / foreground-weighted / subject-dominant
• perspective height — ground-level / elevated / aerial / top-down / detail-plane
• depth cues — foreground framing / occlusion / parallax / leading lines / layered planes / scale intrusion

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
