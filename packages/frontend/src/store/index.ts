import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { createSpawnManagerSlice, type SpawnManagerSlice } from './slices/spawnManagerSlice';
import { createChatManagerSlice, type ChatManagerSlice } from './slices/chatManagerSlice';

// Combined store interface
export interface CombinedStore extends SpawnManagerSlice, ChatManagerSlice {
  // Theme is handled by separate useThemeStore for persistence
}

// Create the store with slices
export const useStore = create<CombinedStore>()(
  devtools(
    (...a) => ({
      // Spawn manager slice
      ...createSpawnManagerSlice(...a),
      
      // Chat manager slice
      ...createChatManagerSlice(...a),
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
