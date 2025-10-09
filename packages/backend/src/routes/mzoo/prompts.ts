/**
 * MZOO Prompt Routes
 * Handles prompt retrieval and generation endpoints
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import { getPrompt } from '../../prompts';

const router = Router();

/**
 * Get chat system prompt
 */
router.get('/chat-system', asyncHandler(async (req: Request, res: Response) => {
  const systemMessage = getPrompt('chatSystemMessage', 'en');
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Chat system prompt retrieved successfully',
    data: {
      content: systemMessage
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Get chat system prompt with character impersonation
 */
router.post('/chat-system', asyncHandler(async (req: Request, res: Response) => {
  const { entityData } = req.body;

  if (!entityData || typeof entityData !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Entity data is required',
      error: 'Missing or invalid entityData in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const systemMessage = getPrompt('chatCharacterImpersonation', 'en')(entityData);
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Character impersonation prompt generated successfully',
    data: {
      content: systemMessage
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Get sample entity prompts
 */
router.get('/entity-samples', asyncHandler(async (req: Request, res: Response) => {
  const samples = getPrompt('sampleCharacterPrompts', 'en');
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Sample entity prompts retrieved successfully',
    data: {
      samples
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * Get sample location prompts
 */
router.get('/location-samples', asyncHandler(async (req: Request, res: Response) => {
  const samples = getPrompt('sampleLocationPrompts', 'en');
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Sample location prompts retrieved successfully',
    data: {
      samples
    },
    timestamp: new Date().toISOString(),
  });
}));

export { router as promptsRouter };
