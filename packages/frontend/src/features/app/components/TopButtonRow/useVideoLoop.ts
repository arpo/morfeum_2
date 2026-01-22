/**
 * Video Loop Hook
 * Handles video loop generation state and API calls with progress tracking
 */

import { useCallback } from 'react';
import { useStore } from '@/store';
import { clearMediaItem } from '@/services/mediaService';

export function useVideoLoop() {
  // Use store for progress tracking
  const startMediaOperation = useStore(state => state.startMediaOperation);
  const updateMediaProgress = useStore(state => state.updateMediaProgress);
  const finishMediaOperation = useStore(state => state.finishMediaOperation);
  const isEntityGeneratingVideo = useStore(state => state.isEntityGeneratingVideo);
  
  const isEntityGenerating = useCallback((entityId: string) => {
    return isEntityGeneratingVideo(entityId);
  }, [isEntityGeneratingVideo]);

  const generateVideoLoop = useCallback(async (
    entityId: string,
    primaryMediaId: string
  ) => {
    if (!entityId || !primaryMediaId) {
      console.warn('[useVideoLoop] Missing entityId or primaryMediaId');
      return;
    }

    if (isEntityGeneratingVideo(entityId)) {
      console.warn('[useVideoLoop] Already generating video for this entity');
      return;
    }

    startMediaOperation(entityId, 'video');
    updateMediaProgress(entityId, 0);

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

      // Listen for SSE events
      return new Promise<void>((resolve, reject) => {
        const eventSource = new EventSource(eventsUrl);
        
        // Track progress based on stage events
        eventSource.addEventListener('stage', (event) => {
          const data = JSON.parse(event.data);
          // Map stages to progress: analyzing (20%), prompting (40%), generating (80%)
          if (data.stage === 'analyzing') {
            updateMediaProgress(entityId, 20);
          } else if (data.stage === 'prompting') {
            updateMediaProgress(entityId, 40);
          } else if (data.stage === 'generating') {
            updateMediaProgress(entityId, 80);
          }
        });

        eventSource.addEventListener('completed', (event) => {
          const data = JSON.parse(event.data);
          
          updateMediaProgress(entityId, 100);
          
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
          // Small delay to show 100% before removing progress bar
          setTimeout(() => finishMediaOperation(entityId), 500);
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
          finishMediaOperation(entityId);
          reject(new Error(errorMessage));
        });

        eventSource.onerror = () => {
          eventSource.close();
          finishMediaOperation(entityId);
          reject(new Error('Connection lost during video generation'));
        };
      });
    } catch (error) {
      finishMediaOperation(entityId);
      throw error;
    }
  }, [startMediaOperation, updateMediaProgress, finishMediaOperation, isEntityGeneratingVideo]);

  return {
    generateVideoLoop,
    isEntityGenerating
  };
}
