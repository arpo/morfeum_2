/**
 * Prompt types and interfaces
 */

export type PromptKey = 
  | 'chatSystemMessage'
  | 'chatCharacterImpersonation'
  | 'entitySeedGeneration'
  | 'entityImageGeneration'
  | 'visualAnalysis'
  | 'deepProfileEnrichment'
  | 'sampleEntityPrompts';

export type Language = 'en';

export interface PromptTemplates {
  entitySeedGeneration: (textPrompt: string) => string;
  entityImageGeneration: (looks: string, wearing: string) => string;
  chatSystemMessage: string;
  chatCharacterImpersonation: (entityData: string) => string;
  visualAnalysis: (looks: string, wearing: string) => string;
  deepProfileEnrichment: (seedJson: string, visionJson: string) => string;
  sampleEntityPrompts: string[];
}
