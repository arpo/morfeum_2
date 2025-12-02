/**
 * Navigation & Node Creation Routes
 * LLM-based intent classification + deterministic routing + slash commands
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import { NAVIGATION_COMMANDS, SLASH_COMMANDS, type NavigationCommand, type NodeType } from '../../config/navigation';
import { classifyIntent, routeNavigation, buildIntentFromCommand } from '../../engine/navigation';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../engine/navigation/pipelines/createNodePipeline';
import type { NavigationContext, NavigationAnalysisResult } from '../../engine/navigation';
import { sseService } from '../../services/SSEService';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { createNode } from '../../engine/nodeCreation/core/createNode';
import { createHierarchy } from '../../engine/nodeCreation/core/createHierarchy';

const router = Router();

// Track pipeline configurations for SSE initialization
const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

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
      
      // Store pipeline configuration for SSE initialization (BEFORE sending response)
      const steps = getStepsForPipeline('navigation');
      pipelineConfigs.set(navigationId, {
        pipelineType: 'navigation',
        steps: steps.map((step, index) => ({
          index,
          id: step.id,
          name: step.name,
          duration: step.duration
        }))
      });
      
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
        } finally {
          // Clean up config
          pipelineConfigs.delete(navigationId);
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
 * POST /api/mzoo/navigation/command
 * Execute a navigation command directly (without LLM classification)
 * Used for slash commands like /GO_INSIDE
 */
router.post('/command', asyncHandler(async (req: Request, res: Response) => {
  const { command, text, context }: { 
    command: string; 
    text?: string; 
    context: NavigationContext 
  } = req.body;

  // Validation
  if (!command || !context) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: command, context'
    });
    return;
  }

  // Validate command is a known navigation command
  if (!NAVIGATION_COMMANDS.includes(command as NavigationCommand)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Unknown navigation command: ${command}. Valid commands: ${NAVIGATION_COMMANDS.join(', ')}`
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
    // Build intent from command (no LLM call)
    const intent = buildIntentFromCommand(
      command as NavigationCommand,
      text || null,
      context.currentNode.type
    );

    // Route navigation using deterministic logic
    const decision = routeNavigation(intent, context);

    // Build response
    const result: NavigationAnalysisResult = {
      userCommand: `/${command}${text ? ' ' + text : ''}`,
      context,
      intent,
      decision
    };

    // Handle not implemented commands
    if (decision.action === 'not_implemented') {
      console.log(`[NAVIGATION] Command not implemented: ${command}`);
      res.status(HTTP_STATUS.OK).json({
        data: {
          ...result,
          notImplemented: true,
          message: decision.reasoning
        }
      });
      return;
    }

    // If decision is create_niche, return immediately and run pipeline asynchronously
    let navigationId: string | undefined;
    let eventsUrl: string | undefined;
    
    if (decision.action === 'create_niche') {
      navigationId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
      
      // Store pipeline configuration for SSE initialization
      const steps = getStepsForPipeline('navigation');
      pipelineConfigs.set(navigationId, {
        pipelineType: 'navigation',
        steps: steps.map((step, index) => ({
          index,
          id: step.id,
          name: step.name,
          duration: step.duration
        }))
      });
      
      // Return response immediately
      res.status(HTTP_STATUS.OK).json({
        data: {
          ...result,
          navigationId,
          eventsUrl
        }
      });

      // Run pipeline asynchronously
      (async () => {
        try {
          await runCreateNodePipeline(decision, context, intent, apiKey, undefined, navigationId);
        } catch (pipelineError) {
          console.error('[NAVIGATION COMMAND ERROR]', pipelineError);
        } finally {
          pipelineConfigs.delete(navigationId);
        }
      })();
      
      return;
    }

    // For non-pipeline actions, return standard response
    res.status(HTTP_STATUS.OK).json({
      data: result
    });
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Navigation command failed: ${error instanceof Error ? error.message : 'Unknown error'}`
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

  // Get pipeline config if available
  const config = pipelineConfigs.get(navigationId);
  
  sseService.addConnection(navigationId, res, config);
}));

/**
 * POST /api/mzoo/navigation/create-node
 * Create a new node via slash command (/new-host, /new-region, /new-location, /new-niche)
 */
