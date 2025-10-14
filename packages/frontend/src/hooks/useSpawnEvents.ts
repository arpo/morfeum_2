/**
 * Hook to listen to Server-Sent Events for spawn updates
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useLocationsStore, Node, NodeType } from '@/store/slices/locationsSlice';

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
  
  // New tree-based methods
  const createNode = useLocationsStore(state => state.createNode);
  const getNode = useLocationsStore(state => state.getNode);
  const updateNode = useLocationsStore(state => state.updateNode);
  const addNodeToTree = useLocationsStore(state => state.addNodeToTree);
  const getCascadedDNA = useLocationsStore(state => state.getCascadedDNA);

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
      console.log('🎨 Image Generated:', imageUrl);
      
      // Update chat with image
      if (updateChatImage) {
        updateChatImage(spawnId, imageUrl);
      }
      
      // Update chat with image prompt
      if (updateChatImagePrompt && imagePrompt) {
        updateChatImagePrompt(spawnId, imagePrompt);
      }
      
      // For location nodes, update the imagePath in the location node
      // The location node ID should be spawnId-location based on tree creation logic
      const locationNodeId = `${spawnId}-location`;
      const locationNode = getNode(locationNodeId);
      if (locationNode) {
        console.log('[SSE] 📸 Updating location node image:', locationNodeId);
        updateNode(locationNodeId, { imagePath: imageUrl });
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
        
        // Build tree structure from hierarchical DNA
        const worldId = spawnId; // Root world uses spawn ID
        
        // Create world node
        const worldNode: Node = {
          id: worldId,
          type: 'world',
          name: deepProfile.world.meta.name,
          dna: deepProfile.world,
          imagePath: '',
          focus: undefined,
        };
        createNode(worldNode);
        addNodeToTree(worldId, null, worldId, 'world');
        console.log('[Tree] Created world node:', worldId);
        
        // Create region node if exists
        let regionId: string | null = null;
        if (deepProfile.region) {
          regionId = `${worldId}-region`;
          const regionNode: Node = {
            id: regionId,
            type: 'region',
            name: deepProfile.region.meta.name,
            dna: deepProfile.region,
            imagePath: '',
            focus: undefined,
          };
          createNode(regionNode);
          addNodeToTree(worldId, worldId, regionId, 'region');
          console.log('[Tree] Created region node:', regionId);
        }
        
        // Create location node if exists
        if (deepProfile.location) {
          const locationId = `${worldId}-location`;
          const locationNode: Node = {
            id: locationId,
            type: 'location',
            name: deepProfile.location.meta.name,
            dna: deepProfile.location,
            imagePath: '', // Will be set when image arrives
            focus: undefined,
          };
          createNode(locationNode);
          
          const parentId = regionId || worldId;
          addNodeToTree(worldId, parentId, locationId, 'location');
          console.log('[Tree] Created location node:', locationId);
          
          // Update the chat session's deep profile to use the location node ID
          // This ensures the image and focus updates target the location node
          if (updateChatDeepProfile && deepProfile) {
            updateChatDeepProfile(spawnId, deepProfile);
          }
        }
      } else {
        // Character entity - store deep profile normally
        if (updateChatDeepProfile && deepProfile) {
          updateChatDeepProfile(spawnId, deepProfile);
        }
      }
      
      console.log('💬 Enhanced System Prompt Updated');
      
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
      
      // Get parent node to build cascaded DNA for preview
      const parentNode = getNode(parentNodeId);
      if (!parentNode) {
        console.error('[SSE] ❌ Parent node not found:', parentNodeId);
        return;
      }
      
      console.log('[SSE] 🔍 Getting cascaded DNA from parent:', parentNodeId);
      
      // Get cascaded DNA from tree traversal
      const cascadedDNA = getCascadedDNA(parentNodeId);
      
      // Build complete inherited DNA structure for preview
      const inheritedDNA = {
        ...cascadedDNA,
        sublocation: dna
      };
      
      console.log('[SSE] ✅ Preview DNA has world node:', !!inheritedDNA.world);
      
      // Create preview immediately with DNA (no image yet)
      // This switches the preview panel to show the new sublocation
      if (createChatWithEntity) {
        const cleanName = dna.meta.name.split(' (')[0];
        const seed = {
          name: cleanName,
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
      
      // Get parent node
      const parentNode = getNode(parentNodeId);
      if (!parentNode) {
        console.error('[SSE] ❌ Parent node not found:', parentNodeId);
        return;
      }
      
      // Find world ID by traversing tree
      const cascadedDNA = getCascadedDNA(parentNodeId);
      if (!cascadedDNA.world) {
        console.error('[SSE] ❌ Could not find world DNA for parent:', parentNodeId);
        return;
      }
      
      // Extract clean name (remove the hierarchical suffix)
      const cleanName = dna.meta.name.split(' (')[0];
      
      console.log('[SSE] 🧬 Creating sublocation node:', cleanName);
      
      // Create sublocation node
      const sublocationNode: Node = {
        id: spawnId,
        type: 'sublocation',
        name: cleanName,
        dna: dna,
        imagePath: imageUrl || '',
        focus: undefined,
      };
      
      createNode(sublocationNode);
      
      // Find world ID from cascaded DNA
      // The world node ID is the first node in any tree path
      const worldId = Object.values(useLocationsStore.getState().nodes)
        .find(node => node.type === 'world' && node.dna === cascadedDNA.world)?.id;
      
      if (!worldId) {
        console.error('[SSE] ❌ Could not find world ID for sublocation');
        return;
      }
      
      // Add to tree under parent
      addNodeToTree(worldId, parentNodeId, spawnId, 'sublocation');
      
      console.log('[SSE] 📍 Sublocation stored in tree:', spawnId);
      console.log('[SSE] 📊 Tree: world:', worldId, ', parent:', parentNodeId);
      console.log('[SSE] ✅ Node created with clean name:', cleanName);
      
      // Update chat deep profile with cascaded DNA for display
      const fullCascadedDNA = {
        ...cascadedDNA,
        sublocation: dna
      };
      
      if (updateChatDeepProfile) {
        updateChatDeepProfile(spawnId, fullCascadedDNA as any);
      }
      
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
