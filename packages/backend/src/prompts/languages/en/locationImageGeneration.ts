/**
 * Location image generation prompt
 * Source: https://deepinfra.com/blog/flux1-dev-guide
 */
// Original user description: "${originalPrompt}"
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

${name}, ${filterText}.

Visual details: ${looks}.

Atmosphere: ${atmosphere}.

${mood ? 'Mood: ' + mood + '.' : ''}

If water is present, depict it as calm and still if nothing else is specified.

${qualityPrompt}`;
};
