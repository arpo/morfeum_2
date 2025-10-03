import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StateCreator } from 'zustand';

// Combined store interface
export interface CombinedStore {
  // Add global state here as needed
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
}

// Create the store
export const useStore = create<CombinedStore>()(
  devtools(
    (set, get) => ({
      // Initial state
      theme: 'light',
      
      // Actions
      setTheme: (theme) => set({ theme }),
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
