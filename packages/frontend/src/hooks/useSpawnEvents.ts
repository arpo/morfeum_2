/**
 * Hook to listen to Server-Sent Events for spawn updates
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locationsSlice';

export function useSpawnEvents() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const createChatWithEntity = useStore(state => state.createChatWithEntity);
  const updateChatImage = useStore(state => state.updateChatImage);
  const updateChatImagePrompt = useStore(state => state.updateChatImagePrompt);
  const updateChatSystemPrompt = useStore(state => state.updateChatSystemPrompt);
  const updateChatDeepProfile = useStore(state => state.updateChatDeepProfile);
  const updateSpawnStatus = useStore(state => state.updateSpawnStatus);
  const removeSpawn = useStore(state => state.removeSpawn);
  const setActiveChat = useStore(state => state.setActiveChat);
  const createLocation = useLocationsStore(state => state.createLocation);
  const getLocation = useLocationsStore(state => state.getLocation);

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
        console.log('🌍 Location Generated with Hierarchical DNA:');
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

    // Listen for sublocation DNA complete event
    eventSource.addEventListener('spawn:sublocation-dna-complete', (e) => {
      const { spawnId, dna, parentNodeId } = JSON.parse(e.data);
      console.log('[SSE] 🧬 Sublocation DNA generated:', spawnId);
      
      // Get parent location to build inherited DNA structure
      const parentLocation = getLocation(parentNodeId);
      if (!parentLocation) {
        console.error('[SSE] ❌ Parent location not found for DNA inheritance:', parentNodeId);
        return;
      }
      
      console.log('[SSE] 🔍 Building inherited DNA from parent:', parentNodeId);
      
      // Build complete inherited DNA structure
      const inheritedDNA = {
        world: parentLocation.dna.world,
        region: parentLocation.dna.region,
        location: (parentLocation.dna as any).sublocation || parentLocation.dna.location,
        sublocation: dna
      };
      
      console.log('[SSE] ✅ Preview DNA has world node:', !!inheritedDNA.world);
      
      // Create preview immediately with DNA (no image yet)
      // This switches the preview panel to show the new sublocation
      if (createChatWithEntity) {
        const seed = {
          name: dna.meta.name,
          looks: dna.profile.looks,
          atmosphere: dna.profile.atmosphere,
          mood: dna.profile.mood
        };
        createChatWithEntity(spawnId, seed, 'location');
      }
      
      // Store complete inherited DNA in deep profile
      if (updateChatDeepProfile) {
        updateChatDeepProfile(spawnId, inheritedDNA as any);
      }
      
      // Switch to this chat immediately
      if (setActiveChat) {
        setActiveChat(spawnId);
        console.log('[SSE] 🎯 Preview switched to sublocation:', spawnId);
      }
      
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'generating_image');
      }
    });

    // Listen for sublocation image complete event
    eventSource.addEventListener('spawn:sublocation-image-complete', (e) => {
      const { spawnId, imageUrl } = JSON.parse(e.data);
      console.log('[SSE] 🎨 Sublocation image generated:', imageUrl);
      
      // Update the preview with the image
      if (updateChatImage) {
        updateChatImage(spawnId, imageUrl);
      }
      
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'completed');
      }
    });

    // Listen for sublocation complete event
    eventSource.addEventListener('spawn:sublocation-complete', (e) => {
      const { spawnId, dna, imageUrl, parentNodeId } = JSON.parse(e.data);
      console.log('[SSE] ✅ Sublocation generation complete:', spawnId);
      
      // Get parent location to inherit hierarchy info
      const parentLocation = getLocation(parentNodeId);
      if (!parentLocation) {
        console.error('[SSE] ❌ Parent location not found:', parentNodeId);
        return;
      }
      
      console.log('[SSE] 🔍 Parent location DNA structure:', parentLocation.dna);
      
      // Determine which nodes to inherit
      // If parent is a sublocation, it already has world/region/location inherited
      const inheritedDNA = {
        world: parentLocation.dna.world,
        region: parentLocation.dna.region,
        location: (parentLocation.dna as any).sublocation || parentLocation.dna.location,
        sublocation: dna
      };
      
      console.log('[SSE] 🧬 Creating sublocation with DNA:', inheritedDNA);
      
      // Extract clean name (remove the hierarchical suffix)
      const cleanName = dna.meta.name.split(' (')[0];
      
      // Store sublocation in locationsSlice
      createLocation({
        id: spawnId,
        world_id: parentLocation.world_id,
        parent_location_id: parentNodeId,
        depth_level: parentLocation.depth_level + 1,
        name: cleanName, // Use clean name for display
        dna: inheritedDNA as any,
        imagePath: imageUrl || '',
        adjacent_to: [],
        children: []
      });
      
      console.log('[SSE] 📍 Sublocation stored:', spawnId);
      console.log('[SSE] 📊 Hierarchy: world_id:', parentLocation.world_id, ', parent:', parentNodeId, ', depth:', parentLocation.depth_level + 1);
      console.log('[SSE] ✅ Verified DNA has world node:', !!inheritedDNA.world);
      
      // Switch active chat to new sublocation
      if (setActiveChat) {
        setActiveChat(spawnId);
        console.log('[SSE] 🎯 Switched to sublocation:', spawnId);
      }
      
      // Remove from active spawns after delay
      setTimeout(() => {
        if (removeSpawn) {
          removeSpawn(spawnId);
        }
      }, 2000);
    });

    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [createChatWithEntity, updateChatImage, updateChatImagePrompt, updateChatSystemPrompt, updateChatDeepProfile]);
}
