/**
 * V2 Command Utilities
 * 
 * Shared utilities for V2 command handlers
 */

import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locations';
import type { V2CommandCallbacks, V2CommandResult } from '../types';

/**
 * Show a temporary error message
 */
export function showError(
  callbacks: V2CommandCallbacks,
  message: string,
  duration = 5000
): void {
  callbacks.setErrorMessage(message);
  setTimeout(() => callbacks.setErrorMessage(null), duration);
}

/**
 * Handle validation failure - show error and return failure result
 */
export function validationError(
  callbacks: V2CommandCallbacks,
  message: string
): V2CommandResult {
  showError(callbacks, message);
  return { success: false, error: message };
}

/**
 * Handle command execution failure
 */
export function handleCommandError(
  callbacks: V2CommandCallbacks,
  error: unknown,
  defaultMessage: string
): V2CommandResult {
  console.error(`[V2] Command error:`, error);
  showError(callbacks, defaultMessage);
  callbacks.setIsMoving(false);
  callbacks.setMovementInput('');
  return { success: false, error: defaultMessage };
}

/**
 * Register SSE spawn and handle completion
 */
export function registerSpawn(
  operationId: string,
  eventsUrl: string,
  commandDisplay: string,
  onComplete: (data: any) => Promise<void>,
  onError: (error: any) => void
): void {
  const registerExternalSpawn = useStore.getState().registerExternalSpawn;
  
  registerExternalSpawn(
    operationId,
    eventsUrl,
    commandDisplay,
    'location',
    onComplete,
    onError
  );
}

/**
 * Reload locations from backend and set active entity
 */
export async function reloadAndSetActive(entityId: string): Promise<void> {
  await useLocationsStore.getState().loadFromBackend();
  useStore.getState().setActiveEntity(entityId);
}

/**
 * Create standard error handler for SSE spawn
 */
export function createErrorHandler(
  callbacks: V2CommandCallbacks,
  defaultMessage: string
): (error: any) => void {
  return (error: any) => {
    console.error('[V2] SSE error:', error);
    showError(callbacks, error.message || defaultMessage);
    callbacks.setIsMoving(false);
  };
}
