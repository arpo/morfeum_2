/**
 * Entity image generation prompt
 * Source: https://deepinfra.com/blog/flux1-dev-guide
 */

import { morfeumVibes, qualityPrompt } from './constants';

export const entityImageGeneration = (
  originalPrompt: string,
  name: string,
  looks: string,
  wearing: string,
  personality?: string,
  presence?: string,
  setting?: string
) => `${morfeumVibes}

Original user description: "${originalPrompt}"

Half portrait of ${name},, subject looking at the camera. Face in sharp focus, natural lighting, soft background blur (bokeh), balanced composition emphasizing eyes and expression.”.

Look: ${looks}.

Wearing: ${wearing}.

${presence ? "Presence: " + presence + '.' : ''}

${setting ? "Setting: " + setting + '.' : ''}

${personality ? 'Their demeanor reflects: ' + personality + '.' : ''}

${qualityPrompt}`;
