/**
 * MZOO API routes - External API integrations
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../config';
import { asyncHandler } from '../middleware';
import { validateMzooApiKey } from '../middleware/mzooAuth';
import * as mzooService from '../services/mzoo.service';
import { getPrompt } from '../prompts';

const router = Router();

// Apply MZOO API key validation to all routes
router.use(validateMzooApiKey);

/**
 * Get chat system prompt
 */
router.get('/prompts/chat-system', asyncHandler(async (req: Request, res: Response) => {
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
router.post('/prompts/chat-system', asyncHandler(async (req: Request, res: Response) => {
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
router.get('/prompts/entity-samples', asyncHandler(async (req: Request, res: Response) => {
  const samples = getPrompt('sampleEntityPrompts', 'en');
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Sample entity prompts retrieved successfully',
    data: {
      samples
    },
    timestamp: new Date().toISOString(),
  });
}));

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
 * MZOO Entity seed generation endpoint
 */
router.post('/entity/generate-seed', asyncHandler(async (req: Request, res: Response) => {
  const { textPrompt } = req.body;

  if (!textPrompt || typeof textPrompt !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Text prompt is required',
      error: 'Missing or invalid textPrompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const systemPrompt = getPrompt('entitySeedGeneration', 'en')(textPrompt);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: textPrompt }
  ];

  const result = await mzooService.generateText(
    (req as any).mzooApiKey, 
    messages, 
    'gemini-2.5-flash-lite'
  );
  
  if (result.error) {
    res.status(result.status).json({
      message: 'Failed to generate entity seed from MZOO API',
      error: result.error,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  // Try to parse the JSON response
  let parsedData;
  try {
    // Extract JSON from the text response if it's wrapped in code blocks or text
    const jsonMatch = result.data.text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedData = JSON.parse(jsonMatch[0]);
    } else {
      throw new Error('No JSON found in response');
    }
  } catch (parseError) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to parse entity seed JSON',
      error: 'Response was not valid JSON',
      rawResponse: result.data.text,
      timestamp: new Date().toISOString(),
    });
    return;
  }
  
  res.status(HTTP_STATUS.OK).json({
    message: 'Entity seed generated successfully',
    data: parsedData,
    timestamp: new Date().toISOString(),
  });
}));

/**
 * MZOO Entity image generation endpoint
 */
router.post('/entity/generate-image', asyncHandler(async (req: Request, res: Response) => {
  const { originalPrompt, name, looks, wearing, personality, presence, setting } = req.body;

  if (!originalPrompt || !name || !looks || !wearing) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Original prompt, name, looks, and wearing fields are required',
      error: 'Missing required fields in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const imagePrompt = getPrompt('entityImageGeneration', 'en')(originalPrompt, name, looks, wearing, personality, presence, setting);

  // console.log('=== IMAGE GENERATION PROMPT ===');
  // console.log(imagePrompt);
  // console.log('==============================');

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
router.post('/entity/analyze-image', asyncHandler(async (req: Request, res: Response) => {
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
    const analysisPrompt = getPrompt('visualAnalysis', 'en')(name, looks, wearing, personality, presence);

    // Call vision API with the analysis prompt
    const visionResult = await mzooService.analyzeImage(
      (req as any).mzooApiKey,
      base64Image,
      analysisPrompt,
      'image/jpeg',
      'gemini-2.5-flash'
    );

    if (visionResult.error) {
      res.status(visionResult.status).json({
        message: 'Failed to analyze image from MZOO API',
        error: visionResult.error,
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

/**
 * MZOO Entity deep profile enrichment endpoint
 */
router.post('/entity/enrich-profile', asyncHandler(async (req: Request, res: Response) => {
  const { seedData, visualAnalysis } = req.body;

  if (!seedData || !visualAnalysis) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Seed data and visual analysis are required',
      error: 'Missing required parameters in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  try {
    // Convert data to JSON strings for the prompt
    const seedJson = JSON.stringify(seedData, null, 2);
    const visionJson = JSON.stringify(visualAnalysis, null, 2);

    // Get the deep profile enrichment prompt
    const enrichmentPrompt = getPrompt('deepProfileEnrichment', 'en')(seedJson, visionJson);

    // Call Gemini with the enrichment prompt
    const messages = [
      { role: 'system', content: enrichmentPrompt },
      { role: 'user', content: 'Generate the complete character profile based on the provided data.' }
    ];

    const result = await mzooService.generateText(
      (req as any).mzooApiKey,
      messages,
      'gemini-2.5-flash'
    );

    if (result.error) {
      res.status(result.status).json({
        message: 'Failed to generate deep profile from MZOO API',
        error: result.error,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    // Parse the response text to extract JSON
    const responseText = result.data.text;
    
    let profile;
    try {
      // Extract JSON from the text response (same as seed generation)
      const jsonMatch = responseText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        profile = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No JSON found in response');
      }
    } catch (parseError) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        message: 'Failed to parse deep profile JSON',
        error: 'Response was not valid JSON',
        rawResponse: responseText,
        timestamp: new Date().toISOString(),
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      message: 'Deep profile enrichment completed successfully',
      data: profile,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      message: 'Failed to process profile enrichment',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
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
