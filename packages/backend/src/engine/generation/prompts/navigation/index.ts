/**
 * Navigation Prompts
 * Exports navigation-related prompt generation functions and types
 */

export { intentClassifierPrompt, INTENT_CLASSIFIER_STATIC } from './intentClassifier';
export type { IntentClassifierRequest } from './intentClassifier';
// Note: nicheImagePrompt removed - now using composeImagePrompt in createNodePipeline
export { destinationAnalysisPrompt, destinationAnalysisDynamic, DESTINATION_ANALYSIS_STATIC } from './destinationAnalysis';
export { 
  structureAnalysisPrompt, 
  structureAnalysisDynamic, 
  STRUCTURE_ANALYSIS_STATIC 
} from './structureAnalysis';
export type { StructureAnalysisInput } from './structureAnalysis';
