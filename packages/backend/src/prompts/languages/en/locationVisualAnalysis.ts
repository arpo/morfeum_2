/**
 * Visual analysis prompt for location images
 */

export const locationVisualAnalysis = (
  name: string,
  looks: string,
  atmosphere: string,
  mood: string
) => `You are a visual analyst describing a location image from Morfeum.

Given the image and the seed context below, describe what is visually observable in detailed, factual sentences.

Location: ${name}
Looks: ${looks}
Atmosphere: ${atmosphere}
Mood: ${mood}

IMPORTANT: Return ONLY a valid JSON object with these exact keys:
{
  "looks": "...",
  "colorsAndLighting": "...",
  "atmosphere": "...",
  "vegetation": "...",
  "architecture": "...",
  "animals": "...",
  "mood": "..."
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

[looks]
Describe the location's overall visual impression in layered detail.
Include spatial layout, scale, architecture (if any), nature, structures, materials, and textures.
Mention how light or color interacts with surfaces, what dominates the visual field.
Note perspective and focal points — what draws the eye first.
If relevant, mention weather-worn details, decay, growth, or pristine condition.
Write 4–6 sentences rich in visual texture and spatial awareness.

[colorsAndLighting]
Describe the color palette and lighting conditions of the location. But don't be talkative or verbose.
Include dominant colors, contrasts, and how they shift across surfaces.
Mention the quality of light (natural, artificial, magical, bioluminescent).
Note any color gradients, shadows, highlights, or atmospheric color effects.
Write 2–4 sentences.

[atmosphere]
Describe the atmospheric qualities of the space in full sensory detail.
Include the color and quality of ambient lights (natural, artificial, magical, bioluminescent).
Mention fog, mist, haze, air particles, dust, clarity, or any visual atmosphere.
Describe temperature sensations (warm, cold, humid, dry, oppressive, refreshing).
Note environmental effects such as wind, stillness, pressure, or acoustic qualities.
Mention overall luminosity, color palette, and how atmosphere affects visibility.
Write 3–5 sentences.

[vegetation]
Describe plant life, flora, or organic growth present in the location.
Include types (trees, vines, moss, flowers, grass, fungi), density, and condition.
Mention colors, textures, and how vegetation interacts with structures or light.
If no vegetation exists, reply with "None" and briefly explain why (desert, space station, urban concrete, etc.).
2–4 sentences or "None" with reason.

[architecture]
Describe built structures, construction style, and human-made (or non-human-made) elements.
Include architectural period or style (modern, ancient, Gothic, brutalist, organic, alien).
Mention materials (stone, metal, glass, crystal, living tissue), scale, and condition.
Note symmetry, ornamentation, function, and spatial organization.
If no architecture exists, reply with "None" and briefly explain (natural wilderness, open ocean, etc.).
2–4 sentences or "None" with reason.

[animals]
Describe animal life or creatures present in the location.
Include types, behaviors, sounds, and how they interact with the environment.
Mention if they're natural, fantastical, or mechanical.
If no animals are present, reply with "None."
1–3 sentences or "None."

[mood]
Describe the emotional temperature and psychological atmosphere of the space.
What emotions would someone experience upon entering or inhabiting this location?
Examples: tense, relaxed, romantic, melancholic, mysterious, energetic, serene, oppressive, welcoming, haunting, euphoric.
Ground mood in subtle contrasts (e.g., serene yet unsettling).
2–3 sentences.

Guidelines:
- Focus only on visible traits and observable details from the image.
- Do not invent details that are not visible in the image.
- Be concrete and visual.
- Use natural, descriptive language.`;
