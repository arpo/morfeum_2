/**
 * SSE Events Handler
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { sseService } from '../../services/SSEService';
import { pipelineConfigs } from '../utils/routeUtils';
import { displayPipelineConfigs } from '../display';

export const eventsHandler = asyncHandler(async (req: Request, res: Response) => {
  const { operationId } = req.params;

  // Get stored pipeline config - check both local and display configs
  const config = pipelineConfigs.get(operationId) || displayPipelineConfigs.get(operationId);

  // Set up SSE connection
  sseService.addConnection(operationId, res, config);
});
