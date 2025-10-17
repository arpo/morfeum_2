/**
 * Hierarchy Analysis Routes
 * API endpoints for analyzing user input and creating hierarchical structures
 */

import { Router, Request, Response } from 'express';
import { analyzeHierarchy, validateHierarchy } from '../../engine/hierarchyAnalysis';
import { asyncHandler } from '../../middleware/errorHandler';

const router = Router();

/**
 * POST /api/mzoo/hierarchy/analyze
 * Analyzes user input and returns hierarchical structure
 * 
 * Request body:
 * {
 *   "userPrompt": "A glass on a table in a VIP room..."
 * }
 * 
 * Response:
 * {
 *   "hierarchy": { host: {...}, regions: [...] },
 *   "metadata": {
 *     "layersDetected": ["host", "region", "location"],
 *     "totalNodes": 5,
 *     "hasMultipleRegions": false,
 *     "hasMultipleLocations": true
 *   }
 * }
 */
router.post('/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { userPrompt } = req.body;

  // Validation
  if (!userPrompt || typeof userPrompt !== 'string' || userPrompt.trim().length === 0) {
    return res.status(400).json({
      error: 'Invalid request',
      message: 'userPrompt is required and must be a non-empty string'
    });
  }

  // Get API key from request (added by mzooAuth middleware)
  const apiKey = (req as any).mzooApiKey;
  if (!apiKey) {
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'MZOO API key is required'
    });
  }

  try {
    // Analyze hierarchy
    const result = await analyzeHierarchy(userPrompt, apiKey);

    // Validate result
    if (!validateHierarchy(result.hierarchy)) {
      return res.status(500).json({
        error: 'Invalid hierarchy generated',
        message: 'The generated hierarchy structure is invalid'
      });
    }

    // Return successful result
    res.json(result);
  } catch (error: any) {
    console.error('[Hierarchy Analysis] Error:', error);
    res.status(500).json({
      error: 'Hierarchy analysis failed',
      message: error.message || 'Unknown error occurred'
    });
  }
}));

export default router;
