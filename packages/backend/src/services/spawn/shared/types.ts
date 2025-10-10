/**
 * Shared types for spawn pipeline managers
 */

export interface ImageResult {
  imageUrl: string;
  imagePrompt: string;
}

export interface PipelineTimings {
  seedGeneration: number;
  imageGeneration: number;
  visualAnalysis: number;
  profileEnrichment: number;
}

export interface PipelineResult {
  seed: any;
  imageUrl: string;
  imagePrompt: string;
  visualAnalysis: any;
  deepProfile: any;
  timings: PipelineTimings;
}
