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
        // Check depth limit
        if (currentLocation.depth_level >= 5) {
          console.error('[NavigatorAI] ❌ Max depth reached (5). Cannot create deeper sublocations.');
          return;
        }
        
        // Get parent location
        const parentLocation = getLocation(navigation.parentNodeId);
        if (!parentLocation) {
          console.error('[NavigatorAI] ❌ Parent location not found:', navigation.parentNodeId);
          return;
        }
        
        const parentDNA = parentLocation.dna;
        
        // Extract visual context from world (base layer)
        const worldContext = {
          environment: parentDNA.world.semantic.environment,
          dominant_materials: parentDNA.world.semantic.dominant_materials,
          atmosphere: parentDNA.world.semantic.atmosphere,
          architectural_tone: parentDNA.world.semantic.architectural_tone,
          genre: parentDNA.world.semantic.genre,
          mood_baseline: parentDNA.world.semantic.mood_baseline,
          palette_bias: parentDNA.world.semantic.palette_bias,
          colorsAndLighting: parentDNA.world.profile.colorsAndLighting
        };
        
        // Cascade with region (if exists) - overrides world
        const cascadedContext: any = { ...worldContext };
        
        if (parentDNA.region) {
          cascadedContext.environment = parentDNA.region.semantic.environment;
          cascadedContext.climate = parentDNA.region.semantic.climate;
          cascadedContext.weather = parentDNA.region.semantic.weather_pattern;
          cascadedContext.architecture = parentDNA.region.semantic.architecture_style;
          cascadedContext.mood = parentDNA.region.semantic.mood;
          cascadedContext.palette = parentDNA.region.semantic.palette_shift;
          cascadedContext.colorsAndLighting = parentDNA.region.profile.colorsAndLighting;
        } else {
          // No region, use world values
          cascadedContext.mood = worldContext.mood_baseline;
          cascadedContext.palette = worldContext.palette_bias;
        }
        
        // Final cascade with parent location - overrides everything
        if (parentDNA.location) {
          cascadedContext.parentLocationName = parentDNA.location.meta.name;
          cascadedContext.structures = parentDNA.location.semantic.structures;
          cascadedContext.lighting = parentDNA.location.semantic.lighting;
          cascadedContext.weather = parentDNA.location.semantic.weather_or_air;
          cascadedContext.atmosphere = parentDNA.location.semantic.atmosphere;
          cascadedContext.mood = parentDNA.location.semantic.mood;
          cascadedContext.palette = parentDNA.location.semantic.color_palette;
          cascadedContext.soundscape = parentDNA.location.semantic.soundscape;
          cascadedContext.materials = parentDNA.location.profile.materials;
          cascadedContext.colorsAndLighting = parentDNA.location.profile.colorsAndLighting;
        }
        
        // Log cascaded context for verification
        console.log('[Sublocation Generation] 🎨 Cascaded Visual Context:', cascadedContext);
        
        // Call backend to generate sublocation DNA
        console.log('[Sublocation Generation] ⚙️ Generating sublocation DNA...');
        
        try {
          const sublocationResponse = await fetch('/api/mzoo/locations/generate-sublocation', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              sublocationName: navigation.name,
              cascadedContext,
              createImage: false // For now, don't create image
            })
          });
          
          if (!sublocationResponse.ok) {
            const error = await sublocationResponse.json();
            console.error('[Sublocation Generation] ❌ API error:', error);
            return;
          }
          
          const sublocationResult = await sublocationResponse.json();
          const sublocationDNA = sublocationResult.data.sublocation;
          
          console.log('\n[Sublocation Generation] ✅ DNA Generated Successfully!');
          console.log('[Sublocation DNA] � Complete Structure:');
          console.log(JSON.stringify(sublocationDNA, null, 2));
          
        } catch (genError) {
          console.error('[Sublocation Generation] ❌ Failed to generate:', genError);
        }
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
