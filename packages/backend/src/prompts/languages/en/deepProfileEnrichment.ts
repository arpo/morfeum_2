/**
 * Deep profile enrichment prompt
 * Combines seed data and visual analysis into a complete character profile
 */

export const deepProfileEnrichment = (seedJson: string, visionJson: string, originalPrompt: string) => `You are generating a complete, nuanced character profile for Morfeum — a world where realism and imagination coexist.

Original user request:
${originalPrompt}

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
- don't reuse the character name in the document. It should be stated only once in the name field.

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
- Do not use uncertain language like "likely," "possibly," or "seems." "Appears to be", If uncertain make it up.
- If details are missing, invent them to harmonize with seed and image.  
- No illegal content.  
- Do not describe minors or anyone under 18 in a sexual context.  
- Keep output coherent, sensory, and emotionally believable.`;
