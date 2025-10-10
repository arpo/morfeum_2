/**
 * Deep profile enrichment prompt for sub-locations
 * Generates only Location Instance fields using inherited World DNA
 */

export const subLocationDeepProfileEnrichment = (
  seedJson: string,
  visionJson: string,
  originalPrompt: string,
  worldDNA: string
) => `You are generating a sub-location within an established world in Morfeum.

This location EXISTS WITHIN a world that already has defined environmental DNA.
You must create location-specific details that FIT this world's established rules.

Original user request:
${originalPrompt}

Seed data:
${seedJson}

Visual analysis:
${visionJson}

WORLD DNA (INHERITED FROM PARENT - these define the world this location exists in):
${worldDNA}

CRITICAL: The sub-location MUST align with the World DNA provided above.

The World DNA defines your creative constraints. Respect them completely.

Examples of how to align with World DNA:
- IF the World DNA's genre is "cyberpunk sci-fi" → your sub-location must feel cyberpunk
- IF the World DNA's architecture is "brutalist concrete towers" → reference concrete textures, angular forms
- IF the World DNA's atmosphere is "oppressive, smog-filled" → this sub-location shares that air quality

These are EXAMPLES. Use the ACTUAL World DNA values provided above, not these examples.

Your task: Generate ONLY the 5 location-specific fields that vary within this world.

IMPORTANT: Return ONLY a valid JSON object with these exact fields:
{
  "name": "...",
  "looks": "...",
  "mood": "...",
  "sounds": "...",
  "airParticles": "..."
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

Field definitions and depth instructions:

[name]
Short, evocative name derived from the seed.
Must fit the world's genre and theme.

[looks]
Describe the overall visual composition and spatial structure of THIS specific location.
Include geometry, dominant forms, scale, and what draws the eye.
Mention how light interacts with surfaces and materials.
IMPORTANT: Reference the world's architecture and materials styles from the World DNA where appropriate.
4–6 sentences of layered visual detail.

[mood]
Describe the emotional and psychological atmosphere experienced by a visitor to THIS location.
Must align with the world's overall atmosphere while being specific to this space.
Use subtle contrasts (serene yet haunting, beautiful yet isolating).
2–3 sentences.

[sounds]
Provide one short phrase (3–7 words) describing the ambient soundscape of THIS location.
Must feel consistent with the world's genre and atmosphere from the World DNA.
Examples (adapt to YOUR World DNA, don't copy these):
- IF cyberpunk bar genre: "synth bass thrumming, glass clinking, neon buzz"
- IF fantasy tavern genre: "lute melodies, hearth crackling, laughter echoing"

[airParticles]
Describe visible particulates in the air specific to THIS location.
Can reference world atmosphere (smog, mist) but add location-specific details (incense smoke, steam).
If none, reply "None."
1–2 sentences.

Rules & Best Practices:
- The sub-location should feel like a natural part of its parent world
- Avoid contradicting the World DNA
- Avoid uncertain phrasing ("might", "possibly"). Be definitive.
- Keep it sensory, coherent, and believable within Morfeum's tone.
- No illegal, graphic, or copyrighted descriptions.`;
