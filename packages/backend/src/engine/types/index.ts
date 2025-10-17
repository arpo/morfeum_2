/**
 * Core Engine Types
 * Simplified type definitions for the engine
 */

/**
 * Entity seed from initial generation
 */
export interface EntitySeed {
  name: string;
  looks: string;
  originalPrompt?: string;
  // Location-specific
  atmosphere?: string;
  mood?: string;
  renderInstructions?: string;
  scale_hint?: string;
  classification?: string;
  // Character-specific
  wearing?: string;
  personality?: string;
  presence?: string;
  setting?: string;
}

/**
 * Visual analysis from image
 */
export interface VisualAnalysis {
  looks: string;
  colorsAndLighting?: string;
  atmosphere?: string;
  vegetation?: string;
  architecture?: string;
  animals?: string;
  mood?: string;
  visualAnchors?: {
    dominantElements?: string[];
    spatialLayout?: string;
    surfaceMaterialMap?: string[];
    colorMapping?: string[];
    uniqueIdentifiers?: string[];
  };
  // Character-specific
  face?: string;
  hair?: string;
  body?: string;
  specificDetails?: string;
}

/**
 * Complete entity profile (deep enrichment)
 */
export interface DeepProfile {
  looks: string;
  colorsAndLighting?: string;
  atmosphere?: string;
  architectural_tone?: string;
  materials?: string;
  mood?: string;
  sounds?: string;
  visualAnchors?: any;
  searchDesc?: string;
  fictional?: boolean;
  copyright?: boolean;
  // Character-specific
  name?: string;
  wearing?: string;
  face?: string;
  body?: string;
  hair?: string;
  specificDetails?: string;
  style?: string;
  personality?: string;
  voice?: string;
  speechStyle?: string;
  gender?: string;
  nationality?: string;
  tags?: string[];
}

/**
 * Image generation result
 */
export interface ImageResult {
  imageUrl: string;
  imagePrompt: string;
}

/**
 * Pipeline timing information
 */
export interface PipelineTimings {
  seedGeneration: number;
  imageGeneration: number;
  visualAnalysis: number;
  profileEnrichment: number;
}
