/**
 * Events Handler
 * GET /api/mzoo/navigation/events/:navigationId
 * SSE Stream for navigation events
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import { sseService } from '../../../services/SSEService';
import { pipelineConfigs } from '../navigation';

export async function eventsHandler(req: Request, res: Response): Promise<void> {
  const { navigationId } = req.params;
  
  if (!navigationId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Navigation ID is required',
    });
    return;
  }

  // Get pipeline config if available
  const config = pipelineConfigs.get(navigationId);
  
  sseService.addConnection(navigationId, res, config);
}
