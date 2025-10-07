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

Half portrait of ${name}, looking at the camera.

Look: ${looks}. 

wearing: ${wearing}.

${presence ? "presence: " + presence + '.' : ''}

${setting ? "setting: " + setting + '.' : ''}

${personality ? 'Their demeanor reflects: ' + personality + '.' : ''}

${qualityPrompt}`;
