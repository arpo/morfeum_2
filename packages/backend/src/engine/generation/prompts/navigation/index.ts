/**
 * Navigation Prompts
 * Exports navigation-related prompt generation functions and types
 */

export { intentClassifierPrompt } from './intentClassifier';
export type { IntentClassifierRequest } from './intentClassifier';
// Note: nicheImagePrompt removed - now using composeImagePrompt in createNodePipeline
export { destinationAnalysisPrompt } from './destinationAnalysis';
