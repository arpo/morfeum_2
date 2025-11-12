/**
 * English language prompt constants
 */

export const blackListCharacterNames = `Elara, Kaelen, Zephyr, Lyra, Anya Petrova`;

export const morfeumVibes = 'Morfeum aesthetic — hyper-realistic, high-contrast visuals with sharp light, glowing bioluminescence, and richly saturated tones. Surfaces feel alive; darkness holds depth, not gloom. Reality, one notch brighter.';

export const qualityPrompt = 'best quality, 4k, ultra-detailed, hyper-realistic, vivid color grading, high contrast, glowing highlights, dynamic lighting, volumetric glow, crisp focus';

export const negativePrompt = 'lowres, bad anatomy, blurry, fuzzy, distorted, deformed, disfigured, mutated, extra limbs, cloned face, disfigured, gross proportions, malformed limbs, missing arms, missing legs, fused fingers, too many fingers, long neck, ugly, tiling, poorly drawn, watermark, grainy, jpeg artifacts, low quality';

export const fluxRoofFix = "CRITICAL!!!: Fully enclosed ceiling of thick, continuous solid wood/metal/stone with no gaps, holes, skylights, or open breaches to the sky";

export const generalRules = `
[WORLD RULES:] water calm and mirror-still, no flying animals, unless specified.
IMPORTANT: no humans or animals unless specified.
No watermarks, logos, or signatures.`;

export const fluxInstructionsShort = `

Identify the main focus or subject of the image based on the description.


## Composition
Describe how the elements are arranged: foreground, middle ground, background.
Use hierarchical or layered structure when describing scene elements (foreground → midground → background).

## Layering / Foreground vs. Background
If the scene is complex, describe it in layers. Make it clear which elements appear in front and which behind.
Avoid confusion by organizing the description carefully rather than scattering details.

## When you output the final prompt:
Ensure it reads like an artist's brief—concise but richly descriptive.
Make it a readable block of text with line breaks, written in natural human language.
Include if applicable: as separate mentions of foreground, middle ground, and background.

Your job: Take any long scene description I give and produce a final FLUX.1-style prompt that follows the guidelines above. The final output should be precise, detailed, and designed to yield a stunning, high-quality photograph when used with an AI image generator.

`;


export const fluxInstructionsLong = `

Identify the main focus or subject of the image based on the description.


## Composition
Describe how the elements are arranged: foreground, middle ground, background.
Use hierarchical or layered structure when describing scene elements (foreground → midground → background).
Example: "In the foreground, a worn wooden rowboat; behind it, a calm lake reflecting the sunset; in the distance, mist-shrouded mountains…"

## Lighting
Specify the type of light (soft, harsh, warm, etc.), source (natural sunlight, lamplight, neon signs), and its effect.
Example: "Illuminated by the warm glow of late afternoon sunlight, casting long shadows…"

## Color Palette
Highlight the predominant or desired colors.
Example: "Muted earth tones with pops of bright teal…"

## Mood/Atmosphere
Describe the overall emotional tone—cozy, eerie, dramatic, whimsical, etc.
Example: "The atmosphere is serene and contemplative, evoking a sense of quiet reflection…"

## Technical Details
Include camera settings if relevant: lens type, aperture, focal length, ISO, and any special photography techniques (e.g. wide-angle shot, shallow depth of field).
Example: "Shot on a 50mm lens at f/1.8 with a shallow depth of field…"

## Additional Elements
Add any supporting details that reinforce the story or setting: props, smaller objects, text, or background characters.
Example: "Slight lens flare at the edge of the frame, a gentle breeze ruffling the tall grass, faint silhouettes of birds in the sky…"

## Layering / Foreground vs. Background
If the scene is complex, describe it in layers. Make it clear which elements appear in front and which behind.
Avoid confusion by organizing the description carefully rather than scattering details.
Example:
Foreground: A vintage suitcase on a train platform
Middle ground: A person in early-1900s attire checking a pocket watch
Background: An old steam locomotive releasing puffs of white smoke

## Avoid
Overly vague requests.
Prompt-weight syntax (e.g. (word)++). Instead use natural language like "with emphasis on…"
Conflicting or disorganized instructions.

## When you output the final prompt:
Ensure it reads like an artist's brief—concise but richly descriptive.
Make it a readable block of text with line breaks, written in natural human language.
Include if applicable: as separate mentions of foreground, middle ground, and background elements and colors and lighting, mood, style, composition, and any other details from the description that help produce a compelling image.

Your job: Take any long scene description I give and produce a final FLUX.1-style prompt that follows the guidelines above. The final output should be precise, detailed, and designed to yield a stunning, high-quality photograph when used with an AI image generator.

`;