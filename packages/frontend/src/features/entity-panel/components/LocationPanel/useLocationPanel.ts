import { useState, useCallback } from 'react';
import { useLocationsStore, Node } from '@/store/slices/locationsSlice';
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
  const [createImage, setCreateImage] = useState(true);
  
  // New tree-based methods
  const getNode = useLocationsStore(state => state.getNode);
  const getSpatialNodes = useLocationsStore(state => state.getSpatialNodes);
  const updateNodeFocus = useLocationsStore(state => state.updateNodeFocus);
  const getCascadedDNA = useLocationsStore(state => state.getCascadedDNA);
  const getWorldTree = useLocationsStore(state => state.getWorldTree);
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
      
      // Get current node
      let currentNode = getNode(base.activeChat);
      if (!currentNode && base.activeChatSession?.deepProfile) {
        console.log('[useLocationPanel] ⚠️ Node not saved, saving now...');
        saveLocation();
        currentNode = getNode(base.activeChat);
      }
      
      if (!currentNode) {
        console.warn('[useLocationPanel] Cannot travel: current node not found');
        return;
      }
      
      // console.log('[useLocationPanel] 🔍 Current node:', currentNode.name, '(', currentNode.type, ')');
      
      // Get cascaded DNA for current node
      const cascadedDNA = getCascadedDNA(currentNode.id);
      // console.log('[useLocationPanel] 🌐 Cascaded DNA:', cascadedDNA);
      
      // Initialize focus if missing
      const currentFocus = currentNode.focus || {
        node_id: currentNode.name,
        perspective: 'exterior' as const,
        viewpoint: 'default view',
        distance: 'medium' as const,
      };
      
      // Get spatially connected nodes (ancestors, siblings, children)
      const spatialNodes = getSpatialNodes(currentNode.id);
      
      // console.log('[NavigatorAI] Finding destination...');
      // console.log('[NavigatorAI] Command:', movementInput.trim());
      // console.log('[NavigatorAI] Current focus:', currentFocus);
      // console.log('[NavigatorAI] Spatial nodes:', spatialNodes.length);
      
      // Call NavigatorAI backend endpoint with spatial filtering
      const response = await fetch('/api/mzoo/navigator/find-destination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCommand: movementInput.trim(),
          currentFocus,
          allNodes: spatialNodes.map(node => {
            // Extract searchDesc from node's DNA based on type
            let searchDesc = node.name;
            const dna = node.dna as any;
            
            if (dna.profile?.searchDesc) {
              searchDesc = dna.profile.searchDesc;
            }
            
            return {
              id: node.id,
              name: node.name,
              searchDesc,
              type: node.type,
            };
          })
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
        // Move to existing node
        const targetNode = getNode(navigation.targetNodeId);
        if (targetNode) {
          console.log('[NavigatorAI] 🚀 Moving to:', {
            name: targetNode.name,
            type: targetNode.type,
            id: navigation.targetNodeId,
            reason: navigation.reason
          });
          
          // Update focus to target node
          const newFocus = updateFocus(currentFocus, navigation.targetNodeId, {
            perspective: 'exterior' // Default, could be inferred from command
          });
          updateNodeFocus(navigation.targetNodeId, newFocus);
          
          // Switch active chat to target node
          setActiveChat(navigation.targetNodeId);
          // console.log('[NavigatorAI] ✅ Switched to node:', navigation.targetNodeId);
        } else {
          console.warn('[NavigatorAI] ❌ Target node not found:', navigation.targetNodeId);
        }
      } else if (navigation.action === 'generate') {
        // Get parent node
        const parentNode = getNode(navigation.parentNodeId);
        if (!parentNode) {
          console.error('[NavigatorAI] ❌ Parent node not found:', navigation.parentNodeId);
          return;
        }
        
        // Validate parent is in same world tree (prevent cross-world generation)
        const parentCascaded = getCascadedDNA(navigation.parentNodeId);
        
        // Both current and parent must have world DNA, and they must be the same world
        if (!cascadedDNA.world || !parentCascaded.world) {
          console.error('[NavigatorAI] ❌ Missing world DNA, using current node as parent');
          navigation.parentNodeId = currentNode.id;
        } else if (cascadedDNA.world.meta.name !== parentCascaded.world.meta.name) {
          console.error('[NavigatorAI] ❌ Parent node is in different world tree, using current node as parent');
          console.log('[NavigatorAI] Current world:', cascadedDNA.world.meta.name);
          console.log('[NavigatorAI] Parent world:', parentCascaded.world.meta.name);
          navigation.parentNodeId = currentNode.id;
        }
        
        // Get cascaded DNA from parent for context building
        const parentCascadedDNA = getCascadedDNA(navigation.parentNodeId);
        
        // Build cascaded context from parent's DNA tree
        const cascadedContext: any = {};
        
        // Extract world context
        if (parentCascadedDNA.world) {
          cascadedContext.environment = parentCascadedDNA.world.semantic?.environment || '';
          cascadedContext.dominant_materials = parentCascadedDNA.world.semantic?.dominant_materials || [];
          cascadedContext.atmosphere = parentCascadedDNA.world.semantic?.atmosphere || '';
          cascadedContext.architectural_tone = parentCascadedDNA.world.semantic?.architectural_tone || '';
          cascadedContext.genre = parentCascadedDNA.world.semantic?.genre || '';
          cascadedContext.mood_baseline = parentCascadedDNA.world.semantic?.mood_baseline || '';
          cascadedContext.palette_bias = parentCascadedDNA.world.semantic?.palette_bias || [];
          cascadedContext.colorsAndLighting = parentCascadedDNA.world.profile?.colorsAndLighting || '';
        }
        
        // Override with region context if exists
        if (parentCascadedDNA.region) {
          cascadedContext.environment = parentCascadedDNA.region.semantic?.environment || cascadedContext.environment;
          cascadedContext.climate = parentCascadedDNA.region.semantic?.climate;
          cascadedContext.weather = parentCascadedDNA.region.semantic?.weather_pattern;
          cascadedContext.architecture = parentCascadedDNA.region.semantic?.architecture_style;
          cascadedContext.mood = parentCascadedDNA.region.semantic?.mood || cascadedContext.mood_baseline;
          cascadedContext.palette = parentCascadedDNA.region.semantic?.palette_shift || cascadedContext.palette_bias;
          cascadedContext.colorsAndLighting = parentCascadedDNA.region.profile?.colorsAndLighting || cascadedContext.colorsAndLighting;
        } else {
          cascadedContext.mood = cascadedContext.mood_baseline;
          cascadedContext.palette = cascadedContext.palette_bias;
        }
        
        // Get immediate parent DNA (location or sublocation)
        const immediateParentDNA = parentCascadedDNA.sublocation || parentCascadedDNA.location;
        
        // Final override with immediate parent context
        if (immediateParentDNA) {
          cascadedContext.parentLocationName = immediateParentDNA.meta?.name || 'Unknown';
          cascadedContext.structures = immediateParentDNA.semantic?.structures || [];
          cascadedContext.lighting = immediateParentDNA.semantic?.lighting || '';
          cascadedContext.weather = immediateParentDNA.semantic?.weather_or_air || '';
          cascadedContext.atmosphere = immediateParentDNA.semantic?.atmosphere || '';
          cascadedContext.mood = immediateParentDNA.semantic?.mood || cascadedContext.mood;
          cascadedContext.palette = immediateParentDNA.semantic?.color_palette || cascadedContext.palette;
          cascadedContext.soundscape = immediateParentDNA.semantic?.soundscape || [];
          cascadedContext.materials = immediateParentDNA.profile?.materials || '';
          cascadedContext.colorsAndLighting = immediateParentDNA.profile?.colorsAndLighting || cascadedContext.colorsAndLighting;
        }
        
        // Ensure required array properties have defaults to prevent .join() errors
        cascadedContext.palette = cascadedContext.palette || [];
        cascadedContext.soundscape = cascadedContext.soundscape || [];
        cascadedContext.dominant_materials = cascadedContext.dominant_materials || [];
        cascadedContext.structures = cascadedContext.structures || [];
        
        // Log cascaded context for verification
        console.log('[Sublocation Generation] 🎨 Cascaded Visual Context:', cascadedContext);
        
        // Start sublocation spawn with pipeline
        console.log('[Sublocation Generation] ⚙️ Starting sublocation spawn pipeline...');
        
        try {
          const spawnId = await startSpawn(
            navigation.name,
            'sublocation',
            {
              sublocationName: navigation.name,
              parentNodeId: navigation.parentNodeId,
              cascadedContext,
              createImage
            }
          );
          
          console.log('[Sublocation Generation] ✅ Spawn started:', spawnId);
          console.log('[Sublocation Generation] 📊 Watch the ActiveSpawnsPanel for progress updates');
          
        } catch (genError) {
          console.error('[Sublocation Generation] ❌ Failed to start spawn:', genError);
        }
      }
      
      // Clear input
      setMovementInput('');
    } catch (error) {
      console.error('[NavigatorAI] Navigation failed:', error);
    } finally {
      setIsMoving(false);
    }
  }, [movementInput, base.activeChat, getNode, getSpatialNodes, updateNodeFocus, getCascadedDNA, getWorldTree, startSpawn, setActiveChat, createImage]);

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
    
    console.log('[useLocationPanel] Saving world tree structure...');
    
    // The tree should already be created by useSpawnEvents during profile-complete
    // This method is primarily for marking the entity as saved in the UI
    // The actual node creation happens in useSpawnEvents.ts
    
    console.log(`[useLocationPanel] Location tree saved with ID: ${base.activeChat}`);
    
    base.setIsSaved(true);
  }, [base]);

  return {
    state: {
      // Base state
      ...base,
      // Location-specific state
      movementInput,
      isMoving,
      createImage
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
      saveLocation,
      setCreateImage
    }
  };
}
