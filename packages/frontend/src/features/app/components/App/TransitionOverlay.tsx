/**
 * TransitionOverlay Component
 * Cinematic black overlay for smooth node transitions
 * Fades in to hide node switch, fades out to reveal new scene
 */

import { useEffect, useState, useCallback } from 'react';
import { TRANSITION_OVERLAY_CONFIG } from '@/config';
import styles from './TransitionOverlay.module.css';

type OverlayState = 'hidden' | 'fading-in' | 'visible' | 'fading-out';

interface TransitionOverlayProps {
  /** Whether a transition is requested */
  isTransitioning: boolean;
  /** Called when overlay is fully black (safe to switch content) */
  onFadedIn?: () => void;
  /** Called when overlay fade-out is complete */
  onFadedOut?: () => void;
}

export function TransitionOverlay({ 
  isTransitioning, 
  onFadedIn, 
  onFadedOut 
}: TransitionOverlayProps) {
  const [state, setState] = useState<OverlayState>('hidden');

  // Start fade-in when transition requested
  useEffect(() => {
    if (isTransitioning && state === 'hidden') {
      setState('fading-in');
    }
  }, [isTransitioning, state]);

  // Handle fade-in completion
  const handleFadeInEnd = useCallback(() => {
    if (state === 'fading-in') {
      setState('visible');
      onFadedIn?.();
    }
  }, [state, onFadedIn]);

  // Handle fade-out completion
  const handleFadeOutEnd = useCallback(() => {
    if (state === 'fading-out') {
      setState('hidden');
      onFadedOut?.();
    }
  }, [state, onFadedOut]);

  // Start fade-out when transition is no longer needed and we're visible
  useEffect(() => {
    if (!isTransitioning && state === 'visible') {
      setState('fading-out');
    }
  }, [isTransitioning, state]);

  // Compute CSS class based on state
  const overlayClass = [
    styles.overlay,
    state === 'fading-in' && styles.fadingIn,
    state === 'visible' && styles.visible,
    state === 'fading-out' && styles.fadingOut,
    state === 'hidden' && styles.hidden,
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={overlayClass}
      style={{
        '--fade-in-duration': `${TRANSITION_OVERLAY_CONFIG.FADE_IN_MS}ms`,
        '--fade-out-duration': `${TRANSITION_OVERLAY_CONFIG.FADE_OUT_MS}ms`,
      } as React.CSSProperties}
      onTransitionEnd={(e) => {
        // Only handle opacity transitions
        if (e.propertyName !== 'opacity') return;
        
        if (state === 'fading-in') {
          handleFadeInEnd();
        } else if (state === 'fading-out') {
          handleFadeOutEnd();
        }
      }}
      data-component="transition-overlay"
    />
  );
}
