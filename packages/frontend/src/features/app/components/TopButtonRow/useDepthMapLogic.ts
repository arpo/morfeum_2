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

      // Step 4: Check if depth map already exists for this primary media
      const existingMediaResponse = await fetch(`/api/media?entityId=${entityId}`);
      const existingMediaResult = await existingMediaResponse.json();
      const existingDepthMap = existingMediaResult.data?.find(
        (m: any) => m.type === 'depth-map' && m.parentMedia === primaryMediaId
      );

      let mediaResult;
      let mediaId: string;

      if (existingDepthMap) {
        // Update existing depth map
        const updateResponse = await fetch(`/api/media/${existingDepthMap.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            url: depthMapUrl,
            metadata: {
              parentMedia: primaryMediaId,
              originalPrompt: mediaItem.metadata?.originalPrompt,
              model: 'fal-depth-anything-v2'
            }
          })
        });

        if (!updateResponse.ok) {
          const errorMsg = 'Failed to update depth map in media database';
          setError(errorMsg);
          setIsGenerating(false);
          return { success: false, error: errorMsg };
        }

        mediaResult = await updateResponse.json();
        mediaId = existingDepthMap.id;
        console.log('Updated existing depth map:', existingDepthMap.id);
      } else {
        // Create new depth map
        const createResponse = await fetch('/api/media', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'depth-map',
            url: depthMapUrl,
            metadata: {
              parentMedia: primaryMediaId,
              originalPrompt: mediaItem.metadata?.originalPrompt,
              model: 'fal-depth-anything-v2'
            },
            entityRefs: [entityId],
            parentMedia: primaryMediaId
          })
        });

        if (!createResponse.ok) {
          const errorMsg = 'Failed to store depth map in media database';
          setError(errorMsg);
          setIsGenerating(false);
          return { success: false, error: errorMsg };
        }

        mediaResult = await createResponse.json();
        mediaId = mediaResult.data?.id;
        console.log('Created new depth map:', mediaId);
      }

      setIsGenerating(false);
      return {
        success: true,
        depthMapUrl,
        mediaId
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
