/**
 * Stage timing configurations for different entity types
 * Values in milliseconds - these match average backend timings
 */

export interface StageTimings {
  [stage: string]: number;
}

export interface EntityTimings {
  [entityType: string]: StageTimings;
}

export const STAGE_TIMINGS: EntityTimings = {
  character: {
    starting: 3500,             // Initial spawn - same as generating_seed
    generating_seed: 3500,      // ~2.15s average
    generating_image: 2100,     // ~2.09s average
    analyzing: 4500,            // ~2.77s average
    enriching: 4200,            // ~3.93s average
    completed: 200              // Quick jump to 100%
  },
  location: {
    starting: 2500,
    generating_seed: 2500,      // Old location system (deprecated)
    classifying: 3000,          // Hierarchy: Structure analysis
    generating_dna: 8000,       // Hierarchy: DNA generation (multiple nodes)
    generating_image: 5000,     // Hierarchy: Image generation with Flux
    analyzing: 3000,            // Old location system
    enriching: 4200,            // Old location system
    completed: 200              // Quick jump to 100%
  },
  sublocation: {
    starting: 1800,
    generating_seed: 1800,      // Sublocations are faster
    generating_flux_prompt: 1500,
    generating_image: 2000,
    completed: 200              // Quick jump to 100%
  }
};

/**
 * Get transition duration for a specific stage and entity type
 */
export function getTransitionDuration(
  status: string,
  entityType: 'character' | 'location' | 'sublocation' = 'character'
): number {
  const timings = STAGE_TIMINGS[entityType];
  return timings?.[status] || 1000; // Default to 1s if not found
}
