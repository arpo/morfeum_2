/**
 * Shared utilities for navigation routes
 */

// Track pipeline configurations for SSE initialization
export const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

/**
 * Generate unique operation ID
 */
export function generateOperationId(prefix: string = 'op'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
