/**
 * Image Upscale Hook
 * Handles image upscaling with time-based progress animation
 */

import { useState } from 'react';
import { useTimedProgress } from '@/hooks';
import { getMedia, clearMediaCache } from '@/services/mediaService';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';
import { UPSCALE_CONFIG } from '@/config';

const UPSCALE_DURATION_MS = 10000; // 10 seconds expected duration

interface UpscaleResult {
  success: boolean;
  upscaledUrl?: string;
  error?: string;
}

export function useImageUpscale() {
  const [error, setError] = useState<string | null>(null);
  const { start, stop, cancel, isRunning } = useTimedProgress();

  const upscaleImage = async (
    entityId: string,
    primaryMediaId: string,
    entityType: 'character' | 'location'
  ): Promise<UpscaleResult> => {
    if (isRunning(entityId)) {
      return { success: false, error: 'Already upscaling' };
    }

    // Start time-based progress animation (0% → 95% over 10 seconds)
    start(entityId, UPSCALE_DURATION_MS, 'upscaling');
    setError(null);

    try {
      // Step 1: Get the primary media item to get its URL
      const mediaItem = await getMedia(primaryMediaId);
      
      if (!mediaItem || !mediaItem.url) {
        const errorMsg = 'Failed to fetch primary media';
        setError(errorMsg);
        cancel(entityId);
        return { success: false, error: errorMsg };
      }

      // Step 2: Call the upscale API
      const upscaleResponse = await fetch('/api/mzoo/navigation/upscale-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputImage: mediaItem.url,
          upscale_mode: 'factor',
          upscale_factor: UPSCALE_CONFIG.FACTOR,
          noise_scale: UPSCALE_CONFIG.NOISE_SCALE,
          output_format: 'jpg'
        })
      });

      if (!upscaleResponse.ok) {
        const errorBody = await upscaleResponse.text();
        const errorMsg = `Upscale API failed: ${upscaleResponse.status} - ${errorBody}`;
        setError(errorMsg);
        cancel(entityId);
        return { success: false, error: errorMsg };
      }

      const upscaleResult = await upscaleResponse.json();
      const upscaledUrl = upscaleResult.data?.images?.[0]?.url;
      
      if (!upscaledUrl) {
        const errorMsg = 'No upscaled image URL in response';
        setError(errorMsg);
        cancel(entityId);
        return { success: false, error: errorMsg };
      }

      // Step 3: Store original URL if not already stored
      if (!mediaItem.urls?.original) {
        const originalResponse = await fetch(`/api/media/${primaryMediaId}/url-variant`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            variant: 'original',
            url: mediaItem.url
          })
        });

        if (!originalResponse.ok) {
          const errorMsg = `Failed to store original URL: ${originalResponse.status}`;
          setError(errorMsg);
          cancel(entityId);
          return { success: false, error: errorMsg };
        }
      }

      // Step 4: Store upscaled URL as variant
      const upscaledResponse = await fetch(`/api/media/${primaryMediaId}/url-variant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant: 'upscaled',
          url: upscaledUrl
        })
      });

      if (!upscaledResponse.ok) {
        const errorBody = await upscaledResponse.text();
        const errorMsg = `Failed to store upscaled URL: ${upscaledResponse.status} - ${errorBody}`;
        setError(errorMsg);
        cancel(entityId);
        return { success: false, error: errorMsg };
      }

      // Step 5: Update the display URL to show upscaled version
      const updateResponse = await fetch(`/api/media/${primaryMediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: upscaledUrl,
          metadata: {
            ...mediaItem.metadata,
            upscaled: true,
            upscale_factor: UPSCALE_CONFIG.FACTOR
          }
        })
      });

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.text();
        const errorMsg = `Failed to update display URL: ${updateResponse.status} - ${errorBody}`;
        setError(errorMsg);
        cancel(entityId);
        return { success: false, error: errorMsg };
      }

      // Step 6: Clear cache and dispatch events
      clearMediaCache();
      
      window.dispatchEvent(new CustomEvent('imageUpscaled', {
        detail: {
          entityId,
          entityType,
          primaryMediaId,
          newUrl: upscaledUrl
        }
      }));
      
      // Step 7: Update entity with timestamp to force re-render
      const updateData = {
        primaryMedia: primaryMediaId,
        updatedAt: Date.now()
      };
      
      if (entityType === 'character') {
        useCharactersStore.getState().updateCharacter(entityId, updateData);
      } else {
        useLocationsStore.getState().updateNode(entityId, updateData);
      }

      // Stop animation and jump to 100%
      stop(entityId);
      
      return {
        success: true,
        upscaledUrl
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      cancel(entityId);
      return { success: false, error: errorMsg };
    }
  };

  return {
    upscaleImage,
    isUpscaling: false, // Backward compatibility - not really used
    isEntityUpscaling: isRunning,
    error
  };
}
