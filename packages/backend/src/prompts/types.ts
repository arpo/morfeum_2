/**
 * Prompt types and interfaces
 */

export type PromptKey = 
  | 'entitySeedGeneration'
  | 'chatSystemMessage';

export type Language = 'en';

export interface PromptTemplates {
  entitySeedGeneration: (textPrompt: string) => string;
  chatSystemMessage: string;
}
