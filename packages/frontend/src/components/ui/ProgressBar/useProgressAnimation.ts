/**
 * Progress Bar animation hook
 * Calculates the target progress and animation duration based on current step
 */

import { useMemo, useState, useEffect } from 'react';
import type { UseProgressAnimationProps, AnimationResult } from './types';

/**
 * Hook that calculates animated progress values for the ProgressBar
 * @param props - Animation configuration
 * @returns Object containing progress percentage and animation duration
 */
export function useProgressAnimation({
  steps,
  currentStep,
  isComplete,
}: UseProgressAnimationProps): AnimationResult {
  // Use state for the displayed progress value (starts at 0)
  const [displayedProgress, setDisplayedProgress] = useState(0);
  
  // Calculate the target progress and duration
  const target = useMemo(() => {
    // Complete state: animate to 100%
    if (isComplete) {
      return { 
        progress: 100,
        currentStepDuration: 500 // Quick animation to 100% when complete
      };
    }
    
    // Not started state: stay at 0%
    if (currentStep < 0) {
      return { progress: 0, currentStepDuration: 0 };
    }
    
    // Calculate total duration across all steps
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    if (totalDuration === 0) {
      return { progress: 0, currentStepDuration: 0 };
    }
    
    // Calculate cumulative duration up to and including current step
    let targetDuration = 0;
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      targetDuration += steps[i].duration;
    }
    
    // Calculate the target progress as percentage of total
    const targetProgress = (targetDuration / totalDuration) * 100;
    
    // Use current step's duration for animation, with fallback
    const animationDuration = currentStep >= 0 && currentStep < steps.length 
      ? steps[currentStep].duration 
      : 500;
    
    return {
      progress: targetProgress,
      currentStepDuration: animationDuration
    };
  }, [steps, currentStep, isComplete]);

  // Sync displayed progress to target using useEffect
  // This ensures that when the component mounts, it starts at 0 (initial state)
  // and then transitions to the target value, triggering the CSS animation
  useEffect(() => {
    if (currentStep < 0 && !isComplete) {
      setDisplayedProgress(0);
      return;
    }
    
    // Simple state update triggers re-render, allowing CSS transition to animate the change
    setDisplayedProgress(target.progress);
  }, [target.progress, currentStep, isComplete]);
  
  return {
    progress: displayedProgress,
    currentStepDuration: target.currentStepDuration
  };
}
