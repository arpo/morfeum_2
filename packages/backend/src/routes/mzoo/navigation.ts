/**
 * Navigation Analysis Routes
 * LLM-based intent classification + deterministic routing
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import { classifyIntent, routeNavigation } from '../../engine/navigation';
import { runCreateNichePipeline } from '../../engine/navigation/pipelines/createNicheNodePipeline';
import type { NavigationContext, NavigationAnalysisResult } from '../../engine/navigation';

const router = Router();

/**
 * POST /api/mzoo/navigation/analyze
 * Analyze user's navigation command using LLM + deterministic routing
 */
router.post('/analyze', asyncHandler(async (req: Request, res: Response) => {
  const { userCommand, context }: { userCommand: string; context: NavigationContext } = req.body;

  // Validation
  if (!userCommand || !context) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: userCommand, context'
    });
    return;
  }

  if (!context.currentNode || !context.currentNode.id || !context.currentNode.type) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Invalid context: currentNode with id and type required'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  try {
    // Step 1: Classify intent using LLM (with optional context)
    const intent = await classifyIntent(
      apiKey,
      userCommand,
      context.currentNode.type,
      context.currentNode.name,
      context.currentNode.data.navigableElements,
      context.currentNode.data.dominantElements,
      context.currentNode.data.description,
      context.currentNode.data.searchDesc
    );

    // Step 2: Route navigation using deterministic logic
    const decision = routeNavigation(intent, context);

    // Step 3: If decision is create_niche, run image generation pipeline
    let imageUrl: string | undefined;
    let imagePrompt: string | undefined;
    let node: any | undefined;
    
    if (decision.action === 'create_niche') {
      console.log('\n🚀 [NAVIGATION] Running create_niche pipeline...');
      try {
        const pipelineResult = await runCreateNichePipeline(decision, context, intent, apiKey);
        imageUrl = pipelineResult.imageUrl;
        imagePrompt = pipelineResult.imagePrompt;
        node = pipelineResult.node;
        console.log('✅ [NAVIGATION] Pipeline complete. Node created:', !!node);
      } catch (pipelineError) {
        console.error('\n❌ [NAVIGATION ERROR]', pipelineError);
        // Continue without image - don't fail the whole request
      }
    }

    // Step 4: Build complete response for frontend
    const result: NavigationAnalysisResult = {
      userCommand,
      context,
      intent,
      decision
    };

    // Return everything including optional image and node
    console.log('\n📤 [NAVIGATION] Returning response. Node included:', !!node ? '✓' : '✗');
    res.status(HTTP_STATUS.OK).json({
      data: {
        ...result,
        imageUrl,
        imagePrompt,
        node
      }
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Navigation analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return;
  }
}));

export { router as navigationRouter };
