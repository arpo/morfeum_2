import { useState, useCallback } from 'react';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { splitWorldAndLocation } from '@/utils/locationProfile';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import type { LocationPanelLogicReturn } from './types';

/**
 * Location-specific panel logic - extends base entity panel with travel functionality
 */
export function useLocationPanel(): LocationPanelLogicReturn {
  const base = useEntityPanelBase();
  const [movementInput, setMovementInput] = useState('');
  const [isMoving] = useState(false); // Future: implement travel logic
  
  const createLocation = useLocationsStore(state => state.createLocation);

  const handleMove = useCallback(async () => {
    // Movement logic - UI placeholder for future travel feature
    console.log('[useLocationPanel] Movement input:', movementInput);
    // TODO: Implement travel system
  }, [movementInput]);

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
    
    // Split the deep profile into world and location data
    const { world, location } = splitWorldAndLocation(deepProfile as Record<string, any>);
    
    // Create location in storage
    createLocation({
      id: base.activeChat, // Use spawnId as location ID
      world_id: base.activeChat, // Use same ID for world
      name: base.activeChatSession.entityName || 'Unnamed Location',
      locationInfo: location,
      worldInfo: world,
      imagePath: base.activeChatSession.entityImage || '',
      parent_location_id: null,
      adjacent_to: [],
      children: [],
      depth_level: 0
    });
    
    base.setIsSaved(true);
    console.log(`[useLocationPanel] Location saved with ID: ${base.activeChat}`);
  }, [base, createLocation]);

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
