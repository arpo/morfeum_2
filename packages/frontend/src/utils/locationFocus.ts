/**
 * Location Focus Utilities
 * Helper functions for initializing and managing focus state
 */

import type { Location, FocusState } from '@/store/slices/locationsSlice';

/**
 * Initialize focus state from location DNA's viewContext
 * Falls back to sensible defaults if viewContext is missing
 */
export function initFocus(location: Location): FocusState {
  const vc = location.dna?.location?.profile?.viewContext;
  const locationName = location.dna?.location?.meta?.name ?? location.name;
  
  return {
    node_id: locationName,
    perspective: (vc?.perspective as FocusState['perspective']) ?? 'exterior',
    viewpoint: vc?.composition ?? 'default world view',
    distance: (vc?.distance as FocusState['distance']) ?? 'medium',
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
