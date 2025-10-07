/**
 * English language prompts - aggregated exports
 */

import type { PromptTemplates } from '../../types';
import { blackListCharacterNames, morfeumVibes, qualityPrompt } from './constants';
import { chatSystemMessage } from './chatSystemMessage';
import { chatCharacterImpersonation } from './chatCharacterImpersonation';
import { entitySeedGeneration } from './entitySeedGeneration';
import { entityImageGeneration } from './entityImageGeneration';
import { visualAnalysis } from './visualAnalysis';
import { deepProfileEnrichment } from './deepProfileEnrichment';
import { sampleEntityPrompts } from './sampleEntityPrompts';

export const en: PromptTemplates = {
  blackListCharacterNames,
  morfeumVibes,
  qualityPrompt,
  chatSystemMessage,
  chatCharacterImpersonation,
  entitySeedGeneration,
  entityImageGeneration,
  visualAnalysis,
  deepProfileEnrichment,
  sampleEntityPrompts
};
