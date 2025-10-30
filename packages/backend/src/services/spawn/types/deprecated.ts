/**
 * Deprecated Types - Legacy types kept for backward compatibility
 * These types are maintained during migration but should not be used in new code
 * 
 * @deprecated Use types from location.ts instead
 */

import { WorldNode, RegionNode, LocationNode } from './location';

/**
 * @deprecated Use NodeDNA from location.ts instead
 * DEPRECATED: Old hierarchical structure (kept for compatibility during migration)
 */
export interface LocationDeepProfile {
  world: WorldNode;
  region?: RegionNode;
  location?: LocationNode;
}
