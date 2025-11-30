/**
 * Entity UI Slice
 * Handles UI state: panel open/close, explorer toggle, focus mode
 */

import type { StateCreator } from 'zustand';

export interface EntityUISlice {
  entityPanelOpen: Map<string, boolean>;
  entityExplorerPanelOpen: boolean;
  spawnInputMinimized: boolean;
  focusModeEnabled: boolean;

  openEntityPanel: (entityId: string) => void;
  closeEntityPanel: (entityId: string) => void;
  isEntityPanelOpen: (entityId: string) => boolean;
  toggleEntityExplorerPanel: () => void;
  toggleSpawnInput: () => void;
  toggleFocusMode: () => void;
}

export const createEntityUISlice: StateCreator<EntityUISlice> = (set, get) => ({
  entityPanelOpen: new Map(),
  entityExplorerPanelOpen: localStorage.getItem('entityExplorerPanelOpen') !== 'false',
  spawnInputMinimized: localStorage.getItem('spawnInputMinimized') === 'true',
  focusModeEnabled: false,

  openEntityPanel: (entityId: string) => {
    set((state) => {
      const newEntityPanelOpen = new Map(state.entityPanelOpen);
      newEntityPanelOpen.set(entityId, true);
      return { entityPanelOpen: newEntityPanelOpen };
    });
  },

  closeEntityPanel: (entityId: string) => {
    set((state) => {
      const newEntityPanelOpen = new Map(state.entityPanelOpen);
      newEntityPanelOpen.set(entityId, false);
      return { entityPanelOpen: newEntityPanelOpen };
    });
  },

  isEntityPanelOpen: (entityId: string) => {
    return get().entityPanelOpen.get(entityId) || false;
  },

  toggleEntityExplorerPanel: () => {
    set((state) => {
      const newState = !state.entityExplorerPanelOpen;
      localStorage.setItem('entityExplorerPanelOpen', String(newState));
      return { entityExplorerPanelOpen: newState };
    });
  },

  toggleSpawnInput: () => {
    set((state) => {
      const newState = !state.spawnInputMinimized;
      localStorage.setItem('spawnInputMinimized', String(newState));
      return { spawnInputMinimized: newState };
    });
  },

  toggleFocusMode: () => {
    set((state) => ({ focusModeEnabled: !state.focusModeEnabled }));
  }
});
