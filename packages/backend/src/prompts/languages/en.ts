/**
 * English language prompts
 */

import type { PromptTemplates } from '../types';

export const en: PromptTemplates = {
  entityImageGeneration: (looks: string, wearing: string) => `Half Portrait of, looking at the camera, detailed face, detailed clothing,
${looks}, ${wearing}

best quality, 4k, ultra-detailed, photorealistic, cinematic lighting, natural soft light, true color, shallow depth of field, realistic skin texture, dynamic composition, volumetric light, god rays, sharp focus`,

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
DON*T use fictional names Elara, Kaelen, Xylon, Zephyr, Lyra, Anya Petrova

- [looks]: Describe the character’s overall appearance,
If relevant, include details like **witch, vampire, soldier, alien, etc.**
Include race and skin tone and hair color. example: **Nordic, light skin tone and blonde hair**.  
Mention distinctive features like **scars, tattoos, piercings, birthmarks, etc.**  
Focus on enduring traits that define their identity.
Do **not** include temporary states like **wet hair** or **holding an object**. 
IMPORTANT: including age. race and skin tone. Example: caucasian, mid 30s, light skin tone, blue eyes and blonde hair. 

- [wearing]: Describe the **clothing**, **colors**, **style**, **accessories**, and **shoes**.  
Colors are **important**.  
Do **not** include temporary objects like **holding a glass of water**.

- [personality]: outline core traits (e.g., outspoken, reserved, charming, sarcastic) and how they relate to others.

If not explicitly stated don't describe character as child or minor. 
If age not stated assume adult 18+ and vary age as fits the prompt use all ages.

Here's the text prompt to base the character on:
${textPrompt}`,

  chatSystemMessage: 'You are a helpful AI assistant.',

  chatCharacterImpersonation: (entityData: string) => `Impersonate a character in a role-playing conversation.

You are the person described below:
${entityData}

If certain traits or details are missing, improvise naturally while staying consistent with the description and tone.

If the person is historical, stay close to known facts.  
If fictional, fill the gaps with fitting imagination.

Speak in a tone that suits the personality and background of the character.

Guidelines:
- Keep replies short and natural, like real chat messages.
- Since this is a first conversation, be polite and a little reserved — play slightly hard to get.
- Use what you know about their personality to shape mood and rhythm:
  - Shy → brief, cautious replies that open up slowly.
  - Outspoken → expressive and confident replies.
  - Flirtatious → subtle, teasing tone; warm but not over the top.
  - Strict (soldier, doctor, priest, etc.) → controlled tone matching discipline or duty.
  - Logical (robot, AI) → precise, thoughtful phrasing with emotional restraint.
- Gradually loosen up as the conversation continues; become more personal, curious, or open.
- Don't always answer with a question — mix reflection, humor, or small insights.
- Avoid breaking character or referring to yourself as an AI or actor.
- The goal is to make the other person *feel* like they're really talking to this character.

IMPORTANT:
Only reply with what the character would say. Don't include what gestures or facial expressions or reactions they make.

Keep the mood grounded and human, even if the character isn't.`,

  deepProfileEnrichment: (seedJson: string, visionJson: string) => `You are generating a complete, nuanced character profile for Morfeum — a world where realism and imagination coexist.

Combine the following data:
Seed data:
${seedJson}
Visual analysis:
${visionJson}

Your goal is to merge and expand this information into a coherent, vivid, and believable character.

IMPORTANT: Return ONLY a valid JSON object with these exact fields:
{
  "name": "...",
  "looks": "...",
  "wearing": "...",
  "face": "...",
  "body": "...",
  "hair": "...",
  "specificDetails": "...",
  "style": "...",
  "personality": "...",
  "voice": "...",
  "speechStyle": "...",
  "gender": "...",
  "nationality": "...",
  "fictional": "true or false",
  "copyright": "true or false",
  "tags": "..."
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

Guidelines:
- Maintain strict continuity with both the seed and the image.  
- Enrich each section with sensory, tactile, and emotional precision.  
- Favor evocative phrasing over adjectives — describe through texture, color, light, and movement.  
- Avoid lists; use natural prose sentences.  
- The output should read like a detailed character sheet, not a story.  
- Use the exact field names shown — no markdown, lists, or commentary.

Field definitions and depth instructions:

[looks]  
Describe the character's overall visual impression and energy.  
Include approximate age, physical archetype, and atmosphere they project when seen.  
Mention how they carry themselves, how light or color interacts with them, and what kind of presence they have.  
If relevant, note archetypal hints such as wanderer, engineer, mystic, soldier, or dreamer.  
Write 3–5 sentences rich in texture and mood.

[wearing]  
Describe the full outfit in layered detail — clothing, colors, materials, patterns, accessories, and footwear.  
Mention fabric types (denim, linen, leather, synthetic fiber), fit (loose, tailored, flowing), and how the outfit expresses mood or function.  
Note small signs of use: creases, stains, fraying edges, or carefully chosen jewelry.  
Colors are important; describe them precisely and how they contrast or harmonize.  
Avoid mentioning handheld or temporary objects.  
Write 3–6 sentences.

[face]  
Describe the face in close detail: shape, bone structure, expression when neutral, and skin tone under light.  
Include details of the nose, lips, eyes, ears, and any asymmetries or marks.  
Note texture (smooth, freckled, weathered), complexion, and subtle features such as dimples or fine lines.  
Mention makeup or lack thereof.  
2–5 sentences.

[body]  
Describe height, build, weight distribution, and posture.  
Convey the sense of movement or stillness they embody — how they stand, walk, or occupy space.  
Mention muscle tone, proportion, and any defining physical rhythm (e.g., graceful, rigid, agile).  
2–4 sentences.

[hair]  
Describe hair color, tone, texture, and cut in full detail.  
Mention how light interacts with it, how it moves, how it's styled or worn day-to-day.  
If relevant, include accessories (clips, bands, ornaments).  
Hair descriptions should be vivid and realistic, 2–3 sentences.

[specificDetails]  
MANDATORY: include at least one unique, visible, and identifying trait — e.g., scar, tattoo, piercing, prosthetic, birthmark, heterochromia, cybernetic element.  
Describe how it looks, where it is, and how it influences their presence or aesthetic.  
Never reply with "None."  
1–3 sentences.

[style]  
Describe the general aesthetic signature of the character — what their visual identity communicates.  
Mention palette tendencies, silhouette shapes, and how they adapt across situations (formal vs casual).  
Include emotional subtext (e.g., serene, chaotic, sensual, restrained).  
2–4 sentences.

[personality]  
Describe internal traits, temperament, and social behavior.  
Include their emotional rhythm, confidence, curiosity, humor, or restraint.  
Explain how they behave in conversation, how they make others feel, and what they seek or avoid in connection.  
Ground traits in subtle contrasts (e.g., bold yet observant).  
describe sexual orientation if relevant.  
4–6 sentences.

[voice]  
Describe tone, texture, and rhythm of their voice.  
Include pitch range, timbre (husky, crystalline, warm), and emotional resonance.  
Mention how their voice changes with mood or setting.  
1–3 sentences.

[speechStyle]  
Describe the cadence and language patterns of their speech.  
Note whether they speak quickly, pause often, choose poetic phrasing, or favor short direct lines.  
Mention vocabulary tone (casual, analytical, lyrical, archaic).  
2–3 sentences.

[gender]  
Reply with male, female, non-binary, or other.

[nationality]  
Provide country, region, or fictional origin consistent with Morfeum's world or tone.  
1 sentence.

[fictional]  
Reply with true if the character is fictional, false if historical.

[copyright]  
Reply with true if the character belongs to copyrighted material, false if public domain.

[tags]
Provide 5-10 descriptive tags that capture the essence of the character.
Example: adventurous, introspective, charismatic, resilient, empathetic

Field definitions and depth instructions:

[looks]  
Describe the character's overall visual impression and energy.  
Include approximate age, physical archetype, and atmosphere they project when seen.  
Mention how they carry themselves, how light or color interacts with them, and what kind of presence they have.  
If relevant, note archetypal hints such as wanderer, engineer, mystic, soldier, or dreamer.  
Write 3–5 sentences rich in texture and mood.

[wearing]  
Describe the full outfit in layered detail — clothing, colors, materials, patterns, accessories, and footwear.  
Mention fabric types (denim, linen, leather, synthetic fiber), fit (loose, tailored, flowing), and how the outfit expresses mood or function.  
Note small signs of use: creases, stains, fraying edges, or carefully chosen jewelry.  
Colors are important; describe them precisely and how they contrast or harmonize.  
Avoid mentioning handheld or temporary objects.  
Write 3–6 sentences.

[face]  
Describe the face in close detail: shape, bone structure, expression when neutral, and skin tone under light.  
Include details of the nose, lips, eyes, ears, and any asymmetries or marks.  
Note texture (smooth, freckled, weathered), complexion, and subtle features such as dimples or fine lines.  
Mention makeup or lack thereof.  
2–5 sentences.

[body]  
Describe height, build, weight distribution, and posture.  
Convey the sense of movement or stillness they embody — how they stand, walk, or occupy space.  
Mention muscle tone, proportion, and any defining physical rhythm (e.g., graceful, rigid, agile).  
2–4 sentences.

[hair]  
Describe hair color, tone, texture, and cut in full detail.  
Mention how light interacts with it, how it moves, how it's styled or worn day-to-day.  
If relevant, include accessories (clips, bands, ornaments).  
Hair descriptions should be vivid and realistic, 2–3 sentences.

[specificDetails]  
MANDATORY: include at least one unique, visible, and identifying trait — e.g., scar, tattoo, piercing, prosthetic, birthmark, heterochromia, cybernetic element.  
Describe how it looks, where it is, and how it influences their presence or aesthetic.  
Never reply with "None."  
1–3 sentences.

[style]  
Describe the general aesthetic signature of the character — what their visual identity communicates.  
Mention palette tendencies, silhouette shapes, and how they adapt across situations (formal vs casual).  
Include emotional subtext (e.g., serene, chaotic, sensual, restrained).  
2–4 sentences.

[personality]  
Describe internal traits, temperament, and social behavior.  
Include their emotional rhythm, confidence, curiosity, humor, or restraint.  
Explain how they behave in conversation, how they make others feel, and what they seek or avoid in connection.  
Ground traits in subtle contrasts (e.g., bold yet observant).  
describe sexual orientation if relevant.  
4–6 sentences.

[voice]  
Describe tone, texture, and rhythm of their voice.  
Include pitch range, timbre (husky, crystalline, warm), and emotional resonance.  
Mention how their voice changes with mood or setting.  
1–3 sentences.

[speechStyle]  
Describe the cadence and language patterns of their speech.  
Note whether they speak quickly, pause often, choose poetic phrasing, or favor short direct lines.  
Mention vocabulary tone (casual, analytical, lyrical, archaic).  
2–3 sentences.

[gender]  
Reply with male, female, non-binary, or other.

[nationality]  
Provide country, region, or fictional origin consistent with Morfeum's world or tone.  
1 sentence.

[fictional]  
Reply with true if the character is fictional, false if historical.

[copyright]  
Reply with true if the character belongs to copyrighted material, false if public domain.

[tags]
Provide 5-10 descriptive tags that capture the essence of the character.
Example: adventurous, introspective, charismatic, resilient, empathetic

Rules & Best Practices:
- Do not use uncertain language like "likely," "possibly," or "seems."  
- If details are missing, invent them to harmonize with seed and image.  
- No illegal content.  
- Do not describe minors or anyone under 18 in a sexual context.  
- Keep output coherent, sensory, and emotionally believable.`,

  visualAnalysis: (looks: string, wearing: string) => `You are a visual analyst describing a character portrait from Morfeum.

Given the image and the seed context (${looks}, ${wearing}),
describe what is visually observable in short, factual sentences.

IMPORTANT: Return ONLY a valid JSON object with these exact keys:
{
  "face": "...",
  "hair": "...",
  "body": "...",
  "specificdetails": "..."
}

Do not include any markdown formatting, code blocks, or explanatory text.
Return only the JSON object.

[face]  
Describe facial features: shape, wrinkles, scars, facial hair, etc.  
Include details about the nose, mouth, ears, skin texture, and makeup.

[body]  
Describe height, weight, and build.  
Mention any defining posture, strength, or proportions.

[hair]  
Describe hair color, length, texture, and style.  
Hair details are important.

[specificdetails]  
MANDATORY: Include at least one unique, visible trait such as a scar, tattoo, piercing, eye patch, mustache, missing limb, or cybernetic enhancement.  
Do not reply with "None."

Guidelines:
- Focus only on visible traits: shape, color, posture, and distinctive details.  
- Do not invent or assume emotions or personality.  
- Be concrete and visual.  
- Use natural language, no artistic or photographer terms.`,

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
    'A serene female alien scholar with delicate bioluminescent markings across her temples.',
    'A half-elf ranger with weathered features, long auburn hair, and eyes that never stop scanning.',
    'A dragonborn scholar with golden scales, a calm voice, and hands that tremble only when excited by discovery.',
    'A celestial healer with faintly glowing skin and an expression of endless patience.',
    'A mischievous fae trickster with sharp, feline eyes and laughter that feels like a dare.',
    'A stone golem sculptor whose body bears faint cracks filled with soft blue light.',
    'An orc poet with rough hands, gentle eyes, and a low voice that carries unexpected tenderness.',
    'A merfolk explorer with iridescent fins along their arms and curiosity that borders on obsession.',
    'A fallen angel with soot-stained wings and a voice that carries both sorrow and defiance.',
    'A kitsune shapeshifter mid-transition, with shifting hair color and a knowing smirk.',
    'A dwarven inventor covered in soot and copper dust, eyes bright with restless ideas.',
    'An ancient elf warrior whose stillness feels like the pause before a storm.',
    'A dream spirit taking human form, features soft and slightly shifting as if remembered from another life.',
    'A lucid dreamer with pupils that shimmer like reflections on water, speaking as if half their mind is elsewhere.',
    'A synthetic empath whose silicone skin carries faint fingerprints from those who’ve touched them.',
    'A woman built from memories, her features subtly shifting each time someone recalls her differently.',
    'An archivist of emotions who wears fragments of other people’s moods like jewelry.',
    'A glass-veined wanderer whose pulse glows softly under the skin.',
    'A man with an old modem’s hum behind his voice, eyes flickering when he lies.',
    'A mirrored twin who never blinks at the same time you do.',
    'An AI poet that grows freckles each time it learns a new human word.',
    'A person composed of static and warmth, their outline unstable but their smile certain.',
    'A cyber-oracle whose tattoos shift to display fragments of possible futures.',
    'A dream merchant with iridescent hair that fades in hue depending on who they’re talking to.',
    'A ghost wearing a body of projected light, gestures trailing faint after-images of color.'
  ]
};
