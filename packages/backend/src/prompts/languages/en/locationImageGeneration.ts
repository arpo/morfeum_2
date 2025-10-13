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
  const renderDirective = renderInstructions || 'cinematic view, balanced composition, natural lighting';

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

IMPORTANT:
- If water is present, depict it as calm and still if nothing else is specified.
- Don't add a figure or person unless explicitly mentioned in the original prompt like "a bustling city street with people" or "a serene lakeside with a fisherman" or "a crowded marketplace with vendors and shoppers".

${qualityPrompt}`;
};
