/**
 * Video Loop Hook
 * Handles video loop generation state and API calls
 */

import { useState, useCallback } from 'react';
import { useStore } from '@/store';
import { clearMediaItem } from '@/services/mediaService';

export function useVideoLoop() {
  const [generatingEntityIds, setGeneratingEntityIds] = useState<Set<string>>(new Set());

  const startGenerating = useCallback((entityId: string) => {
    setGeneratingEntityIds(prev => new Set(prev).add(entityId));
  }, []);

  const finishGenerating = useCallback((entityId: string) => {
    setGeneratingEntityIds(prev => {
      const next = new Set(prev);
      next.delete(entityId);
      return next;
    });
  }, []);

  const isEntityGenerating = useCallback((entityId: string) => {
    return generatingEntityIds.has(entityId);
  }, [generatingEntityIds]);

  const generateVideoLoop = useCallback(async (
    entityId: string,
    primaryMediaId: string
  ) => {
    if (!entityId || !primaryMediaId) {
      console.warn('[useVideoLoop] Missing entityId or primaryMediaId');
      return;
    }

    if (generatingEntityIds.has(entityId)) {
      console.warn('[useVideoLoop] Already generating video for this entity');
      return;
    }

    startGenerating(entityId);

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

        eventSource.addEventListener('completed', (event) => {
          const data = JSON.parse(event.data);
          
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
          finishGenerating(entityId);
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
          finishGenerating(entityId);
          reject(new Error(errorMessage));
        });

        eventSource.onerror = () => {
          eventSource.close();
          finishGenerating(entityId);
          reject(new Error('Connection lost during video generation'));
        };
      });
    } catch (error) {
      finishGenerating(entityId);
      throw error;
    }
  }, [generatingEntityIds, startGenerating, finishGenerating]);

  return {
    generateVideoLoop,
    isEntityGenerating,
    generatingEntityIds
  };
}
