import { useMemo } from 'react';
import type { ProgressStep } from './ProgressBar';

interface UseProgressAnimationProps {
  steps: ProgressStep[];
  currentStep: number;
  currentStepProgress: number;
  isComplete: boolean;
  onComplete?: () => void;
}

interface AnimationResult {
  progress: number;
  currentStepDuration: number;
}

export function useProgressAnimation({
  steps,
  currentStep,
  currentStepProgress,
  isComplete,
}: UseProgressAnimationProps): AnimationResult {
  
  // Calculate the target progress and duration
  const result = useMemo(() => {
    if (isComplete) {
      return { 
        progress: 100,
        currentStepDuration: 500 // Quick animation to 100% when complete
      };
    }
    
    // If currentStep is -1 (not started), return 0%
    if (currentStep < 0) {
      return { progress: 0, currentStepDuration: 0 };
    }
    
    // Calculate total duration
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
    if (totalDuration === 0) {
      return { progress: 0, currentStepDuration: 0 };
    }
    
    // When a step starts, we want to animate TO the end of that step
    // Calculate cumulative duration up to and including current step
    let targetDuration = 0;
    for (let i = 0; i <= currentStep && i < steps.length; i++) {
      targetDuration += steps[i].duration;
    }
    
    // The target progress is the END position of the current step
    let targetProgress = (targetDuration / totalDuration) * 100;
    
    // If this is the last step, cap it at 95% so there's room for completion animation
    const isLastStep = currentStep === steps.length - 1;
    if (isLastStep && targetProgress > 95) {
      targetProgress = 95;
    }
    
    // The animation duration is the current step's duration
    const animationDuration = currentStep >= 0 && currentStep < steps.length 
      ? steps[currentStep].duration 
      : 500; // Default duration if out of bounds
    
    return {
      progress: targetProgress,
      currentStepDuration: animationDuration
    };
  }, [steps, currentStep, isComplete]);
  
  return result;
}
