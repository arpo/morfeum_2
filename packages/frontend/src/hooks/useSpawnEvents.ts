/**
 * Hook to listen to Server-Sent Events for spawn updates
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function useSpawnEvents() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const createChatWithEntity = useStore(state => state.chatManager?.createChatWithEntity);
  const updateChatImage = useStore(state => state.chatManager?.updateChatImage);
  const updateChatSystemPrompt = useStore(state => state.chatManager?.updateChatSystemPrompt);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/spawn/events');
    eventSourceRef.current = eventSource;

    console.log('[SSE] Connecting to spawn events...');

    // Handle connection open
    eventSource.onopen = () => {
      console.log('[SSE] Connected to spawn events');
    };

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
      if (eventSource.readyState === EventSource.CLOSED) {
        console.log('[SSE] Connection closed, will attempt to reconnect...');
      }
    };

    // Listen for seed complete event
    eventSource.addEventListener('spawn:seed-complete', (e) => {
      const { spawnId, seed } = JSON.parse(e.data);
      console.log('[SSE] Seed complete:', { spawnId, seed });
      
      // Create new chat with this entity
      if (createChatWithEntity) {
        createChatWithEntity(spawnId, seed);
      }
    });

    // Listen for image complete event
    eventSource.addEventListener('spawn:image-complete', (e) => {
      const { spawnId, imageUrl } = JSON.parse(e.data);
      console.log('[SSE] Image complete:', { spawnId, imageUrl });
      
      // Update chat with image
      if (updateChatImage) {
        updateChatImage(spawnId, imageUrl);
      }
    });

    // Listen for analysis complete event
    eventSource.addEventListener('spawn:analysis-complete', (e) => {
      const { spawnId, visualAnalysis } = JSON.parse(e.data);
      console.log('[SSE] Analysis complete:', { spawnId, visualAnalysis });
      // Just log for now - no UI update needed
    });

    // Listen for profile complete event
    eventSource.addEventListener('spawn:profile-complete', (e) => {
      const { spawnId, deepProfile, systemPrompt } = JSON.parse(e.data);
      console.log('[SSE] Profile complete:', { spawnId, deepProfile });
      
      // Silently update chat system prompt
      if (updateChatSystemPrompt) {
        updateChatSystemPrompt(spawnId, systemPrompt);
      }
    });

    // Listen for spawn cancelled event
    eventSource.addEventListener('spawn:cancelled', (e) => {
      const { spawnId } = JSON.parse(e.data);
      console.log('[SSE] Spawn cancelled:', spawnId);
    });

    // Listen for spawn error event
    eventSource.addEventListener('spawn:error', (e) => {
      const { spawnId, error } = JSON.parse(e.data);
      console.error('[SSE] Spawn error:', { spawnId, error });
    });

    // Cleanup on unmount
    return () => {
      console.log('[SSE] Disconnecting from spawn events');
      eventSource.close();
    };
  }, [createChatWithEntity, updateChatImage, updateChatSystemPrompt]);
}
