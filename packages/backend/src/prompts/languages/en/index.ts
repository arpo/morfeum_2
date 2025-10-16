/**
 * English language prompts - aggregated exports
 */

import type { PromptTemplates } from '../../types';
import { blackListCharacterNames, morfeumVibes, qualityPrompt } from './constants';
import { chatSystemMessage } from './chatSystemMessage';
import { chatCharacterImpersonation } from './chatCharacterImpersonation';
import { characterSeedGeneration } from './characterSeedGeneration';
import { characterImageGeneration } from './characterImageGeneration';
import { characterVisualAnalysis } from './characterVisualAnalysis';
import { locationVisualAnalysis } from './locationVisualAnalysis';
import { characterDeepProfileEnrichment } from './characterDeepProfileEnrichment';
import { sampleCharacterPrompts } from './sampleCharacterPrompts';
import { locationSeedGeneration } from './locationSeedGeneration';
import { locationImageGeneration } from './locationImageGeneration';
import { generateNewWorldDNA } from './locationDeepProfileEnrichment';
import { sampleLocationPrompts } from './sampleLocationPrompts';
import { navigatorSemanticNodeSelector } from './navigatorSemanticNodeSelector';
import { generateViewDescriptions } from './generateViewDescriptions';
import { characterProfileGenerationUserMessage, locationProfileGenerationUserMessage } from './profileGenerationUserMessages';
import { basicEntityDataFormatting, enhancedEntityDataFormatting } from './entityDataFormatting';

// Export flux filters for external use
export { fluxFilters, getFluxFilter, getDefaultFluxFilter, type FluxFilter } from './fluxFilters';

export const en: PromptTemplates = {
  blackListCharacterNames,
  morfeumVibes,
  qualityPrompt,
  chatSystemMessage,
  chatCharacterImpersonation,
  characterSeedGeneration,
  characterImageGeneration,
  characterVisualAnalysis,
  locationVisualAnalysis,
  characterDeepProfileEnrichment,
  sampleCharacterPrompts,
  locationSeedGeneration,
  locationImageGeneration,
  locationDeepProfileEnrichment: generateNewWorldDNA,
  sampleLocationPrompts,
  navigatorSemanticNodeSelector,
  generateViewDescriptions,
  characterProfileGenerationUserMessage,
  locationProfileGenerationUserMessage,
  basicEntityDataFormatting,
  enhancedEntityDataFormatting
};
