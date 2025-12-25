/**
 * Prompt Input Types
 * 
 * Types for DNA and image prompt generation inputs.
 */

import type { Node } from './nodes';
import type { ScenePerspective } from './scene';
import type { ParentDNAContext } from './context';
import type { NodeType } from './nodes';

// =============================================================================
// PROMPT TEMPLATES
// =============================================================================

/**
 * DNA prompt input for generating node DNA
 */
export interface DNAPromptInput {
  description: string;
  nodeType: NodeType;
  nodeName: string;
  parentContext?: ParentDNAContext;
}

/**
 * Image prompt input for generating node image
 */
export interface ImagePromptInput {
  node: Node;
  perspective: ScenePerspective;
  parentChain: Node[];
}
