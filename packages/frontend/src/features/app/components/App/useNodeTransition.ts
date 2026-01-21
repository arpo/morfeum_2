/**
 * useNodeTransition Hook
 * Coordinates cinematic transitions when switching between nodes
 * 
 * Flow:
 * 1. User clicks node → Queue target, start overlay fade-in
 * 2. Overlay fully black → Actually switch to target node
 * 3. Original image loaded → Start overlay fade-out
 */

import { useState, useCallback, useRef, useEffect } from 'react';
import { useStore } from '@/store';

interface UseNodeTransitionReturn {
  /** Whether a transition is in progress (overlay should be active) */
  isTransitioning: boolean;
  /** Request a transition to a new entity */
  requestTransition: (targetEntityId: string) => void;
  /** Called by overlay when fade-in is complete (safe to switch content) */
  onOverlayFadedIn: () => void;
  /** Called by WorldView when original image is loaded (safe to reveal) */
  onContentReady: () => void;
  /** Called by overlay when fade-out is complete */
  onOverlayFadedOut: () => void;
}

export function useNodeTransition(): UseNodeTransitionReturn {
  const setActiveEntity = useStore(state => state.setActiveEntity);
  const activeEntity = useStore(state => state.activeEntity);
  
  // Transition state
  const [isTransitioning, setIsTransitioning] = useState(false);
  const pendingTargetRef = useRef<string | null>(null);
  const contentReadyRef = useRef(false);
  const overlayBlackRef = useRef(false);

  /**
   * Request a transition to a new entity
   * This queues the target and starts the overlay fade-in
   */
  const requestTransition = useCallback((targetEntityId: string) => {
    // Skip if already transitioning or same entity
    if (isTransitioning || targetEntityId === activeEntity) {
      // If same entity, just switch directly (no overlay needed)
      if (targetEntityId === activeEntity) return;
      return;
    }
    
    // Queue target and start transition
    pendingTargetRef.current = targetEntityId;
    contentReadyRef.current = false;
    overlayBlackRef.current = false;
    setIsTransitioning(true);
  }, [isTransitioning, activeEntity]);

  /**
   * Called when overlay is fully black
   * Now safe to switch the actual content
   */
  const onOverlayFadedIn = useCallback(() => {
    overlayBlackRef.current = true;
    
    if (pendingTargetRef.current) {
      // Actually switch to the new entity (hidden behind black overlay)
      setActiveEntity(pendingTargetRef.current);
      pendingTargetRef.current = null;
    }
  }, [setActiveEntity]);

  /**
   * Called when WorldView has loaded the original image
   * If overlay is already black, we can start fade-out
   */
  const onContentReady = useCallback(() => {
    contentReadyRef.current = true;
    
    // If overlay is black and content is ready, fade out
    if (overlayBlackRef.current && contentReadyRef.current) {
      setIsTransitioning(false);
    }
  }, []);

  /**
   * Called when overlay fade-out is complete
   * Transition is fully done
   */
  const onOverlayFadedOut = useCallback(() => {
    // Reset all state
    pendingTargetRef.current = null;
    contentReadyRef.current = false;
    overlayBlackRef.current = false;
  }, []);

  // Listen for content ready signal from WorldView (via custom event)
  useEffect(() => {
    const handleContentReady = () => {
      onContentReady();
    };
    
    window.addEventListener('worldViewContentReady', handleContentReady);
    return () => window.removeEventListener('worldViewContentReady', handleContentReady);
  }, [onContentReady]);

  // Listen for transition requests from other components (via custom event)
  useEffect(() => {
    const handleTransitionRequest = (event: Event) => {
      const customEvent = event as CustomEvent<{ entityId: string }>;
      const targetEntityId = customEvent.detail?.entityId;
      if (targetEntityId) {
        requestTransition(targetEntityId);
      }
    };
    
    window.addEventListener('requestNodeTransition', handleTransitionRequest);
    return () => window.removeEventListener('requestNodeTransition', handleTransitionRequest);
  }, [requestTransition]);

  return {
    isTransitioning,
    requestTransition,
    onOverlayFadedIn,
    onContentReady,
    onOverlayFadedOut
  };
}
