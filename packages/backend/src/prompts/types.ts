/**
 * Prompt types and interfaces
 */

export type PromptKey = 
  | 'chatSystemMessage'
  | 'chatCharacterImpersonation'
  | 'morfeumVibes'
  | 'qualityPrompt'
  | 'sampleCharacterPrompts'
  | 'sampleLocationPrompts'
  | 'generateViewDescriptions'
  | 'characterProfileGenerationUserMessage'
  | 'locationProfileGenerationUserMessage'
  | 'basicEntityDataFormatting'
  | 'enhancedEntityDataFormatting'

export type Language = 'en';

export interface FluxFilter {
  name: string;
  text: string;
  description: string;
}

export interface PromptTemplates {
  blackListCharacterNames: string;
  morfeumVibes: string;
  qualityPrompt: string;
  chatSystemMessage: string;
  chatCharacterImpersonation: (entityData: string) => string;
  sampleCharacterPrompts: string[];
  sampleLocationPrompts: string[];
  navigatorSemanticNodeSelector: (userCommand: string, currentFocus: any, currentLocationDetails: any, allNodes: any[]) => string;
  generateViewDescriptions: (seedJson: string, visualAnalysisJson: string, renderInstructions: string) => string;
  characterProfileGenerationUserMessage: string;
  locationProfileGenerationUserMessage: string;
  basicEntityDataFormatting: (name: string, looks: string, wearing: string, personality: string) => string;
  enhancedEntityDataFormatting: (deepProfile: any) => string;
}
