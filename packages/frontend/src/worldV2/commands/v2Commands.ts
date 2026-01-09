/**
 * World V2 Command Handlers
 * 
 * Handles V2 slash commands (NEW_HOST, NEW_REGION, etc.)
 * TODO: Remove when V2 is stable and old system is removed
 */

import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';

interface V2CommandCallbacks {
  setIsMoving: (value: boolean) => void;
  setErrorMessage: (message: string | null) => void;
  setMovementInput: (value: string) => void;
}

interface V2CommandResult {
  success: boolean;
  error?: string;
  host?: any;
}

/**
 * Check if command is a V2 command
 */
export function isV2Command(command: string): boolean {
  return ['NEW_HOST'].includes(command);
}

/**
 * Handle V2 commands
 */
export async function handleV2Command(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks
): Promise<V2CommandResult> {
  const { command } = parsedCommand;
  
  switch (command) {
    case 'NEW_HOST':
      return handleNewHostCommand(parsedCommand, callbacks);
    default:
      return { success: false, error: `Unknown V2 command: ${command}` };
  }
}

/**
 * Handle NEW_HOST command
 * Creates a new host node with simplified DNA
 */
async function handleNewHostCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;
  
  if (!text || !text.trim()) {
    setErrorMessage('Please provide a world concept (e.g., /NEW_HOST A steampunk metropolis)');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'No concept provided' };
  }
  
  setIsMoving(true);
  
  try {
    const response = await fetch('/api/v2/new-host', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept: text.trim() })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      setErrorMessage(result.error || 'Failed to create host');
      setTimeout(() => setErrorMessage(null), 5000);
      setIsMoving(false);
      setMovementInput('');
      return { success: false, error: result.error };
    }
    
    const { data } = result;
    
    // If there's an events URL, we have a pipeline to monitor
    if (data.eventsUrl && data.operationId) {
      const registerExternalSpawn = useStore.getState().registerExternalSpawn;
      
      registerExternalSpawn(
        data.operationId,
        data.eventsUrl,
        `/NEW_HOST ${text}`,
        'location',
        async (completedData: any) => {
          console.log('[V2] Completion callback received:', completedData);
          
          if (completedData.host) {
            console.log('[V2] Host created:', completedData.host.name);
            console.log('[V2] Host ID:', completedData.host.id);
            
            // Reload locations store from backend to get the new host
            console.log('[V2] Reloading locations from backend...');
            const loaded = await useLocationsStore.getState().loadFromBackend();
            console.log('[V2] Locations reload result:', loaded);
            
            // Set the new host as active entity
            console.log('[V2] Setting active entity to:', completedData.host.id);
            useStore.getState().setActiveEntity(completedData.host.id);
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[V2] NEW_HOST error:', error);
          setErrorMessage(error.message || 'Failed to create host');
          setTimeout(() => setErrorMessage(null), 5000);
          setIsMoving(false);
        }
      );
      
      setMovementInput('');
      return { success: true };
    }
    
    setMovementInput('');
    return { success: true };
    
  } catch (error) {
    console.error('[V2] NEW_HOST command error:', error);
    setErrorMessage('Failed to create host');
    setTimeout(() => setErrorMessage(null), 5000);
    setIsMoving(false);
    setMovementInput('');
    return { success: false, error: 'Failed to create host' };
  }
}
