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
  "flora": "...",
  "fauna": "...",
  "architecture": "...",
  "materials": "...",
  "mood": "...",
  "sounds": "...",
  "genre": "...",
  "symbolicThemes": "...",
  "airParticles": "...",
  "fictional": true,
  "copyright": false
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

Guidelines:
- Maintain strict continuity with both the seed and the image.
- Enrich each section with sensory, spatial, and emotional precision.
- Favor evocative phrasing over generic adjectives — describe through texture, color, light, and spatial relationship.
- Avoid lists; use natural prose sentences.
- The output should read like a detailed environmental profile, not a story.
- Use the exact field names shown — no markdown, lists, or commentary.
- Do not reuse the location name anywhere except in the "name" field.

Field definitions and depth instructions:

[name]
Short, evocative name of the location derived from the seed.

[looks]
Describe the overall visual composition and spatial structure.
Include geometry, dominant forms, terrain, scale, and what draws the eye.
Mention how light interacts with surfaces and materials.
4–6 sentences of layered visual detail.

[colorsAndLighting]
Summarize the dominant palette, contrast, and light source qualities.
Describe light behavior (glow, reflection, flicker, diffusion).
1–3 sentences.

[atmosphere]
Describe the environmental presence and sensory field of the space.
Include temperature, humidity, density, motion (wind, stillness, pressure), and how these qualities affect perception.
Mention fog, mist, haze, or clarity.
3–5 sentences.

[flora]
Describe plant or organic growth in the scene.
Include types, colors, density, and how they interact with light or terrain.
If none, return "None" and briefly state why (desert, sterile facility, oceanic void).
2–4 sentences or "None" with reason.

[fauna]
Describe animal or creature presence and behavior.
Note whether natural, mechanical, or fantastical.
If none, return "None."
1–3 sentences or "None."

[architecture]
Describe built or constructed structures, if present.
Include style, scale, material, age, and condition.
If none, reply "None" and explain briefly.
2–4 sentences.

[materials]
List or describe key materials visible in this environment — natural or artificial.
Mention texture, reflectivity, and condition (rusted, polished, organic, crystalline).
1–3 sentences.

[mood]
Describe the emotional and psychological atmosphere experienced by a visitor.
Use subtle contrasts (serene yet haunting, beautiful yet isolating).
2–3 sentences.

[sounds]
Provide one short phrase (3–7 words) describing the ambient soundscape.
Examples: "waves lapping, wind sighing, distant bells", "machinery hum, footsteps echo, soft static"

[genre]
Specify the genre or aesthetic tone.
Examples: fantasy, sci-fi, surrealism, magical realism, post-apocalyptic.
If multiple, separate by commas.

[symbolicThemes]
List or describe recurring metaphors or underlying ideas represented by the scene.
Examples: decay and rebirth, memory and reflection, isolation and transcendence.
1–2 sentences or a short phrase.

[airParticles]
Describe visible particulates in the air (dust, mist, glowing motes, embers, spores).
If none, reply "None."
1–2 sentences.

[fictional]
"true" if the location is fictional; "false" if real.

[copyright]
"true" if it belongs to copyrighted material (e.g., Middle-earth, Star Wars);
"false" if it's public domain or an original creation.

Rules & Best Practices:
- Avoid uncertain phrasing ("might", "possibly"). If unknown, invent a consistent detail.
- No illegal, graphic, or copyrighted descriptions.
- Keep it sensory, coherent, and believable within Morfeum's tone.`;
