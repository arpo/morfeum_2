/**
 * Prompt types and interfaces
 */

export type PromptKey = 
  | 'chatSystemMessage'
  | 'chatCharacterImpersonation'
  | 'characterSeedGeneration'
  | 'characterImageGeneration'
  | 'morfeumVibes'
  | 'qualityPrompt'
  | 'characterVisualAnalysis'
  | 'locationVisualAnalysis'
  | 'characterDeepProfileEnrichment'
  | 'sampleCharacterPrompts'
  | 'locationSeedGeneration'
  | 'locationImageGeneration'
  | 'locationDeepProfileEnrichment'
  | 'sampleLocationPrompts'
  | 'generateViewDescriptions'
  | 'characterProfileGenerationUserMessage'
  | 'locationProfileGenerationUserMessage'
  | 'basicEntityDataFormatting'
  | 'enhancedEntityDataFormatting'
  | 'hierarchyCategorization'
  | 'nodeDNAGeneration'
  | 'hostAndRegionsDNA'
  | 'locationsAndNichesDNA';

export type Language = 'en';

export interface FluxFilter {
  name: string;
  text: string;
  description: string;
}

export interface PromptTemplates {
  blackListCharacterNames: string;
  characterSeedGeneration: (textPrompt: string) => string;
  characterImageGeneration: (originalPrompt: string, name: string, looks: string, wearing: string, personality?: string, presence?: string, setting?: string, filterName?: string) => string;
  morfeumVibes: string;
  qualityPrompt: string;
  chatSystemMessage: string;
  chatCharacterImpersonation: (entityData: string) => string;
  characterVisualAnalysis: (name: string, looks: string, wearing: string, personality: string, presence?: string) => string;
  locationVisualAnalysis: (name: string, looks: string, atmosphere: string, mood: string) => string;
  characterDeepProfileEnrichment: (seedJson: string, visionJson: string, originalPrompt: string) => string;
  sampleCharacterPrompts: string[];
  locationSeedGeneration: (textPrompt: string) => string;
  locationImageGeneration: (originalPrompt: string, name: string, looks: string, atmosphere: string, mood?: string, filterName?: string) => string;
  locationDeepProfileEnrichment: (seedJson: string, visionJson: string, originalPrompt: string, scopeHint?: string) => string;
  sampleLocationPrompts: string[];
  navigatorSemanticNodeSelector: (userCommand: string, currentFocus: any, currentLocationDetails: any, allNodes: any[]) => string;
  generateViewDescriptions: (seedJson: string, visualAnalysisJson: string, renderInstructions: string) => string;
  characterProfileGenerationUserMessage: string;
  locationProfileGenerationUserMessage: string;
  basicEntityDataFormatting: (name: string, looks: string, wearing: string, personality: string) => string;
  enhancedEntityDataFormatting: (deepProfile: any) => string;
  hierarchyCategorization: (userPrompt: string) => string;
  nodeDNAGeneration: (originalPrompt: string, nodeName: string, nodeType: string, nodeDescription: string, parentContext?: { architectural_tone?: string; cultural_tone?: string; dominant?: string; mood?: string }) => string;
  hostAndRegionsDNA: (originalPrompt: string, hostName: string, hostDescription: string, regions: Array<{ name: string; description: string }>) => string;
  locationsAndNichesDNA: (originalPrompt: string, regionName: string, mergedParentDNA: string, locations: Array<{ name: string; description: string; niches?: Array<{ name: string; description: string }> }>) => string;
}
