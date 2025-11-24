/**
 * ProgressBar Component
 * A minimalistic progress bar with step-based animations and color transitions
 * @component
 */

import styles from './ProgressBar.module.css';
import { useProgressBar } from './useProgressBar';
import type { ProgressBarProps } from './types';

/**
 * Progress bar component with step-based animation
 * 
 * Features:
 * - Smooth animations based on step durations
 * - Color transition from purple to blue as progress increases
 * - Hover tooltips showing step names
 * - Subtle step markers
 * - Completion callback
 * 
 * @example
 * ```tsx
 * const steps = [
 *   { name: 'Loading', duration: 2000 },
 *   { name: 'Processing', duration: 3000 },
 *   { name: 'Finalizing', duration: 1000 }
 * ];
 * 
 * <ProgressBar
 *   steps={steps}
 *   currentStep={1}
 *   isComplete={false}
 *   onComplete={() => console.log('Done!')}
 * />
 * ```
 */
export function ProgressBar(props: ProgressBarProps) {
  const {
    animatedProgress,
    currentStepDuration,
    stepPositions,
    hoveredStep,
    handleStepMouseEnter,
    handleStepMouseLeave
  } = useProgressBar(props);

  return (
    <div className={styles.container}>
      <div className={styles.progressBar}>
        {/* Background track */}
        <div className={styles.track} />
        
        {/* Animated progress fill with dynamic transition duration and color */}
        <div
          className={styles.fill}
          style={{
            width: `${animatedProgress}%`,
            transition: `width ${currentStepDuration}ms cubic-bezier(0.4, 0, 0.2, 1)`,
            // Interpolate color from purple (270°) to blue (240°) based on progress
            background: `hsl(${270 - (animatedProgress * 0.3)}deg, 70%, 60%)`
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
            onMouseEnter={() => handleStepMouseEnter(index)}
            onMouseLeave={handleStepMouseLeave}
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
