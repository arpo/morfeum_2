import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { useCallback, useState, useRef } from 'react';
import { useEntityPanelBase } from '../../hooks/useEntityPanelBase';
import {
  buildCascadedContext,
  validateParentNode
} from './locationCascading';
import { startSublocationSpawn } from './locationSpawn';
import type { LocationPanelLogicReturn } from './types';
import type { TreeNode, LocationNode, NicheNode } from '@/store/slices/locations';

/**
 * Helper: Find parent ID from tree structure
 */
function findParentId(worldTrees: TreeNode[], nodeId: string): string | null {
  for (const tree of worldTrees) {
    const result = findParentInTree(tree, nodeId, null);
    if (result !== undefined) return result;
  }
  return null;
}

function findParentInTree(node: TreeNode, targetId: string, parentId: string | null): string | null | undefined {
  if (node.id === targetId) return parentId;
  for (const child of node.children) {
    const result = findParentInTree(child, targetId, node.id);
    if (result !== undefined) return result;
  }
  return undefined;
}

/**
 * Helper: Extract description/looks from DNA based on node type
 */
function extractNodeData(node: any): { description?: string; looks?: string; dominantElements?: string[]; navigableElements?: any[]; searchDesc?: string } {
  const dna = node.dna;
  if (!dna) return {};
  
  // Handle nested dna structure from backend
  const innerDNA = dna.dna || dna;
  
  if (node.type === 'location' || node.type === 'niche') {
    const profile = (innerDNA as LocationNode | NicheNode)?.profile;
    return {
      description: profile?.looks || '',
      looks: profile?.looks || '',
      searchDesc: profile?.searchDesc || '',
      dominantElements: [], // Would need visual analysis data
      navigableElements: []
    };
  }
  
  return {};
}

/**
 * Location-specific panel logic - extends base entity panel with travel functionality
 */
