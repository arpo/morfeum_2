import { useCallback, useState } from 'react';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import { parseCommandInput, isCreationCommand, isMediaCommand, isNavigationCommand } from './commandParser';
import { handleCreationCommand } from './creationCommands';
import { handleMediaCommand } from './mediaCommands';
import { handleNavigationCommand } from './navigationCommands';

export function useNavigationLogic() {
  const [movementInput, setMovementInput] = useState('');
  const [isMoving, setIsMoving] = useState(false);
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
    const parsedCommand = parseCommandInput(trimmedInput);
    const { command } = parsedCommand;

    // Callbacks for all command handlers
    const callbacks = {
      setIsMoving,
      setErrorMessage,
      setMovementInput
    };

    // Get current node (may be undefined for NEW_WORLD)
    let currentNode: ReturnType<typeof getNode> | undefined = undefined;

    // For NEW_WORLD, we don't need an active entity
    if (command !== 'NEW_WORLD') {
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
