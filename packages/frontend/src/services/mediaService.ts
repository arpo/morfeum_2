/**
 * Media Service
 * 
 * Handles fetching and caching media from the backend media API
 */

interface MediaItem {
  id: string;
  type: 'image' | 'video' | 'depth-map' | 'normal-map' | 'transition';
  url: string;
  createdAt: string;
  metadata?: {
    prompt?: string;
    model?: string;
    seed?: any;
    [key: string]: any;
  };
  entityRefs?: string[];
  parentMedia?: string;
  relatedMedia?: string[];
  transitionSequence?: {
    startImageId: string;
    endImageId: string;
    frameCount: number;
    fps: number;
    duration: number;
  };
}

interface MediaResponse {
  media: Record<string, MediaItem>;
}

// Simple in-memory cache
const mediaCache = new Map<string, MediaItem>();
const entityMediaCache = new Map<string, MediaItem[]>();

/**
 * Fetch a specific media item by ID
 */
export async function getMedia(mediaId: string): Promise<MediaItem | null> {
  // Check cache first
  if (mediaCache.has(mediaId)) {
    return mediaCache.get(mediaId)!;
  }

  try {
    const response = await fetch(`/api/media/${mediaId}`);
    
    if (!response.ok) {
      return null;
    }

    const result = await response.json();
    
    // Backend returns { success: true, data: media }
    const media: MediaItem = result.data || result;
    
    // Cache the result
    mediaCache.set(mediaId, media);
    
    return media;
  } catch (error) {
    return null;
  }
}

/**
 * Fetch all media for a specific entity
 */
export async function getEntityMedia(entityId: string): Promise<MediaItem[]> {
  // Check cache first
  if (entityMediaCache.has(entityId)) {
    return entityMediaCache.get(entityId)!;
  }

  try {
    const response = await fetch(`/api/media?entityId=${entityId}`);
    
    if (!response.ok) {
      return [];
    }

    const result = await response.json();
    
    // Backend returns { success: true, data: media[] }
    const mediaList = Array.isArray(result.data) ? result.data : Object.values(result.data || {});
    
    // Cache the result
    entityMediaCache.set(entityId, mediaList);
    
    return mediaList;
  } catch (error) {
    return [];
  }
}

/**
 * Get media URL by media ID
 * Returns the URL directly or null if not found
 */
export async function getMediaUrl(mediaId: string | null | undefined): Promise<string | null> {
  if (!mediaId) return null;
  
  const media = await getMedia(mediaId);
  return media?.url || null;
}

/**
 * Get primary media for an entity
 * Entities now have a primaryMedia field that references a media ID
 */
export async function getPrimaryMediaUrl(entity: any): Promise<string | null> {
  // New system: use primaryMedia field
  if (entity.primaryMedia) {
    return getMediaUrl(entity.primaryMedia);
  }
  
  // Backward compatibility: support old imagePath field
  if (entity.imagePath) {
    return entity.imagePath;
  }
  
  // Backward compatibility: support old imageUrl in details
  if (entity.details?.imageUrl) {
    return entity.details.imageUrl;
  }
  
  // Backward compatibility: support old imageUrl directly
  if (entity.imageUrl) {
    return entity.imageUrl;
  }
  
  return null;
}

/**
 * Clear the media cache
 * Useful when media is updated or deleted
 */
export function clearMediaCache(): void {
  mediaCache.clear();
  entityMediaCache.clear();
}

/**
 * Clear cache for a specific media item
 */
export function clearMediaItem(mediaId: string): void {
  mediaCache.delete(mediaId);
  
  // Also clear entity cache entries that might contain this media
  entityMediaCache.clear();
}

/**
 * Preload media for multiple entities
 * Useful for batch loading when displaying lists
 */
export async function preloadEntityMedia(entityIds: string[]): Promise<void> {
  const promises = entityIds.map(entityId => getEntityMedia(entityId));
  await Promise.all(promises);
}
