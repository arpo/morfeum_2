/**
 * SET_WEATHER Command Handler
 * 
 * Updates the weather on a host node.
 * No LLM calls needed - just a direct storage update.
 */

import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import { storageService } from '../../services/storage/storageService';

interface SetWeatherRequest {
  hostId: string;
  weather: string;
}

export const setWeatherHandler = asyncHandler(async (req: Request, res: Response) => {
  const { hostId, weather } = req.body as SetWeatherRequest;

  // Validation
  if (!hostId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: hostId'
    });
    return;
  }

  if (!weather || weather.trim().length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: weather'
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

  // Update the weather
  const previousWeather = host.weather;
  host.weather = weather.trim();

  // Save to storage
  await storageService.saveWorlds(worldsData);

  console.log(`[SET_WEATHER] Updated host "${host.name}" from "${previousWeather}" to "${weather}"`);

  res.status(HTTP_STATUS.OK).json({
    data: {
      message: 'Weather updated successfully',
      hostId,
      hostName: host.name,
      previousWeather,
      weather: host.weather
    }
  });
});
