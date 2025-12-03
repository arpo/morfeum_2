import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { createEntitySession } from '@/utils/entity/sessionManager';
import { ParsedCommand } from './commandParser';

interface MediaResult {
  success: boolean;
  error?: string;
}

interface MediaCallbacks {
  setIsMoving: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setMovementInput: (value: string) => void;
}

/**
 * Handle CREATE_IMAGE command
 */
export async function handleMediaCommand(
  parsedCommand: ParsedCommand,
  currentNode: any,
  callbacks: MediaCallbacks
): Promise<MediaResult> {
  const { flags } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;

  if (!currentNode) {
    setErrorMessage('Select a node to create an image');
    setTimeout(() => setErrorMessage(null), 5000);
    setMovementInput('');
    return { success: false, error: 'No node selected' };
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
      return { success: false, error: result.error };
    }
    
    const { data } = result;
    
    if (data.eventsUrl && data.operationId) {
      const registerExternalSpawn = useStore.getState().registerExternalSpawn;
      const capturedNode = currentNode;
      
      registerExternalSpawn(
        data.operationId,
        data.eventsUrl,
        '/CREATE_IMAGE',
        'location',
        async (completedData: any) => {
          if (completedData.imageUrl) {
            await updateNodeWithImage(capturedNode, completedData);
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[mediaCommands] Image creation error:', error);
          setIsMoving(false);
        }
      );
      
      setMovementInput('');
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[mediaCommands] Create image error:', error);
    setErrorMessage('Failed to create image');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'Failed to create image' };
  } finally {
    setIsMoving(false);
    setMovementInput('');
  }
}

/**
 * Update node with newly created image
 */
async function updateNodeWithImage(
  node: any,
  completedData: { imageUrl: string; mediaId: string }
): Promise<void> {
  const { imageUrl, mediaId } = completedData;
  
  // Update node with new image
  const updateNode = useLocationsStore.getState().updateNode;
  updateNode(node.id, { primaryMedia: mediaId });
  
  const saveToBackend = useLocationsStore.getState().saveToBackend;
  await saveToBackend();
  
  // Refresh entity session
  createEntitySession(useStore.getState(), {
    id: node.id,
    name: node.name,
    type: 'location',
    primaryMedia: mediaId,
    imageUrl
  });
}
