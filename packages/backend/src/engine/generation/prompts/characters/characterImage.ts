/**
 * Character image generation prompt
 * Migrated from packages/backend/src/prompts/languages/en/characterImageGeneration.ts
 * Source: https://deepinfra.com/blog/flux1-dev-guide
 * 
 * Uses applyMorfeumStyle with creatureMode: 'allow' to allow people in character images.
 */

import { getFluxFilter, getDefaultFluxFilter } from '../shared';
import { applyMorfeumStyle } from '../../shared/applyMorfeumStyle';

export const characterImagePrompt = (
  originalPrompt: string,
  name: string,
  looks: string,
  wearing: string,
  personality?: string,
  presence?: string,
  setting?: string,
  filterName?: string
) => {
  const filter = filterName ? getFluxFilter(filterName) : getDefaultFluxFilter();
  const filterText = filter?.text || getDefaultFluxFilter().text;

  const basePrompt = `Original user description: "${originalPrompt}"

${name}, ${filterText}.

Look: ${looks}.

Wearing: ${wearing}.

${presence ? "Presence: " + presence + '.' : ''}

${setting ? "Setting: " + setting + '.' : ''}

${personality ? 'Their demeanor reflects: ' + personality + '.' : ''}`;

  // Apply Morfeum style WITHOUT NoCreatures filter (characters need people!)
  return applyMorfeumStyle(basePrompt, { creatureMode: 'allow' });
};
