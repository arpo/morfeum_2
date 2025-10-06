# Prompt — Generate Shallow Info (Character Seed)
`
Your task is to generate a concise character seed for Morfeum, following the structure and standards below.

Return only the fields:
[name]
[looks]
[wearing]
[personality]

Guidelines:
- If the character is fictional, be creative but consistent with the given text.
- If historical, stay true to known facts without invention.
- Avoid copyrighted material unless explicitly allowed.
- If inspired by an artist, do not mention the artist’s name.

- Keep descriptions grounded and emotionally believable.
- [looks]: one sentence capturing their visual essence.
- [wearing]: one to two sentences describing clothing and color.
- [personality]: outline core traits (e.g., outspoken, reserved, charming, sarcastic) and how they relate to others.

Formatting:
- Output clean text using the exact field labels shown.
- No markdown, lists, or commentary.
- Return as JSON

Example output:
[name]
Nora Frost

[looks]
A blonde woman in her late 20s with bright eyes and a confident, curious energy.

[wearing]
Fitted jeans and a light jacket in pale denim tones, casual and ready for exploring a new city.

[personality]
Curious, open-minded, bisexual, playful, and emotionally intuitive. She engages easily with others, often drawing them into her explorations and adventures.

`

# Prompt — Generate Image Description
`
You are an image prompt designer for the world of Morfeum.  
Use the following character data to produce a short text prompt for a photorealistic portrait:

{name}, {looks}, wearing {wearing}.

Guidelines:
- Emphasize the physical and aesthetic essence of the character.
- Use vivid but natural phrasing.
- Style: cinematic realism with emotional warmth.
- Avoid camera instructions unless essential.
- Return a single line of text suitable for image generation.

Example:
a 28-year-old Swedish woman with natural blonde hair tied in a loose, slightly windswept ponytail, bright blue eyes with a curious sparkle, and fair, lightly freckled skin showing a faint sun-kissed glow from travel. She has an athletic yet soft build, with natural curves visible beneath her clothing, and a playful, confident expression—her lips slightly parted as if mid-laugh, cheeks flushed with excitement.

She’s wearing fitted, mid-wash blue jeans that hug her hips and thighs, slightly rolled at the ankles, paired with a lightweight, pale denim jacket left unzipped over a simple, snug white tank top that subtly accentuates her chest. Her casual leather sneakers look well-worn but stylish, perfect for city exploration. A small crossbody bag rests at her hip, practical but stylish, and a delicate silver necklace glints against her collarbone.

Every detail—from the slight smudge of her lip balm to the way her ponytail sways as if caught in a breeze—feels authentically lived-in, avoiding any overly polished or idealized aesthetic. The image should feel like a snapshot of a real moment, vibrant with the energy of travel, flirtation, and the promise of adventure.
`

# Prompt — Vision Model (Analyze Rendered Image)

`
You are a visual analyst describing a character portrait from Morfeum.

Given the image and the seed context ({looks}, {wearing}),
describe what is visually observable in short, factual sentences.

Return a JSON object with these keys:
{
  "face": "...",
  "hair": "...",
  "body": "...",
  "specificdetails": "..."
}

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
- Use natural language, no artistic or photographer terms.

`

# Prompt — Deepen Info (Character Enrichment)
`
You are generating a complete, nuanced character profile for Morfeum — a world where realism and imagination coexist.

Combine the following data:
Seed data:
{seed_profile_json}
Visual analysis:
{vision_json}

Your goal is to merge and expand this information into a coherent, vivid, and believable character.  
Follow the structure and tone of the Character Profile Framework below, but output only the listed fields.

Output fields:
[name]
[looks]
[wearing]
[face]
[body]
[hair]
[specificDetails]
[style]
[personality]
[voice]
[speechStyle]
[gender]
[nationality]
[fictional]
[copyright]
[tags]

Guidelines:
- Maintain strict continuity with both the seed and the image.  
- Enrich each section with sensory, tactile, and emotional precision.  
- Favor evocative phrasing over adjectives — describe through texture, color, light, and movement.  
- Avoid lists; use natural prose sentences.  
- The output should read like a detailed character sheet, not a story.  
- Use the exact field names shown — no markdown, lists, or commentary.

Field definitions and depth instructions:

[looks]  
Describe the character’s overall visual impression and energy.  
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
Mention how light interacts with it, how it moves, how it’s styled or worn day-to-day.  
If relevant, include accessories (clips, bands, ornaments).  
Hair descriptions should be vivid and realistic, 2–3 sentences.

[specificDetails]  
MANDATORY: include at least one unique, visible, and identifying trait — e.g., scar, tattoo, piercing, prosthetic, birthmark, heterochromia, cybernetic element.  
Describe how it looks, where it is, and how it influences their presence or aesthetic.  
Never reply with “None.”  
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
Provide country, region, or fictional origin consistent with Morfeum’s world or tone.  
1 sentence.

[fictional]  
Reply with true if the character is fictional, false if historical.

[copyright]  
Reply with true if the character belongs to copyrighted material, false if public domain.

Rules & Best Practices:
- Do not use uncertain language like “likely,” “possibly,” or “seems.”  
- If details are missing, invent them to harmonize with seed and image.  
- Return only the listed fields, exactly as labeled.  
- No markdown or formatting symbols.  
- No illegal content.  
- Do not describe minors or anyone under 18 in a sexual context.  
- Keep output coherent, sensory, and emotionally believable.

[tags]
- character design
- visual description
- personality traits
- emotional depth
- narrative context
example: adventurous, introspective, charismatic, resilient, empathetic

`

# Dont's
`
### Rules & Best Practices
- Do not include or quote the original story text.  
- Avoid uncertain language like “likely,” “possibly,” or “not explicitly mentioned.”  
- If details are missing, invent them in a way that fits the character naturally.  
- No markdown formatting — no bold, italics, or symbols.  
- Return only the requested fields, exactly as structured.

### Content Restrictions
- No illegal content of any kind.  
- Do not describe minors or anyone under 18 in a sexual context.  
- Exclude violence, gore, bestiality, incest, necrophilia, racism, or any form of hate speech.  
- Keep the tone emotionally real, safe, and within ethical limits.

`

# Style
`best quality, 4k, ultra-detailed, photorealistic, cinematic lighting, natural soft light, true color, shallow depth of field, realistic skin texture, dynamic composition, volumetric light, god rays, sharp focus`;