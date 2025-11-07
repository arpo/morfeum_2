import { useState, useCallback } from 'react';
import { useLocationsStore } from '@/store/slices/locations';
import { useStore } from '@/store';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import type { LocationPanelLogicReturn } from './types';
import { updateFocus } from '@/utils/locationFocus';
import {
  buildCurrentLocationDetails,
  buildSpatialNodes,
  findDestination
} from './locationNavigation';
import {
  buildCascadedContext,
  validateParentNode
} from './locationCascading';
import { startSublocationSpawn } from './locationSpawn';

/**
 * Location-specific panel logic - extends base entity panel with travel functionality
 */
export function useLocationPanel(): LocationPanelLogicReturn {
  const base = useEntityPanelBase();
  const [movementInput, setMovementInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [createImage, setCreateImage] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  
  // Store methods
  const getNode = useLocationsStore(state => state.getNode);
  const getSpatialNodes = useLocationsStore(state => state.getSpatialNodes);
  const updateNodeFocus = useLocationsStore(state => state.updateNodeFocus);
  const getCascadedDNA = useLocationsStore(state => state.getCascadedDNA);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const startSpawn = useStore(state => state.startSpawn);
  const setActiveEntity = useStore(state => state.setActiveEntity);

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
        saveLocation();
        currentNode = getNode(base.activeChat);
      }
      
      if (!currentNode) {
        console.warn('[useLocationPanel] Cannot travel: current node not found');
        return;
      }
      
      // Get cascaded DNA for current node
      const cascadedDNA = getCascadedDNA(currentNode.id);
      
      // Initialize focus if missing (for later move action)
      const currentFocus = currentNode.focus || {
        node_id: currentNode.name,
        perspective: 'exterior' as const,
        viewpoint: 'default view',
        distance: 'medium' as const,
      };
      
      // Get spatially connected nodes
      const spatialNodes = getSpatialNodes(currentNode.id);
      
      // Build spatial nodes with tree traversal data
      const spatialNodesWithTree = buildSpatialNodes(spatialNodes, worldTrees);
      
      // Call NavigatorAI to find destination
      const navigation = await findDestination(
        movementInput,
        currentNode,
        spatialNodesWithTree,
        getCascadedDNA
      );
      
      // If image was generated, display it
      if (navigation.imageUrl) {
        setPreviewImage(navigation.imageUrl);
      }
      
      // Handle navigation result
      if (navigation.action === 'move' && navigation.targetNodeId) {
        await handleMoveAction(navigation, currentFocus);
      } else if (navigation.action === 'generate') {
        // TODO: Implement generate action - currently disabled
        // await handleGenerateAction(navigation, currentNode, cascadedDNA);
      }
      
      // Clear input
      setMovementInput('');
    } catch (error) {
      if (error instanceof Error && error.message === 'ALREADY_AT_TOP_LEVEL') {
        // User-friendly error already logged, just return
        return;
      }
      console.error('[NavigatorAI] Navigation failed:', error);
    } finally {
      setIsMoving(false);
    }
  }, [
    movementInput,
    base.activeChat,
    base.activeChatSession,
    getNode,
    getSpatialNodes,
    updateNodeFocus,
    getCascadedDNA,
    worldTrees,
    startSpawn,
    setActiveEntity,
    createImage
  ]);

  /**
   * Handle 'move' action - navigate to existing node
   */
  const handleMoveAction = useCallback(async (
    navigation: any,
    currentFocus: any
  ) => {
    const targetNode = getNode(navigation.targetNodeId);
    if (targetNode) {
      // Update focus to target node
      const newFocus = updateFocus(currentFocus, navigation.targetNodeId, {
        perspective: 'exterior'
      });
      updateNodeFocus(navigation.targetNodeId, newFocus);
      
      // Switch active entity to target node
      setActiveEntity(navigation.targetNodeId);
    } else {
      console.warn('[NavigatorAI] ⚠️ Target node not found:', navigation.targetNodeId);
    }
  }, [getNode, updateNodeFocus, setActiveEntity]);

  /**
   * Handle 'generate' action - create new niche
   */
  const handleGenerateAction = useCallback(async (
    navigation: any,
    currentNode: any,
    cascadedDNA: any
  ) => {
    // Get parent node
    const parentNode = getNode(navigation.parentNodeId);
    if (!parentNode) {
      console.error('[NavigatorAI] ❌ Parent node not found:', navigation.parentNodeId);
      return;
    }
    
    // Validate parent is in same world tree
    const validatedParentId = validateParentNode(
      navigation.parentNodeId,
      currentNode,
      cascadedDNA,
      getCascadedDNA
    );
    
    // Get validated parent node
    const validatedParentNode = getNode(validatedParentId);
    if (!validatedParentNode) {
      console.error('[NavigatorAI] ❌ Validated parent node not found');
      return;
    }
    
    // Build cascaded context from parent node
    const cascadedContext = buildCascadedContext(
      validatedParentNode,
      getCascadedDNA
    );
    
    // Start niche spawn
    await startSublocationSpawn(
      navigation.name,
      validatedParentId,
      cascadedContext,
      createImage,
      navigation.scale_hint,
      startSpawn
    );
  }, [getNode, getCascadedDNA, createImage, startSpawn]);

  const saveLocation = useCallback(async () => {
    if (!base.activeChatSession || !base.activeChat) {
      console.warn('[useLocationPanel] Cannot save: no active chat session');
      return;
    }
    
    const deepProfile = base.activeChatSession.deepProfile;
    if (!deepProfile) {
      console.warn('[useLocationPanel] Cannot save: no deep profile data');
      return;
    }
    
    // Save to backend file
    const saveToBackend = useLocationsStore.getState().saveToBackend;
    const success = await saveToBackend();
    
    if (success) {
      base.setIsSaved(true);
    } else {
      console.error('[useLocationPanel] Failed to save to backend');
    }
  }, [base]);

  return {
    state: {
      ...base,
      movementInput,
      isMoving,
      createImage,
      previewImage
    },
    handlers: {
      openModal: base.openModal,
      closeModal: base.closeModal,
      openFullscreen: base.openFullscreen,
      closeFullscreen: base.closeFullscreen,
      setMovementInput,
      handleMove,
      saveLocation,
      setCreateImage,
      clearPreviewImage: () => setPreviewImage(null)
    }
  };
}
