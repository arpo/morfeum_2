/**
 * Custom hook for fetching entity images using the new media system
 * Handles async media loading and caching
 */

import { useState, useEffect } from 'react';
import { getPrimaryMediaUrl } from '@/services/mediaService';

/**
 * Hook to get the image URL for an entity
 * Handles both new media system (primaryMedia) and old system (imagePath) for backward compatibility
 */
export function useEntityImage(entity: any): string | null {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!entity) {
      setImageUrl(null);
      return;
    }

    // Use the getPrimaryMediaUrl helper which handles both old and new formats
    getPrimaryMediaUrl(entity).then(url => {
      setImageUrl(url);
    });
  }, [entity?.id, entity?.primaryMedia, entity?.imagePath]);

  return imageUrl;
}

/**
 * Hook to preload and cache image URLs for multiple entities
 * Useful for tree views and lists where you need all images upfront
 */
export function useEntityImages(entities: any[]): Map<string, string | null> {
  const [imageMap, setImageMap] = useState<Map<string, string | null>>(new Map());

  // Create a stable key based on entity IDs and their primaryMedia/imagePath values
  const entitiesKey = entities
    ?.map(e => `${e?.id}:${e?.primaryMedia || e?.imagePath || ''}`)
    .join(',') || '';

  useEffect(() => {
    if (!entities || entities.length === 0) {
      setImageMap(new Map());
      return;
    }

    // Load all images in parallel
    Promise.all(
      entities.map(async (entity) => {
        if (!entity?.id) return [null, null];
        const url = await getPrimaryMediaUrl(entity);
        return [entity.id, url] as [string, string | null];
      })
    ).then(results => {
      const map = new Map(results.filter(([id]) => id !== null) as [string, string | null][]);
      setImageMap(map);
    });
  }, [entitiesKey, entities]);

  return imageMap;
}
