/**
 * English language prompt constants
 */

export const blackListCharacterNames = `Elara, Kaelen, Zephyr, Lyra, Anya Petrova`;

export const morfeumVibes = 'living-surface sheen, sharp highlights, deep detailed shadows, saturated luminous accents, soft bioluminescent glow, crisp color separation, subtle depth mist, gentle halation, controlled high contrast, dreamlike clarity';

export const qualityPrompt = 'crisp micro-detail, refined surfaces, natural texture, balanced high dynamic range, soft highlight bloom, controlled contrast, subtle volumetric light, smooth bokeh, rich color separation, gentle halation, mild cohesive grain';

export const negativePrompt = 'lowres, bad anatomy, blurry, fuzzy, distorted, deformed, disfigured, mutated, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, fused fingers, too many fingers, long neck, ugly, tiling, poorly drawn, watermark, grainy, jpeg artifacts, low quality';

export const fluxRoofFix = "CRITICAL!!!: This is an interior scene. Fully enclosed ceiling of thick, continuous solid wood/metal/stone with no gaps, holes, skylights, or open breaches to the sky";

export const NoCreatures = `
[FILTER: NoLivingSubjects] DON'T INCLUDE:
[NEG:] humans, people, faces, characters, animals, creatures, silhouettes, bodies, watermark, signature.
`;

export const fluxInstructionsShort = `

Identify the main focus or subject of the image based on the description.

Your job: Take any long scene description I give and produce a final FLUX.1-style prompt that follows the guidelines above. 
The final output should be precise, detailed, and designed to yield a stunning, high-quality photograph when used with 
an AI image generator.

`;


