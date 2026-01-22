/**
 * Video Loop Hook
 * Handles video loop generation with time-based progress animation
 */

import { useCallback } from 'react';
import { useTimedProgress } from '@/hooks';
import { clearMediaItem } from '@/services/mediaService';
import { VIDEO_LOOP_CONFIG } from '@/config';
import type { WorldViewRenderer } from '@/features/app/components/WorldView/WorldViewRenderer';

export function useVideoLoop(rendererRef?: React.RefObject<WorldViewRenderer | null>) {
  const { start, stop, cancel, isRunning } = useTimedProgress();

  const generateVideoLoop = useCallback(async (
    entityId: string,
    primaryMediaId: string
  ) => {
    if (!entityId || !primaryMediaId) {
      console.warn('[useVideoLoop] Missing entityId or primaryMediaId');
      return;
    }

    if (isRunning(entityId)) {
      console.warn('[useVideoLoop] Already generating video for this entity');
      return;
    }

    // Start time-based progress animation (0% → 95% over expected duration)
    start(entityId, VIDEO_LOOP_CONFIG.EXPECTED_GENERATION_DURATION_MS, 'video');

    try {
      // Capture filtered image from canvas if renderer is available
      let filteredImageBlob: Blob | null = null;
      if (rendererRef?.current) {
        try {
          filteredImageBlob = await rendererRef.current.captureFilteredImage('jpeg', 0.92);
          if (!filteredImageBlob) {
            console.warn('[useVideoLoop] Failed to capture filtered image, using original');
          }
        } catch (error) {
          console.warn('[useVideoLoop] Error capturing filtered image:', error);
        }
      }

      // Prepare request with filtered image if available
      let response: Response;
      
      if (filteredImageBlob) {
        // Send as multipart/form-data with filtered image
        const formData = new FormData();
        formData.append('nodeId', entityId);
        formData.append('primaryMediaId', primaryMediaId);
        formData.append('filteredImage', filteredImageBlob, 'filtered.jpg');
        
        response = await fetch('/api/v2/generate-video-loop', {
          method: 'POST',
          body: formData
        });
      } else {
        // Fallback to JSON request without filtered image
        response = await fetch('/api/v2/generate-video-loop', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nodeId: entityId, primaryMediaId })
        });
      }

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to start video generation');
      }

      const result = await response.json();
      const { eventsUrl } = result.data;

      // Listen for completion via SSE
      return new Promise<void>((resolve, reject) => {
        const eventSource = new EventSource(eventsUrl);

        eventSource.addEventListener('completed', (event) => {
          const data = JSON.parse(event.data);
          
          // Stop animation and jump to 100%
          stop(entityId);
          
          // Clear media cache to get fresh data
          clearMediaItem(primaryMediaId);
          
          // Dispatch event for WorldView to pick up
          window.dispatchEvent(new CustomEvent('videoGenerated', {
            detail: {
              entityId,
              primaryMediaId,
              videoUrl: data.videoUrl,
              videoPrompt: data.videoPrompt
            }
          }));

          eventSource.close();
          resolve();
        });

        eventSource.addEventListener('error', (event: Event) => {
          const messageEvent = event as MessageEvent;
          let errorMessage = 'Video generation failed';
          
          try {
            if (messageEvent.data) {
              const data = JSON.parse(messageEvent.data);
              errorMessage = data.error || data.message || errorMessage;
            }
          } catch {
            // Ignore JSON parse errors
          }

          eventSource.close();
          cancel(entityId);
          reject(new Error(errorMessage));
        });

        eventSource.onerror = () => {
          eventSource.close();
          cancel(entityId);
          reject(new Error('Connection lost during video generation'));
        };
      });
    } catch (error) {
      cancel(entityId);
      throw error;
    }
  }, [start, stop, cancel, isRunning]);

  return {
    generateVideoLoop,
    isEntityGenerating: isRunning
  };
}
