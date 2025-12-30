/**
 * Engine Generation Exports
 * Character pipeline for new engine
 */

export {
  generateCharacterSeed,
  generateCharacterImage,
  analyzeCharacterImage,
  enrichCharacterProfile,
  runCharacterPipeline,
  generateInitialSystemPrompt,
  generateEnhancedSystemPrompt
} from '../pipelines/characterPipeline';

// Re-export prompts for testing
export {
  characterSeedPrompt,
  characterImagePrompt,
  characterVisualAnalysisPrompt,
  characterDeepProfilePrompt
} from './prompts/index';

// Image prompt generation (structured output)
export {
  generateImagePromptForNode,
  generateStructuredImagePrompt,
  assembleImagePrompt
} from './shared/imagePromptGeneration';

export type { ImagePromptStructure, AssemblePromptOptions } from './shared/imagePromptTypes';

// Image generation
export { generateLocationImage } from './shared/imageGeneration';
