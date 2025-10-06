/**
 * English language prompts
 */

import type { PromptTemplates } from '../types';

export const en: PromptTemplates = {
  entitySeedGeneration: (textPrompt: string) => `Your task is to generate a concise character seed, following the structure and standards below.

Return only valid JSON with these exact fields:
{
  "name": "...",
  "looks": "...",
  "wearing": "...",
  "personality": "..."
}

Guidelines:
- If the character is fictional, be creative but consistent with the given text.
- If historical, stay true to known facts without invention.
- Avoid copyrighted material unless explicitly allowed.
- If inspired by an artist, do not mention the artist's name.

- Keep descriptions grounded and emotionally believable.

- [name]: Provide a realistic full name (first and last). Be creative. 
If the character is a historical figure, use the name of the historical figure.
DON*T use fictional names Elara, Kaelen, Xylon, Zephyr, Lyra, 

- [looks]: Describe the character’s overall appearance, including age. race and skin tone.
If relevant, include details like **witch, vampire, soldier, alien, etc.**
Include race and skin tone and hair color. example: **Nordic, light skin tone and blonde hair**.  
Mention distinctive features like **scars, tattoos, piercings, birthmarks, etc.**  
Focus on enduring traits that define their identity.
Do **not** include temporary states like **wet hair** or **holding an object**. 

- [wearing]: Describe the **clothing**, **colors**, **style**, **accessories**, and **shoes**.  
Colors are **important**.  
Do **not** include temporary objects like **holding a glass of water**.

- [personality]: outline core traits (e.g., outspoken, reserved, charming, sarcastic) and how they relate to others.

Here's the text prompt to base the character on:
${textPrompt}`,

  chatSystemMessage: 'You are a helpful AI assistant.'
};
