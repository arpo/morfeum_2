/**
 * Prompt types and interfaces
 */

export type PromptKey = 
  | 'chatSystemMessage'
  | 'chatCharacterImpersonation'
  | 'entitySeedGeneration'
  | 'entityImageGeneration'
  | 'morfeumVibes'
  | 'qualityPrompt'
  | 'visualAnalysis'
  | 'deepProfileEnrichment'
  | 'sampleEntityPrompts';

export type Language = 'en';

export interface PromptTemplates {
  blackListCharacterNames: string;
  entitySeedGeneration: (textPrompt: string) => string;
  entityImageGeneration: (originalPrompt: string, name: string, looks: string, wearing: string, personality?: string, presence?: string, setting?: string) => string;
  morfeumVibes: string;
  qualityPrompt: string;
  chatSystemMessage: string;
  chatCharacterImpersonation: (entityData: string) => string;
  visualAnalysis: (name: string, looks: string, wearing: string, personality: string, presence?: string) => string;
  deepProfileEnrichment: (seedJson: string, visionJson: string) => string;
  sampleEntityPrompts: string[];
}
