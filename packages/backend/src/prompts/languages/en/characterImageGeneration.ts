/**
 * Character image generation prompt
 * Source: https://deepinfra.com/blog/flux1-dev-guide
 */

import { morfeumVibes, qualityPrompt } from './constants';
import { getFluxFilter, getDefaultFluxFilter } from './fluxFilters';

export const characterImageGeneration = (
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

  return `${morfeumVibes}

Original user description: "${originalPrompt}"

${name}, ${filterText}.

Look: ${looks}.

Wearing: ${wearing}.

${presence ? "Presence: " + presence + '.' : ''}

${setting ? "Setting: " + setting + '.' : ''}

${personality ? 'Their demeanor reflects: ' + personality + '.' : ''}

${qualityPrompt}`;
};
