/**
 * Progress Bar animation hook
 * Calculates the target progress and animation duration based on current step
 */

import { useMemo } from 'react';
import type { UseProgressAnimationProps, AnimationResult, ProgressStep } from './types';

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
  
  // Calculate the target progress and duration
  const result = useMemo(() => {
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
    let targetProgress = (targetDuration / totalDuration) * 100;
    
    // Cap last step at 95% to leave room for completion animation
    const isLastStep = currentStep === steps.length - 1;
    if (isLastStep && targetProgress > 95) {
      targetProgress = 95;
    }
    
    // Use current step's duration for animation, with fallback
    const animationDuration = currentStep >= 0 && currentStep < steps.length 
      ? steps[currentStep].duration 
      : 500;
    
    return {
      progress: targetProgress,
      currentStepDuration: animationDuration
    };
  }, [steps, currentStep, isComplete]);
  
  return result;
}
