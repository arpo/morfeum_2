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

  chatSystemMessage: 'You are a helpful AI assistant.',

  sampleEntityPrompts: [
    'A confident woman in her late 20s with an easy smile and eyes that study people closely.',
    'A quiet man in his 30s who hides his nerves behind charm and perfect posture.',
    'A thoughtful non-binary artist with sharp cheekbones and a patient, knowing expression.',
    'A cheerful woman in her early 20s whose energy feels impossible to contain.',
    'A middle-aged man with kind eyes, a worn leather jacket, and a voice that carries authority.',
    'A soft-spoken introvert who watches more than they speak, but notices everything.',
    'A mischievous woman with a half-smile and a look that suggests she knows more than she says.',
    'A composed man with meticulous style, calm tone, and a habit of choosing words carefully.',
    'A curious young woman with expressive eyes and a tendency to drift into daydreams.',
    'A resilient man whose quiet confidence makes people trust him instantly.',
    'An elegant older woman with silver hair and a presence that fills any room without effort.',
    'A flirtatious non-binary traveler whose warmth and wit draw people in effortlessly.',
    'A graceful elf with luminous eyes and a calm intelligence that feels centuries old.',
    'A charming woman in her 20s with a confident smile and a hint of mischief in her gaze.',
    'A stoic alien diplomat with smooth, iridescent skin and eyes that shift color with emotion.',
    'A young man with freckles, tousled hair, and the quiet confidence of someone who has rebuilt themselves.',
    'A fierce female warrior with a scar over one eyebrow and the posture of unshakable pride.',
    'A curious android who imitates human gestures just a fraction too perfectly.',
    'An ethereal being with translucent skin and hair that moves as if stirred by an unseen breeze.',
    'A brooding male vampire with controlled charm and an expression that never fully softens.',
    'A radiant elf queen with silver hair braided in intricate patterns and eyes like liquid moonlight.',
    'A shy, non-binary mage with ink-stained fingers and a gentle, hesitant smile.',
    'A confident demon with a disarming grin, subtle horns, and a voice that sounds like velvet and smoke.',
    'A serene female alien scholar with delicate bioluminescent markings across her temples.'
  ]
};
