import { useState, useCallback } from 'react';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { useStore } from '@/store';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import type { LocationPanelLogicReturn } from './types';

/**
 * Location-specific panel logic - extends base entity panel with travel functionality
 */
export function useLocationPanel(): LocationPanelLogicReturn {
  const base = useEntityPanelBase();
  const [movementInput, setMovementInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  
  const createLocation = useLocationsStore(state => state.createLocation);
  const getLocation = useLocationsStore(state => state.getLocation);
  const getWorldDNA = useLocationsStore(state => state.getWorldDNA);
  const startSpawn = useStore(state => state.startSpawn);

  const handleMove = useCallback(async () => {
    if (!movementInput.trim() || !base.activeChat) {
      console.warn('[useLocationPanel] Cannot travel: missing input or location');
      return;
    }
    
    try {
      setIsMoving(true);
      
      // Try to get saved location
      let currentLocation = getLocation(base.activeChat);
      let worldId: string;
      
      if (!currentLocation) {
        // Location not saved yet - check if it's in chat session
        if (!base.activeChatSession?.deepProfile) {
          console.error('[useLocationPanel] No location data available. Please save the location first.');
          return;
        }
        
        // Get world_id from spawn info (for unsaved sub-locations)
        const spawnInfo = useStore.getState().activeSpawns.get(base.activeChat);
        if (spawnInfo?.parentLocationId) {
          // This is an unsaved sub-location - get world_id from parent
          const parentLocation = getLocation(spawnInfo.parentLocationId);
          if (!parentLocation) {
            console.error('[useLocationPanel] Parent location not found');
            return;
          }
          worldId = parentLocation.world_id;
        } else {
          // This is an unsaved root location - use its own ID as world_id
          worldId = base.activeChat;
        }
      } else {
        // Location is saved - use its world_id
        worldId = currentLocation.world_id;
      }
      
      // Get World DNA from root location
      const worldDNA = getWorldDNA(worldId);
      
      // Start sub-location spawn
      await startSpawn(
        movementInput.trim(),
        'location',
        base.activeChat, // Parent location ID (can be unsaved)
        worldDNA
      );
      
      // Clear input
      setMovementInput('');
      console.log('[useLocationPanel] Started sub-location spawn from:', base.activeChatSession?.entityName || 'current location');
    } catch (error) {
      console.error('[useLocationPanel] Failed to start travel:', error);
    } finally {
      setIsMoving(false);
    }
  }, [movementInput, base.activeChat, base.activeChatSession, getLocation, getWorldDNA, startSpawn]);

  const saveLocation = useCallback(() => {
    if (!base.activeChatSession || !base.activeChat) {
      console.warn('[useLocationPanel] Cannot save: no active chat session');
      return;
    }
    
    const deepProfile = base.activeChatSession.deepProfile;
    if (!deepProfile) {
      console.warn('[useLocationPanel] Cannot save: no deep profile data');
      return;
    }
    
    // Cast to hierarchical structure
    const profile = deepProfile as any;
    
    // Check if this spawn was a sub-location
    const spawnInfo = useStore.getState().activeSpawns.get(base.activeChat);
    const isSubLocation = !!spawnInfo?.parentLocationId;
    
    if (isSubLocation && spawnInfo?.parentLocationId) {
      // Sub-location: inherit world_id from parent
      const parentLocation = getLocation(spawnInfo.parentLocationId);
      
      if (!parentLocation) {
        console.error('[useLocationPanel] Parent location not found');
        return;
      }
      
      createLocation({
        id: base.activeChat,
        world_id: parentLocation.world_id, // Inherit parent's world
        name: base.activeChatSession.entityName || 'Unnamed Location',
        dna: profile, // Store complete hierarchical profile
        imagePath: base.activeChatSession.entityImage || '',
        parent_location_id: spawnInfo.parentLocationId,
        adjacent_to: [],
        children: [],
        depth_level: (parentLocation.depth_level || 0) + 1
      });
      
      console.log(`[useLocationPanel] Sub-location saved under parent: ${parentLocation.name}`);
    } else {
      // Root location: store full hierarchical DNA
      createLocation({
        id: base.activeChat,
        world_id: base.activeChat, // Root location uses own ID as world_id
        name: base.activeChatSession.entityName || 'Unnamed Location',
        dna: profile, // Store complete hierarchical profile
        imagePath: base.activeChatSession.entityImage || '',
        parent_location_id: null,
        adjacent_to: [],
        children: [],
        depth_level: 0
      });
      
      console.log(`[useLocationPanel] Root location saved with ID: ${base.activeChat}`);
    }
    
    base.setIsSaved(true);
  }, [base, createLocation, getLocation]);

  return {
    state: {
      // Base state
      ...base,
      // Location-specific state
      movementInput,
      isMoving
    },
    handlers: {
      // Base handlers
      openModal: base.openModal,
      closeModal: base.closeModal,
      openFullscreen: base.openFullscreen,
      closeFullscreen: base.closeFullscreen,
      // Location-specific handlers
      setMovementInput,
      handleMove,
      saveLocation
    }
  };
}
