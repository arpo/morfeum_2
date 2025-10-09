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
  | 'characterVisualAnalysis'
  | 'locationVisualAnalysis'
  | 'deepProfileEnrichment'
  | 'sampleEntityPrompts'
  | 'locationSeedGeneration'
  | 'locationImageGeneration'
  | 'locationDeepProfileEnrichment'
  | 'sampleLocationPrompts';

export type Language = 'en';

export interface FluxFilter {
  name: string;
  text: string;
  description: string;
}

export interface PromptTemplates {
  blackListCharacterNames: string;
  entitySeedGeneration: (textPrompt: string) => string;
  entityImageGeneration: (originalPrompt: string, name: string, looks: string, wearing: string, personality?: string, presence?: string, setting?: string, filterName?: string) => string;
  morfeumVibes: string;
  qualityPrompt: string;
  chatSystemMessage: string;
  chatCharacterImpersonation: (entityData: string) => string;
  characterVisualAnalysis: (name: string, looks: string, wearing: string, personality: string, presence?: string) => string;
  locationVisualAnalysis: (name: string, looks: string, atmosphere: string, mood: string) => string;
  deepProfileEnrichment: (seedJson: string, visionJson: string, originalPrompt: string) => string;
  sampleEntityPrompts: string[];
  locationSeedGeneration: (textPrompt: string) => string;
  locationImageGeneration: (originalPrompt: string, name: string, looks: string, atmosphere: string, mood?: string, filterName?: string) => string;
  locationDeepProfileEnrichment: (seedJson: string, visionJson: string, originalPrompt: string) => string;
  sampleLocationPrompts: string[];
}
