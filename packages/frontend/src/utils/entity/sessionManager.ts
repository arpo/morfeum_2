/**
 * Entity Session Manager
 * Unified entity session creation and activation
 */

import { getPrimaryMediaUrl } from '@/services/mediaService';

export interface EntitySessionData {
  id: string;
  name: string;
  type: 'character' | 'location';
  personality?: string;
  atmosphere?: string;
  imagePath?: string;  // Deprecated: use primaryMedia
  primaryMedia?: string;  // ID reference to media.json
  imagePrompt?: string;
}

/**
 * Create entity session and set as active
 * Handles creating the session, updating image/prompt, and activating
 */
export function createEntitySession(
  store: any,
  data: EntitySessionData
): void {
  console.log(`[SessionManager] Creating ${data.type} session: ${data.name}`);

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

  // Update entity with image if provided (supports both old imagePath and new primaryMedia)
  // Check if image is different to prevent unnecessary re-renders (flicker)
  if (data.imagePath) {
    const currentEntity = store.entitySessions?.[data.id];
    const currentImage = currentEntity?.entityImage;
    
    if (currentImage !== data.imagePath) {
      store.updateEntityImage(data.id, data.imagePath);
    }
  }

  // Resolve via media system (handles primaryMedia)
  getPrimaryMediaUrl(data).then(url => {
    if (url) {
      store.updateEntityImage(data.id, url);
    }
  });

  // Update with image prompt if provided
  if (data.imagePrompt) {
    store.updateEntityImagePrompt(data.id, data.imagePrompt);
  }

  // Set as active entity (switches to tab)
  store.setActiveEntity(data.id);
  
  // Persist to localStorage
  localStorage.setItem('lastActiveEntityId', data.id);

  console.log(`[SessionManager] ${data.type} session created and activated: ${data.name}`);
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
