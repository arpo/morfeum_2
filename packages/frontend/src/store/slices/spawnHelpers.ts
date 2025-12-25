/**
 * Spawn Slice Helpers
 * SSE monitoring and progress tracking utilities
 */

import { setupSSEConnection, getStepIndexFromStage } from '../../utils/spawn/sseConnection';
import { handleSpawnCompletion } from '../../utils/spawn/completionHandlers';
import type { SpawnProcess, SpawnSlice, SpawnCallbacks } from './spawnTypes';

/**
 * Helper to manage SSE callbacks and store updates
 * Monitors spawn progress via Server-Sent Events
 */
export const monitorSpawnProgress = (
  spawnId: string,
  eventsUrl: string,
  get: () => SpawnSlice,
  callbacks?: SpawnCallbacks
) => {
  setupSSEConnection(eventsUrl, spawnId, {
    onProgress: (id, data) => {
      const spawn = get().activeSpawns.find((s) => s.id === id);
      
      // Build update object - always start with current stage message
      const update: Partial<SpawnProcess> = {
        currentStage: data.message
      };
      
      // Check for image URL on EVERY progress event (not just in else branch)
      // SSE payload structure: { stage, message, data: { imageUrl: ... } }
      if (data.data && typeof data.data === 'object' && 'imageUrl' in data.data) {
        update.imageUrl = data.data.imageUrl;
      }
      
      // If this progress event includes steps, store them (happens on first event)
      if (data.steps && data.pipelineType) {
        update.pipelineType = data.pipelineType;
        update.steps = data.steps;
        // Initialize at 0 so progress bar appears immediately (instead of -1 which hides it)
        update.currentStepIndex = 0;
      } else if (spawn && spawn.steps) {
        // Calculate current step index from stage name
        const stepIndex = getStepIndexFromStage(data.stage, spawn.steps);
        // Only update if we got a valid step index (not -1)
        // This prevents 'started' events from overwriting the initial step index
        if (stepIndex >= 0) {
          update.currentStepIndex = stepIndex;
        }
      }
      
      get().updateSpawnProgress(id, update);
      get().addSpawnLog(id, data.message);
    },
    onCompleted: (id, data) => {
      const spawn = get().activeSpawns.find((s) => s.id === id);
      get().updateSpawnProgress(id, {
        status: 'completed',
        progress: 100,
        result: data.worldTree || data.character || data.node,
        currentStage: 'Completed',
        currentStepIndex: spawn?.steps ? spawn.steps.length - 1 : undefined
      });
      
      // Handle entity-specific completion (routing, cleanup, etc)
      handleSpawnCompletion(id, data, get());

      // External callback if provided
      if (callbacks?.onComplete) {
        callbacks.onComplete(data);
      }
    },
    onError: (id, data) => {
      get().failSpawn(id, data.message || 'Unknown error');
      if (callbacks?.onError) {
        callbacks.onError(data);
      }
    },
    onCancelled: (id) => {
      get().updateSpawnProgress(id, { status: 'cancelled' });
    }
  });
};
