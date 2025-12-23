/**
 * Navigation Helpers
 * Shared utility functions for navigation operations
 * 
 * This file now serves as a facade, re-exporting functions from focused utility modules.
 */

// Re-export tree traversal utilities
export { findHostForRegion, addChildToWorldTree } from './utils/treeTraversal';

// Re-export parent resolution utilities
export {
  findParentLocationNode,
  findParentRegionNode,
  createRegionSpec,
  createLocationSpec,
  createNicheSpec
} from './utils/parentResolution';

// Re-export DNA resolution utilities
export {
  resolveNavigationParentDNA,
  shouldRunDestinationAnalysis,
  type DNAResolutionResult
} from './utils/dnaResolution';
