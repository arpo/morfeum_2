/**
 * Location seed generation prompt
 */

export const locationSeedGeneration = (textPrompt: string) => `Generate a concise, visually focused location seed based on the description below.

Return only valid JSON with these exact fields:
{
  "originalPrompt": "...",
  "name": "...",
  "looks": "...",
  "atmosphere": "...",
  "mood": "..."
}

Core rule:
- Favor striking, image-ready details over realism. If something sounds even slightly unreal, show it clearly.

Field hints:

- [originalPrompt]:
  - Echo back the exact original user description provided in the input
  - Preserve the original text without modification

- [name]: 
  - If name is mentioned in the text, use that name
  - Come up with a memorable name for the location if not mentioned in the text
  - Use evocative, descriptive names that capture the essence
  - Examples: "The Whispering Archives", "Neon Sanctum", "Forgotten Shore"

- [looks]:
  - Describe the location's visible, physical traits — what a lens would capture
  - Include nature, architecture, vegetation, structures, materials, and unique features
  - Describe spatial layout, scale, and distinctive visual elements
  - Mention textures, surfaces, and how light interacts with the environment
  - Keep it visual and concrete — no emotions, no metaphors
  - Short, image-ready description

- [atmosphere]: 
  - Detailed description of the atmospheric qualities
  - Include color and quality of ambient lights (natural, artificial, magical)
  - Describe fog, mist, haze, air particles, dust, or clarity
  - Mention temperature sensations (warm, cold, humid, dry)
  - Note any environmental effects (wind, stillness, pressure)
  - Describe overall luminosity and color palette

- [mood]: 
  - Describe the emotional temperature of the space
  - Examples: tense, relaxed, romantic, melancholic, mysterious, energetic, serene
  - What emotions would someone feel upon entering this space?
  - Keep it concise but evocative

IMPORTANT:
If details are missing, invent them to create a vivid, image-ready location.

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

Input description:
${textPrompt}`;
