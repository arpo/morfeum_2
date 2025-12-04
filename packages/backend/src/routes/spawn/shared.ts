/**
 * Shared state and utilities for spawn routes
 */

// Track pipeline configurations for SSE initialization
export const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

/**
 * Generate a unique spawn ID with prefix
 */
export function generateSpawnId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
