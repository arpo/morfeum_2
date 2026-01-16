/**
 * Entity Session Manager
 * Unified entity session creation and activation
 */

import { useMediaCacheStore } from '@/store/slices/mediaCacheSlice';

export interface EntitySessionData {
  id: string;
  name: string;
  type: 'character' | 'location';
  personality?: string;
  atmosphere?: string;
  primaryMedia?: string;  // ID reference to media.json
  imageUrl?: string;      // Direct URL (from pipeline)
  imagePrompt?: string;
  modelClass?: string;    // Anonymous CSS class from backend (e.g., 'model-b')
}

/**
 * Create entity session and set as active
 * Handles creating the session, updating image/prompt, and activating
 */
export function createEntitySession(
  store: any,
  data: EntitySessionData
): void {
  // Create entity session (appears in tabs)
  const seed: any = {
    name: data.name
  };

  if (data.type === 'character' && data.personality) {
    seed.personality = data.personality;
  } else if (data.type === 'location' && data.atmosphere) {
    seed.atmosphere = data.atmosphere;
  }

  store.createEntity(data.id, seed, data.type);

  // If we have a direct imageUrl (from pipeline), add to cache and use it
  if (data.imageUrl && data.primaryMedia) {
    // Add to cache for future SYNC lookups (include modelClass in metadata)
    const addToCache = useMediaCacheStore.getState().addToCache;
    addToCache(data.primaryMedia, data.imageUrl, { 
      metadata: { modelClass: data.modelClass } 
    });
    
    // Use modelClass directly from completion data (already mapped by backend)
    store.updateEntityImage(data.id, data.imageUrl, data.modelClass);
  } else if (data.primaryMedia) {
    // SYNC lookup from cache - no async!
    const getMediaUrl = useMediaCacheStore.getState().getMediaUrl;
    const getMediaData = useMediaCacheStore.getState().getMediaData;
    const cachedUrl = getMediaUrl(data.primaryMedia);
    if (cachedUrl) {
      // Get modelClass from media cache metadata (already mapped by backend /api/media/bulk)
      const mediaData = getMediaData(data.primaryMedia);
      const modelClass = mediaData?.metadata?.modelClass;
      
      store.updateEntityImage(data.id, cachedUrl, modelClass);
    }
  }

  // Update with image prompt if provided
  if (data.imagePrompt) {
    store.updateEntityImagePrompt(data.id, data.imagePrompt);
  }

  // Set as active entity (switches to tab)
  store.setActiveEntity(data.id);
  
  // Persist to localStorage
  localStorage.setItem('lastActiveEntityId', data.id);
}

/**
 * Close entity session
 */
export function closeEntitySession(store: any, entityId: string): void {
  store.closeEntity(entityId);
  console.log(`[SessionManager] Session closed: ${entityId}`);
}

/**
 * Switch active entity
 */
export function switchActiveEntity(store: any, entityId: string): void {
  store.setActiveEntity(entityId);
  localStorage.setItem('lastActiveEntityId', entityId);
  console.log(`[SessionManager] Switched to entity: ${entityId}`);
}
