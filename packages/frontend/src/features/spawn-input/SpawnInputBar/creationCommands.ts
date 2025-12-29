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
 * Also handles pass-through locations that need to be added to the store
 */
export async function handleNodeCreation(
  navigation: { 
    node: any; 
    parentNodeId?: string; 
    imageUrl?: string;
    passThroughLocation?: { node: any; parentId: string };  // Pass-through location from GO_INSIDE
    nicheParentId?: string;  // The correct parent ID for the niche (from completion event)
  },
  currentNode: any
): Promise<void> {
  const { node, parentNodeId, imageUrl, passThroughLocation, nicheParentId } = navigation;
  
  const createNodeInStore = useLocationsStore.getState().createNode;
  const addNodeToTree = useLocationsStore.getState().addNodeToTree;
  
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
  
  // ═══════════════════════════════════════════════════════════════════════════
  // PASS-THROUGH LOCATION: Add to store first if present
  // This ensures proper hierarchy: niche → pass-through location → interior niche
  // ═══════════════════════════════════════════════════════════════════════════
  let worldTreeId = worldTree.id;
  
  if (passThroughLocation) {
    console.log(`[handleNodeCreation] Adding pass-through location: ${passThroughLocation.node.id}`);
    createNodeInStore(passThroughLocation.node);
    addNodeToTree(worldTreeId, passThroughLocation.parentId, passThroughLocation.node.id, 'location');
    
    // IMPORTANT: Re-fetch addNodeToTree after adding pass-through location
    // The tree state was updated, so we need a fresh reference for the next operation
    // The worldTreeId stays the same, but the tree structure has changed
  }
  
  // Add the main node to store
  createNodeInStore(node);
  
  // Determine correct parent:
  // 1. Use nicheParentId from completion event (pass-through location ID) if present
  // 2. Fall back to parentNodeId (stale - captured before pass-through was created)
  // 3. Fall back to current node ID
  const correctParentId = nicheParentId || parentNodeId || currentNode.id;
  
  if (nicheParentId) {
    console.log(`[handleNodeCreation] Using nicheParentId from completion event: ${nicheParentId}`);
  }
  
  // Get fresh addNodeToTree reference to ensure we're working with updated tree state
  const addNodeToTreeFresh = useLocationsStore.getState().addNodeToTree;
  addNodeToTreeFresh(worldTreeId, correctParentId, node.id, node.type);
  
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
