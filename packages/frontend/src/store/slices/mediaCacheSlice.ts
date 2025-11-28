/**
 * Media Cache Slice
 * 
 * Centralized cache for media URLs. Provides:
 * - Bulk loading of media on app startup
 * - Synchronous URL lookup (no async during navigation)
 * - Unified solution for characters, locations, and future entity types
 */

import { create } from 'zustand';

interface MediaItem {
  id: string;
  url: string;
  type: 'image' | 'video' | 'depth-map' | 'normal-map' | 'transition';
  metadata?: Record<string, any>;
}

interface MediaCacheState {
  // Cache: mediaId -> resolved URL
  cache: Map<string, string>;
  
  // Full media data for when we need more than just URL
  mediaData: Map<string, MediaItem>;
  
  // Loading state
  isLoaded: boolean;
  
  // Actions
  
  /**
   * Bulk load media from backend
   * Call this once on app startup with all media IDs
   */
  loadMediaBulk: (mediaIds: string[]) => Promise<void>;
  
  /**
   * Get media URL by ID - SYNCHRONOUS
   * Returns null if not in cache
   */
  getMediaUrl: (mediaId: string | undefined | null) => string | null;
  
  /**
   * Get full media data by ID - SYNCHRONOUS
   */
  getMediaData: (mediaId: string | undefined | null) => MediaItem | null;
  
  /**
   * Add single item to cache
   * Used when pipeline creates new media
   */
  addToCache: (mediaId: string, url: string, data?: Partial<MediaItem>) => void;
  
  /**
   * Remove item from cache
   * Used when media is deleted
   */
  removeFromCache: (mediaId: string) => void;
  
  /**
   * Clear entire cache
   */
  clearCache: () => void;
}

export const useMediaCacheStore = create<MediaCacheState>()((set, get) => ({
  cache: new Map(),
  mediaData: new Map(),
  isLoaded: false,
  
  loadMediaBulk: async (mediaIds: string[]) => {
    if (mediaIds.length === 0) {
      set({ isLoaded: true });
      return;
    }
    
    // Filter out undefined/null values
    const validIds = mediaIds.filter(Boolean);
    
    if (validIds.length === 0) {
      set({ isLoaded: true });
      return;
    }
    
    try {
      // Single bulk request to backend
      const response = await fetch(`/api/media/bulk?ids=${validIds.join(',')}`);
      
      if (!response.ok) {
        console.error('[MediaCache] Bulk load failed:', response.statusText);
        set({ isLoaded: true });
        return;
      }
      
      const result = await response.json();
      const mediaMap = result.data || {};
      
      // Populate cache
      const newCache = new Map(get().cache);
      const newMediaData = new Map(get().mediaData);
      
      Object.entries(mediaMap).forEach(([id, media]: [string, any]) => {
        if (media?.url) {
          newCache.set(id, media.url);
          newMediaData.set(id, {
            id,
            url: media.url,
            type: media.type,
            metadata: media.metadata
          });
        }
      });
      
      set({ 
        cache: newCache, 
        mediaData: newMediaData,
        isLoaded: true 
      });
      
    } catch (error) {
      console.error('[MediaCache] Bulk load error:', error);
      set({ isLoaded: true });
    }
  },
  
  getMediaUrl: (mediaId) => {
    if (!mediaId) return null;
    return get().cache.get(mediaId) || null;
  },
  
  getMediaData: (mediaId) => {
    if (!mediaId) return null;
    return get().mediaData.get(mediaId) || null;
  },
  
  addToCache: (mediaId, url, data) => {
    const newCache = new Map(get().cache);
    const newMediaData = new Map(get().mediaData);
    
    newCache.set(mediaId, url);
    newMediaData.set(mediaId, {
      id: mediaId,
      url,
      type: data?.type || 'image',
      metadata: data?.metadata
    });
    
    set({ cache: newCache, mediaData: newMediaData });
  },
  
  removeFromCache: (mediaId) => {
    const newCache = new Map(get().cache);
    const newMediaData = new Map(get().mediaData);
    
    newCache.delete(mediaId);
    newMediaData.delete(mediaId);
    
    set({ cache: newCache, mediaData: newMediaData });
  },
  
  clearCache: () => {
    set({ 
      cache: new Map(), 
      mediaData: new Map(),
      isLoaded: false 
    });
  }
}));

/**
 * Helper function to collect all media IDs from entities
 * Used on app startup to gather IDs for bulk loading
 */
export function collectMediaIds(entities: {
  characters?: Array<{ primaryMedia?: string; [key: string]: any }>;
  nodes?: Record<string, { primaryMedia?: string; [key: string]: any }>;
}): string[] {
  const ids: string[] = [];
  
  // Collect from characters
  if (entities.characters) {
    entities.characters.forEach(char => {
      if (char.primaryMedia) ids.push(char.primaryMedia);
      // Future: add other media types here
      // if (char.videoMedia) ids.push(char.videoMedia);
    });
  }
  
  // Collect from nodes
  if (entities.nodes) {
    Object.values(entities.nodes).forEach(node => {
      if (node.primaryMedia) ids.push(node.primaryMedia);
      // Future: add other media types here
    });
  }
  
  // Remove duplicates
  return [...new Set(ids)];
}
