/**
 * Hook to listen to Server-Sent Events for spawn updates
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

export function useSpawnEvents() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const createChatWithEntity = useStore(state => state.createChatWithEntity);
  const updateChatImage = useStore(state => state.updateChatImage);
  const updateChatImagePrompt = useStore(state => state.updateChatImagePrompt);
  const updateChatSystemPrompt = useStore(state => state.updateChatSystemPrompt);
  const updateChatDeepProfile = useStore(state => state.updateChatDeepProfile);
  const updateSpawnStatus = useStore(state => state.updateSpawnStatus);
  const removeSpawn = useStore(state => state.removeSpawn);
  const activeSpawns = useStore(state => state.activeSpawns);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/spawn/events');
    eventSourceRef.current = eventSource;

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
    };

    // Listen for seed complete event
    eventSource.addEventListener('spawn:seed-complete', (e) => {
      const { spawnId, seed, systemPrompt } = JSON.parse(e.data);
      console.log('🌱 Seed Generated:', seed);
      console.log('💬 Initial System Prompt:', systemPrompt);
      
      // Detect entity type from seed structure
      // Locations have 'atmosphere', characters have 'personality' as discriminator
      const entityType: 'character' | 'location' = seed.atmosphere ? 'location' : 'character';
      // console.log('[SpawnEvents] Detected entity type:', entityType);
      
      // Create new chat with this entity
      if (createChatWithEntity) {
        createChatWithEntity(spawnId, seed, entityType);
      }
      
      // Set initial system prompt
      if (updateChatSystemPrompt) {
        updateChatSystemPrompt(spawnId, systemPrompt);
      }
      
      // Update spawn status
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'generating_image');
      }
    });

    // Listen for image complete event
    eventSource.addEventListener('spawn:image-complete', (e) => {
      const { spawnId, imageUrl, imagePrompt } = JSON.parse(e.data);
      // console.log('🎨 Image Generated:', imageUrl);
      
      // Update chat with image
      if (updateChatImage) {
        updateChatImage(spawnId, imageUrl);
      }
      
      // Update chat with image prompt
      if (updateChatImagePrompt && imagePrompt) {
        updateChatImagePrompt(spawnId, imagePrompt);
      }
      
      // Update spawn status
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'analyzing');
      }
    });

    // Listen for analysis complete event
    eventSource.addEventListener('spawn:analysis-complete', (e) => {
      const { spawnId, visualAnalysis } = JSON.parse(e.data);
      console.log('👁️ Visual Analysis:', visualAnalysis);
      
      // Update spawn status
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'enriching');
      }
    });

    // Listen for profile complete event
    eventSource.addEventListener('spawn:profile-complete', (e) => {
      const { spawnId, deepProfile, enhancedSystemPrompt, entityType } = JSON.parse(e.data);
      
      // Log hierarchical location structure (locations only)
      if (entityType === 'location') {
        console.log(' Location Generated with Hierarchical DNA:');
        console.log('  🌐 World Node:', deepProfile.world);
        if (deepProfile.region) {
          console.log('  🗺️ Region Node:', deepProfile.region);
        }
        if (deepProfile.location) {
          console.log('  📍 Location Node:', deepProfile.location);
        }
      }
      
      console.log('💬 Enhanced System Prompt Updated');
      
      // Store deep profile in chat session
      if (updateChatDeepProfile && deepProfile) {
        updateChatDeepProfile(spawnId, deepProfile);
      }
      
      // Update system prompt with enhanced version from deep profile
      if (updateChatSystemPrompt && enhancedSystemPrompt) {
        updateChatSystemPrompt(spawnId, enhancedSystemPrompt);
      }
      
      // Update spawn status and remove from active list
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'completed');
      }
      // Remove from active spawns after a short delay
      setTimeout(() => {
        if (removeSpawn) {
          removeSpawn(spawnId);
        }
      }, 2000);
    });

    // Listen for spawn cancelled event
    eventSource.addEventListener('spawn:cancelled', (e) => {
      const { spawnId } = JSON.parse(e.data);
      
      // Remove from active spawns
      if (removeSpawn) {
        removeSpawn(spawnId);
      }
    });

    // Listen for spawn error event
    eventSource.addEventListener('spawn:error', (e) => {
      const { spawnId, error } = JSON.parse(e.data);
      console.error('[SSE] Spawn error:', { spawnId, error });
      
      // Remove from active spawns
      if (removeSpawn) {
        removeSpawn(spawnId);
      }
    });

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [createChatWithEntity, updateChatImage, updateChatImagePrompt, updateChatSystemPrompt, updateChatDeepProfile]);
}
