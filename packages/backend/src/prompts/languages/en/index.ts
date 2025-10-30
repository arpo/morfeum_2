/**
 * English language prompts - aggregated exports
 */

import type { PromptTemplates } from '../../types';
import { blackListCharacterNames, morfeumVibes, qualityPrompt } from '../../../engine/generation/prompts/shared/constants';
import { chatSystemMessage } from '../../../engine/generation/prompts/chat/chatSystemMessage';
import { chatCharacterImpersonation } from '../../../engine/generation/prompts/chat/chatCharacterImpersonation';
import { sampleCharacterPrompts } from '../../../engine/generation/prompts/samples/sampleCharacterPrompts';
import { sampleLocationPrompts } from '../../../engine/generation/prompts/samples/sampleLocationPrompts';
import { navigatorSemanticNodeSelector } from '../../../engine/generation/prompts/navigation/navigatorSemanticNodeSelector';
import { characterProfileGenerationUserMessage, locationProfileGenerationUserMessage } from '../../../engine/generation/prompts/chat/profileGenerationUserMessages';
import { basicEntityDataFormatting, enhancedEntityDataFormatting } from '../../../engine/generation/prompts/chat/entityDataFormatting';

// Export flux filters for external use
export { fluxFilters, getFluxFilter, getDefaultFluxFilter, type FluxFilter } from '../../../engine/generation/prompts/shared/fluxFilters';

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
