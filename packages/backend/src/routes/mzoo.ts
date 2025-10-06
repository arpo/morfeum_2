/**
 * MZOO API routes - External API integrations
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { asyncHandler } from '../middleware';

const router = Router();

/**
 * MZOO Gemini text generation endpoint
 */
router.post('/gemini/text', asyncHandler(async (req: Request, res: Response) => {
  const MZOO_API_KEY = process.env.MZOO_API_KEY;
  
  if (!MZOO_API_KEY) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'MZOO API key not configured',
      error: 'Missing MZOO_API_KEY environment variable',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const { messages, model = 'gemini-2.5-flash' } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Messages array is required',
      error: 'Missing or invalid messages in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Format messages array into a single prompt with conversation history
  const prompt = messages.map((msg: any) => {
    const role = msg.role === 'system' ? 'System' : msg.role === 'user' ? 'User' : 'Assistant';
    return `${role}: ${msg.content}`;
  }).join('\n\n');

  const response = await fetch('https://www.mzoo.app/api/v1/ai/gemini/text', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MZOO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      model
    })
  });
  
  if (!response.ok) {
    res.status(response.status).json({
      message: 'Failed to generate text from MZOO API',
      error: `HTTP error! status: ${response.status}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  const data = await response.json();
  res.status(HTTP_STATUS.OK).json({
    message: 'Text generated successfully',
    data: data.data,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * MZOO Vision API endpoint - Analyzes images
 */
router.post('/vision', asyncHandler(async (req: Request, res: Response) => {
  const MZOO_API_KEY = process.env.MZOO_API_KEY;
  
  if (!MZOO_API_KEY) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'MZOO API key not configured',
      error: 'Missing MZOO_API_KEY environment variable',
      timestamp: new Date().toISOString(),
    });
    return;
  }

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

  const response = await fetch('https://www.mzoo.app/api/v1/ai/vision', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MZOO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      image: {
        mimeType,
        data: base64Image
      }
    })
  });
  
  if (!response.ok) {
    res.status(response.status).json({
      message: 'Failed to analyze image from MZOO API',
      error: `HTTP error! status: ${response.status}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  const data = await response.json();
  res.status(HTTP_STATUS.OK).json({
    message: 'Image analyzed successfully',
    data: data.data,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * MZOO FAL Flux image generation endpoint
 */
router.post('/fal-flux-srpo/generate', asyncHandler(async (req: Request, res: Response) => {
  const MZOO_API_KEY = process.env.MZOO_API_KEY;
  
  if (!MZOO_API_KEY) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'MZOO API key not configured',
      error: 'Missing MZOO_API_KEY environment variable',
      timestamp: new Date().toISOString(),
    });
    return;
  }

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

  const response = await fetch('https://www.mzoo.app/api/v1/ai/fal-flux-srpo/generate', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${MZOO_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      prompt,
      num_images,
      image_size,
      acceleration
    })
  });
  
  if (!response.ok) {
    res.status(response.status).json({
      message: 'Failed to generate image from MZOO API',
      error: `HTTP error! status: ${response.status}`,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  const data = await response.json();
  res.status(HTTP_STATUS.OK).json({
    message: 'Image generated successfully',
    data: data.data,
    timestamp: new Date().toISOString(),
  });
}));

export { router as mzooRouter };
