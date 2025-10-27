/**
 * Hook to listen to Server-Sent Events for spawn updates
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useLocationsStore, Node } from '@/store/slices/locationsSlice';

export function useSpawnEvents() {
  const eventSourceRef = useRef<EventSource | null>(null);
  const createEntity = useStore(state => state.createEntity);
  const updateEntityImage = useStore(state => state.updateEntityImage);
  const updateEntityImagePrompt = useStore(state => state.updateEntityImagePrompt);
  const updateEntitySystemPrompt = useStore(state => state.updateEntitySystemPrompt);
  const updateEntityProfile = useStore(state => state.updateEntityProfile);
  const updateSpawnStatus = useStore(state => state.updateSpawnStatus);
  const removeSpawn = useStore(state => state.removeSpawn);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  
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
      
      // Detect entity type from seed structure
      // Locations have 'atmosphere', characters have 'personality' as discriminator
      const entityType: 'character' | 'location' = seed.atmosphere ? 'location' : 'character';
      
      // Create entity session
      if (createEntity) {
        createEntity(spawnId, seed, entityType);
      }
      
      // Set initial system prompt
      if (updateEntitySystemPrompt) {
        updateEntitySystemPrompt(spawnId, systemPrompt);
      }
      
      // Update spawn status
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'generating_image');
      }
    });

    // Listen for image complete event
    eventSource.addEventListener('spawn:image-complete', (e) => {
      const { spawnId, imageUrl, imagePrompt } = JSON.parse(e.data);
      
      // Update entity with image
      if (updateEntityImage) {
        updateEntityImage(spawnId, imageUrl);
      }
      
      // Update entity with image prompt
      if (updateEntityImagePrompt && imagePrompt) {
        updateEntityImagePrompt(spawnId, imagePrompt);
      }
      
      // Update world node image (world node uses spawnId as its ID)
      const worldNode = getNode(spawnId);
      if (worldNode && worldNode.type === 'world') {
        updateNode(spawnId, { imagePath: imageUrl });
      }
      
      // For location nodes, update the imagePath in the location node
      // The location node ID should be spawnId-location based on tree creation logic
      const locationNodeId = `${spawnId}-location`;
      const locationNode = getNode(locationNodeId);
      if (locationNode) {
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
      
      // Update spawn status
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'enriching');
      }
    });

    // Listen for profile complete event
    eventSource.addEventListener('spawn:profile-complete', (e) => {
      const { spawnId, deepProfile, enhancedSystemPrompt, entityType } = JSON.parse(e.data);
      
      // NEW: Simplified single node creation (no hierarchical splitting)
      if (entityType === 'location') {
        
        // Get image from entity session (already stored by image-complete event)
        const entities = useStore.getState().entities;
        const entitySession = entities.get(spawnId);
        const nodeImage = entitySession?.entityImage || '';
        
        // Extract name from deep profile - try multiple sources
        const nodeName = (deepProfile as any).name ||
                        (deepProfile as any).meta?.name ||
                        deepProfile.searchDesc?.split('] ')[1] || // Extract from "[World] Name"
                        entitySession?.entityName ||
                        'Unknown Location';
        
        // Create single node with flat NodeDNA (simplified for now - keep old structure temporarily)
        const node: Partial<Node> = {
          id: spawnId,
          type: 'world' as any, // Temporary - will be removed in full migration
          name: nodeName,
          dna: deepProfile, // Flat NodeDNA structure
          imagePath: nodeImage,
          focus: undefined
        };
        
        createNode(node as any);
        addNodeToTree(spawnId, null, spawnId, 'world' as any);
        
        // Store simplified DNA in deep profile
        if (updateEntityProfile && deepProfile) {
          updateEntityProfile(spawnId, deepProfile);
        }
      } else {
        // Character entity - store deep profile normally
        if (updateEntityProfile && deepProfile) {
          updateEntityProfile(spawnId, deepProfile);
        }
      }
      
      // Update system prompt with enhanced version from deep profile
      if (updateEntitySystemPrompt && enhancedSystemPrompt) {
        updateEntitySystemPrompt(spawnId, enhancedSystemPrompt);
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
      // console.log('[SSE] 🧬 Sublocation DNA generated:', spawnId);
      
      // Get parent node to build cascaded DNA for preview
      const parentNode = getNode(parentNodeId);
      if (!parentNode) {
        console.error('[SSE] ❌ Parent node not found:', parentNodeId);
        return;
      }
      
      // console.log('[SSE] 🔍 Getting cascaded DNA from parent:', parentNodeId);
      
      // Get cascaded DNA from tree traversal
      const cascadedDNA = getCascadedDNA(parentNodeId);
      
      // Build complete inherited DNA structure for preview
      const inheritedDNA = {
        ...cascadedDNA,
        sublocation: dna
      };
      
      // console.log('[SSE] ✅ Preview DNA has world node:', !!inheritedDNA.world);
      
      // Create preview immediately with DNA (no image yet)
      // This switches the preview panel to show the new sublocation
      if (createEntity) {
        const cleanName = dna.meta.name.split(' (')[0];
        const seed = {
          name: cleanName,
          looks: dna.profile.looks,
          atmosphere: dna.profile.atmosphere,
          mood: dna.profile.mood
        };
        createEntity(spawnId, seed, 'location');
      }
      
      // Store complete inherited DNA in deep profile
      if (updateEntityProfile) {
        updateEntityProfile(spawnId, inheritedDNA as any);
      }
      
      // Switch to this entity immediately
      if (setActiveEntity) {
        setActiveEntity(spawnId);
        // console.log('[SSE] 🎯 Preview switched to sublocation:', spawnId);
      }
      
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'generating_flux_prompt');
      }
    });

    // Listen for sublocation image prompt complete event
    eventSource.addEventListener('spawn:sublocation-image-prompt-complete', (e) => {
      const { spawnId, imagePrompt } = JSON.parse(e.data);
      
      // Store the image prompt
      if (updateEntityImagePrompt) {
        updateEntityImagePrompt(spawnId, imagePrompt);
      }
      
      // Update status to show we're now generating the actual image
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'generating_image');
      }
    });

    // Listen for sublocation image complete event
    eventSource.addEventListener('spawn:sublocation-image-complete', (e) => {
      const { spawnId, imageUrl } = JSON.parse(e.data);
      // console.log('[SSE] 🎨 Sublocation image generated:', imageUrl);
      
      // Update the preview with the image
      if (updateEntityImage) {
        updateEntityImage(spawnId, imageUrl);
      }
      
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'completed');
      }
    });

    // Listen for sublocation complete event
    eventSource.addEventListener('spawn:sublocation-complete', (e) => {
      const { spawnId, dna, imageUrl, parentNodeId } = JSON.parse(e.data);
      // console.log('[SSE] ✅ Sublocation generation complete:', spawnId);
      
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
      
      // Update entity deep profile with cascaded DNA for display
      const fullCascadedDNA = {
        ...cascadedDNA,
        sublocation: dna
      };
      
      if (updateEntityProfile) {
        updateEntityProfile(spawnId, fullCascadedDNA as any);
      }
      
      // Switch active entity to new sublocation
      if (setActiveEntity) {
        setActiveEntity(spawnId);
      }
      
      // Remove from active spawns after delay
      setTimeout(() => {
        if (removeSpawn) {
          removeSpawn(spawnId);
        }
      }, 2000);
    });

    // Listen for hierarchy classification complete event
    eventSource.addEventListener('hierarchy:classification-complete', (e) => {
      const { hierarchy } = JSON.parse(e.data);
      console.log('[Hierarchy] Classification Complete:');
      console.log(hierarchy);
      
      // Update status for all active location spawns
      const activeSpawns = useStore.getState().activeSpawns;
      activeSpawns.forEach((spawn, spawnId) => {
        if (spawn.entityType === 'location' && updateSpawnStatus) {
          updateSpawnStatus(spawnId, 'classifying');
        }
      });
    });

    // Listen for hierarchy image prompt generated event
    eventSource.addEventListener('hierarchy:image-prompt-generated', (e) => {
      const { spawnId, imagePrompt, nodeChain } = JSON.parse(e.data);
      console.log('[Hierarchy] Image Prompt Generated:');
      console.log(imagePrompt);
      console.log('Node Chain:', nodeChain);
      
      // Create entity session with enriched data from deepest node
      if (createEntity && nodeChain && nodeChain.length > 0) {
        const targetNode = nodeChain[nodeChain.length - 1];
        const seed = {
          name: targetNode.name,
          looks: targetNode.looks || targetNode.description,
          atmosphere: targetNode.atmosphere || '',
          mood: targetNode.mood || ''
        };
        createEntity(spawnId, seed, 'location');
      }
      
      // Store image prompt
      if (updateEntityImagePrompt) {
        updateEntityImagePrompt(spawnId, imagePrompt);
      }
      
      // Update status to generating image
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'generating_image');
      }
    });

    // Listen for hierarchy host DNA complete event
    eventSource.addEventListener('hierarchy:host-dna-complete', (e) => {
      const { nodeName, dna } = JSON.parse(e.data);
      console.log(`[Hierarchy] Host DNA Complete: ${nodeName}`);
      console.log(dna);
      
      // Update status to DNA generation
      const activeSpawns = useStore.getState().activeSpawns;
      activeSpawns.forEach((spawn, spawnId) => {
        if (spawn.entityType === 'location' && updateSpawnStatus) {
          updateSpawnStatus(spawnId, 'generating_dna');
        }
      });
    });

    // Listen for hierarchy region DNA complete event
    eventSource.addEventListener('hierarchy:region-dna-complete', (e) => {
      const { nodeName, dna } = JSON.parse(e.data);
      console.log(`[Hierarchy] Region DNA Complete: ${nodeName}`);
      console.log(dna);
    });

    // Listen for hierarchy location DNA complete event
    eventSource.addEventListener('hierarchy:location-dna-complete', (e) => {
      const { nodeName, dna } = JSON.parse(e.data);
      console.log(`[Hierarchy] Location DNA Complete: ${nodeName}`);
      console.log(dna);
    });

    // Listen for hierarchy niche DNA complete event
    eventSource.addEventListener('hierarchy:niche-dna-complete', (e) => {
      const { nodeName, dna } = JSON.parse(e.data);
      console.log(`[Hierarchy] Niche DNA Complete: ${nodeName}`);
      console.log(dna);
    });

    // Listen for hierarchy detail DNA complete event
    eventSource.addEventListener('hierarchy:detail-dna-complete', (e) => {
      const { nodeName, dna } = JSON.parse(e.data);
      console.log(`[Hierarchy] Detail DNA Complete: ${nodeName}`);
      console.log(dna);
    });

    // Listen for all image prompts complete event
    eventSource.addEventListener('hierarchy:all-image-prompts-complete', (e) => {
      const { totalNodes } = JSON.parse(e.data);
      console.log(`[Hierarchy] All Image Prompts Complete (${totalNodes} nodes)`);
    });

    // Listen for hierarchy image generation started event
    eventSource.addEventListener('hierarchy:image-generation-started', (e) => {
      const { nodeType, nodeName, prompt } = JSON.parse(e.data);
      if (nodeType && nodeName) {
        console.log(`[Hierarchy] Image Generation Started [${nodeType.toUpperCase()}]: ${nodeName}`);
      }
      
      // Update status to image generation
      const activeSpawns = useStore.getState().activeSpawns;
      activeSpawns.forEach((spawn, spawnId) => {
        if (spawn.entityType === 'location' && updateSpawnStatus) {
          updateSpawnStatus(spawnId, 'generating_image');
        }
      });
    });

    // Listen for hierarchy image complete event
    eventSource.addEventListener('hierarchy:image-complete', (e) => {
      const { spawnId, nodeType, nodeName, imageUrl, imagePrompt } = JSON.parse(e.data);
      if (nodeType && nodeName) {
        console.log(`[Hierarchy] Image Complete [${nodeType.toUpperCase()}]: ${nodeName}`);
      } else {
        console.log('[Hierarchy] Image Complete');
      }
      console.log('Image URL:', imageUrl);
      
      // Update entity with image for instant flow
      if (spawnId && updateEntityImage) {
        updateEntityImage(spawnId, imageUrl);
      }
      
      // Update entity with image prompt
      if (spawnId && updateEntityImagePrompt && imagePrompt) {
        updateEntityImagePrompt(spawnId, imagePrompt);
      }
      
      // Update spawn status
      if (spawnId && updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'completed');
        
        // Remove from active spawns after delay
        setTimeout(() => {
          if (removeSpawn) {
            removeSpawn(spawnId);
          }
        }, 2000);
      }
    });

    // Listen for hierarchy complete event (FINAL - displays result)
    eventSource.addEventListener('hierarchy:complete', (e) => {
      const { spawnId, hierarchy, metadata, imageUrl, entityType } = JSON.parse(e.data);
      console.log(`[Hierarchy] Complete!`);
      console.log('Hierarchy:', hierarchy);
      console.log('Metadata:', metadata);
      console.log('Image URL:', imageUrl);
      
      // Create entity session with hierarchy data
      if (createEntity && hierarchy.host) {
        const seed = {
          name: hierarchy.host.name,
          looks: hierarchy.host.dna?.looks || hierarchy.host.description,
          atmosphere: hierarchy.host.dna?.atmosphere || '',
          mood: hierarchy.host.dna?.mood || ''
        };
        createEntity(spawnId, seed, 'location');
      }
      
      // Update entity with image
      if (updateEntityImage && imageUrl) {
        updateEntityImage(spawnId, imageUrl);
      }
      
      // Store full hierarchy as deep profile
      if (updateEntityProfile) {
        updateEntityProfile(spawnId, {
          hierarchy,
          metadata,
          imageUrl
        } as any);
      }
      
      // Create node in location tree
      if (hierarchy.host) {
        const node: Partial<Node> = {
          id: spawnId,
          type: 'world' as any,
          name: hierarchy.host.name,
          dna: hierarchy as any,
          imagePath: imageUrl || '',
          focus: undefined
        };
        
        createNode(node as any);
        addNodeToTree(spawnId, null, spawnId, 'world' as any);
      }
      
      // Switch to this entity
      if (setActiveEntity) {
        setActiveEntity(spawnId);
      }
      
      // Update spawn status and remove from active list
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'completed');
      }
      
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
  }, [createEntity, updateEntityImage, updateEntityImagePrompt, updateEntitySystemPrompt, updateEntityProfile]);
}
