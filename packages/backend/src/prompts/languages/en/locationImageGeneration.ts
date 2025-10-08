/**
 * Location image generation prompt
 * Source: https://deepinfra.com/blog/flux1-dev-guide
 */

import { morfeumVibes, qualityPrompt } from './constants';
import { getFluxFilter, getDefaultFluxFilter } from './fluxFilters';

export const locationImageGeneration = (
  originalPrompt: string,
  name: string,
  looks: string,
  atmosphere: string,
  mood?: string,
  filterName?: string
) => {
  const filter = filterName ? getFluxFilter(filterName) : getDefaultFluxFilter();
  const filterText = filter?.text || getDefaultFluxFilter().text;

  return `${morfeumVibes}

Original user description: "${originalPrompt}"

${name}, ${filterText}.

Visual details: ${looks}.

Atmosphere: ${atmosphere}.

${mood ? 'Mood: ' + mood + '.' : ''}

${qualityPrompt}`;
};
