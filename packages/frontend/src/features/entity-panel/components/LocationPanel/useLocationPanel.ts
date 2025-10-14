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

  const handleMove = useCallback(async () => {
    if (!movementInput.trim()) {
      console.warn('[useLocationPanel] Cannot travel: missing input');
      return;
    }
    
    try {
      setIsMoving(true);
      
      // Just log the travel input for now
      console.log('[useLocationPanel] Travel destination:', movementInput.trim());
      console.log('[useLocationPanel] Current location:', base.activeChatSession?.entityName || 'unknown');
      
      // Clear input
      setMovementInput('');
    } catch (error) {
      console.error('[useLocationPanel] Failed to log travel:', error);
    } finally {
      setIsMoving(false);
    }
  }, [movementInput, base.activeChatSession]);

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
    
    console.log(`[useLocationPanel] Location saved with ID: ${base.activeChat}`);
    
    base.setIsSaved(true);
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
