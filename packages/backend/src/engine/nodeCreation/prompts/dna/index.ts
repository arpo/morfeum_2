/**
 * DNA Prompts Index
 * 
 * Exports all DNA generation prompts and a unified getter function.
 */

import type { NodeType, ParentDNAContext, ScenePerspective } from '../../types';
import { hostDNAPrompt } from './hostDNA';
import { regionDNAPrompt } from './regionDNA';
import { locationDNAPrompt } from './locationDNA';
import { nicheDNAPrompt } from './nicheDNA';

// Export individual prompts
export { hostDNAPrompt } from './hostDNA';
export { regionDNAPrompt } from './regionDNA';
export { locationDNAPrompt } from './locationDNA';
export { nicheDNAPrompt } from './nicheDNA';

/**
 * Get the appropriate DNA prompt for a node type
 * 
 * @param nodeType - Type of node to generate DNA for
 * @param description - User description of the node
 * @param options - Additional options
 * @returns Prompt string for LLM
 */
export function getNodeDNAPrompt(
  nodeType: NodeType,
  description: string,
  options?: {
    parentContext?: ParentDNAContext;
    perspective?: ScenePerspective;
  }
): string {
  const { parentContext, perspective = 'exterior' } = options || {};

  switch (nodeType) {
    case 'host':
      return hostDNAPrompt(description);
    case 'region':
      return regionDNAPrompt(description, parentContext);
    case 'location':
      return locationDNAPrompt(description, parentContext);
    case 'niche':
      return nicheDNAPrompt(description, perspective, parentContext);
    default:
      throw new Error(`Unknown node type: ${nodeType}`);
  }
}
