/**
 * Prompt Templates - Aggregated exports
 * Migrated from languages/en.ts (language abstraction removed as we only support English)
 */

import type { PromptTemplates } from '../types';
import { blackListCharacterNames, morfeumVibes, qualityPrompt } from './constants';
import { chatSystemMessage } from '../chat/chatSystemMessage';
import { chatCharacterImpersonation } from '../chat/chatCharacterImpersonation';
import { sampleCharacterPrompts } from '../samples/sampleCharacterPrompts';
import { sampleLocationPrompts } from '../samples/sampleLocationPrompts';
import { characterProfileGenerationUserMessage, locationProfileGenerationUserMessage } from '../chat/profileGenerationUserMessages';
import { basicEntityDataFormatting, enhancedEntityDataFormatting } from '../chat/entityDataFormatting';

// Export flux filters for external use
export { fluxFilters, getFluxFilter, getDefaultFluxFilter, type FluxFilter } from './fluxFilters';

export const promptTemplates: PromptTemplates = {
  blackListCharacterNames,
  morfeumVibes,
  qualityPrompt,
  chatSystemMessage,
  chatCharacterImpersonation,
  sampleCharacterPrompts,
  sampleLocationPrompts,
  characterProfileGenerationUserMessage,
  locationProfileGenerationUserMessage,
  basicEntityDataFormatting,
  enhancedEntityDataFormatting,
};
