import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { createSpawnManagerSlice, type SpawnManagerSlice } from './slices/spawnManagerSlice';
import { createChatManagerSlice, type ChatManagerSlice } from './slices/chatManagerSlice';

// Combined store interface
export interface CombinedStore extends SpawnManagerSlice, ChatManagerSlice {
  // Add global state here as needed
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

// Create the store with slices
export const useStore = create<CombinedStore>()(
  devtools(
    (...a) => ({
      // Global state
      theme: 'light',
      setTheme: (theme) => a[0]({ theme }),
      
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
