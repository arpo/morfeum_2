/**
 * Hook to listen to Server-Sent Events for spawn updates
 */

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { collectAllNodeIds } from '@/utils/treeUtils';

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
  
  // Tree-based methods
  const setCompleteWorldTree = useLocationsStore(state => state.setCompleteWorldTree);
  const updateNode = useLocationsStore(state => state.updateNode);

  useEffect(() => {
    // Connect to SSE endpoint
    const eventSource = new EventSource('/api/spawn/events');
    eventSourceRef.current = eventSource;

    // Handle connection errors
    eventSource.onerror = (error) => {
      console.error('[SSE] Connection error:', error);
    };

    // ========================================================================
    // CHARACTER SPAWN EVENTS
    // ========================================================================

    // Listen for seed complete event
    eventSource.addEventListener('spawn:seed-complete', (e) => {
      const { spawnId, seed, systemPrompt } = JSON.parse(e.data);
      
      // Create entity session - Character only (locations use new pipeline)
      // Only handle characters here
      const entityType = 'character';
      
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

    // Listen for image complete event (Characters)
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
      
      if (entityType === 'character') {
        if (updateEntityProfile && deepProfile) {
          updateEntityProfile(spawnId, deepProfile);
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
      }
    });

    // Listen for spawn cancelled event
    eventSource.addEventListener('spawn:cancelled', (e) => {
      const { spawnId } = JSON.parse(e.data);
      if (removeSpawn) removeSpawn(spawnId);
    });

    // Listen for spawn error event
    eventSource.addEventListener('spawn:error', (e) => {
      const { spawnId, error } = JSON.parse(e.data);
      console.error('[SSE] Spawn error:', { spawnId, error });
      if (removeSpawn) removeSpawn(spawnId);
    });

    // ========================================================================
    // WORLD / LOCATION SPAWN EVENTS (NEW PIPELINE)
    // ========================================================================

    // Status update
    eventSource.addEventListener('world:status', (e) => {
      const { spawnId, status } = JSON.parse(e.data);
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, status);
      }
    });

    // Image ready (preview)
    eventSource.addEventListener('world:image-ready', (e) => {
      const { spawnId, imageUrl, prompt } = JSON.parse(e.data);
      
      // We don't have a permanent node yet, but we can update the active spawn session
      // Is there an entity session for the spawnId itself?
      
      // For locations, the 'spawnId' is currently just tracking progress.
      // We could create a temporary placeholder entity if we wanted to show preview.
      // But the current UI just shows progress bar. 
      // If we want to show the image in the progress row, we'd need to update the store.
      
      // For now, simply logging or updating status is fine.
      // The status update to 'analyzing' happens next.
    });

    // World Generation Complete
    eventSource.addEventListener('world:complete', (e) => {
      const { spawnId, worldTree } = JSON.parse(e.data);
      
      console.log('[World] Generation Complete:', worldTree.name);
      console.log('Tree:', worldTree);
      
      // 1. Store the complete tree structure
      // This handles creating nodes, tree structure, and pinning
      setCompleteWorldTree(worldTree.rootNode);
      
      // 2. Create entity sessions for all nodes so they can be chatted with
      const rootNode = worldTree.rootNode;
      const allNodeIds = collectAllNodeIds(rootNode);
      
      createEntitySessionsForNodes(
        allNodeIds,
        { createEntity, updateEntityImage, updateEntityProfile }
      );

      // 3. Set active entity to the root (Host)
      if (setActiveEntity) {
        setActiveEntity(rootNode.id);
      }

      // 4. Cleanup spawn progress
      if (updateSpawnStatus) {
        updateSpawnStatus(spawnId, 'completed');
      }
      
      setTimeout(() => {
        if (removeSpawn) {
          removeSpawn(spawnId);
        }
      }, 2000);
    });

    // Legacy Hierarchy events cleanup
    // We keep listeners but with minimal logic or logging if needed, 
    // or remove them if we are sure they aren't used.
    // Since we updated the backend endpoint, new spawns use world:* events.
    // Old events might still fire if there are lingering processes but they will just log errors.
    
    const legacyEvents = [
      'hierarchy:classification-complete',
      'hierarchy:image-prompt-generated',
      'hierarchy:host-dna-complete',
      'hierarchy:region-dna-complete',
      'hierarchy:location-dna-complete',
      'hierarchy:niche-dna-complete',
      'hierarchy:detail-dna-complete',
      'hierarchy:all-image-prompts-complete',
      'hierarchy:image-generation-started',
      'hierarchy:image-complete',
      'hierarchy:visual-analysis-complete',
      'hierarchy:complete',
      'hierarchy:cancelled',
      'hierarchy:error'
    ];

    legacyEvents.forEach(eventType => {
        eventSource.addEventListener(eventType, (e) => {
            // Consume and ignore legacy events to prevent errors
            // console.debug('[Legacy SSE]', eventType);
            
            // Handle cancellation/error to clean up spawns
            if (eventType === 'hierarchy:cancelled' || eventType === 'hierarchy:error') {
                 const { spawnId } = JSON.parse(e.data);
                 if (removeSpawn) removeSpawn(spawnId);
            }
        });
    });


    // Cleanup on unmount
    return () => {
      eventSource.close();
    };
  }, [createEntity, updateEntityImage, updateEntityImagePrompt, updateEntitySystemPrompt, updateEntityProfile]);
}
