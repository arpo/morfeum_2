import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { StateCreator } from 'zustand';
import { createEntityManagerSlice, type EntityManagerSlice } from './slices/entityManagerSlice';
import { createEntityUISlice, type EntityUISlice } from './slices/entityUISlice';
import { createSpawnSlice, type SpawnSlice } from './slices/spawnSlice';
import { createMediaSlice, type MediaSlice } from './slices/mediaSlice';
import type { WorldViewRenderer } from '@/features/app/components/WorldView/WorldViewRenderer';

// Combined store interface
export interface CombinedStore extends EntityManagerSlice, EntityUISlice, SpawnSlice, MediaSlice {
  // Theme is handled by separate useThemeStore for persistence
  
  // WorldView renderer reference (for image capture, etc.)
  worldViewRendererRef: WorldViewRenderer | null;
  setWorldViewRendererRef: (renderer: WorldViewRenderer | null) => void;
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
      
      // Media slice (upscaling state)
      ...createMediaSlice(...a),
      
      // WorldView renderer reference
      worldViewRendererRef: null,
      setWorldViewRendererRef: (renderer) => a[0]({ worldViewRendererRef: renderer }),
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
