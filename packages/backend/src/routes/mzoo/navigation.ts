/**
 * Navigation & Node Creation Routes
 * LLM-based intent classification + deterministic routing + slash commands
 * 
 * Route handlers are extracted to separate files in ./handlers/
 */

import { Router } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';

// Import handlers
import { analyzeHandler } from './handlers/analyzeHandler';
import { commandHandler } from './handlers/commandHandler';
import { eventsHandler } from './handlers/eventsHandler';
import { createNodeHandler } from './handlers/createNodeHandler';
import { createImageHandler } from './handlers/createImageHandler';
import { enhancePromptHandler } from './handlers/enhancePromptHandler';

const router = Router();

// Track pipeline configurations for SSE initialization
// Exported for use by handlers
export const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

/**
 * Helper: Detect perspective from node data
 * Uses stored spaceType from LLM analysis (no string matching)
 * Exported for use by handlers
 */
export function detectPerspectiveFromNode(node: any): 'interior' | 'exterior' | 'open-air' {
  // 1. Use stored spaceType if available (from LLM structure analysis)
  if (node.spaceType === 'interior' || node.spaceType === 'exterior' || node.spaceType === 'open-air') {
    return node.spaceType;
  }
  
  // 2. Fallback based on node type (domain rules)
  // Location nodes are always exterior (they represent buildings/places)
  if (node.type === 'location' || node.type === 'host' || node.type === 'region') {
    return 'exterior';
  }
  
  // 3. Default for niches without spaceType
  return node.type === 'niche' ? 'interior' : 'exterior';
}

// Route definitions
router.post('/analyze', asyncHandler(analyzeHandler));
router.post('/command', asyncHandler(commandHandler));
router.get('/events/:navigationId', asyncHandler(eventsHandler));
router.post('/create-node', asyncHandler(createNodeHandler));
router.post('/create-image', asyncHandler(createImageHandler));
router.post('/enhance-prompt', asyncHandler(enhancePromptHandler));

export { router as navigationRouter };
