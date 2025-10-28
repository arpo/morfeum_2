import { useEffect } from 'react';
import type { LocationInfoModalProps, LocationInfoLogicReturn } from './types';
import type { FocusState } from '@/store/slices/locationsSlice';

/**
 * Determine which node is currently in focus based on hierarchy structure
 */
export function determineCurrentNode(focus: FocusState | null, profile: any): 'niche' | 'location' | 'region' | 'world' | null {
  if (!focus || !profile) return null;
  
  // Check if flat structure (no hierarchy)
  const isFlat = !profile.world && !profile.region && !profile.location && !profile.sublocation && profile.looks;
  if (isFlat) return 'location'; // Treat flat as location
  
  // Match focus.node_id with node names in hierarchy
  const focusNodeId = focus.node_id;
  
  // Check sublocation/niche
  if (profile.sublocation?.meta?.name === focusNodeId) {
    return 'niche';
  }
  
  // Check location
  if (profile.location?.meta?.name === focusNodeId) {
    return 'location';
  }
  
  // Check region
  if (profile.region?.meta?.name === focusNodeId) {
    return 'region';
  }
  
  // Check world
  if (profile.world?.meta?.name === focusNodeId) {
    return 'world';
  }
  
  // Default to deepest available node if no match
  if (profile.sublocation) return 'niche';
  if (profile.location) return 'location';
  if (profile.region) return 'region';
  if (profile.world) return 'world';
  
  return null;
}

export function useLocationInfoLogic(props: LocationInfoModalProps): LocationInfoLogicReturn {
  const { isOpen, onClose } = props;

  // Handle ESC key to close modal
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  const handleClose = () => {
    onClose();
  };

  return {
    handleClose
  };
}
