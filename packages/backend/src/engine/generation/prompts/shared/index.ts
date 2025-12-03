/**
 * Shared Prompts & Utilities
 * Constants, filters, and instructions used across all generation types
 */

export { blackListCharacterNames, morfeumVibes, qualityPrompt } from './constants';
export { fluxFilters, getFluxFilter, getDefaultFluxFilter, type FluxFilter } from './fluxFilters';
export { renderInstructionsGuidance } from './fluxRenderInstructions';
export { visionDescriptionPrompt } from './visionDescription';

// DNA Schema - shared structure and field definitions
export {
  STRUCTURE_OPTIONS,
  buildStructureSchemaString,
  buildStructureField,
  DNA_SCENE_FIELDS,
  DNA_CASCADING_FIELDS,
  buildDNAFieldsString,
  DNA_GUIDELINES,
  buildGuidelines,
  type DNATemplateOptions
} from './dnaSchema';
