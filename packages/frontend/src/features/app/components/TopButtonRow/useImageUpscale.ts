import { useState } from 'react';
import { getMedia, clearMediaCache } from '@/services/mediaService';
import { useCharactersStore } from '@/store/slices/charactersSlice';
import { useLocationsStore } from '@/store/slices/locations';

interface UpscaleResult {
  success: boolean;
  upscaledUrl?: string;
  error?: string;
}

export function useImageUpscale() {
  const [isUpscaling, setIsUpscaling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const upscaleImage = async (
    entityId: string,
    primaryMediaId: string,
    entityType: 'character' | 'location'
  ): Promise<UpscaleResult> => {
    console.log('🚀 [Upscale] FUNCTION CALLED!', { entityId, primaryMediaId, entityType });
    
    setIsUpscaling(true);
    setError(null);

    try {
      console.log('🚀 [Upscale] Fetching media item...');
      
      // Step 1: Get the primary media item to get its URL
      const mediaItem = await getMedia(primaryMediaId);
      
      console.log('🚀 [Upscale] Media item fetched:', mediaItem);
      
      if (!mediaItem || !mediaItem.url) {
        const errorMsg = 'Failed to fetch primary media';
        setError(errorMsg);
        setIsUpscaling(false);
        return { success: false, error: errorMsg };
      }

      // Step 2: Call the upscale API
      console.log('🚀 [Upscale] Calling upscale API...');
      console.log('🚀 [Upscale] Input image:', mediaItem.url);
      
      const upscaleResponse = await fetch('/api/mzoo/navigation/upscale-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          inputImage: mediaItem.url,
          upscale_mode: 'factor',
          upscale_factor: 4,
          noise_scale: 0.1,
          output_format: 'jpg'
        })
      });

      console.log('🚀 [Upscale] API responded! Status:', upscaleResponse.status);

      if (!upscaleResponse.ok) {
        const errorBody = await upscaleResponse.text();
        const errorMsg = `Upscale API failed: ${upscaleResponse.status} - ${errorBody}`;
        console.error('🚀 [Upscale] API error:', errorMsg);
        setError(errorMsg);
        setIsUpscaling(false);
        return { success: false, error: errorMsg };
      }

      console.log('🚀 [Upscale] Parsing JSON response...');
      const upscaleResult = await upscaleResponse.json();
      console.log('🚀 [Upscale] Full API response:', upscaleResult);
      
      // Step 3: Extract the upscaled image URL from response
      // API returns data.images array, not data.image
      const upscaledUrl = upscaleResult.data?.images?.[0]?.url;
      
      if (!upscaledUrl) {
        const errorMsg = 'No upscaled image URL in response';
        setError(errorMsg);
        setIsUpscaling(false);
        return { success: false, error: errorMsg };
      }

      console.log('🎨 [Upscale] Upscaled image URL:', upscaledUrl);
      console.log('🎨 [Upscale] Original image URL:', mediaItem.url);
      console.log('🎨 [Upscale] Updating media ID:', primaryMediaId);

      // Step 4a: Store original URL if not already stored
      if (!mediaItem.urls?.original) {
        console.log('🎨 [Upscale] Storing original URL variant');
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
          console.error('🎨 [Upscale] Failed to store original:', errorMsg);
          setError(errorMsg);
          setIsUpscaling(false);
          return { success: false, error: errorMsg };
        }
      }

      // Step 4b: Store upscaled URL as variant
      console.log('🎨 [Upscale] Storing upscaled URL variant');
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
        console.error('🎨 [Upscale] Failed to store upscaled:', errorMsg);
        setError(errorMsg);
        setIsUpscaling(false);
        return { success: false, error: errorMsg };
      }

      // Step 4c: Update the display URL to show upscaled version
      const updateResponse = await fetch(`/api/media/${primaryMediaId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: upscaledUrl,
          metadata: {
            ...mediaItem.metadata,
            upscaled: true,
            upscale_factor: 4
          }
        })
      });

      console.log('🎨 [Upscale] PUT response status:', updateResponse.status, updateResponse.statusText);

      if (!updateResponse.ok) {
        const errorBody = await updateResponse.text();
        const errorMsg = `Failed to update display URL: ${updateResponse.status} - ${errorBody}`;
        console.error('🎨 [Upscale] PUT failed:', errorMsg);
        setError(errorMsg);
        setIsUpscaling(false);
        return { success: false, error: errorMsg };
      }

      const updateResult = await updateResponse.json();
      console.log('🎨 [Upscale] PUT success! Updated media:', updateResult);

      // Step 5: Clear media cache to force fresh fetch
      clearMediaCache();
      
      // Step 6: Dispatch custom event to trigger image reload in UI
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

      setIsUpscaling(false);
      return {
        success: true,
        upscaledUrl
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsUpscaling(false);
      console.error('Image upscale error:', err);
      return { success: false, error: errorMsg };
    }
  };

  return {
    upscaleImage,
    isUpscaling,
    error
  };
}
