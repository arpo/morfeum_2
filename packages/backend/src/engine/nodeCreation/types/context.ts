/**
 * DNA Context Types
 * 
 * Types for DNA inheritance and parent context.
 */

import type { NodeDNA } from '../../hierarchyAnalysis/types';
import type { NodeType } from './nodes';

// =============================================================================
// DNA CONTEXT
// =============================================================================

/**
 * Parent context for DNA inheritance
 * Includes FULL parent node data for rich child generation
 */
export interface ParentDNAContext {
  // Parent identity
  name?: string;
  description?: string;
  type?: NodeType;
  
  // Full DNA fields (all 23+)
  looks?: string;
  colorsAndLighting?: string;
  atmosphere?: string;
  materials?: string;
  mood?: string;
  sounds?: string;
  spatialLayout?: string;
  primary_surfaces?: string;
  secondary_surfaces?: string;
  accent_features?: string;
  dominant?: string;
  secondary?: string;
  accent?: string;
  ambient?: string;
  
  // Cascading fields
  genre?: string;
  architectural_tone?: string;
  cultural_tone?: string;
  materials_base?: string;
  mood_baseline?: string;
  palette_bias?: string;
  soundscape_base?: string;
  flora_base?: string;
  fauna_base?: string;
  
  // Structure data
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
  searchDesc?: string;
}

/**
 * Full parent context including node info
 */
export interface ParentContext {
  nodeId: string;
  nodeType: NodeType;
  nodeName: string;
  dna?: NodeDNA | Partial<NodeDNA>;
}
