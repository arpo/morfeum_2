/**
 * MZOO API routes - External API integrations
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { asyncHandler } from '../middleware';
import { validateMzooApiKey } from '../middleware/mzooAuth';
import * as mzooService from '../services/mzoo.service';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

/**
 * MZOO Gemini text generation endpoint
 */
router.post('/gemini/text', asyncHandler(async (req: Request, res: Response) => {
  const { messages, model = 'gemini-2.5-flash' } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Messages array is required',
      error: 'Missing or invalid messages in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = await mzooService.generateText((req as any).mzooApiKey, messages, model);
  
  if (result.error) {
    res.status(result.status).json({
      message: 'Failed to generate text from MZOO API',
      error: result.error,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Text generated successfully',
    data: result.data,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * MZOO Vision API endpoint - Analyzes images
 */
router.post('/vision', asyncHandler(async (req: Request, res: Response) => {
  const { 
    base64Image, 
    mimeType = 'image/png',
    model = 'gemini-2.5-flash'
  } = req.body;

  if (!base64Image) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Base64 image data is required',
      error: 'Missing base64Image in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = await mzooService.analyzeImage((req as any).mzooApiKey, base64Image, mimeType, model);
  
  if (result.error) {
    res.status(result.status).json({
      message: 'Failed to analyze image from MZOO API',
      error: result.error,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Image analyzed successfully',
    data: result.data,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * MZOO FAL Flux image generation endpoint
 */
router.post('/fal-flux-srpo/generate', asyncHandler(async (req: Request, res: Response) => {
  const { 
    prompt, 
    num_images = 1, 
    image_size = 'landscape_16_9', 
    acceleration = 'high' 
  } = req.body;

  if (!prompt) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Prompt is required',
      error: 'Missing prompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const result = await mzooService.generateImage((req as any).mzooApiKey, prompt, num_images, image_size, acceleration);
  
  if (result.error) {
    res.status(result.status).json({
      message: 'Failed to generate image from MZOO API',
      error: result.error,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Image generated successfully',
    data: result.data,
    timestamp: new Date().toISOString(),
  });
}));

export { router as mzooRouter };
