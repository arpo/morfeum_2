/**
 * Spawn Manager Slice
 * Manages client-side spawn process tracking
 */

import type { StateCreator } from 'zustand';

export interface SpawnManagerSlice {
  activeSpawns: Map<string, { prompt: string; status: string; entityType: 'character' | 'location' }>;
  
  startSpawn: (prompt: string, entityType?: 'character' | 'location') => Promise<string>;
  cancelSpawn: (spawnId: string) => Promise<void>;
  updateSpawnStatus: (spawnId: string, status: string) => void;
  removeSpawn: (spawnId: string) => void;
}

export const createSpawnManagerSlice: StateCreator<SpawnManagerSlice> = (set, get) => ({
  activeSpawns: new Map(),

  startSpawn: async (prompt: string, entityType: 'character' | 'location' = 'character') => {
    try {
      const response = await fetch('/api/spawn/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ prompt, entityType })
      });

      if (!response.ok) {
        throw new Error(`Failed to start spawn: ${response.status}`);
      }

      const result = await response.json();
      const spawnId = result.data.spawnId;

      // Add to active spawns
      set((state) => {
        const newSpawns = new Map(state.activeSpawns);
        newSpawns.set(spawnId, { prompt, status: 'starting', entityType });
        return { activeSpawns: newSpawns };
      });

      // console.log('[SpawnManager] Started spawn:', spawnId, 'type:', entityType);
      return spawnId;
    } catch (error) {
      console.error('[SpawnManager] Failed to start spawn:', error);
      throw error;
    }
  },

  cancelSpawn: async (spawnId: string) => {
    try {
      const response = await fetch(`/api/spawn/${spawnId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        throw new Error(`Failed to cancel spawn: ${response.status}`);
      }

      // Remove from active spawns
      set((state) => {
        const newSpawns = new Map(state.activeSpawns);
        newSpawns.delete(spawnId);
        return { activeSpawns: newSpawns };
      });

      console.log('[SpawnManager] Cancelled spawn:', spawnId);
    } catch (error) {
      console.error('[SpawnManager] Failed to cancel spawn:', error);
      throw error;
    }
  },

  updateSpawnStatus: (spawnId: string, status: string) => {
    set((state) => {
      const spawn = state.activeSpawns.get(spawnId);
      if (!spawn) return state;

      const newSpawns = new Map(state.activeSpawns);
      newSpawns.set(spawnId, { ...spawn, status });
      return { activeSpawns: newSpawns };
    });
  },

  removeSpawn: (spawnId: string) => {
    set((state) => {
      const newSpawns = new Map(state.activeSpawns);
      newSpawns.delete(spawnId);
      return { activeSpawns: newSpawns };
    });
  }
});
