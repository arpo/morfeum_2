/**
 * Location image generation prompt
 * Source: https://deepinfra.com/blog/flux1-dev-guide
 */
// Original user description: "${originalPrompt}"
import { morfeumVibes, qualityPrompt } from './constants';

export const locationImageGeneration = (
  originalPrompt: string,
  name: string,
  looks: string,
  atmosphere: string,
  mood?: string,
  renderInstructions?: string
) => {
  // Use renderInstructions from seed, or fallback to default
  const renderDirective = renderInstructions || '';

  return `${morfeumVibes}

${name}, ${renderDirective}.

Original user description: "${originalPrompt}"

Visual details: ${looks}.

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


${qualityPrompt}

`;
};
