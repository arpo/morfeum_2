/**
 * ProgressBar component type definitions
 */

/**
 * Represents a single step in the progress bar
 */
export interface ProgressStep {
  /** Display name for the step (shown on hover) */
  name: string;
  /** Duration in milliseconds for this step's animation */
  duration: number;
}

/**
 * Calculated position for a step in the progress bar
 */
export interface StepPosition {
  /** Starting position as percentage (0-100) */
  start: number;
  /** Ending position as percentage (0-100) */
  end: number;
  /** Display name for the step */
  name: string;
}

/**
 * Props for the ProgressBar component
 */
export interface ProgressBarProps {
  /** Array of steps with names and durations */
  steps: ProgressStep[];
  /** Index of the currently active step (-1 for not started) */
  currentStep: number;
  /** Whether all steps are complete */
  isComplete?: boolean;
  /** Callback fired when the completion animation finishes */
  onComplete?: () => void;
}

/**
 * Return type for useProgressBar hook
 */
export interface UseProgressBarReturn {
  /** Current animated progress percentage (0-100) */
  animatedProgress: number;
  /** Duration for current step animation in ms */
  currentStepDuration: number;
  /** Calculated positions for all steps */
  stepPositions: StepPosition[];
  /** Index of currently hovered step, null if none */
  hoveredStep: number | null;
  /** Handler for mouse entering a step area */
  handleStepMouseEnter: (index: number) => void;
  /** Handler for mouse leaving a step area */
  handleStepMouseLeave: () => void;
}

/**
 * Props for useProgressAnimation hook
 */
export interface UseProgressAnimationProps {
  /** Array of steps with durations */
  steps: ProgressStep[];
  /** Index of current step */
  currentStep: number;
  /** Whether progress is complete */
  isComplete: boolean;
}

/**
 * Return type for useProgressAnimation hook
 */
export interface AnimationResult {
  /** Target progress percentage (0-100) */
  progress: number;
  /** Animation duration in milliseconds */
  currentStepDuration: number;
}
