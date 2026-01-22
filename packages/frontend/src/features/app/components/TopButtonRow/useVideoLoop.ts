/**
 * Video Loop Hook
 * Handles video loop generation with time-based progress animation
 */

import { useCallback } from 'react';
import { useTimedProgress } from '@/hooks';
import { clearMediaItem } from '@/services/mediaService';

const VIDEO_DURATION_MS = 30000; // 30 seconds expected duration

export function useVideoLoop() {
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

    // Start time-based progress animation (0% → 95% over 30 seconds)
    start(entityId, VIDEO_DURATION_MS, 'video');

    try {
      // Call the backend API
      const response = await fetch('/api/v2/generate-video-loop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nodeId: entityId, primaryMediaId })
      });

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
