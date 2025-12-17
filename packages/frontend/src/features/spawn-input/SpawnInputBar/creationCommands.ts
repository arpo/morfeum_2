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
 * Handle creation commands (NEW_WORLD, NEW_REGION, NEW_LOCATION)
 */
export async function handleCreationCommand(
  parsedCommand: ParsedCommand,
  currentNode: any | undefined,
  callbacks: CreationCallbacks
): Promise<CreationResult> {
  const { command, text, flags } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;

  setIsMoving(true);
  
  // NEW_WORLD uses the spawn system (creates full hierarchy from description)
  if (command === 'NEW_WORLD') {
    return handleNewWorldCommand(text, callbacks);
  }
  
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
 * Handle NEW_WORLD command using spawn system (creates full hierarchy from description)
 * Uses the same endpoint as the Location tab (/api/spawn/location/start)
 */
async function handleNewWorldCommand(
  text: string | undefined,
  callbacks: CreationCallbacks
): Promise<CreationResult> {
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;
  
  if (!text || !text.trim()) {
    setErrorMessage('Please provide a world description');
    setTimeout(() => setErrorMessage(null), 5000);
    setIsMoving(false);
    setMovementInput('');
    return { success: false, error: 'No description provided' };
  }

  try {
    const response = await fetch('/api/spawn/location/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: text.trim() })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      setErrorMessage(result.error || 'Failed to create world');
      setTimeout(() => setErrorMessage(null), 5000);
      setIsMoving(false);
      setMovementInput('');
      return { success: false, error: result.error };
    }
    
    const { data } = result;
    
    // Register with spawn system for progress tracking
    if (data.eventsUrl && data.spawnId) {
      const startSpawn = useStore.getState().registerExternalSpawn;
      
      startSpawn(
        data.spawnId,
        data.eventsUrl,
        `/NEW_WORLD ${text}`,
        'location',
        async () => {
          // World tree completion is handled by the spawn completion handler
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[creationCommands] NEW_WORLD error:', error);
          setIsMoving(false);
        }
      );
      
      setMovementInput('');
      return { success: true };
    }
    
    setMovementInput('');
    return { success: true };
  } catch (error) {
    console.error('[creationCommands] NEW_WORLD command error:', error);
    setErrorMessage('Failed to create world');
    setTimeout(() => setErrorMessage(null), 5000);
    setIsMoving(false);
    setMovementInput('');
    return { success: false, error: 'Failed to create world' };
  }
}

/**
 * Handle node creation from navigation (GO_INSIDE creating a niche)
 * 
 * When `promoteParentToLocation` is true, the parent niche is promoted to a location
 * before adding the new niche as its child. This allows GO_INSIDE to work from niches.
 */
export async function handleNodeCreation(
  navigation: { node: any; parentNodeId?: string; imageUrl?: string; promoteParentToLocation?: boolean },
  currentNode: any
): Promise<void> {
  const { node, parentNodeId, imageUrl, promoteParentToLocation } = navigation;
  
  const updateNode = useLocationsStore.getState().updateNode;
  const createNodeInStore = useLocationsStore.getState().createNode;
  
  // If promoteParentToLocation is set, change the parent niche to a location
  if (promoteParentToLocation && parentNodeId) {
    console.log(`[handleNodeCreation] Promoting parent niche ${parentNodeId} to location`);
    updateNode(parentNodeId, { type: 'location' });
  }
  
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
  
  // Also update the world tree entry for the promoted node
  if (promoteParentToLocation && parentNodeId) {
    const updateNodeTypeInTree = (treeNode: any): boolean => {
      if (treeNode.id === parentNodeId) {
        treeNode.type = 'location';
        return true;
      }
      return treeNode.children?.some((child: any) => updateNodeTypeInTree(child)) || false;
    };
    updateNodeTypeInTree(worldTree);
  }
  
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
