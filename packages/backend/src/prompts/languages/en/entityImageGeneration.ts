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

Half portrait of ${name}, Front-facing half-portrait, symmetrical posture, shoulders square to the viewer, making eye contact.”.

Look: ${looks}.

Wearing: ${wearing}.

${presence ? "Presence: " + presence + '.' : ''}

${setting ? "Setting: " + setting + '.' : ''}

${personality ? 'Their demeanor reflects: ' + personality + '.' : ''}

${qualityPrompt}`;
