/**
 * Prompt types and interfaces
 */

export type PromptKey = 
  | 'entitySeedGeneration'
  | 'chatSystemMessage'
  | 'sampleEntityPrompts';

export type Language = 'en';

export interface PromptTemplates {
  entitySeedGeneration: (textPrompt: string) => string;
  chatSystemMessage: string;
  sampleEntityPrompts: string[];
}