router.post('/create-node', asyncHandler(async (req: Request, res: Response) => {
  const { command, description, parentId, flags } = req.body as {
    command: string;
    description?: string;
    parentId?: string;
    flags: { createImage: boolean; backgroundTask: boolean };
  };

  // Validation
  if (!command) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: command'
    });
    return;
  }

  // Map command to node type
  const commandToNodeType: Record<string, NodeType> = {
    NEW_HOST: 'host',
    NEW_REGION: 'region',
    NEW_LOCATION: 'location',
    NEW_NICHE: 'niche'
  };

  const nodeType = commandToNodeType[command];
  if (!nodeType) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Invalid command: ${command}. Valid commands: ${Object.keys(commandToNodeType).join(', ')}`
    });
    return;
  }

  // Validate parent requirement
  if (nodeType !== 'host' && !parentId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `${command} requires a parent node. Select a ${nodeType === 'region' ? 'host' : nodeType === 'location' ? 'region' : 'location'} first.`
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  // Generate unique operation ID
  const operationId = `node-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${operationId}`;

  console.log(`\n🚀 [CREATE-NODE] Starting ${command} pipeline...`);
  console.log(`[CREATE-NODE] Operation ID: ${operationId}`);
  console.log(`[CREATE-NODE] Description: ${description || '(auto-generated)'}`);
  console.log(`[CREATE-NODE] Parent ID: ${parentId || '(root)'}`);
  console.log(`[CREATE-NODE] Flags: createImage=${flags.createImage}, bgtask=${flags.backgroundTask}`);

  // Store pipeline configuration for SSE initialization
  const steps = getStepsForPipeline('navigation');
  pipelineConfigs.set(operationId, {
    pipelineType: 'navigation',
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });

  // Return response immediately
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      command,
      nodeType
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // Send progress event
      sseService.sendEvent(operationId, 'progress', {
        stage: 'prompt_generation',
        message: `Creating ${nodeType}...`
      });

      const result = await createNode(
        nodeType,
        description || `New ${nodeType}`,
        {
          apiKey,
          parentId,
          createImage: flags.createImage
        }
      );

      console.log(`✅ [CREATE-NODE] Pipeline complete. Node: ${result.node?.name || 'unknown'}`);
      
      // Send completion event
      sseService.sendEvent(operationId, 'completed', {
        message: 'Node created successfully',
        node: result.node,
        imageUrl: result.imageUrl
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
    } catch (error) {
      console.error(`\n❌ [CREATE-NODE ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create node'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}));

/**
 * POST /api/mzoo/navigation/create-image
 * Generate image for an existing node via /create-image command
 */
router.post('/create-image', asyncHandler(async (req: Request, res: Response) => {
  const { nodeId, flags } = req.body as {
    nodeId: string;
    flags: { createImage: boolean; backgroundTask: boolean };
  };

  // Validation
  if (!nodeId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required field: nodeId'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  // Generate unique operation ID
  const operationId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${operationId}`;

  console.log(`\n🖼️ [CREATE-IMAGE] Starting image generation pipeline...`);
  console.log(`[CREATE-IMAGE] Operation ID: ${operationId}`);
  console.log(`[CREATE-IMAGE] Node ID: ${nodeId}`);

  // Store pipeline configuration for SSE initialization
  const steps = [
    { id: 'generate', name: 'Generating image', duration: 8000 },
    { id: 'save', name: 'Saving media', duration: 2000 }
  ];
  pipelineConfigs.set(operationId, {
    pipelineType: 'imageGeneration',
    steps: steps.map((step, index) => ({
      index,
      id: step.id,
      name: step.name,
      duration: step.duration
    }))
  });

  // Return response immediately
  res.status(HTTP_STATUS.OK).json({
    data: {
      operationId,
      eventsUrl,
      nodeId
    }
  });

  // Run pipeline asynchronously
  (async () => {
    try {
      // TODO: Implement image generation for existing node
      // This will need to:
      // 1. Load node from storage
      // 2. Generate image prompt from node DNA
      // 3. Call FLUX API
      // 4. Save media and update node

      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
        message: 'Generating image...'
      });

      // For now, return a placeholder error since the full implementation 
      // requires loading node data and image generation
      throw new Error('CREATE_IMAGE command not fully implemented yet. Use /new-* commands with --create-image flag instead.');

    } catch (error) {
      console.error(`\n❌ [CREATE-IMAGE ERROR]`, error);
      sseService.sendEvent(operationId, 'error', {
        message: error instanceof Error ? error.message : 'Failed to create image'
      });
      sseService.closeConnection(operationId);
    } finally {
      pipelineConfigs.delete(operationId);
    }
  })();
}));

export { router as navigationRouter };
