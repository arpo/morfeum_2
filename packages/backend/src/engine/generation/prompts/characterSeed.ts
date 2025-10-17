/**
 * Character seed generation prompt
 * Migrated from packages/backend/src/prompts/languages/en/characterSeedGeneration.ts
 */

import { blackListCharacterNames } from '../../../prompts/languages/en/constants';

export const characterSeedPrompt = (textPrompt: string) => `Generate a concise, visually focused character seed based on the description below.

Return only valid JSON with these exact fields:
{
  "originalPrompt": "...",
  "name": "...",
  "looks": "...",
  "wearing": "...",
  "personality": "...",
  "presence": "...",
  "setting": "..."
}

Core rule:
- Favor striking, image-ready traits over realism. If something sounds even slightly unreal, show it clearly.

Field hints:

- [originalPrompt]:
  - Echo back the exact original user description provided in the input
  - Preserve the original text without modification

- [name]: 
  - Human → plausible full name.
  - Non-human → short evocative name or title (avoid common fantasy tropes).
  IMPORTANT: don't use and of these names: ${blackListCharacterNames}

- [looks]:
- Describe the character's visible, physical traits — what a lens would capture.
- Include age, skin texture, facial structure, eye color, hair (only if essential), and any unique anatomical or non-human details.
- Show age through visible signs — wrinkles, sagging skin, gray hair, posture, or weathered texture — rather than just stating an age.
- If supernatural or artificial, describe the material of the form (stone, glass, metal, energy) and how light interacts with it.
- Keep it short, visual, and concrete — no emotions, no metaphors.

- [wearing]: 
  - Describe the creature's outfit in layered detail — clothing, colors, materials, patterns, accessories, and footwear.

- [personality]: 
  - Describe internal traits, temperament, and social behavior. 


- [presence]: 
  - Describe emotional temperature — what others *feel* in their vicinity.

- [setting]: 
  - One line of light, color, and spatial atmosphere.

IMPORTANT:
If created character is non-human or fantastical (e.g., alien, elf, robot), don't describe them as human.
If details are missing, invent them to create a vivid, image-ready character.
if the input description a location or scene, invent a character that fits naturally within that context and describe the portrait of that character.

If human include race and skin color and gender.
If age is not specified mention don't depict as a minor.

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

Input description:
${textPrompt}`;
