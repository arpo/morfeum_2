import { useCallback, useState } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { parseCommandInput, isCreationCommand, isMediaCommand, isEditCommand, isNavigationCommand } from './commandParser';
import { handleCreationCommand } from './creationCommands';
import { handleMediaCommand } from './mediaCommands';
import { handleEditCommand } from './editCommands';
import { handleNavigationCommand } from './navigationCommands';
// V2 World System - TODO: Remove when V2 is stable
import { isV2Command, handleV2Command } from '@/worldV2';

/** Commands that support enhancement (navigable elements, furnishing) */
const ENHANCEABLE_COMMANDS = ['GO_INSIDE', 'GOTO', 'NEW_LOCATION'];

/**
 * Get default argument for navigation commands based on node data
 * GO_INSIDE: uses dominantElements[0] (main enterable structure)
 * GOTO: uses navigableElements[0] (main navigation point)
 */
function getDefaultNavigationArg(command: string, node: any): string | null {
  if (command === 'GO_INSIDE') {
    const dominantElements = node.dominantElements || node.structure?.dominantElements || [];
    if (dominantElements.length > 0) {
      const elem = dominantElements[0];
      // Handle object-type dominantElements (new structure with shape, style, etc.)
      if (typeof elem === 'object' && elem !== null) {
        // Build description from object properties
        return elem.style || `${elem.shape || 'main'} ${elem.orientation || ''} structure`.trim();
      }
      return String(elem);
    }
  } else if (command === 'GOTO') {
    const navigableElements = node.navigableElements || node.structure?.navigableElements || [];
    if (navigableElements.length > 0) {
      const elem = navigableElements[0];
      // Format: "type at position - description" or just description
      if (typeof elem === 'object') {
        return elem.description || `${elem.type} at ${elem.position}`;
      }
      return String(elem);
    }
  }
  return null;
}

