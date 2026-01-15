/**
 * Dynamic Progress
 * 
 * Creates dynamic progress configurations based on what's being created.
 * Supports variable number of steps depending on hierarchy depth.
 */

import type { HierarchySpec, NodeType, ProgressStep, ProgressConfig } from '../types';

/**
 * Step definitions for each node type
 */
const NODE_STEP_DEFINITIONS: Record<NodeType, { id: string; name: string }> = {
  host: { id: 'create_host', name: 'Creating host...' },
  region: { id: 'create_region', name: 'Creating region...' },
  location: { id: 'create_location', name: 'Creating location...' },
  niche: { id: 'create_niche', name: 'Creating niche...' },
  container: { id: 'create_container', name: 'Creating container...' },
  space: { id: 'create_space', name: 'Creating space...' },
  view: { id: 'create_view', name: 'Creating view...' },
};

/**
 * Image generation step
 */
const IMAGE_STEP: ProgressStep = {
  id: 'generate_image',
  name: 'Generating image...',
};

/**
 * DNA generation step (when separate from node creation)
 */
const DNA_STEP: ProgressStep = {
  id: 'generate_dna',
  name: 'Generating DNA...',
};

/**
 * Create progress configuration from a hierarchy spec
 * 
 * @param spec - Hierarchy specification
 * @param includeImage - Whether image generation is included
 * @returns Progress configuration with dynamic steps
 */
export function createProgressConfig(
  spec: HierarchySpec,
  includeImage: boolean = true
): ProgressConfig {
  const steps: ProgressStep[] = [];

  // Add steps for each node type that's specified
  if (spec.host) {
    steps.push({
      ...NODE_STEP_DEFINITIONS.host,
      nodeType: 'host',
    });
  }

  if (spec.region) {
    steps.push({
      ...NODE_STEP_DEFINITIONS.region,
      nodeType: 'region',
    });
  }

  if (spec.location) {
    steps.push({
      ...NODE_STEP_DEFINITIONS.location,
      nodeType: 'location',
    });
  }

  if (spec.niche) {
    steps.push({
      ...NODE_STEP_DEFINITIONS.niche,
      nodeType: 'niche',
    });
  }

  // Add image step if included
  if (includeImage) {
    steps.push(IMAGE_STEP);
  }

  return {
    steps,
    includeImage,
  };
}

/**
 * Create progress configuration for a single node
 * 
 * @param nodeType - Type of node being created
 * @param includeImage - Whether image generation is included
 * @returns Progress configuration
 */
export function createSingleNodeProgress(
  nodeType: NodeType,
  includeImage: boolean = false
): ProgressConfig {
  const steps: ProgressStep[] = [
    {
      ...NODE_STEP_DEFINITIONS[nodeType],
      nodeType,
    },
  ];

  if (includeImage) {
    steps.push(IMAGE_STEP);
  }

  return {
    steps,
    includeImage,
  };
}

/**
 * Get step index by step ID
 * 
 * @param config - Progress configuration
 * @param stepId - ID of the step to find
 * @returns Index of the step, or -1 if not found
 */
export function getStepIndex(config: ProgressConfig, stepId: string): number {
  return config.steps.findIndex(step => step.id === stepId);
}

/**
 * Get step by node type
 * 
 * @param config - Progress configuration
 * @param nodeType - Node type to find
 * @returns Step for that node type, or undefined
 */
export function getStepByNodeType(
  config: ProgressConfig,
  nodeType: NodeType
): ProgressStep | undefined {
  return config.steps.find(step => step.nodeType === nodeType);
}

/**
 * Calculate progress percentage
 * 
 * @param config - Progress configuration
 * @param completedStepIndex - Index of the last completed step
 * @returns Progress percentage (0-100)
 */
export function calculateProgress(
  config: ProgressConfig,
  completedStepIndex: number
): number {
  if (config.steps.length === 0) return 100;
  if (completedStepIndex < 0) return 0;
  
  const progress = ((completedStepIndex + 1) / config.steps.length) * 100;
  return Math.min(100, Math.round(progress));
}

/**
 * Get display name for current step
 * 
 * @param config - Progress configuration
 * @param currentStepIndex - Current step index
 * @returns Display name for current step
 */
export function getCurrentStepName(
  config: ProgressConfig,
  currentStepIndex: number
): string {
  if (currentStepIndex < 0 || currentStepIndex >= config.steps.length) {
    return 'Preparing...';
  }
  return config.steps[currentStepIndex].name;
}

/**
 * Get total step count
 * 
 * @param config - Progress configuration
 * @returns Total number of steps
 */
export function getTotalSteps(config: ProgressConfig): number {
  return config.steps.length;
}

/**
 * Format progress for SSE event
 * 
 * @param config - Progress configuration
 * @param currentStepIndex - Current step index
 * @param customMessage - Optional custom message
 * @returns Formatted progress object for SSE
 */
export function formatProgressForSSE(
  config: ProgressConfig,
  currentStepIndex: number,
  customMessage?: string
): {
  currentStep: number;
  totalSteps: number;
  stepName: string;
  progress: number;
  message?: string;
} {
  return {
    currentStep: currentStepIndex + 1,
    totalSteps: config.steps.length,
    stepName: getCurrentStepName(config, currentStepIndex),
    progress: calculateProgress(config, currentStepIndex),
    message: customMessage,
  };
}
