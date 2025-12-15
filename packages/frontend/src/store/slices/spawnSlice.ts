import type { StateCreator } from 'zustand';
import { setupSSEConnection, getStepIndexFromStage, type PipelineStep } from '../../utils/spawn/sseConnection';
import { handleSpawnCompletion } from '../../utils/spawn/completionHandlers';

export interface SpawnStage {
  name: string;
  message: string;
  timestamp: number;
}

export interface SpawnProcess {
  id: string;
  prompt: string;
  entityType: 'character' | 'location' | 'niche';
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled';
  progress: number;
  currentStage: string;
  logs: string[];
  stages: SpawnStage[];
  result?: any;
  eventsUrl?: string;
  imageUrl?: string;
  error?: string;
  // Progress bar fields
  pipelineType?: string;
  steps?: PipelineStep[];
  currentStepIndex?: number;
}

export interface SpawnSlice {
  activeSpawns: SpawnProcess[];
  
  startSpawn: (prompt: string, entityType?: 'character' | 'location' | 'niche', options?: any) => Promise<string>;
  registerExternalSpawn: (
    id: string, 
    eventsUrl: string, 
    prompt: string, 
    entityType: 'character' | 'location' | 'niche',
    onComplete?: (data: any) => void,
    onError?: (error: any) => void
  ) => void;
  cancelSpawn: (spawnId: string) => Promise<void>;
  updateSpawnProgress: (spawnId: string, update: Partial<SpawnProcess>) => void;
  addSpawnLog: (spawnId: string, message: string) => void;
  completeSpawn: (spawnId: string, result: any) => void;
  failSpawn: (spawnId: string, error: string) => void;
  removeSpawn: (spawnId: string) => void;
}

// Helper to manage SSE callbacks and store updates
const monitorSpawnProgress = (
    spawnId: string,
    eventsUrl: string,
    get: () => SpawnSlice,
    callbacks?: { onComplete?: (data: any) => void; onError?: (err: any) => void }
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
