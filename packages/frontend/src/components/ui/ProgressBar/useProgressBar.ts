/**
 * Progress Bar logic hook
 * Handles all state management and calculations for the ProgressBar component
 */

import { useState, useMemo, useEffect } from 'react';
import { useProgressAnimation } from './useProgressAnimation';
import type { 
  ProgressBarProps, 
  UseProgressBarReturn, 
  StepPosition 
} from './types';

/**
 * Hook that manages all logic for the ProgressBar component
 * @param props - ProgressBar component props
 * @returns Object containing all values and handlers needed for rendering
 */
export function useProgressBar({
  steps,
  currentStep,
  isComplete = false,
  onComplete
}: ProgressBarProps): UseProgressBarReturn {
  // State for tooltip hover
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  
  // Get animated progress and duration from animation hook
  const { progress: animatedProgress, currentStepDuration } = useProgressAnimation({
    steps,
    currentStep,
    isComplete
  });

  // Calculate step positions based on durations
  const stepPositions = useMemo((): StepPosition[] => {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    if (totalDuration === 0) return [];
    
    let cumulativeDuration = 0;
    
    return steps.map((step) => {
      const start = (cumulativeDuration / totalDuration) * 100;
      cumulativeDuration += step.duration;
      const end = (cumulativeDuration / totalDuration) * 100;
      
      return {
        start,
        end,
        name: step.name
      };
    });
  }, [steps]);

  // Handle completion callback
  useEffect(() => {
    if (isComplete && onComplete) {
      // Wait for animation to reach 100% before calling onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 800); // Slightly longer than animation duration for smooth feel
      
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  // Event handlers
  const handleStepMouseEnter = (index: number) => {
    setHoveredStep(index);
  };

  const handleStepMouseLeave = () => {
    setHoveredStep(null);
  };

  return {
    animatedProgress,
    currentStepDuration,
    stepPositions,
    hoveredStep,
    handleStepMouseEnter,
    handleStepMouseLeave
  };
}
