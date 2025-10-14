import { useState, useCallback } from 'react';
import { useLocationsStore } from '@/store/slices/locationsSlice';
import { useStore } from '@/store';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import type { LocationPanelLogicReturn } from './types';
import { initFocus, updateFocus } from '@/utils/locationFocus';

/**
 * Location-specific panel logic - extends base entity panel with travel functionality
 */
export function useLocationPanel(): LocationPanelLogicReturn {
  const base = useEntityPanelBase();
  const [movementInput, setMovementInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  
  const createLocation = useLocationsStore(state => state.createLocation);
  const getLocation = useLocationsStore(state => state.getLocation);
  const getAllLocations = useLocationsStore(state => state.getAllLocations);
  const getLocationsByWorld = useLocationsStore(state => state.getLocationsByWorld);
  const updateLocationFocus = useLocationsStore(state => state.updateLocationFocus);
  const startSpawn = useStore(state => state.startSpawn);
  const setActiveChat = useStore(state => state.setActiveChat);

  const handleMove = useCallback(async () => {
    if (!movementInput.trim()) {
      console.warn('[useLocationPanel] Cannot travel: missing input');
      return;
    }
    
    if (!base.activeChat) {
      console.warn('[useLocationPanel] Cannot travel: no active location');
      return;
    }
    
    try {
      setIsMoving(true);
      
      // Get current location
      const currentLocation = getLocation(base.activeChat);
      if (!currentLocation) {
        console.warn('[useLocationPanel] Cannot travel: current location not found');
        return;
      }
      
      // Initialize focus if missing
      const currentFocus = currentLocation.focus || initFocus(currentLocation);
      
      // Get all nodes in this world
      const worldId = currentLocation.world_id;
      const allNodes = getLocationsByWorld(worldId);
      
      console.log('[NavigatorAI] Finding destination...');
      console.log('[NavigatorAI] Command:', movementInput.trim());
      console.log('[NavigatorAI] Current focus:', currentFocus);
      console.log('[NavigatorAI] Available nodes:', allNodes.length);
      
      // Call NavigatorAI backend endpoint
      // Only send minimal node data for performance
      const response = await fetch('/api/mzoo/navigator/find-destination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCommand: movementInput.trim(),
          currentFocus,
          allNodes: allNodes.map(node => ({
            id: node.id,
            name: node.name,
            searchDesc: (node.dna?.location?.profile as any)?.searchDesc ||
                       (node.dna?.region?.profile as any)?.searchDesc ||
                       (node.dna?.world?.profile as any)?.searchDesc ||
                       node.name,
            depth_level: node.depth_level,
            parent_location_id: node.parent_location_id
          }))
        })
      });
      
      if (!response.ok) {
        const error = await response.json();
        console.error('[NavigatorAI] API error:', error);
        return;
      }
      
      const result = await response.json();
      const navigation = result.data;
      
      console.log('[NavigatorAI] Result:', navigation);
      
      if (navigation.action === 'move' && navigation.targetNodeId) {
        // Move to existing location
        const targetLocation = getLocation(navigation.targetNodeId);
        if (targetLocation) {
          console.log('[NavigatorAI] 🚀 Moving to:', {
            name: targetLocation.name,
            id: navigation.targetNodeId,
            reason: navigation.reason
          });
          
          // Update focus to target location
          const newFocus = updateFocus(currentFocus, navigation.targetNodeId, {
            perspective: 'exterior' // Default, could be inferred from command
          });
          updateLocationFocus(navigation.targetNodeId, newFocus);
          
          // Switch active chat to target location
          setActiveChat(navigation.targetNodeId);
          console.log('[NavigatorAI] ✅ Switched to location:', navigation.targetNodeId);
        } else {
          console.warn('[NavigatorAI] ❌ Target location not found:', navigation.targetNodeId);
        }
      } else if (navigation.action === 'generate') {
        // Just log the suggestion, don't auto-spawn
        console.log('[NavigatorAI] 💡 Suggestion to generate:', {
          name: navigation.name,
          parentNodeId: navigation.parentNodeId,
          relation: navigation.relation,
          reason: navigation.reason
        });
        console.log('[NavigatorAI] 📝 Parent location ID:', navigation.parentNodeId);
        console.log('[NavigatorAI] 📝 To create this location, use the spawn input with:', navigation.name);
      }
      
      // Clear input
      setMovementInput('');
    } catch (error) {
      console.error('[NavigatorAI] Navigation failed:', error);
    } finally {
      setIsMoving(false);
    }
  }, [movementInput, base.activeChat, getLocation, getAllLocations, getLocationsByWorld, updateLocationFocus, startSpawn]);

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
