import { useState } from 'react';
import { getMedia } from '@/services/mediaService';

interface DepthMapResult {
  success: boolean;
  depthMapUrl?: string;
  mediaId?: string;
  error?: string;
}

export function useDepthMapLogic() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateDepthMap = async (
    entityId: string,
    primaryMediaId: string
  ): Promise<DepthMapResult> => {
    setIsGenerating(true);
    setError(null);

    try {
      // Step 1: Get the primary media item to get its URL
      const mediaItem = await getMedia(primaryMediaId);
      
      if (!mediaItem || !mediaItem.url) {
        const errorMsg = 'Failed to fetch primary media';
        setError(errorMsg);
        setIsGenerating(false);
        return { success: false, error: errorMsg };
      }

      // Step 2: Call the depth map generation API
      const depthResponse = await fetch('/api/mzoo/fal-depth-anything-v2/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          image_url: mediaItem.url,
          output_format: 'jpeg',
          high_quality: false
        })
      });

      if (!depthResponse.ok) {
        const errorMsg = `Depth map API failed: ${depthResponse.status}`;
        setError(errorMsg);
        setIsGenerating(false);
        return { success: false, error: errorMsg };
      }

      const depthResult = await depthResponse.json();
      console.log('Depth map API response:', depthResult);

      // Step 3: Extract the depth map URL from response
      // FAL API returns the URL in depth_map_image.url or depth_map_url
      const depthMapUrl = depthResult.data?.depth_map_image?.url || depthResult.data?.depth_map_url;
      
      if (!depthMapUrl) {
        const errorMsg = 'No depth map URL in response';
        setError(errorMsg);
        setIsGenerating(false);
        return { success: false, error: errorMsg };
      }

      // Step 4: Store depth map URL as variant on the primary media
      console.log('🗺️ [DepthMap] Storing depth map URL variant');
      const depthMapResponse = await fetch(`/api/media/${primaryMediaId}/url-variant`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant: 'depthMap',
          url: depthMapUrl
        })
      });

      if (!depthMapResponse.ok) {
        const errorBody = await depthMapResponse.text();
        const errorMsg = `Failed to store depth map URL: ${depthMapResponse.status} - ${errorBody}`;
        console.error('🗺️ [DepthMap] Failed to store depth map:', errorMsg);
        setError(errorMsg);
        setIsGenerating(false);
        return { success: false, error: errorMsg };
      }

      const mediaResult = await depthMapResponse.json();
      console.log('🗺️ [DepthMap] Depth map stored successfully:', mediaResult);

      setIsGenerating(false);
      return {
        success: true,
        depthMapUrl,
        mediaId: primaryMediaId
      };

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMsg);
      setIsGenerating(false);
      console.error('Depth map generation error:', err);
      return { success: false, error: errorMsg };
    }
  };

  return {
    generateDepthMap,
    isGenerating,
    error
  };
}
