/**
 * Media Slice
 * Tracks media operation states like upscaling per entity
 */

import type { StateCreator } from 'zustand';

export interface MediaSlice {
  // Set of entity IDs currently being upscaled
  upscalingEntityIds: Set<string>;
  
  // Actions
  startUpscaling: (entityId: string) => void;
  finishUpscaling: (entityId: string) => void;
  isEntityUpscaling: (entityId: string) => boolean;
}

export const createMediaSlice: StateCreator<MediaSlice, [], [], MediaSlice> = (set, get) => ({
  upscalingEntityIds: new Set(),
  
  startUpscaling: (entityId: string) => {
    set((state) => {
      const newSet = new Set(state.upscalingEntityIds);
      newSet.add(entityId);
      return { upscalingEntityIds: newSet };
    });
  },
  
  finishUpscaling: (entityId: string) => {
    set((state) => {
      const newSet = new Set(state.upscalingEntityIds);
      newSet.delete(entityId);
      return { upscalingEntityIds: newSet };
    });
  },
  
  isEntityUpscaling: (entityId: string) => {
    return get().upscalingEntityIds.has(entityId);
  }
});
