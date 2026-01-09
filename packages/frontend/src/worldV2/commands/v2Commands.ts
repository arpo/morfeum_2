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
  return ['NEW_HOST', 'NEW_REGION2', 'NEW_LOCATION2', 'DISPLAY'].includes(command);
}

/**
 * Handle V2 commands
 */
export async function handleV2Command(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { command } = parsedCommand;
  
  switch (command) {
    case 'NEW_HOST':
      return handleNewHostCommand(parsedCommand, callbacks);
    case 'NEW_REGION2':
      return handleNewRegionCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'NEW_LOCATION2':
      return handleNewLocationCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
    case 'DISPLAY':
      return handleDisplayCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
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

/**
 * Handle NEW_REGION2 command
 * Creates a new region node under the current host (V2 simplified DNA)
 */
async function handleNewRegionCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;
  
  // Validate that we're on a host node
  if (activeEntityType !== 'host') {
    setErrorMessage('NEW_REGION2 can only be used when focused on a host node');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'Not on a host node' };
  }
  
  if (!activeEntityId) {
    setErrorMessage('No host selected. Create or select a host first.');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'No host selected' };
  }
  
  if (!text || !text.trim()) {
    setErrorMessage('Please provide a region concept (e.g., /NEW_REGION2 The industrial docks)');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'No concept provided' };
  }
  
  setIsMoving(true);
  
  try {
    const response = await fetch('/api/v2/new-region', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        concept: text.trim(),
        hostId: activeEntityId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      setErrorMessage(result.error || 'Failed to create region');
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
        `/NEW_REGION2 ${text}`,
        'location',
        async (completedData: any) => {
          console.log('[V2] Completion callback received:', completedData);
          
          if (completedData.region) {
            console.log('[V2] Region created:', completedData.region.name);
            console.log('[V2] Region ID:', completedData.region.id);
            
            // Reload locations store from backend to get the new region
            console.log('[V2] Reloading locations from backend...');
            const loaded = await useLocationsStore.getState().loadFromBackend();
            console.log('[V2] Locations reload result:', loaded);
            
            // Set the new region as active entity
            console.log('[V2] Setting active entity to:', completedData.region.id);
            useStore.getState().setActiveEntity(completedData.region.id);
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[V2] NEW_REGION2 error:', error);
          setErrorMessage(error.message || 'Failed to create region');
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
    console.error('[V2] NEW_REGION2 command error:', error);
    setErrorMessage('Failed to create region');
    setTimeout(() => setErrorMessage(null), 5000);
    setIsMoving(false);
    setMovementInput('');
    return { success: false, error: 'Failed to create region' };
  }
}

/**
 * Handle NEW_LOCATION2 command
 * Creates a new location node under the current region (V2 simplified DNA)
 */
async function handleNewLocationCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;
  
  // Validate that we're on a region node
  if (activeEntityType !== 'region') {
    setErrorMessage('NEW_LOCATION2 can only be used when focused on a region node');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'Not on a region node' };
  }
  
  if (!activeEntityId) {
    setErrorMessage('No region selected. Create or select a region first.');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'No region selected' };
  }
  
  if (!text || !text.trim()) {
    setErrorMessage('Please provide a location concept (e.g., /NEW_LOCATION2 The old cathedral)');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'No concept provided' };
  }
  
  setIsMoving(true);
  
  try {
    const response = await fetch('/api/v2/new-location', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        concept: text.trim(),
        regionId: activeEntityId
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      setErrorMessage(result.error || 'Failed to create location');
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
        `/NEW_LOCATION2 ${text}`,
        'location',
        async (completedData: any) => {
          console.log('[V2] Completion callback received:', completedData);
          
          if (completedData.location) {
            console.log('[V2] Location created:', completedData.location.name);
            console.log('[V2] Location ID:', completedData.location.id);
            
            // Reload locations store from backend to get the new location
            console.log('[V2] Reloading locations from backend...');
            const loaded = await useLocationsStore.getState().loadFromBackend();
            console.log('[V2] Locations reload result:', loaded);
            
            // Set the new location as active entity
            console.log('[V2] Setting active entity to:', completedData.location.id);
            useStore.getState().setActiveEntity(completedData.location.id);
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[V2] NEW_LOCATION2 error:', error);
          setErrorMessage(error.message || 'Failed to create location');
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
    console.error('[V2] NEW_LOCATION2 command error:', error);
    setErrorMessage('Failed to create location');
    setTimeout(() => setErrorMessage(null), 5000);
    setIsMoving(false);
    setMovementInput('');
    return { success: false, error: 'Failed to create location' };
  }
}

/**
 * Handle DISPLAY command
 * Generate image for current V2 node using cascaded DNA
 * Supports --populate flag for scene population
 */
async function handleDisplayCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { flags } = parsedCommand;
  const { setIsMoving, setErrorMessage, setMovementInput } = callbacks;
  
  // Validate that we're on a V2 node
  if (!activeEntityId) {
    setErrorMessage('No node selected. Select a host, region, or location first.');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'No node selected' };
  }
  
  if (!['host', 'region', 'location'].includes(activeEntityType || '')) {
    setErrorMessage('DISPLAY can only be used on host, region, or location nodes');
    setTimeout(() => setErrorMessage(null), 5000);
    return { success: false, error: 'Invalid node type' };
  }
  
  // Check for --populate flag in passthroughFlags
  const populate = flags?.passthroughFlags?.includes('--populate') || false;
  
  setIsMoving(true);
  
  try {
    const response = await fetch('/api/v2/display', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        nodeId: activeEntityId,
        populate
      })
    });
    
    const result = await response.json();
    
    if (!response.ok) {
      setErrorMessage(result.error || 'Failed to generate image');
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
        `/DISPLAY${populate ? ' --populate' : ''}`,
        'location',
        async (completedData: any) => {
          console.log('[V2] DISPLAY completion received:', completedData);
          
          if (completedData.imageUrl) {
            console.log('[V2] Image generated:', completedData.imageUrl);
            
            // Reload locations store from backend to get the updated node
            console.log('[V2] Reloading locations from backend...');
            const loaded = await useLocationsStore.getState().loadFromBackend();
            console.log('[V2] Locations reload result:', loaded);
            
            // Force refresh by clearing and re-setting the active entity
            // This ensures the LocationPanel re-renders with new data
            useStore.getState().setActiveEntity('');
            setTimeout(() => {
              useStore.getState().setActiveEntity(activeEntityId!);
              console.log('[V2] Entity refreshed:', activeEntityId);
            }, 50);
          }
          setIsMoving(false);
        },
        (error: any) => {
          console.error('[V2] DISPLAY error:', error);
          setErrorMessage(error.message || 'Failed to generate image');
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
    console.error('[V2] DISPLAY command error:', error);
    setErrorMessage('Failed to generate image');
    setTimeout(() => setErrorMessage(null), 5000);
    setIsMoving(false);
    setMovementInput('');
    return { success: false, error: 'Failed to generate image' };
  }
}
