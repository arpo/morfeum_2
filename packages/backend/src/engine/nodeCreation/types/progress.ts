/**
 * Progress Tracking Types
 * 
 * Types for tracking node creation progress.
 */

import type { NodeType } from './nodes';

// =============================================================================
// PROGRESS
// =============================================================================

/**
 * Step definition for progress tracking
 */
export interface ProgressStep {
  id: string;
  name: string;
  nodeType?: NodeType;
}

/**
 * Progress configuration for dynamic step display
 */
export interface ProgressConfig {
  steps: ProgressStep[];
  includeImage: boolean;
}
