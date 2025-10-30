/**
 * Location Focus Utilities
 * Helper functions for initializing and managing focus state
 */

import type { Location, FocusState } from '@/store/slices/locations';

/**
 * Initialize focus state with default values
 */
export function initFocus(location: Location): FocusState {
  const locationName = location.dna?.location?.meta?.name ?? location.name;
  
  return {
    node_id: locationName,
    perspective: 'exterior',
    viewpoint: 'default world view',
    distance: 'medium',
  };
}

/**
 * Create updated focus state with new values
 * Returns a new FocusState object (immutable)
 */
export function updateFocus(
  currentFocus: FocusState,
  nodeId: string,
  updates?: Partial<FocusState>
): FocusState {
  return {
    ...currentFocus,
    node_id: nodeId,
    ...updates,
  };
}
