/**
 * Spawn API routes - Entity generation pipeline management
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { asyncHandler } from '../middleware';
import { validateMzooApiKey } from '../middleware/mzooAuth';
import { createSpawnManager, SpawnProcess } from '../services/spawn';
import { eventEmitter } from '../services/eventEmitter';
import { generateText } from '../services/mzoo.service';
import { getPrompt } from '../prompts';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

// Store spawn managers per API key (in production, consider a more robust solution)
const spawnManagers = new Map<string, ReturnType<typeof createSpawnManager>>();

/**
 * Get or create spawn manager for the current API key
 */
function getSpawnManager(apiKey: string): ReturnType<typeof createSpawnManager> {
  if (!spawnManagers.has(apiKey)) {
    spawnManagers.set(apiKey, createSpawnManager(apiKey));
  }
  return spawnManagers.get(apiKey)!;
}

/**
 * SSE endpoint - Server-Sent Events stream for spawn updates
 */
router.get('/events', (req: Request, res: Response) => {
  // Set SSE headers
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no'); // Disable buffering in nginx

  // Generate client ID
  const clientId = `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  // Register client
  eventEmitter.addClient(clientId, res);

  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`);

  // Handle client disconnect
  req.on('close', () => {
    eventEmitter.removeClient(clientId);
    res.end();
  });
});

/**
 * POST /api/spawn/start - Start a new spawn process
 */
router.post('/start', asyncHandler(async (req: Request, res: Response) => {
  const { prompt, entityType = 'character', movementContext } = req.body;

  console.log('[spawn/start] Received spawn request:', {
    prompt,
    entityType,
    hasMovementContext: !!movementContext,
    movementContext: movementContext ? {
      movementType: movementContext.movementType,
      currentLocationName: movementContext.currentLocationName,
      hasWorldInfo: !!movementContext.worldInfo,
      hasLocationInfo: !!movementContext.locationInfo,
      worldInfoKeys: movementContext.worldInfo ? Object.keys(movementContext.worldInfo) : [],
      locationInfoKeys: movementContext.locationInfo ? Object.keys(movementContext.locationInfo) : []
    } : null
  });

  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid prompt is required',
      error: 'Missing or invalid prompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (entityType !== 'character' && entityType !== 'location') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Invalid entity type',
      error: 'entityType must be either "character" or "location"',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spawnManager = getSpawnManager((req as any).mzooApiKey);
  const spawnId = spawnManager.startSpawn(prompt.trim(), entityType, movementContext);

  res.status(HTTP_STATUS.OK).json({
    message: 'Spawn process started',
    data: { spawnId, entityType },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * DELETE /api/spawn/:spawnId - Cancel a spawn process
 */
router.delete('/:spawnId', asyncHandler(async (req: Request, res: Response) => {
  const { spawnId } = req.params;

  if (!spawnId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Spawn ID is required',
      error: 'Missing spawnId in URL parameters',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const spawnManager = getSpawnManager((req as any).mzooApiKey);
  spawnManager.cancelSpawn(spawnId);

  res.status(HTTP_STATUS.OK).json({
    message: 'Spawn process cancelled',
    data: { spawnId },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * GET /api/spawn/active - Get all active spawn processes
 */
router.get('/active', asyncHandler(async (req: Request, res: Response) => {
  const spawnManager = getSpawnManager((req as any).mzooApiKey);
  const activeProcesses = spawnManager.getActiveProcesses();

  res.status(HTTP_STATUS.OK).json({
    message: 'Active spawn processes retrieved',
    data: {
      count: activeProcesses.length,
      processes: activeProcesses.map((p: SpawnProcess) => ({
        id: p.id,
        prompt: p.prompt,
        status: p.status,
        createdAt: p.createdAt
      }))
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * POST /api/spawn/classify-movement - Classify user movement intent
 */
router.post('/classify-movement', asyncHandler(async (req: Request, res: Response) => {
  const { userCommand, currentLocationName, knownLocationNames } = req.body;

  if (!userCommand || typeof userCommand !== 'string' || !userCommand.trim()) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid user command is required',
      error: 'Missing or invalid userCommand in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  if (!currentLocationName || typeof currentLocationName !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Valid current location name is required',
      error: 'Missing or invalid currentLocationName in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Get movement classification prompt
  const movementClassificationPrompt = getPrompt('movementClassification');
  const prompt = movementClassificationPrompt(
    userCommand.trim(),
    currentLocationName,
    knownLocationNames || 'None listed'
  );

  // Call Gemini to classify movement
  const result = await generateText(
    (req as any).mzooApiKey,
    [{ role: 'user', content: prompt }],
    'gemini-2.5-flash-lite'
  );

  if (result.error || !result.data) {
    res.status(result.status || HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Movement classification failed',
      error: result.error || 'No response from AI',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Extract and validate movement type
  // Handle both string and object responses
  let responseText = '';
  if (typeof result.data === 'string') {
    responseText = result.data;
  } else if (result.data && typeof result.data === 'object') {
    // If it's an object, try to get text from common properties
    responseText = result.data.text || result.data.content || JSON.stringify(result.data);
  } else {
    responseText = String(result.data || '');
  }

  const movementType = responseText.trim().toLowerCase();
  const validTypes = ['descend', 'ascend', 'traverse', 'jump'];

  if (!validTypes.includes(movementType)) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Invalid movement classification',
      error: `AI returned invalid type: "${movementType}" from response: ${responseText}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Movement classified successfully',
    data: { movementType },
    timestamp: new Date().toISOString(),
  });
}));

export { router as spawnRouter };
