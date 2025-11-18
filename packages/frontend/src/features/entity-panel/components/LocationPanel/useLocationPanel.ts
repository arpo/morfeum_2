import { useState, useCallback } from 'react';
import { useLocationsStore } from '@/store/slices/locations';
import { useStore } from '@/store';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import type { LocationPanelLogicReturn } from './types';
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
      
      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('📥 NAVIGATION RESULT RECEIVED');
      console.log('═══════════════════════════════════════════════════════════');
      console.log('  Action:', navigation.action);
      console.log('  Has Node:', !!navigation.node ? '✓' : '✗');
      console.log('  Has Image:', !!navigation.imageUrl ? '✓' : '✗');
      console.log('═══════════════════════════════════════════════════════════\n');
      
      // Handle navigation result
      if (navigation.action === 'move' && navigation.targetNodeId) {
        await handleMoveAction(navigation);
      } else if (navigation.action === 'generate') {
        // If backend returned a complete node, save it
        if (navigation.node) {
          console.log('✅ [FRONTEND] Using new node creation system\n');
          await handleNodeCreation(navigation, currentNode);
        } else {
          console.log('⚠️ [FRONTEND] Falling back to old spawn system\n');
          await handleGenerateAction(navigation, currentNode, cascadedDNA);
        }
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
    navigation: any
  ) => {
    const targetNode = getNode(navigation.targetNodeId);
    if (targetNode) {
      // Switch active entity to target node
      setActiveEntity(navigation.targetNodeId);
    } else {
      console.warn('[NavigatorAI] ⚠️ Target node not found:', navigation.targetNodeId);
    }
  }, [getNode, setActiveEntity]);

  /**
   * Handle node creation from backend
   */
  const handleNodeCreation = useCallback(async (
    navigation: any,
    currentNode: any
  ) => {
    const { node, parentNodeId } = navigation;
    
    // Add node to store
    const createNode = useLocationsStore.getState().createNode;
    createNode(node);
    
    // Find which world tree contains the current node
    const worldTree = worldTrees.find(tree => {
      const findInTree = (treeNode: any, targetId: string): boolean => {
        if (treeNode.id === targetId) return true;
        return treeNode.children?.some((child: any) => findInTree(child, targetId)) || false;
      };
      return findInTree(tree, currentNode.id);
    });
    
    if (!worldTree) {
      console.error('[handleNodeCreation] Cannot find world tree for current node');
      return;
    }
    
    // Use parentNodeId from backend (which correctly traverses to parent location)
    // instead of currentNode.id (which would create niche-under-niche)
    const correctParentId = parentNodeId || currentNode.id;
    
    // Add to tree structure as child of correct parent (from backend decision)
    const addNodeToTree = useLocationsStore.getState().addNodeToTree;
    addNodeToTree(worldTree.id, correctParentId, node.id, node.type);
    
    // Save to backend
    const saveToBackend = useLocationsStore.getState().saveToBackend;
    await saveToBackend();
    
    // Switch to new node
    setActiveEntity(node.id);
    
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('💾 NICHE NODE SAVED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  Name:', node.name);
    console.log('  ID:', node.id);
    console.log('  Parent ID:', correctParentId);
    console.log('  Added to tree: ✓');
    console.log('  Saved to backend: ✓');
    console.log('═══════════════════════════════════════════════════════════\n');
  }, [setActiveEntity, worldTrees]);

  /**
   * Handle 'generate' action - create new niche (fallback to old spawn system)
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
