/**
 * English language prompts - aggregated exports
 */

import type { PromptTemplates } from '../../types';
import { blackListCharacterNames, morfeumVibes, qualityPrompt } from './constants';
import { chatSystemMessage } from './chatSystemMessage';
import { chatCharacterImpersonation } from './chatCharacterImpersonation';
import { sampleCharacterPrompts } from '../../../engine/generation/prompts/samples/sampleCharacterPrompts';
import { sampleLocationPrompts } from '../../../engine/generation/prompts/samples/sampleLocationPrompts';
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
  sampleCharacterPrompts,
  sampleLocationPrompts,
  navigatorSemanticNodeSelector,
  generateViewDescriptions,
  characterProfileGenerationUserMessage,
  locationProfileGenerationUserMessage,
  basicEntityDataFormatting,
  enhancedEntityDataFormatting,
};
