/**
 * Node Creation System
 * 
 * Unified system for creating world tree nodes (Host, Region, Location, Niche).
 * Used by slash commands (/new-host, /new-region, etc.) and LLM tools.
 * 
 * @see docs/node-creation-system.md for full documentation
 */

// Types
export * from './types';

// Core functions
export { createNode } from './core/createNode';
export { 
  createHierarchy,
  createHost,
  createRegion,
  createLocation,
  createNiche,
} from './core/createHierarchy';
export { 
  extractParentDNAContext,
  buildParentContext,
  mergeDNAWithInheritance,
  getExpectedParentType,
  getExpectedChildType,
  getNodeDepth,
} from './core/dnaInheritance';

// Detection
export { 
  detectSceneType,
  suggestNodeType,
  getCameraStyle,
  hasExplicitElements,
  analyzeScene,
} from './detection/sceneDetector';

export {
  parsePromptToHierarchy,
  detectsInterior,
  type ParsedHierarchy,
} from './detection/parsePromptToHierarchy';

// Prompts
export { getNodeDNAPrompt } from './prompts/dna';
export { getNodeImagePrompt } from './prompts/image';

// Progress
export {
  createProgressConfig,
  createSingleNodeProgress,
  getStepIndex,
  getStepByNodeType,
  calculateProgress,
  getCurrentStepName,
  getTotalSteps,
  formatProgressForSSE,
} from './progress/dynamicProgress';
