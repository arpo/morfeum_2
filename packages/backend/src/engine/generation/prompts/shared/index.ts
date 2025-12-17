/**
 * Shared Prompts & Utilities
 * Constants, filters, and instructions used across all generation types
 */

export { blackListCharacterNames, morfeumVibes, qualityPrompt } from './constants';

// Element Rules - dominantElements and navigableElements definitions
export {
  DOMINANT_ELEMENTS_RULES,
  DOMINANT_ELEMENTS_EXAMPLE,
  DOMINANT_ELEMENTS_FORMAT,
  NAVIGABLE_ELEMENTS_RULES,
  NAVIGABLE_ELEMENTS_EXAMPLE
} from './elementRules';
export { fluxFilters, getFluxFilter, getDefaultFluxFilter, type FluxFilter } from './fluxFilters';
export { renderInstructionsGuidance } from './fluxRenderInstructions';
export { visionDescriptionPrompt } from './visionDescription';

// DNA Schema - shared field definitions
export {
  DNA_SCENE_FIELDS,
  DNA_CASCADING_FIELDS,
  buildDNAFieldsString,
  DNA_GUIDELINES,
  buildGuidelines,
  type DNATemplateOptions
} from './dnaSchema';
