/**
 * MZOO Entity Seed Routes
 * Handles entity seed generation
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import * as mzooService from '../../services/mzoo.service';
import { getPrompt } from '../../prompts';

const router = Router();

/**
 * MZOO Entity seed generation endpoint
 */
router.post('/generate-seed', asyncHandler(async (req: Request, res: Response) => {
  const { textPrompt } = req.body;

  if (!textPrompt || typeof textPrompt !== 'string') {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Text prompt is required',
      error: 'Missing or invalid textPrompt in request body',
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const systemPrompt = getPrompt('characterSeedGeneration', 'en')(textPrompt);

  const messages = [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: textPrompt }
  ];

  const result = await mzooService.generateText(
    (req as any).mzooApiKey, 
    messages, 
    'gemini-2.5-flash-lite'
  );
  
  if (result.error || !result.data) {
    res.status(result.status).json({
      message: 'Failed to generate entity seed from MZOO API',
      error: result.error || 'No data returned',
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

export { router as seedRouter };
