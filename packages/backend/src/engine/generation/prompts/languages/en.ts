/**
 * English language prompts - aggregated exports
 */

import type { PromptTemplates } from '../types';
import { blackListCharacterNames, morfeumVibes, qualityPrompt } from '../shared/constants';
import { chatSystemMessage } from '../chat/chatSystemMessage';
import { chatCharacterImpersonation } from '../chat/chatCharacterImpersonation';
import { sampleCharacterPrompts } from '../samples/sampleCharacterPrompts';
import { sampleLocationPrompts } from '../samples/sampleLocationPrompts';
import { navigatorSemanticNodeSelector } from '../navigation/navigatorSemanticNodeSelector';
import { characterProfileGenerationUserMessage, locationProfileGenerationUserMessage } from '../chat/profileGenerationUserMessages';
import { basicEntityDataFormatting, enhancedEntityDataFormatting } from '../chat/entityDataFormatting';

// Export flux filters for external use
export { fluxFilters, getFluxFilter, getDefaultFluxFilter, type FluxFilter } from '../shared/fluxFilters';

export const en: PromptTemplates = {
  blackListCharacterNames,
  morfeumVibes,
  qualityPrompt,
  chatSystemMessage,
  chatCharacterImpersonation,
  sampleCharacterPrompts,
  sampleLocationPrompts,
  navigatorSemanticNodeSelector,
  characterProfileGenerationUserMessage,
  locationProfileGenerationUserMessage,
  basicEntityDataFormatting,
  enhancedEntityDataFormatting,
};
