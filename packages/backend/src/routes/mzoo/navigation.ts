/**
 * Navigation Analysis Routes
 * LLM-based intent classification + deterministic routing
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import { classifyIntent, routeNavigation } from '../../engine/navigation';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../engine/navigation/pipelines/createNodePipeline';
import type { NavigationContext, NavigationAnalysisResult } from '../../engine/navigation';
import { sseService } from '../../services/SSEService';

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

    // Step 3: Build response for frontend
    const result: NavigationAnalysisResult = {
      userCommand,
      context,
      intent,
      decision
    };

    // Step 4: If decision is create_niche, return immediately and run pipeline asynchronously
    let navigationId: string | undefined;
    let eventsUrl: string | undefined;
    
    if (decision.action === 'create_niche') {
      // Generate unique navigation ID
      navigationId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
      
      console.log('\n🚀 [NAVIGATION] Starting create_niche pipeline...');
      console.log(`[NAVIGATION] Navigation ID: ${navigationId}`);
      console.log(`[NAVIGATION] Events URL: ${eventsUrl}`);
      
      // Return response immediately
      res.status(HTTP_STATUS.OK).json({
        data: {
          ...result,
          navigationId,
          eventsUrl
        }
      });

      // Run pipeline asynchronously (don't await) - results sent via SSE
      (async () => {
        try {
          const pipelineResult = await runCreateNodePipeline(decision, context, intent, apiKey, undefined, navigationId);
          console.log('✅ [NAVIGATION] Pipeline complete. Node created:', !!pipelineResult.node);
          
          // Results are already sent via SSE events in the pipeline
          // The completed event includes the node data
        } catch (pipelineError) {
          console.error('\n❌ [NAVIGATION ERROR]', pipelineError);
          // Error already sent via SSE in pipeline
        }
      })();
      
      return; // Exit early since we already sent response
    }

    // For non-pipeline actions, return standard response
    res.status(HTTP_STATUS.OK).json({
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Navigation analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
    return;
  }
}));

/**
 * GET /api/mzoo/navigation/events/:navigationId - SSE Stream for navigation events
 */
router.get('/events/:navigationId', asyncHandler(async (req: Request, res: Response) => {
  const { navigationId } = req.params;
  
  if (!navigationId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      message: 'Navigation ID is required',
    });
    return;
  }

  sseService.addConnection(navigationId, res);
}));

export { router as navigationRouter };
