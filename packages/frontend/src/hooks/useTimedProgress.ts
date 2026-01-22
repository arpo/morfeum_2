/**
 * Timed Progress Hook
 * Provides smooth time-based progress animation for long-running operations
 * 
 * Usage:
 *   const { start, stop, isRunning } = useTimedProgress();
 *   start(entityId, 30000, 'video');  // 30 seconds for video
 *   stop(entityId);                    // Jump to 100% when done
 */

import { useCallback, useRef } from 'react';
import { useStore } from '@/store';
import { easeInOutCubic } from '@/utils/easing';

interface ActiveAnimation {
  intervalId: NodeJS.Timeout;
  startTime: number;
  durationMs: number;
}

export function useTimedProgress() {
  const activeAnimations = useRef<Map<string, ActiveAnimation>>(new Map());
  
  const startMediaOperation = useStore(state => state.startMediaOperation);
  const updateMediaProgress = useStore(state => state.updateMediaProgress);
  const finishMediaOperation = useStore(state => state.finishMediaOperation);
  const getMediaProgress = useStore(state => state.getMediaProgress);

  /**
   * Start a timed progress animation
   * Animates from 0% to 95% over the specified duration with easeInOutCubic
   * Stops at 95% if operation takes longer than expected
   */
  const start = useCallback((
    entityId: string,
    durationMs: number,
    operation: 'upscaling' | 'video'
  ) => {
    // Clear any existing animation for this entity
    const existing = activeAnimations.current.get(entityId);
    if (existing) {
      clearInterval(existing.intervalId);
    }

    // Start the operation in store
    startMediaOperation(entityId, operation);
    updateMediaProgress(entityId, 0);

    const startTime = Date.now();
    const updateInterval = 50; // Update every 50ms for smooth animation
    const maxProgress = 95; // Stop at 95%, let stop() handle 100%

    const intervalId = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const linearProgress = Math.min(elapsed / durationMs, 1);
      const easedProgress = easeInOutCubic(linearProgress);
      const progress = Math.round(easedProgress * maxProgress);

      updateMediaProgress(entityId, progress);

      // Stop interval when we reach max progress
      if (linearProgress >= 1) {
        clearInterval(intervalId);
        activeAnimations.current.delete(entityId);
      }
    }, updateInterval);

    activeAnimations.current.set(entityId, {
      intervalId,
      startTime,
      durationMs
    });
  }, [startMediaOperation, updateMediaProgress]);

  /**
   * Stop the animation and jump to 100%
   * Call this when the operation completes
   */
  const stop = useCallback((entityId: string) => {
    // Clear any running animation
    const animation = activeAnimations.current.get(entityId);
    if (animation) {
      clearInterval(animation.intervalId);
      activeAnimations.current.delete(entityId);
    }

    // Jump to 100%
    updateMediaProgress(entityId, 100);

    // Small delay to show 100% before removing
    setTimeout(() => {
      finishMediaOperation(entityId);
    }, 500);
  }, [updateMediaProgress, finishMediaOperation]);

  /**
   * Cancel the animation and clean up (e.g., on error)
   */
  const cancel = useCallback((entityId: string) => {
    const animation = activeAnimations.current.get(entityId);
    if (animation) {
      clearInterval(animation.intervalId);
      activeAnimations.current.delete(entityId);
    }
    finishMediaOperation(entityId);
  }, [finishMediaOperation]);

  /**
   * Check if an entity has an active operation
   */
  const isRunning = useCallback((entityId: string): boolean => {
    const progress = getMediaProgress(entityId);
    return !!progress;
  }, [getMediaProgress]);

  return {
    start,
    stop,
    cancel,
    isRunning
  };
}
