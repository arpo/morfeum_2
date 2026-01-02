import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { createEntitySession } from '@/utils/entity/sessionManager';
import { clearEntityMediaCache } from '@/services/mediaService';
import { ParsedCommand } from './commandParser';

interface EditResult {
  success: boolean;
  error?: string;
}

interface EditCallbacks {
  setIsMoving: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setMovementInput: (value: string) => void;
}

/**
 * Handle EDIT_IMAGE command
 * Edits the current node's image using the provided prompt
 */
export async function handleEditCommand(
  parsedCommand: ParsedCommand,
  currentNode: any,
  callbacks: EditCallbacks
): Promise<EditResult> {
  const { text: prompt, flags } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;

  if (!currentNode) {
    setErrorMessage('Select a node to edit its image');
    setTimeout(() => setErrorMessage(null), 5000);
    setMovementInput('');
    return { success: false, error: 'No node selected' };
  }

  if (!currentNode.primaryMedia) {
    setErrorMessage('Selected node has no image to edit');
    setTimeout(() => setErrorMessage(null), 5000);
    setMovementInput('');
    return { success: false, error: 'No image to edit' };
  }

  if (!prompt) {
    setErrorMessage('Please provide an edit prompt (e.g., /edit_image change to winter)');
    setTimeout(() => setErrorMessage(null), 5000);
    setMovementInput('');
    return { success: false, error: 'No prompt provided' };
  }

  setIsMoving(true);
  
  try {
    const response = await fetch('/api/mzoo/navigation/edit-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: currentNode.id,
        prompt,
        flags
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      setErrorMessage(result.error || 'Failed to edit image');
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
        '/EDIT_IMAGE',
        'location',
        async (completedData: any) => {
          if (completedData.imageUrl) {
            await updateNodeWithEditedImage(capturedNode, completedData);
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[editCommands] Image edit error:', error);
          setIsMoving(false);
        }
      );
      
      setMovementInput('');
      return { success: true };
    }
    
    return { success: true };
  } catch (error) {
    console.error('[editCommands] Edit image error:', error);
    setErrorMessage('Failed to edit image');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'Failed to edit image' };
  } finally {
    setIsMoving(false);
    setMovementInput('');
  }
}

/**
 * Update node with edited image
 */
async function updateNodeWithEditedImage(
  node: any,
  completedData: { imageUrl: string; mediaId: string }
): Promise<void> {
  const { imageUrl, mediaId } = completedData;
  
  // Clear entity media cache so ViewSlider fetches fresh data
  clearEntityMediaCache(node.id);
  
  // Update node with new edited image
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
  
  // Dispatch event to notify WorldView to refresh views
  window.dispatchEvent(new CustomEvent('editImageComplete', { 
    detail: { entityId: node.id, mediaId } 
  }));
}