export function useLocationPanel(): LocationPanelLogicReturn {
  const base = useEntityPanelBase();
  const [movementInput, setMovementInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [createImage, setCreateImage] = useState(true);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  // Store methods
  const getNode = useLocationsStore(state => state.getNode);
  const getSpatialNodes = useLocationsStore(state => state.getSpatialNodes);
  const getCascadedDNA = useLocationsStore(state => state.getCascadedDNA);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const findNodeInTree = useLocationsStore(state => state.findNodeInTree);
  const startSpawn = useStore(state => state.startSpawn);
  const setActiveEntity = useStore(state => state.setActiveEntity);

  /**
   * Handle 'move' action - navigate to existing node
   */
  const handleMoveAction = useCallback(async (
    navigation: any
  ) => {
    const targetNode = getNode(navigation.targetNodeId);
    if (targetNode) {
      setActiveEntity(navigation.targetNodeId);
    } else {
      console.warn('[useLocationPanel] Target node not found:', navigation.targetNodeId);
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
    
    const createNode = useLocationsStore.getState().createNode;
    createNode(node);
    
    const currentWorldTrees = useLocationsStore.getState().worldTrees;
    const worldTree = currentWorldTrees.find(tree => {
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
    
    const correctParentId = parentNodeId || currentNode.id;
    
    const addNodeToTree = useLocationsStore.getState().addNodeToTree;
    addNodeToTree(worldTree.id, correctParentId, node.id, node.type);
    
    const saveToBackend = useLocationsStore.getState().saveToBackend;
    await saveToBackend();
    
    setActiveEntity(node.id);
  }, [setActiveEntity]);

  const handleMove = useCallback(async () => {
    if (!movementInput.trim()) {
      console.warn('[useLocationPanel] Cannot travel: missing input');
      return;
    }
    
    // Parse slash command format: /COMMAND text
    const trimmedInput = movementInput.trim();
    
    // Check if input starts with /
    if (!trimmedInput.startsWith('/')) {
      console.warn('[useLocationPanel] Input must start with / (slash command)');
      setMovementInput('');
      return;
    }
    
    // Find the first space after the /
    const spaceIndex = trimmedInput.indexOf(' ');
    let command: string;
    let text: string | undefined;
    
    if (spaceIndex > 0) {
      command = trimmedInput.substring(1, spaceIndex);
      text = trimmedInput.substring(spaceIndex + 1).trim() || undefined;
    } else {
      command = trimmedInput.substring(1);
      text = undefined;
    }
    
    // Get current node from active entity
    const activeEntityId = useStore.getState().activeEntity;
    if (!activeEntityId) {
      console.warn('[useLocationPanel] No active entity');
      setMovementInput('');
      return;
    }
    
    const currentNode = getNode(activeEntityId);
    if (!currentNode) {
      console.warn('[useLocationPanel] Current node not found');
      setMovementInput('');
      return;
    }
    
    // Find parent ID from tree structure
    const currentWorldTrees = useLocationsStore.getState().worldTrees;
    const parentId = findParentId(currentWorldTrees, currentNode.id);
    const parentNode = parentId ? getNode(parentId) : undefined;
    
    // Get spatial nodes for siblings
    const spatialNodes = getSpatialNodes(currentNode.id);
    const siblingNodes = spatialNodes
      .filter(n => {
        const nodeParentId = findParentId(currentWorldTrees, n.id);
        return nodeParentId === parentId && n.id !== currentNode.id;
      })
      .map(n => ({ id: n.id, name: n.name, type: n.type }));
    
    // Extract data from DNA
    const currentNodeData = extractNodeData(currentNode);
    const parentNodeData = parentNode ? extractNodeData(parentNode) : {};
    
    const context = {
      currentNode: {
        id: currentNode.id,
        type: currentNode.type,
        name: currentNode.name,
        parentId: parentId,
        data: {
          description: currentNodeData.description,
          looks: currentNodeData.looks,
          dominantElements: currentNodeData.dominantElements,
          navigableElements: currentNodeData.navigableElements,
          searchDesc: currentNodeData.searchDesc
        },
        dna: currentNode.dna
      },
      parentNode: parentNode ? {
        id: parentNode.id,
        type: parentNode.type,
        name: parentNode.name,
        data: {
          description: parentNodeData.description,
          looks: parentNodeData.looks
        },
        dna: parentNode.dna
      } : undefined,
      siblingNodes
    };
    
    setIsMoving(true);
    
    try {
      // Call new /command endpoint
      const response = await fetch('/api/mzoo/navigation/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, text, context })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        // Extract command for user-friendly error message
        const errorMsg = result.error || 'Navigation failed';
        const friendlyMessage = errorMsg.includes('Unknown navigation command')
          ? `Command '/${command}' is not available yet. Only /GO_INSIDE is currently implemented.`
          : errorMsg;
        
        setErrorMessage(friendlyMessage);
        console.error('[useLocationPanel] Navigation command failed:', result.error);
        
        // Clear error message after 5 seconds
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      
      const { data } = result;
      
      // Handle different navigation actions
      if (data.decision.action === 'move') {
        await handleMoveAction(data.decision);
      } else if (data.decision.action === 'create_niche' && data.eventsUrl && data.navigationId) {
        // Use registerExternalSpawn to properly integrate with progress bar system
        // This adds the spawn to activeSpawns store, enabling the progress bar to show
        const registerExternalSpawn = useStore.getState().registerExternalSpawn;
        const capturedCurrentNode = currentNode; // Capture for callback
        const capturedParentNodeId = data.decision.parentNodeId;
        
        registerExternalSpawn(
          data.navigationId,
          data.eventsUrl,
          `/${command}${text ? ' ' + text : ''}`,
          'niche',
          async (completedData: any) => {
            // onComplete callback
            if (completedData.node) {
              await handleNodeCreation(
                { node: completedData.node, parentNodeId: capturedParentNodeId },
                capturedCurrentNode
              );
            }
            setIsMoving(false);
          },
          (error: any) => {
            // onError callback
            console.error('[useLocationPanel] Navigation error:', error);
            setIsMoving(false);
          }
        );
        
        // Don't set isMoving to false here - wait for SSE to complete
        setMovementInput('');
        return;
      }
    } catch (error) {
      console.error('[useLocationPanel] Navigation error:', error);
    } finally {
      setIsMoving(false);
    }
    
    // Clear input
    setMovementInput('');
  }, [movementInput, getNode, getSpatialNodes, handleMoveAction, handleNodeCreation]);

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

  const handleInvalidCommand = useCallback((command: string) => {
    const message = `Command '/${command}' is not available yet. Only /GO_INSIDE is currently implemented.`;
    setErrorMessage(message);
    console.warn('[useLocationPanel] Invalid command attempted:', command);
    
    // Clear error message after 5 seconds
    setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  return {
    state: {
      ...base,
      movementInput,
      isMoving,
      createImage,
      previewImage,
      errorMessage
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
      clearPreviewImage: () => setPreviewImage(null),
      handleInvalidCommand
    }
  };
}
