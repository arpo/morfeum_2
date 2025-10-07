/**
 * Spawn Service Module
 * Exports SpawnManager and related types
 */

import { SpawnManager } from './SpawnManager';

export { SpawnManager };
export type { SpawnProcess, EntitySeed, VisualAnalysis, DeepProfile } from './types';

// Factory function for backward compatibility
export function createSpawnManager(mzooApiKey: string) {
  return new SpawnManager(mzooApiKey);
}
