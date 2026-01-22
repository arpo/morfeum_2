/**
 * Media Slice
 * Tracks media operation states and progress per entity
 */

import type { StateCreator } from 'zustand';

export interface MediaProgress {
  entityId: string;
  progress: number;      // 0-100
  operation: 'upscaling' | 'video';
}

export interface MediaSlice {
  // Map of entity IDs to their media operation progress
  mediaProgress: Map<string, MediaProgress>;
  
  // Actions
  startMediaOperation: (entityId: string, operation: 'upscaling' | 'video') => void;
  updateMediaProgress: (entityId: string, progress: number) => void;
  finishMediaOperation: (entityId: string) => void;
  getMediaProgress: (entityId: string) => MediaProgress | undefined;
  
  // Backward compatibility helpers
  isEntityUpscaling: (entityId: string) => boolean;
  isEntityGeneratingVideo: (entityId: string) => boolean;
  getUpscalingEntityIds: () => Set<string>; // Function for backward compatibility
  upscalingEntityIds: Set<string>; // Cached value for selector usage
}

export const createMediaSlice: StateCreator<MediaSlice, [], [], MediaSlice> = (set, get) => ({
  mediaProgress: new Map(),
  upscalingEntityIds: new Set(), // Initialize as empty set
  
  startMediaOperation: (entityId: string, operation: 'upscaling' | 'video') => {
    set((state) => {
      const newMap = new Map(state.mediaProgress);
      newMap.set(entityId, { entityId, progress: 0, operation });
      // Update upscalingEntityIds set
      const newUpscalingIds = new Set<string>();
      newMap.forEach((progress, id) => {
        if (progress.operation === 'upscaling') {
          newUpscalingIds.add(id);
        }
      });
      return { mediaProgress: newMap, upscalingEntityIds: newUpscalingIds };
    });
  },
  
  updateMediaProgress: (entityId: string, progress: number) => {
    set((state) => {
      const current = state.mediaProgress.get(entityId);
      if (!current) return state;
      
      const newMap = new Map(state.mediaProgress);
      newMap.set(entityId, { ...current, progress });
      return { mediaProgress: newMap };
    });
  },
  
  finishMediaOperation: (entityId: string) => {
    set((state) => {
      const newMap = new Map(state.mediaProgress);
      newMap.delete(entityId);
      // Update upscalingEntityIds set
      const newUpscalingIds = new Set<string>();
      newMap.forEach((progress, id) => {
        if (progress.operation === 'upscaling') {
          newUpscalingIds.add(id);
        }
      });
      return { mediaProgress: newMap, upscalingEntityIds: newUpscalingIds };
    });
  },
  
  getMediaProgress: (entityId: string) => {
    return get().mediaProgress.get(entityId);
  },
  
  isEntityUpscaling: (entityId: string) => {
    const progress = get().mediaProgress.get(entityId);
    return progress?.operation === 'upscaling';
  },
  
  isEntityGeneratingVideo: (entityId: string) => {
    const progress = get().mediaProgress.get(entityId);
    return progress?.operation === 'video';
  },
  
  getUpscalingEntityIds: () => {
    const ids = new Set<string>();
    get().mediaProgress.forEach((progress, entityId) => {
      if (progress.operation === 'upscaling') {
        ids.add(entityId);
      }
    });
    return ids;
  }
});
