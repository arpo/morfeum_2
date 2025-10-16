/**
 * Sublocation (interior) image generation prompt
 * Adapted from locationImageGeneration.ts for interior spaces
 */
import { morfeumVibes, qualityPrompt } from './constants';

export const sublocationImageGeneration = (
  name: string,
  looks: string,
  atmosphere: string,
  colorsAndLighting: string,
  mood?: string
) => {
  // Interior-focused composition
  

  return `${morfeumVibes}

${name}.

Visual details: ${looks}.

Colors and Lighting: ${colorsAndLighting}.

Atmosphere: ${atmosphere}.

${mood ? 'Mood: ' + mood + '.' : ''}

Guidelines:
- Focus on the location itself, avoid including people or animals if not specified in the original prompt.
- Use rich, evocative language to bring the scene to life.
- Avoid generic terms; be specific and concrete in descriptions.
- Ensure the scene is coherent and visually engaging.

[WORLD RULES:]
No human or animal figures appear unless explicitly mentioned.
Water, when visible, is calm and mirror-still, reflecting light softly.


${qualityPrompt}`;
};
