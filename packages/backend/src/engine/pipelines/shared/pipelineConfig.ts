/**
 * Pipeline Configuration
 * SINGLE SOURCE OF TRUTH for all pipeline steps and navigation intent mappings
 */

export interface PipelineStep {
  id: string;
  name: string;
  duration: number;
}

/**
 * Step definitions for each pipeline type
 * Durations are in milliseconds, rounded up from actual timing logs
 */
export const PIPELINE_STEPS = {
  worldTree: [
    { id: 'hierarchy_classification', name: 'Analyzing Structure', duration: 2000 },
    { id: 'deepest_dna_generation', name: 'Creating DNA', duration: 10000 },
    { id: 'image_prompt_generation', name: 'Crafting Visual', duration: 3000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2500 },
    { id: 'parent_dna_generation', name: 'Building World', duration: 9000 },
    { id: 'tree_building', name: 'Finalizing', duration: 500 }
  ],
  
  character: [
    { id: 'seed_generation', name: 'Creating Seed', duration: 3000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'visual_analysis', name: 'Analyzing Appearance', duration: 4000 },
    { id: 'profile_enrichment', name: 'Building Profile', duration: 5000 }
  ],
  
  // Navigation intent pipeline (generic - most intents use this)
  navigation: [
    { id: 'prompt_generation', name: 'Planning Scene', duration: 2000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'dna_generation', name: 'Creating DNA', duration: 6000 },
    { id: 'node_building', name: 'Building Space', duration: 1000 }
  ]
} as const;

/**
 * Navigation Intent Registry
 * Maps intent names to pipeline types
 * ADD NEW INTENTS HERE - this is the ONLY place you need to update
 */
export const NAVIGATION_INTENT_REGISTRY = {
  'GO_INSIDE': 'navigation',
} as const;

export type PipelineType = keyof typeof PIPELINE_STEPS;
export type NavigationIntent = keyof typeof NAVIGATION_INTENT_REGISTRY;

/**
 * Get pipeline type for a navigation intent
 * Automatically falls back to 'navigation' for unknown intents
 */
export function getPipelineTypeForIntent(intent: string): PipelineType {
  return (NAVIGATION_INTENT_REGISTRY as any)[intent] || 'navigation';
}

/**
 * Get steps for a pipeline type
 */
export function getStepsForPipeline(pipelineType: PipelineType): readonly PipelineStep[] {
  return PIPELINE_STEPS[pipelineType];
}
