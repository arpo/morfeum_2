import { useCallback, useState } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { createEntitySession } from '@/utils/entity/sessionManager';

/**
 * Helper: Find parent ID from tree structure
 */
function findParentId(worldTrees: any[], nodeId: string): string | null {
  for (const tree of worldTrees) {
    const result = findParentInTree(tree, nodeId, null);
    if (result !== undefined) return result;
  }
  return null;
}

function findParentInTree(node: any, targetId: string, parentId: string | null): string | null | undefined {
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
  
  const innerDNA = dna.dna || dna;
  
  if (node.type === 'location' || node.type === 'niche') {
    const profile = innerDNA?.profile;
    return {
      description: profile?.looks || '',
      looks: profile?.looks || '',
      searchDesc: profile?.searchDesc || '',
      dominantElements: [],
      navigableElements: []
    };
  }
  
  return {};
}

export function useNavigationLogic() {
  const [movementInput, setMovementInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  const getNode = useLocationsStore(state => state.getNode);
  const getSpatialNodes = useLocationsStore(state => state.getSpatialNodes);
  const worldTrees = useLocationsStore(state => state.worldTrees);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const activeEntity = useStore(state => state.activeEntity);

  const handleMoveAction = useCallback(async (navigation: any) => {
    const targetNode = getNode(navigation.targetNodeId);
    if (targetNode) {
      setActiveEntity(navigation.targetNodeId);
    } else {
      console.warn('[useNavigationLogic] Target node not found:', navigation.targetNodeId);
    }
  }, [getNode, setActiveEntity]);

  const handleNodeCreation = useCallback(async (navigation: any, currentNode: any) => {
    const { node, parentNodeId } = navigation;
    
    const createNodeInStore = useLocationsStore.getState().createNode;
    createNodeInStore(node);
    
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
    
    // Create entity session with image (instead of just setActiveEntity)
    // This ensures the image persists in the WorldView after pipeline completion
    createEntitySession(useStore.getState(), {
      id: node.id,
      name: node.name,
      type: 'location',
    });
  }, []);

  const handleMove = useCallback(async () => {
    if (!movementInput.trim()) {
      console.warn('[useNavigationLogic] Cannot travel: missing input');
      return;
    }
    
    const trimmedInput = movementInput.trim();
    
    if (!trimmedInput.startsWith('/')) {
      console.warn('[useNavigationLogic] Input must start with / (slash command)');
      setMovementInput('');
      return;
    }
    
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
    
    const activeEntityId = useStore.getState().activeEntity;
    if (!activeEntityId) {
      console.warn('[useNavigationLogic] No active entity');
      setMovementInput('');
      return;
    }
    
    const currentNode = getNode(activeEntityId);
    if (!currentNode) {
      console.warn('[useNavigationLogic] Current node not found');
      setMovementInput('');
      return;
    }
    
    const currentWorldTrees = useLocationsStore.getState().worldTrees;
    const parentId = findParentId(currentWorldTrees, currentNode.id);
    const parentNode = parentId ? getNode(parentId) : undefined;
    
    const spatialNodes = getSpatialNodes(currentNode.id);
    const siblingNodes = spatialNodes
      .filter(n => {
        const nodeParentId = findParentId(currentWorldTrees, n.id);
        return nodeParentId === parentId && n.id !== currentNode.id;
      })
      .map(n => ({ id: n.id, name: n.name, type: n.type }));
    
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
      const response = await fetch('/api/mzoo/navigation/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, text, context })
      });
      
      const result = await response.json();
      
      if (!response.ok) {
        const errorMsg = result.error || 'Navigation failed';
        const friendlyMessage = errorMsg.includes('Unknown navigation command')
          ? `Command '/${command}' is not available yet. Only /GO_INSIDE is currently implemented.`
          : errorMsg;
        
        setErrorMessage(friendlyMessage);
        console.error('[useNavigationLogic] Navigation command failed:', result.error);
        
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      
      const { data } = result;
      
      if (data.decision.action === 'move') {
        await handleMoveAction(data.decision);
      } else if (data.decision.action === 'create_niche' && data.eventsUrl && data.navigationId) {
        const registerExternalSpawn = useStore.getState().registerExternalSpawn;
        const capturedCurrentNode = currentNode;
        const capturedParentNodeId = data.decision.parentNodeId;
        
        registerExternalSpawn(
          data.navigationId,
          data.eventsUrl,
          `/${command}${text ? ' ' + text : ''}`,
          'niche',
          async (completedData: any) => {
            if (completedData.node) {
              await handleNodeCreation(
                { node: completedData.node, parentNodeId: capturedParentNodeId },
                capturedCurrentNode
              );
            }
            setIsMoving(false);
          },
          (error: any) => {
            console.error('[useNavigationLogic] Navigation error:', error);
            setIsMoving(false);
          }
        );
        
        setMovementInput('');
        return;
      }
    } catch (error) {
      console.error('[useNavigationLogic] Navigation error:', error);
    } finally {
      setIsMoving(false);
    }
    
    setMovementInput('');
  }, [movementInput, getNode, getSpatialNodes, handleMoveAction, handleNodeCreation]);

  const handleInvalidCommand = useCallback((command: string) => {
    const message = `Command '/${command}' is not available yet. Only /GO_INSIDE is currently implemented.`;
    setErrorMessage(message);
    console.warn('[useNavigationLogic] Invalid command attempted:', command);
    
    setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  return {
    state: {
      movementInput,
      isMoving,
      errorMessage,
      activeEntity
    },
    handlers: {
      setMovementInput,
      handleMove,
      handleInvalidCommand
    }
  };
}