export function useNavigationLogic() {
  const [movementInput, setMovementInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const getNode = useLocationsStore(state => state.getNode);
  const getSpatialNodes = useLocationsStore(state => state.getSpatialNodes);
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const activeEntity = useStore(state => state.activeEntity);

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
    let parsedCommand = parseCommandInput(trimmedInput);
    const { command } = parsedCommand;

    // Callbacks for all command handlers
    const callbacks = {
      setIsMoving,
      setErrorMessage,
      setMovementInput
    };

    // Get current node (may be undefined for NEW_WORLD)
    let currentNode: ReturnType<typeof getNode> | undefined = undefined;

    // For NEW_WORLD, NEW_HOST, and NEW_WORLD_LOCATION, we don't need an active entity
    if (command !== 'NEW_WORLD' && command !== 'NEW_HOST' && command !== 'NEW_WORLD_LOCATION') {
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

      // Block commands on pass-through nodes
      if (currentNode.isPassThrough) {
        setErrorMessage('Commands cannot be run on pass-through regions. Navigate to a location first.');
        setMovementInput('');
        setTimeout(() => setErrorMessage(null), 5000);
        return;
      }
      
      // For GO_INSIDE/GOTO with no text, inject default argument from node data
      if ((command === 'GO_INSIDE' || command === 'GOTO') && !parsedCommand.text) {
        const defaultArg = getDefaultNavigationArg(command, currentNode);
        if (defaultArg) {
          parsedCommand = { ...parsedCommand, text: defaultArg };
        }
      }
    }

    // ============================================
    // V2 World System Commands
    // TODO: Remove when V2 is stable
    // ============================================
    if (isV2Command(command)) {
      // Get active entity info for V2 commands that need context
      const activeEntityId = useStore.getState().activeEntity;
      const activeNode = activeEntityId ? getNode(activeEntityId) : null;
      const activeEntityType = activeNode?.type || null;
      
      await handleV2Command(parsedCommand, callbacks, activeEntityId, activeEntityType);
      return;
    }

    // Route to appropriate command handler
    if (isCreationCommand(command)) {
      await handleCreationCommand(parsedCommand, currentNode, callbacks);
      return;
    }

    if (isMediaCommand(command)) {
      await handleMediaCommand(parsedCommand, currentNode, callbacks);
      return;
    }

    if (isEditCommand(command)) {
      await handleEditCommand(parsedCommand, currentNode, callbacks);
      return;
    }

    // Standard navigation commands
    await handleNavigationCommand(parsedCommand, currentNode, callbacks, {
      getNode,
      getSpatialNodes,
      setActiveEntity
    });
  }, [movementInput, getNode, getSpatialNodes, setActiveEntity]);

  const handleInvalidCommand = useCallback((command: string) => {
    const message = `Command '/${command}' is not available yet. Available navigation commands: /GO_INSIDE, /GOTO`;
    setErrorMessage(message);
    console.warn('[useNavigationLogic] Invalid command attempted:', command);

    setTimeout(() => setErrorMessage(null), 5000);
  }, []);

  /**
   * Enhance the current command with navigable elements, furnishing, or facade
   * Uses LLM to suggest appropriate details based on context
   */
  const handleEnhance = useCallback(async () => {
    if (isEnhancing) return;
    
    const trimmedInput = movementInput.trim();
    if (!trimmedInput.startsWith('/')) {
      setErrorMessage('Enter a command first (e.g., /GO_INSIDE spa)');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    // Parse the command
    const parsedCommand = parseCommandInput(trimmedInput);
    const { command } = parsedCommand;
    let { text } = parsedCommand;

    // Check if command supports enhancement
    if (!ENHANCEABLE_COMMANDS.includes(command)) {
      setErrorMessage(`Enhancement not available for /${command}. Supported: ${ENHANCEABLE_COMMANDS.join(', ')}`);
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    // Get current node
    const activeEntityId = useStore.getState().activeEntity;
    if (!activeEntityId) {
      setErrorMessage('Select a location first');
      setTimeout(() => setErrorMessage(null), 3000);
      return;
    }

    const currentNode = getNode(activeEntityId);
    
    // For GO_INSIDE/GOTO with no text, inject default argument from node data
    if ((command === 'GO_INSIDE' || command === 'GOTO') && !text && currentNode) {
      const defaultArg = getDefaultNavigationArg(command, currentNode);
      if (defaultArg) {
        text = defaultArg;
      }
    }

    setIsEnhancing(true);

    try {
      const response = await fetch('/api/mzoo/navigation/enhance-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          command,
          text: text || '',
          nodeId: activeEntityId
        })
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Enhancement failed');
      }

      const result = await response.json();
      const enhancement = result.data?.enhancement;

      if (enhancement) {
        // Append enhancement to existing command
        const newInput = text 
          ? `/${command} ${text}, ${enhancement}`
          : `/${command} ${enhancement}`;
        setMovementInput(newInput);
      }
    } catch (error) {
      console.error('[useNavigationLogic] Enhancement failed:', error);
      setErrorMessage(error instanceof Error ? error.message : 'Enhancement failed');
      setTimeout(() => setErrorMessage(null), 5000);
    } finally {
      setIsEnhancing(false);
    }
  }, [movementInput, isEnhancing, getNode]);

  /**
   * Check if the current input can be enhanced
   */
  const canEnhance = useCallback((): boolean => {
    const trimmedInput = movementInput.trim();
    if (!trimmedInput.startsWith('/')) return false;
    
    const parsedCommand = parseCommandInput(trimmedInput);
    return ENHANCEABLE_COMMANDS.includes(parsedCommand.command);
  }, [movementInput]);

  return {
    state: {
      movementInput,
      isMoving,
      isEnhancing,
      errorMessage,
      activeEntity
    },
    handlers: {
      setMovementInput,
      handleMove,
      handleEnhance,
      handleInvalidCommand
    },
    utils: {
      canEnhance
    }
  };
}
