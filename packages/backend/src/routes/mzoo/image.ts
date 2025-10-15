/**
 * MZOO Entity Image Routes
 * Handles entity image generation and analysis
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import * as mzooService from '../../services/mzoo';
import { getPrompt } from '../../prompts';

const router = Router();

/**
 * MZOO Entity image generation endpoint
 */
router.post('/generate-image', asyncHandler(async (req: Request, res: Response) => {
  const { originalPrompt, name, looks, wearing, personality, presence, setting, filterName } = req.body;

  if (!originalPrompt || !name || !looks || !wearing) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Original prompt, name, looks, and wearing fields are required',
      error: 'Missing required fields in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const imagePrompt = getPrompt('characterImageGeneration', 'en')(originalPrompt, name, looks, wearing, personality, presence, setting, filterName);

  const imageResult = await mzooService.generateImage(
    (req as any).mzooApiKey,
    imagePrompt,
    1,
    'landscape_16_9',
    'high'
  );

  if (imageResult.error) {
    res.status(imageResult.status).json({
      message: 'Failed to generate image from MZOO API',
      error: imageResult.error,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  // Extract the image URL from the nested structure
  const imageUrl = imageResult.data?.images?.[0]?.url;

  if (!imageUrl) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Image URL not found in response',
      error: 'Invalid image data structure',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  res.status(HTTP_STATUS.OK).json({
    message: 'Entity image generated successfully',
    data: {
      imageUrl
    },
    timestamp: new Date().toISOString(),
  });
}));

/**
 * MZOO Entity visual analysis endpoint
 */
router.post('/analyze-image', asyncHandler(async (req: Request, res: Response) => {
  const { imageUrl, name, looks, wearing, personality, presence } = req.body;

  if (!imageUrl || !name || !looks || !wearing || !personality) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Image URL, name, looks, wearing, and personality fields are required',
      error: 'Missing required parameters in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // Fetch the image from the URL
    const imageResponse = await fetch(imageUrl);
    if (!imageResponse.ok) {
      res.status(HTTP_STATUS.BAD_REQUEST).json({
        message: 'Failed to fetch image from URL',
        error: `HTTP error! status: ${imageResponse.status}`,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Convert image to base64
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    // Get the visual analysis prompt
    const analysisPrompt = getPrompt('characterVisualAnalysis', 'en')(name, looks, wearing, personality, presence);

    // Call vision API with the analysis prompt
    const visionResult = await mzooService.analyzeImage(
      (req as any).mzooApiKey,
      base64Image,
      analysisPrompt,
      'image/jpeg',
      'gemini-2.5-flash'
    );

    if (visionResult.error || !visionResult.data) {
      res.status(visionResult.status).json({
        message: 'Failed to analyze image from MZOO API',
        error: visionResult.error || 'No data returned',
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Parse the JSON response from vision API
    const visionResponseText = visionResult.data.text;
    
    let parsedAnalysis;
    try {
      const jsonMatch = visionResponseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedAnalysis = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to parse visual analysis JSON',
        error: 'Response was not valid JSON',
        rawResponse: visionResponseText,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Visual analysis completed successfully',
      data: parsedAnalysis,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to process image analysis',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}));

export { router as imageRouter };
