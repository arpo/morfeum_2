import type { StateCreator } from 'zustand';
import type { SpawnProcess, SpawnSlice } from './spawnTypes';
import { monitorSpawnProgress } from './spawnHelpers';

// Re-export types for consumers
export type { SpawnStage, SpawnProcess, SpawnSlice } from './spawnTypes';

export const createSpawnSlice: StateCreator<any, [], [], SpawnSlice> = (set, get) => ({
  activeSpawns: [],

  startSpawn: async (prompt: string, entityType = 'character', options = true) => {
    // Handle niche or unsupported types gracefully or map them
    if (entityType === 'niche') {
        console.warn('Niche spawning not fully implemented in new engine yet. Falling back or ignoring.');
        // TODO: Implement niche spawning via API
        return 'niche-stub-id';
    }

    const endpoint = entityType === 'location' 
      ? '/api/spawn/location/start' 
      : '/api/spawn/engine/start';
      
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt, entityType }),
      });

      if (!response.ok) {
        throw new Error(`Failed to start spawn: ${response.statusText}`);
      }

      const result = await response.json();
      const { spawnId, eventsUrl } = result.data;

      const newProcess: SpawnProcess = {
        id: spawnId,
        prompt,
        entityType: entityType as 'character' | 'location',
        status: 'processing',
        progress: 0,
        currentStage: 'Initializing...',
        logs: ['Spawn initiated'],
        stages: [],
        eventsUrl
      };

      set((state: any) => ({
        activeSpawns: [...state.activeSpawns, newProcess]
      }));

      // Establish SSE connection using shared helper
      if (eventsUrl) {
        monitorSpawnProgress(spawnId, eventsUrl, get);
      }

      return spawnId;
    } catch (error: any) {
      console.error('Start spawn failed:', error);
      throw error;
    }
  },

  registerExternalSpawn: (
    id: string, 
    eventsUrl: string, 
    prompt: string, 
    entityType: 'character' | 'location' | 'niche',
    onComplete?: (data: any) => void,
    onError?: (error: any) => void
  ) => {
    const newProcess: SpawnProcess = {
        id,
        prompt,
        entityType,
        status: 'processing',
        progress: 0,
        currentStage: 'Initializing...',
        logs: ['External spawn registered'],
        stages: [],
        eventsUrl
    };

    set((state: any) => ({
        activeSpawns: [...state.activeSpawns, newProcess]
    }));

    // Establish SSE connection using shared helper
    monitorSpawnProgress(id, eventsUrl, get, { onComplete, onError });
  },

  cancelSpawn: async (spawnId: string) => {
    try {
      await fetch(`/api/spawn/${spawnId}`, { method: 'DELETE' });
      set((state: any) => ({
        activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
          p.id === spawnId ? { ...p, status: 'cancelled' } : p
        )
      }));
    } catch (error) {
      console.error('Cancel spawn failed:', error);
    }
  },

  updateSpawnProgress: (spawnId, update) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, ...update } : p
      )
    }));
  },

  addSpawnLog: (spawnId, message) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, logs: [...p.logs, message] } : p
      )
    }));
  },

  completeSpawn: (spawnId, result) => {
    // This is now handled by handleSpawnCompletion in SSE listener
    // Keeping method for compatibility, but logic moved to utilities
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, status: 'completed', progress: 100, result, currentStage: 'Completed' } : p
      )
    }));
  },

  failSpawn: (spawnId, error) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.map((p: SpawnProcess) => 
        p.id === spawnId ? { ...p, status: 'failed', error } : p
      )
    }));
  },

  removeSpawn: (spawnId) => {
    set((state: any) => ({
      activeSpawns: state.activeSpawns.filter((p: SpawnProcess) => p.id !== spawnId)
    }));
  }
});
