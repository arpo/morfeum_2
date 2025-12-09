import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { findParentId } from '@/utils/tree/navigation';
import { ParsedCommand } from './commandParser';
import { handleNodeCreation } from './creationCommands';

interface NavigationResult {
  success: boolean;
  error?: string;
}

interface NavigationCallbacks {
  setIsMoving: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setMovementInput: (value: string) => void;
}

/**
 * Extract description/looks from DNA based on node type
 */
function extractNodeData(node: any): {
  description?: string;
  looks?: string;
  dominantElements?: string[];
  navigableElements?: any[];
  searchDesc?: string;
} {
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

/**
 * Build navigation context for API call
 */
export function buildNavigationContext(
  currentNode: any,
  parentNode: any | undefined,
  siblingNodes: Array<{ id: string; name: string; type: string }>,
  parentId: string | undefined
): any {
  const currentNodeData = extractNodeData(currentNode);
  const parentNodeData = parentNode ? extractNodeData(parentNode) : {};
  
  return {
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
}

/**
 * Handle move action (navigate to existing node)
 */
export function handleMoveAction(
  navigation: { targetNodeId: string },
  getNode: (id: string) => any,
  setActiveEntity: (id: string) => void
): void {
  const targetNode = getNode(navigation.targetNodeId);
  if (targetNode) {
    setActiveEntity(navigation.targetNodeId);
  } else {
    console.warn('[navigationCommands] Target node not found:', navigation.targetNodeId);
  }
}

/**
 * Handle standard navigation commands (GO_INSIDE, etc.)
 */
export async function handleNavigationCommand(
  parsedCommand: ParsedCommand,
  currentNode: any,
  callbacks: NavigationCallbacks,
  deps: {
    getNode: (id: string) => any;
    getSpatialNodes: (id: string) => any[];
    setActiveEntity: (id: string) => void;
  }
): Promise<NavigationResult> {
  const { command, text, flags } = parsedCommand;
  
  // Reconstruct text with flags for backend parsing
  let textWithFlags = text || '';
  if (flags.furnish) {
    textWithFlags = textWithFlags ? `${textWithFlags} --furnish` : '--furnish';
  }
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;
  const { getNode, getSpatialNodes, setActiveEntity } = deps;

  if (!currentNode) {
    setErrorMessage('Select a location to navigate');
    setTimeout(() => setErrorMessage(null), 5000);
    setMovementInput('');
    return { success: false, error: 'No location selected' };
  }

  const currentWorldTrees = useLocationsStore.getState().worldTrees;
  const parentId = findParentId(currentWorldTrees, currentNode.id) || undefined;
  const parentNode = parentId ? getNode(parentId) : undefined;

  const spatialNodes = getSpatialNodes(currentNode.id);
  const siblingNodes = spatialNodes
    .filter(n => {
      const nodeParentId = findParentId(currentWorldTrees, n.id);
      return nodeParentId === parentId && n.id !== currentNode.id;
    })
    .map(n => ({ id: n.id, name: n.name, type: n.type }));

  const context = buildNavigationContext(currentNode, parentNode, siblingNodes, parentId);

  setIsMoving(true);

  try {
    const response = await fetch('/api/mzoo/navigation/command', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ command, text: textWithFlags || undefined, context })
    });

    const result = await response.json();

    if (!response.ok) {
      const errorMsg = result.error || 'Navigation failed';
      const friendlyMessage = errorMsg.includes('Unknown navigation command')
        ? `Command '/${command}' is not available yet. Only /GO_INSIDE is currently implemented.`
        : errorMsg;

      setErrorMessage(friendlyMessage);
      console.error('[navigationCommands] Navigation command failed:', result.error);

      setTimeout(() => setErrorMessage(null), 5000);
      return { success: false, error: friendlyMessage };
    }

    const { data } = result;

    if (data.decision.action === 'move') {
      handleMoveAction(data.decision, getNode, setActiveEntity);
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
                imageUrl: completedData.imageUrl
              },
              capturedCurrentNode
            );
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[navigationCommands] Navigation error:', error);
          setIsMoving(false);
        }
      );

      setMovementInput('');
      return { success: true };
    }

    return { success: true };
  } catch (error) {
    console.error('[navigationCommands] Navigation error:', error);
    return { success: false, error: 'Navigation failed' };
  } finally {
    setIsMoving(false);
    setMovementInput('');
  }
}
