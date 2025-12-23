/**
 * Prompt Enhancer Templates
 * 
 * This file now serves as a facade, re-exporting from focused modules.
 */

// Re-export instruction templates
export {
  navigableElementsInteriorInstructions,
  navigableElementsExteriorInstructions,
  furnishingInstructions,
  exteriorNicheInstructions,
  openAirInstructions,
  facadeInstructions
} from './instructionTemplates';

// Re-export prompt builder and type
export {
  buildEnhancerPrompt,
  type EnhancerPerspective
} from './enhancerPromptBuilder';
