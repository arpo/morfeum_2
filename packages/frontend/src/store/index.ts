import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { createEntityManagerSlice, type EntityManagerSlice } from './slices/entityManagerSlice';
import { createEntityUISlice, type EntityUISlice } from './slices/entityUISlice';
import { createSpawnSlice, type SpawnSlice } from './slices/spawnSlice';

// Combined store interface
export interface CombinedStore extends EntityManagerSlice, EntityUISlice, SpawnSlice {
  // Theme is handled by separate useThemeStore for persistence
}

// Create the store with slices
export const useStore = create<CombinedStore>()(
  devtools(
    (...a) => ({
      // Entity manager slice (CRUD operations)
      ...createEntityManagerSlice(...a),
      
      // Entity UI slice (panel state, focus mode)
      ...createEntityUISlice(...a),
      
      // Spawn slice
      ...createSpawnSlice(...a),
    }),
    {
      name: 'morfeum-store',
    }
  )
);

// Type helper for creating slices
export type StoreState = ReturnType<typeof useStore.getState>;
export type StoreSetter = typeof useStore.setState;
export type StoreGetter = typeof useStore.getState;

// Export the StateCreator type for slice creation
export type { StateCreator };
