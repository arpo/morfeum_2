/**
 * MZOO Entity Profile Routes
 * Handles entity deep profile enrichment
 */

import { Router, Request, Response } from 'express';
import { HTTP_STATUS } from '../../config';
import { asyncHandler } from '../../middleware';
import * as mzooService from '../../services/mzoo.service';
import { getPrompt } from '../../prompts';

const router = Router();

/**
 * MZOO Entity deep profile enrichment endpoint
 */
router.post('/enrich-profile', asyncHandler(async (req: Request, res: Response) => {
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

export { router as profileRouter };
