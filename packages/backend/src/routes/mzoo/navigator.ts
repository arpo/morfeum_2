/**
 * NavigatorAI Routes
 * Semantic navigation endpoints
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import * as navigatorService from '../../services/navigator.service';

const router = Router();

interface NavigationRequest {
  userCommand: string;
  currentFocus: {
    node_id: string;
    perspective: string;
    viewpoint: string;
    distance: string;
  };
  allNodes: Array<{
    id: string;
    name: string;
    dna: any;
    depth_level: number;
    parent_location_id: string | null;
  }>;
}

/**
 * POST /api/mzoo/navigator/find-destination
 * Find destination node using semantic search
 */
router.post('/find-destination', asyncHandler(async (req: Request, res: Response) => {
  const { userCommand, currentFocus, allNodes }: NavigationRequest = req.body;

  // Validation
  if (!userCommand || !currentFocus || !allNodes) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: userCommand, currentFocus, allNodes'
    });
    return;
  }

  if (!currentFocus.node_id || !currentFocus.perspective) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid focus state: node_id and perspective required'
    });
    return;
  }

  if (!Array.isArray(allNodes)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'allNodes must be an array'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  // Call navigator service
  const result = await navigatorService.findDestinationNode(
    apiKey,
    userCommand,
    currentFocus,
    allNodes
  );

  if (result.error) {
    res.status(result.status).json({
      error: result.error
    });
    return;
  }

  res.status(HTTP_STATUS.OK).json({
    data: result.data
  });
}));

export { router as navigatorRouter };
