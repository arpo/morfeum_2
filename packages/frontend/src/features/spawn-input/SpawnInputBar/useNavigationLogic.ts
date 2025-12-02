import { useCallback, useState } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { createEntitySession } from '@/utils/entity/sessionManager';
import { findParentId } from '@/utils/tree/navigation';
import { SLASH_COMMANDS, COMMAND_FLAGS } from '@backend/config/navigation';

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
    
    // Create entity session with image (instead of just setActiveEntity)
    // This ensures the image persists in the WorldView after pipeline completion
    // Pass imageUrl from pipeline completion data to add to cache
    createEntitySession(useStore.getState(), {
      id: node.id,
      name: node.name,
      type: 'location',
      primaryMedia: node.primaryMedia,
      imageUrl  // From pipeline completion (top-level)
    });
  }, []);

  /**
   * Parse command input to extract command, text, and flags
   * Example: "/NEW_HOST London --create-image --bgtask"
   * Returns: { command: "NEW_HOST", text: "London", flags: { createImage: true, backgroundTask: true } }
   */
  const parseCommandInput = (input: string): { 
    command: string; 
    text: string | undefined; 
    flags: { createImage: boolean; backgroundTask: boolean } 
  } => {
    const parts = input.trim().split(/\s+/);
    const commandPart = parts[0].substring(1); // Remove leading /
    
    const flags = {
      createImage: false,
      backgroundTask: false
    };
    
    const textParts: string[] = [];
    
    for (let i = 1; i < parts.length; i++) {
      const part = parts[i];
      if (part === COMMAND_FLAGS.CREATE_IMAGE) {
        flags.createImage = true;
      } else if (part === COMMAND_FLAGS.BACKGROUND_TASK) {
        flags.backgroundTask = true;
      } else if (!part.startsWith('--')) {
        textParts.push(part);
      }
    }
    
    return {
      command: commandPart.toUpperCase(),
      text: textParts.length > 0 ? textParts.join(' ') : undefined,
      flags
    };
  };

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
    
    // Parse command with flags
    const { command, text, flags } = parseCommandInput(trimmedInput);
    
    // Check if command is a creation command (NEW_HOST, NEW_REGION, etc.)
    const isCreationCommand = ['NEW_HOST', 'NEW_REGION', 'NEW_LOCATION', 'NEW_NICHE'].includes(command);
    const isMediaCommand = command === 'CREATE_IMAGE';
    
    // Get current node (may be undefined for NEW_HOST)
    let currentNode: ReturnType<typeof getNode> | undefined = undefined;
    
    // For NEW_HOST, we don't need an active entity
    if (command !== 'NEW_HOST') {
      const activeEntityId = useStore.getState().activeEntity;
      if (!activeEntityId) {
        console.warn('[useNavigationLogic] No active entity');
        setMovementInput('');
        return;
      }
      
      currentNode = getNode(activeEntityId);
      if (!currentNode) {
        console.warn('[useNavigationLogic] Current node not found');
        setMovementInput('');
        return;
      }
    }
    
    // Handle creation commands
    if (isCreationCommand) {
      setIsMoving(true);
      try {
        const apiKey = ''; // Will be handled by backend middleware
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
          return;
        }
        
        const { data } = result;
        
        // If there's an events URL, we have a pipeline to monitor
        if (data.eventsUrl && data.operationId) {
          const registerExternalSpawn = useStore.getState().registerExternalSpawn;
          
          // Determine node type from command
          const nodeTypeMap: Record<string, string> = {
            NEW_HOST: 'host',
            NEW_REGION: 'region',
            NEW_LOCATION: 'location',
            NEW_NICHE: 'niche'
          };
          const nodeType = nodeTypeMap[command] || 'location';
          
          // Map node type to valid entityType for spawn system
          const entityTypeMap: Record<string, 'character' | 'location' | 'niche'> = {
            host: 'location',
            region: 'location',
            location: 'location',
            niche: 'niche'
          };
          const spawnEntityType = entityTypeMap[nodeType] || 'location';
          
          // Capture current node for closure
          const capturedCurrentNode = currentNode;
          
          registerExternalSpawn(
            data.operationId,
            data.eventsUrl,
            `/${command}${text ? ' ' + text : ''}`,
            spawnEntityType,
            async (completedData: any) => {
              if (completedData.node) {
                // Add node to store and tree
                const createNodeInStore = useLocationsStore.getState().createNode;
                createNodeInStore(completedData.node);
                
                if (completedData.node.type !== 'host') {
                  // Add to parent's children
                  const currentWorldTrees = useLocationsStore.getState().worldTrees;
                  const worldTree = currentWorldTrees.find(tree => {
                    const findInTree = (treeNode: any, targetId: string): boolean => {
                      if (treeNode.id === targetId) return true;
                      return treeNode.children?.some((child: any) => findInTree(child, targetId)) || false;
                    };
                    return capturedCurrentNode ? findInTree(tree, capturedCurrentNode.id) : false;
                  });
                  
                  if (worldTree && capturedCurrentNode) {
                    const addNodeToTree = useLocationsStore.getState().addNodeToTree;
                    addNodeToTree(worldTree.id, capturedCurrentNode.id, completedData.node.id, completedData.node.type);
                  }
                }
                
                const saveToBackend = useLocationsStore.getState().saveToBackend;
                await saveToBackend();
                
                // Create entity session
                createEntitySession(useStore.getState(), {
                  id: completedData.node.id,
                  name: completedData.node.name,
                  type: 'location',
                  primaryMedia: completedData.node.primaryMedia,
                  imageUrl: completedData.imageUrl
                });
              }
              setIsMoving(false);
            },
            (error: any) => {
              console.error('[useNavigationLogic] Creation error:', error);
              setIsMoving(false);
            }
          );
          
          setMovementInput('');
          return;
        }
        
      } catch (error) {
        console.error('[useNavigationLogic] Creation command error:', error);
        setErrorMessage('Failed to create node');
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        if (!flags.backgroundTask) {
          setIsMoving(false);
        }
      }
      
      setMovementInput('');
      return;
    }
    
    // Handle media commands
    if (isMediaCommand) {
      if (!currentNode) {
        setErrorMessage('Select a node to create an image');
        setTimeout(() => setErrorMessage(null), 5000);
        setMovementInput('');
        return;
      }
      
      setIsMoving(true);
      try {
        const response = await fetch('/api/mzoo/navigation/create-image', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            nodeId: currentNode.id,
            flags
          })
        });
        
        const result = await response.json();
        
        if (!response.ok) {
          setErrorMessage(result.error || 'Failed to create image');
          setTimeout(() => setErrorMessage(null), 5000);
          setIsMoving(false);
          setMovementInput('');
          return;
        }
        
        const { data } = result;
        
        if (data.eventsUrl && data.operationId && currentNode) {
          const registerExternalSpawn = useStore.getState().registerExternalSpawn;
          const capturedNode = currentNode;
          
          registerExternalSpawn(
            data.operationId,
            data.eventsUrl,
            '/CREATE_IMAGE',
            'location',
            async (completedData: any) => {
              if (completedData.imageUrl) {
                // Update node with new image
                const updateNode = useLocationsStore.getState().updateNode;
                updateNode(capturedNode.id, { primaryMedia: completedData.mediaId });
                
                const saveToBackend = useLocationsStore.getState().saveToBackend;
                await saveToBackend();
                
                // Refresh entity session
                createEntitySession(useStore.getState(), {
                  id: capturedNode.id,
                  name: capturedNode.name,
                  type: 'location',
                  primaryMedia: completedData.mediaId,
                  imageUrl: completedData.imageUrl
                });
              }
              setIsMoving(false);
            },
            (error: any) => {
              console.error('[useNavigationLogic] Image creation error:', error);
              setIsMoving(false);
            }
          );
          
          setMovementInput('');
          return;
        }
        
      } catch (error) {
        console.error('[useNavigationLogic] Create image error:', error);
        setErrorMessage('Failed to create image');
        setTimeout(() => setErrorMessage(null), 5000);
      } finally {
        setIsMoving(false);
      }
      
      setMovementInput('');
      return;
    }
    
    // Standard navigation commands (GO_INSIDE, etc.)
    if (!currentNode) {
      setErrorMessage('Select a location to navigate');
      setTimeout(() => setErrorMessage(null), 5000);
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
                { 
                  node: completedData.node, 
                  parentNodeId: capturedParentNodeId,
                  imageUrl: completedData.imageUrl  // Pass imageUrl from completion
                },
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
