/**
 * Deep profile enrichment prompt for locations
 * Combines seed data and visual analysis into a complete location profile
 */

export const locationDeepProfileEnrichment = (seedJson: string, visionJson: string, originalPrompt: string) => `You are generating a complete, nuanced location profile for Morfeum — a world where realism and imagination coexist.

Original user request:
${originalPrompt}

Combine the following data:
Seed data:
${seedJson}
Visual analysis:
${visionJson}

Your goal is to merge and expand this information into a coherent, vivid, and believable location.

IMPORTANT: Return ONLY a valid JSON object with these exact fields:
{
  "name": "...",
  "looks": "...",
  "colorsAndLighting": "...",
  "atmosphere": "...",
  "vegetation": "...",
  "animals": "...",
  "architecture": "...",
  "mood": "...",
  "sounds": "...",
  "genre": "...",
  "fictional": "true or false",
  "copyright": "true or false"
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

Guidelines:
- Maintain strict continuity with both the seed and the image.
- Enrich each section with sensory, spatial, and atmospheric precision.
- Favor evocative phrasing over adjectives — describe through texture, color, light, and scale.
- Avoid lists; use natural prose sentences.
- The output should read like a detailed location profile, not a story.
- Use the exact field names shown — no markdown, lists, or commentary.
- Don't reuse the location name in the document. It should be stated only once in the name field.

Field definitions and depth instructions:

[name]
The name of the location from the seed data.
One short phrase only.

[looks]
Describe the location's overall visual impression in layered detail.
Include spatial layout, scale, architecture (if any), nature, structures, materials, and textures.
Mention how light or color interacts with surfaces, what dominates the visual field.
Note perspective and focal points — what draws the eye first.
If relevant, mention weather-worn details, decay, growth, or pristine condition.
Write 4-6 sentences rich in visual texture and spatial awareness.

[colorsAndLighting]
Describe the color palette and lighting conditions of the location.
Include dominant colors, contrasts, and how they shift across surfaces.

[atmosphere]
Describe the atmospheric qualities of the space in full sensory detail.
Include the color and quality of ambient lights (natural, artificial, magical, bioluminescent).
Mention fog, mist, haze, air particles, dust, clarity, or any visual atmosphere.
Describe temperature sensations (warm, cold, humid, dry, oppressive, refreshing).
Note environmental effects such as wind, stillness, pressure, or acoustic qualities.
Mention overall luminosity, color palette, and how atmosphere affects visibility.
Write 3-5 sentences.

[vegetation]
Describe plant life, flora, or organic growth present in the location.
Include types (trees, vines, moss, flowers, grass, fungi), density, and condition.
Mention colors, textures, and how vegetation interacts with structures or light.
If no vegetation exists, reply with "None" and briefly explain why (desert, space station, urban concrete, etc.).
2-4 sentences or "None" with reason.

[architecture]
Describe built structures, construction style, and human-made (or non-human-made) elements.
Include architectural period or style (modern, ancient, Gothic, brutalist, organic, alien).
Mention materials (stone, metal, glass, crystal, living tissue), scale, and condition.
Note symmetry, ornamentation, function, and spatial organization.
If no architecture exists, reply with "None" and briefly explain (natural wilderness, open ocean, etc.).
2-4 sentences or "None" with reason.

[animals]
Describe animal life or creatures present in the location.
Include types, behaviors, sounds, and how they interact with the environment.
Mention if they're natural, fantastical, or mechanical.
If no animals are present, reply with "None."
1-3 sentences or "None."

[mood]
Describe the emotional temperature and psychological atmosphere of the space.
What emotions would someone experience upon entering or inhabiting this location?
Examples: tense, relaxed, romantic, melancholic, mysterious, energetic, serene, oppressive, welcoming, haunting, euphoric.
Ground mood in subtle contrasts (e.g., serene yet unsettling).
2-3 sentences.

[sounds]
MANDATORY: Provide 3-7 words describing background sounds in this location.
Condense the audio atmosphere into a brief, evocative phrase.
Describe suitable sounds for the entire location, not a single moment.
Examples: "birds chirping, wind blowing, distant thunder", "mechanical hums, steam hissing, footsteps echoing", "waves crashing, gulls crying, wood creaking"
One phrase only, 3-7 words.

[genre]
Describe the genre or aesthetic this location belongs to.
Examples: fantasy, sci-fi, horror, steampunk, cyberpunk, gothic, post-apocalyptic, magical realism, cosmic horror, solarpunk, noir
If it spans multiple genres, list them separated by commas.
1-2 sentences.

[fictional]
Reply with "true" if the location is fictional, "false" if it's a real place.

[copyright]
Reply with "true" if the location belongs to copyrighted material (e.g., Middle-earth, Hogwarts, Star Wars locations).
Reply with "false" if it's public domain or original creation created recently.

Rules & Best Practices:
- Do not use uncertain language like "likely," "possibly," or "seems." "Appears to be". If uncertain, make it up.
- If details are missing, invent them to harmonize with seed and image.
- No illegal content.
- Keep output coherent, sensory, and atmospherically believable.`;
