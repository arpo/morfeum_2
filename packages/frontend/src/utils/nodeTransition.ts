/**
 * Node Transition Utility
 * Helper function to trigger cinematic node transitions with overlay
 * 
 * Usage:
 *   import { requestNodeTransition } from '@/utils/nodeTransition';
 *   requestNodeTransition(entityId);
 */

/**
 * Request a cinematic transition to a new entity
 * This triggers the black overlay fade-in, then switches the entity when hidden
 * 
 * @param entityId - The target entity ID to switch to
 */
export function requestNodeTransition(entityId: string): void {
  window.dispatchEvent(new CustomEvent('requestNodeTransition', {
    detail: { entityId }
  }));
}
