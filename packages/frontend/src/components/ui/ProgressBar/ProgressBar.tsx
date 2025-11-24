import { useEffect, useRef, useState, useMemo } from 'react';

import styles from './ProgressBar.module.css';
import { useProgressAnimation } from './useProgressAnimation';

export interface ProgressStep {
  name: string;
  duration: number; // duration in milliseconds for this step
}

export interface ProgressBarProps {
  steps: ProgressStep[];
  currentStep: number;
  currentStepProgress?: number; // 0-100 within current step
  isComplete?: boolean;
  onComplete?: () => void;
  label?: string; // Optional label to show what's being generated
}

export function ProgressBar({
  steps,
  currentStep,
  currentStepProgress = 0,
  isComplete = false,
  onComplete,
  label
}: ProgressBarProps) {
  const [hoveredStep, setHoveredStep] = useState<number | null>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  
  // Calculate animated progress and get current step duration
  const { progress: animatedProgress, currentStepDuration } = useProgressAnimation({
    steps,
    currentStep,
    currentStepProgress,
    isComplete,
    onComplete
  });

  // Calculate step positions from durations
  const stepPositions = useMemo(() => {
    const totalDuration = steps.reduce((sum, step) => sum + step.duration, 0);
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

  // Handle completion animation
  useEffect(() => {
    if (isComplete && onComplete) {
      // Wait for animation to reach 100% before calling onComplete
      const timer = setTimeout(() => {
        onComplete();
      }, 800); // Slightly longer for smoother feel
      return () => clearTimeout(timer);
    }
  }, [isComplete, onComplete]);

  return (
    <div className={styles.container}>
      <div className={styles.progressBar} ref={progressBarRef}>
        {/* Background track */}
        <div className={styles.track} />
        
        {/* Animated progress fill with dynamic transition duration */}
        <div
          className={styles.fill}
          style={{
            width: `${animatedProgress}%`,
            transition: `width ${currentStepDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`
          }}
        />
        
        {/* Step hover areas */}
        {stepPositions.map((step, index) => (
          <div
            key={index}
            className={styles.stepHoverArea}
            style={{
              left: `${step.start}%`,
              width: `${step.end - step.start}%`
            }}
            onMouseEnter={() => setHoveredStep(index)}
            onMouseLeave={() => setHoveredStep(null)}
          />
        ))}
        
        {/* Step markers (subtle vertical lines) */}
        {stepPositions.slice(0, -1).map((step, index) => (
          <div
            key={index}
            className={styles.stepLine}
            style={{ left: `${step.end}%` }}
          />
        ))}
        
        {/* Tooltip */}
        {hoveredStep !== null && (
          <div
            className={styles.tooltip}
            style={{
              left: `${(stepPositions[hoveredStep].start + stepPositions[hoveredStep].end) / 2}%`
            }}
          >
            <div className={styles.tooltipContent}>
              {stepPositions[hoveredStep].name}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
