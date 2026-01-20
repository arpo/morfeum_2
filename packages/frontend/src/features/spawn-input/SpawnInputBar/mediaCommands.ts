/**
 * Media Commands (V1 - DEPRECATED)
 * 
 * VIEW command has been removed. Use DISPLAY instead.
 */

import type { ParsedCommand } from './commandParser';

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
 * Handle VIEW command (V1 - DEPRECATED)
 * @deprecated VIEW replaced by DISPLAY command
 */
export async function handleMediaCommand(
  _parsedCommand: ParsedCommand,
  _currentNode: any,
  callbacks: MediaCallbacks
): Promise<MediaResult> {
  const { setErrorMessage, setIsMoving, setMovementInput } = callbacks;
  
  setErrorMessage('VIEW command removed. Use /DISPLAY instead');
  setTimeout(() => setErrorMessage(null), 5000);
  setIsMoving(false);
  setMovementInput('');
  
  return { success: false, error: 'VIEW command deprecated' };
}
