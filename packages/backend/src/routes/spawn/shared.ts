/**
 * Shared state and utilities for spawn routes
 */

import { createSpawnManager } from '../../services/spawn';

// Store spawn managers per API key (in production, consider a more robust solution)
export const spawnManagers = new Map<string, ReturnType<typeof createSpawnManager>>();

// Track active pipeline abort controllers by spawnId
export const activeAbortControllers = new Map<string, AbortController>();

// Track pipeline configurations for SSE initialization
export const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

/**
 * Get or create spawn manager for the current API key
 */
export function getSpawnManager(apiKey: string): ReturnType<typeof createSpawnManager> {
  if (!spawnManagers.has(apiKey)) {
    spawnManagers.set(apiKey, createSpawnManager(apiKey));
  }
  return spawnManagers.get(apiKey)!;
}
