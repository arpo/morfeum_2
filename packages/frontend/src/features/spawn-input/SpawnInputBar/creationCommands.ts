import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { createEntitySession } from '@/utils/entity/sessionManager';
import { ParsedCommand, getNodeTypeFromCommand, getSpawnEntityType } from './commandParser';

interface CreationResult {
  success: boolean;
  error?: string;
}

interface CreationCallbacks {
  setIsMoving: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setMovementInput: (value: string) => void;
}

/**
 * Handle creation commands (NEW_HOST, NEW_REGION, NEW_LOCATION)
 */
export async function handleCreationCommand(
  parsedCommand: ParsedCommand,
  currentNode: any | undefined,
  callbacks: CreationCallbacks
): Promise<CreationResult> {
  const { command, text, flags } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;

  setIsMoving(true);
  
  try {
    const response = await fetch('/api/mzoo/navigation/create-node', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        command,
        description: text,
        parentId: currentNode?.id,
        flags
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      setErrorMessage(result.error || 'Failed to create node');
      setTimeout(() => setErrorMessage(null), 5000);
      setIsMoving(false);
      setMovementInput('');
      return { success: false, error: result.error };
    }
    
    const { data } = result;
    
    // If there's an events URL, we have a pipeline to monitor
    if (data.eventsUrl && data.operationId) {
      const registerExternalSpawn = useStore.getState().registerExternalSpawn;
      
      const nodeType = getNodeTypeFromCommand(command);
      const spawnEntityType = getSpawnEntityType(nodeType);
      
      // Capture current node for closure
      const capturedCurrentNode = currentNode;
      
      registerExternalSpawn(
        data.operationId,
        data.eventsUrl,
        `/${command}${text ? ' ' + text : ''}`,
        spawnEntityType,
        async (completedData: any) => {
          if (completedData.node) {
            await addNodeToStoreAndTree(completedData, capturedCurrentNode);
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[creationCommands] Creation error:', error);
          setIsMoving(false);
        }
      );
      
      setMovementInput('');
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[creationCommands] Creation command error:', error);
    setErrorMessage('Failed to create node');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'Failed to create node' };
  } finally {
    if (!flags.backgroundTask) {
      setIsMoving(false);
    }
    setMovementInput('');
  }
}

/**
 * Add created node to store and tree structure
 */
async function addNodeToStoreAndTree(
  completedData: any,
  parentNode: any | undefined
): Promise<void> {
  const { node, imageUrl } = completedData;
  
  // Add node to store
  const createNodeInStore = useLocationsStore.getState().createNode;
  createNodeInStore(node);
  
  if (node.type !== 'host' && parentNode) {
    // Add to parent's children
    const currentWorldTrees = useLocationsStore.getState().worldTrees;
    const worldTree = currentWorldTrees.find(tree => {
      const findInTree = (treeNode: any, targetId: string): boolean => {
        if (treeNode.id === targetId) return true;
        return treeNode.children?.some((child: any) => findInTree(child, targetId)) || false;
      };
      return findInTree(tree, parentNode.id);
    });
    
    if (worldTree) {
      const addNodeToTree = useLocationsStore.getState().addNodeToTree;
      addNodeToTree(worldTree.id, parentNode.id, node.id, node.type);
    }
  }
  
  const saveToBackend = useLocationsStore.getState().saveToBackend;
  await saveToBackend();
  
  // Create entity session
  createEntitySession(useStore.getState(), {
    id: node.id,
    name: node.name,
    type: 'location',
    primaryMedia: node.primaryMedia,
    imageUrl
  });
}

/**
 * Handle node creation from navigation (GO_INSIDE creating a niche)
 */
export async function handleNodeCreation(
  navigation: { node: any; parentNodeId?: string; imageUrl?: string },
  currentNode: any
): Promise<void> {
  const { node, parentNodeId, imageUrl } = navigation;
  
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
  
  // Create entity session with image
  createEntitySession(useStore.getState(), {
    id: node.id,
    name: node.name,
    type: 'location',
    primaryMedia: node.primaryMedia,
    imageUrl
  });
}
