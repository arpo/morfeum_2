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
    { id: 'deepest_dna_generation', name: 'Creating DNA', duration: 6000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2500 },
    { id: 'parent_dna_generation', name: 'Building World', duration: 9000 },
    { id: 'tree_building', name: 'Building Tree', duration: 500 },
    { id: 'media_assignment', name: 'Finalizing', duration: 500 }
  ],
  
  // Interior spawn pipeline: creates exterior hierarchy first, then GO_INSIDE for niche
  // Used when hierarchy_classification detects niche/interior intent
  worldTreeInterior: [
    { id: 'hierarchy_classification', name: 'Analyzing Structure', duration: 2000 },
    { id: 'location_dna_generation', name: 'Creating Location DNA', duration: 6000 },
    { id: 'parent_dna_generation', name: 'Building World', duration: 9000 },
    { id: 'tree_building', name: 'Building Tree', duration: 500 },
    { id: 'space_analysis', name: 'Analyzing Interior', duration: 3000 },
    { id: 'image_prompt', name: 'Composing Scene', duration: 1000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'node_building', name: 'Creating Interior', duration: 1000 }
  ],
  
  character: [
    { id: 'seed_generation', name: 'Creating Seed', duration: 3000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'visual_analysis', name: 'Analyzing Appearance', duration: 4000 },
    { id: 'profile_enrichment', name: 'Building Profile', duration: 5000 }
  ],
  
  // Navigation intent pipeline (generic - GO_INSIDE with simple prompts)
  // Uses the new unified space analysis (Structure + DNA in parallel)
  navigation: [
    { id: 'space_analysis', name: 'Analyzing Space', duration: 6000 },     // Structure + DNA in parallel
    { id: 'image_prompt', name: 'Composing Scene', duration: 3000 },       // Uses pre-computed data
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'node_building', name: 'Building Space', duration: 300 }
  ],
  
  // Navigation with destination analysis (GO_INSIDE with rich descriptions >20 chars)
  // Dynamically switched to via updatePipelineConfig() when rich description detected
  navigationWithDestination: [
    { id: 'destination_analysis', name: 'Analyzing Destination', duration: 2000 },  // Synthesizes user prompt with context
    { id: 'space_analysis', name: 'Analyzing Space', duration: 6000 },
    { id: 'image_prompt', name: 'Composing Scene', duration: 3000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'node_building', name: 'Building Space', duration: 300 }
  ],
  
  // GOTO pipeline - always includes destination analysis
  // Creates sibling nodes at same hierarchy level
  navigationGoto: [
    { id: 'destination_analysis', name: 'Analyzing Destination', duration: 2000 },  // Always runs for GOTO
    { id: 'space_analysis', name: 'Analyzing Space', duration: 6000 },
    { id: 'image_prompt', name: 'Composing Scene', duration: 3000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'node_building', name: 'Building Space', duration: 300 }
  ],
  
  // Legacy navigation pipeline (for backward compatibility during transition)
  navigationLegacy: [
    { id: 'prompt_generation', name: 'Planning Scene', duration: 2000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'dna_generation', name: 'Creating DNA', duration: 6000 },
    { id: 'node_building', name: 'Building Space', duration: 1000 }
  ],
  
  // Character creation from navigation (CREATE_CHARACTER_REAL / CREATE_CHARACTER_UNREAL)
  characterNavigation: [
    { id: 'prompt_engineering', name: 'Crafting Description', duration: 2500 },
    { id: 'seed_generation', name: 'Creating Seed', duration: 3000 },
    { id: 'scene_composition', name: 'Composing Scene', duration: 2000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2000 },
    { id: 'visual_analysis', name: 'Analyzing Appearance', duration: 4000 },
    { id: 'profile_enrichment', name: 'Building Profile', duration: 5000 }
  ],
  
  // VIEW command - generate image for existing node (save happens silently)
  view: [
    { id: 'generate', name: 'Generating Image', duration: 2500 }
  ],
  
  // EDIT_IMAGE command - edit existing image with text prompt
  edit: [
    { id: 'edit', name: 'Editing Image', duration: 6000 }
  ],
  
  // ============================================
  // V2 WORLD SYSTEM PIPELINES
  // TODO: Remove these and old pipelines when V2 is stable
  // ============================================
  
  /** V2: Create host node (DNA only, no image) */
  v2CreateHost: [
    { id: 'dna_generation', name: 'Creating Host DNA', duration: 2000 }
  ],
  
  /** V2: Create region node (DNA only, no image) */
  v2CreateRegion: [
    { id: 'dna_generation', name: 'Creating Region DNA', duration: 2000 }
  ],
  
  /** V2: Create location node (DNA + promptStructure in single call, no image) */
  v2CreateNode: [
    { id: 'dna_generation', name: 'Creating Location DNA', duration: 2000 }
  ],
  
  /** V2: Display command (LLM prompt generation + image generation) */
  v2Display: [
    { id: 'prompt_generation', name: 'Creating Image Prompt', duration: 4000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2500 }
  ],
  
  /** V2: Create full world with Host + Region + Location + auto-Display (single LLM call) */
  v2CreateWorldLocation: [
    { id: 'world_creation', name: 'Creating World', duration: 4000 },
    { id: 'saving', name: 'Saving World', duration: 500 },
    { id: 'prompt_generation', name: 'Creating Image Prompt', duration: 4000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2500 }
  ],
  
  /** V2: Create interior location as child of existing exterior location + auto-Display */
  v2CreateWorldLocationInterior: [
    { id: 'interior_creation', name: 'Creating Interior', duration: 3000 },
    { id: 'saving', name: 'Saving Interior', duration: 500 },
    { id: 'prompt_generation', name: 'Creating Image Prompt', duration: 4000 },
    { id: 'image_generation', name: 'Generating Image', duration: 2500 }
  ],
  
  /** V2: GO_INSIDE2 - Navigate into a space using image edit */
  v2GoInside: [
    { id: 'analyzing', name: 'Analyzing Location', duration: 1000 },
    { id: 'structure', name: 'Creating Entrance Structure', duration: 3000 },
    { id: 'image', name: 'Generating Space View', duration: 6000 },
    { id: 'saving', name: 'Saving Space', duration: 500 }
  ]
} as const;

/**
 * Navigation Intent Registry
 * Maps intent names to pipeline types
 * ADD NEW INTENTS HERE - this is the ONLY place you need to update
 */
export const NAVIGATION_INTENT_REGISTRY = {
  'GO_INSIDE': 'navigation',
  'GOTO': 'navigationGoto',
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
