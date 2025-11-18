import { useEffect } from 'react';
import type { LocationInfoModalProps, LocationInfoLogicReturn } from './types';

/**
 * Determine which node is currently in view based on hierarchy structure
 */
export function determineCurrentNode(nodeId: string | null, profile: any): 'niche' | 'location' | 'region' | 'world' | null {
  if (!nodeId || !profile) return null;
  
  // Check if flat structure (no hierarchy)
  const isFlat = !profile.world && !profile.region && !profile.location && !profile.niche && profile.looks;
  if (isFlat) return 'location'; // Treat flat as location
  
  // Match nodeId with node names in hierarchy
  
  // Check niche
  if (profile.niche?.meta?.name === nodeId) {
    return 'niche';
  }
  
  // Check location
  if (profile.location?.meta?.name === nodeId) {
    return 'location';
  }
  
  // Check region
  if (profile.region?.meta?.name === nodeId) {
    return 'region';
  }
  
  // Check world
  if (profile.world?.meta?.name === nodeId) {
    return 'world';
  }
  
  // Default to deepest available node if no match
  if (profile.niche) return 'niche';
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
