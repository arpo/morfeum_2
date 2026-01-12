/**
 * SET_TIME Command Handler
 * 
 * Updates the timeOfDay on a host node.
 * No LLM calls needed - just a direct storage update.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import { storageService } from '../../services/storage/storageService';
import type { TimeOfDay } from '../types';

const VALID_TIME_OF_DAY: TimeOfDay[] = [
  'pre_dawn', 'dawn', 'morning', 'midday', 'afternoon',
  'golden_hour', 'sunset', 'dusk', 'night', 'midnight'
];

interface SetTimeRequest {
  hostId: string;
  timeOfDay: TimeOfDay;
}

export const setTimeHandler = asyncHandler(async (req: Request, res: Response) => {
  const { hostId, timeOfDay } = req.body as SetTimeRequest;

  // Validation
  if (!hostId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: hostId'
    });
    return;
  }

  if (!timeOfDay) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: timeOfDay'
    });
    return;
  }

  if (!VALID_TIME_OF_DAY.includes(timeOfDay)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Invalid timeOfDay. Must be one of: ${VALID_TIME_OF_DAY.join(', ')}`
    });
    return;
  }

  // Load worlds data
  const worldsData = await storageService.loadWorlds();
  if (!worldsData) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      error: 'No worlds data found'
    });
    return;
  }

  // Find the host node
  const host = worldsData.nodes[hostId];
  if (!host) {
    res.status(HTTP_STATUS.NOT_FOUND).json({
      error: `Host not found: ${hostId}`
    });
    return;
  }

  if (host.type !== 'host') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Node ${hostId} is not a host node (type: ${host.type})`
    });
    return;
  }

  // Update the time
  const previousTime = host.timeOfDay;
  host.timeOfDay = timeOfDay;

  // Save to storage
  await storageService.saveWorlds(worldsData);

  console.log(`[SET_TIME] Updated host "${host.name}" from ${previousTime} to ${timeOfDay}`);

  res.status(HTTP_STATUS.OK).json({
    data: {
      message: 'Time of day updated successfully',
      hostId,
      hostName: host.name,
      previousTimeOfDay: previousTime,
      timeOfDay
    }
  });
});
