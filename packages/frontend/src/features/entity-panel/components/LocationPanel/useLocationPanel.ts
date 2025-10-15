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
      
      // NEW: Build currentLocationDetails from node DNA for visual context
      const nodeDNA = currentNode.dna as any;
      
      // Extract visualAnchors from DNA (flat NodeDNA structure)
      const visualAnchors = nodeDNA.visualAnchors || {
        dominantElements: [],
        uniqueIdentifiers: []
      };
      
      // Extract searchDesc
      const searchDesc = nodeDNA.searchDesc || nodeDNA.profile?.searchDesc || currentNode.name;
      
      // Extract viewContext
      const viewContext = nodeDNA.viewContext || nodeDNA.profile?.viewContext || {
        focusTarget: currentNode.name
      };
      
      // Build currentLocationDetails
      const currentLocationDetails = {
        node_id: currentNode.id,
        name: currentNode.name,
        searchDesc,
        visualAnchors: {
          dominantElements: visualAnchors.dominantElements || [],
          uniqueIdentifiers: visualAnchors.uniqueIdentifiers || []
        },
        currentView: {
          viewKey: 'default',
          focusTarget: viewContext.focusTarget || currentNode.name
        }
        // viewDescriptions will be added in future multi-view implementation
      };
      
      console.log('[NavigatorAI] 🎯 Visual context:', {
        dominantElements: currentLocationDetails.visualAnchors.dominantElements,
        currentView: currentLocationDetails.currentView.focusTarget
      });
      
      // Call NavigatorAI backend endpoint with visual context
      const response = await fetch('/api/mzoo/navigator/find-destination', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userCommand: movementInput.trim(),
          currentFocus,
          currentLocationDetails, // NEW: Visual context for spatial reasoning
          allNodes: spatialNodes.map(node => {
            // Extract searchDesc from node's DNA based on type
            let searchDesc = node.name;
            const dna = node.dna as any;
            
            if (dna.profile?.searchDesc) {
              searchDesc = dna.profile.searchDesc;
            }
            
            // Find world tree containing this node to get depth info
            const worldTree = getWorldTree(node.id);
            let depth_level = 0;
            let parent_location_id = null;
            
            // Simple depth calculation based on node type (temporary)
            if (node.type === 'world') depth_level = 0;
            else if (node.type === 'region') depth_level = 1;
            else if (node.type === 'location') depth_level = 2;
            else if (node.type === 'sublocation') depth_level = 3;
            
            return {
              id: node.id,
              name: node.name,
              dna: node.dna,
              searchDesc,
              depth_level,
              parent_location_id
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
          console.error('[NavigatorAI] Available nodes:', spatialNodes.map(n => ({id: n.id, name: n.name})));
          return;
        }
        
        // Validate parent is in same world tree (prevent cross-world generation)
        const parentCascaded = getCascadedDNA(navigation.parentNodeId);
        
        // Add null check for parentCascaded
        if (!parentCascaded || !parentCascaded.world) {
          console.error('[NavigatorAI] ❌ Could not get cascaded DNA for parent:', navigation.parentNodeId);
          console.error('[NavigatorAI] Using current node as parent instead');
          navigation.parentNodeId = currentNode.id;
        }
        
        // Both current and parent must have world DNA, and they must be the same world
        if (!cascadedDNA.world) {
          console.error('[NavigatorAI] ❌ Current node missing world DNA');
          return;
        }
        
        if (!parentCascaded.world) {
          console.error('[NavigatorAI] ❌ Parent node missing world DNA, using current node as parent');
          navigation.parentNodeId = currentNode.id;
        } else if (cascadedDNA.world.meta?.name !== parentCascaded.world.meta?.name) {
          console.error('[NavigatorAI] ❌ Parent node is in different world tree, using current node as parent');
          console.log('[NavigatorAI] Current world:', cascadedDNA.world.meta.name);
          console.log('[NavigatorAI] Parent world:', parentCascaded.world.meta.name);
          navigation.parentNodeId = currentNode.id;
        }
        
        // Get parent node DNA directly (not cascaded)
        const parentDNA = parentNode.dna as any;
        
        // Detect structure: flat NodeDNA vs hierarchical
        const isFlatDNA = !parentDNA.world && !parentDNA.region && !parentDNA.location && parentDNA.looks;
        
        console.log('[Sublocation Generation] Parent DNA structure:', isFlatDNA ? 'Flat NodeDNA' : 'Hierarchical');
        
        // Build cascaded context from parent's DNA
        const cascadedContext: any = {};
        
        if (isFlatDNA) {
          // NEW: Extract from flat NodeDNA structure
          console.log('[Sublocation Generation] Extracting context from flat NodeDNA');
          
          cascadedContext.parentLocationName = parentNode.name;
          cascadedContext.atmosphere = parentDNA.atmosphere || '';
          cascadedContext.mood = parentDNA.mood || '';
          cascadedContext.colorsAndLighting = parentDNA.colorsAndLighting || '';
          cascadedContext.materials = parentDNA.materials || '';
          cascadedContext.lighting = parentDNA.colorsAndLighting || ''; // Use colorsAndLighting for lighting
          cascadedContext.architectural_tone = parentDNA.architectural_tone || ''; // NEW: architectural style
          
          // Extract from visualAnchors if available
          if (parentDNA.visualAnchors) {
            if (parentDNA.visualAnchors.colorMapping) {
              cascadedContext.palette = [
                parentDNA.visualAnchors.colorMapping.dominant,
                parentDNA.visualAnchors.colorMapping.secondary,
                parentDNA.visualAnchors.colorMapping.accent
              ].filter(Boolean);
            }
            
            if (parentDNA.visualAnchors.surfaceMaterialMap) {
              const mats = parentDNA.visualAnchors.surfaceMaterialMap;
              cascadedContext.dominant_materials = [
                mats.primary_surfaces,
                mats.secondary_surfaces
              ].filter(Boolean);
            }
          }
          
          // Parse sounds into soundscape array
          if (parentDNA.sounds) {
            cascadedContext.soundscape = parentDNA.sounds.split(',').map((s: string) => s.trim());
          }
          
          // Set empty defaults for missing fields
          cascadedContext.environment = '';
          cascadedContext.genre = '';
          cascadedContext.structures = [];
          
        } else {
          // OLD: Extract from hierarchical structure
          console.log('[Sublocation Generation] Extracting context from hierarchical structure');
          
          const parentCascadedDNA = getCascadedDNA(navigation.parentNodeId);
          
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
        }
        
        // Ensure required array properties have defaults to prevent .join() errors
        cascadedContext.palette = cascadedContext.palette || [];
        cascadedContext.soundscape = cascadedContext.soundscape || [];
        cascadedContext.dominant_materials = cascadedContext.dominant_materials || [];
        cascadedContext.structures = cascadedContext.structures || [];
        
        // Log cascaded context for verification
        console.log('[Sublocation Generation] 🎨 Cascaded Visual Context:', cascadedContext);
        
        // Start sublocation spawn with pipeline
        // console.log('[Sublocation Generation] ⚙️ Starting sublocation spawn pipeline...');
        
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
          
          // console.log('[Sublocation Generation] ✅ Spawn started:', spawnId);
          // console.log('[Sublocation Generation] 📊 Watch the ActiveSpawnsPanel for progress updates');
          
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
