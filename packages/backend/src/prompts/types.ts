/**
 * Prompt types and interfaces
 */

export type PromptKey = 
  | 'chatSystemMessage'
  | 'entitySeedGeneration'
  | 'entityImageGeneration'
  | 'sampleEntityPrompts';

export type Language = 'en';

export interface PromptTemplates {
  entitySeedGeneration: (textPrompt: string) => string;
  entityImageGeneration: (looks: string, wearing: string) => string;
  chatSystemMessage: string;
  sampleEntityPrompts: string[];
}
