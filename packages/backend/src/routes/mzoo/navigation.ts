/**
 * Navigation & Node Creation Routes
 * LLM-based intent classification + deterministic routing + slash commands
 */

import { Router, Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS } from '../../config';
import { NAVIGATION_COMMANDS, SLASH_COMMANDS, type NavigationCommand, type NodeType } from '../../config/navigation';
import { classifyIntent, routeNavigation, buildIntentFromCommand, analyzeDestination } from '../../engine/navigation';
import type { RouteOptions } from '../../engine/navigation';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../engine/navigation/pipelines/createNodePipeline';
import { runCreateCharacterPipeline } from '../../engine/navigation/pipelines/createCharacterPipeline';
import { findParentLocationNode } from '../../engine/navigation/navigationHelpers';
import type { NavigationContext, NavigationAnalysisResult } from '../../engine/navigation';
import { sseService } from '../../services/SSEService';
import { getStepsForPipeline } from '../../engine/pipelines/shared/pipelineConfig';
import { createNode } from '../../engine/nodeCreation/core/createNode';
import { createHierarchy } from '../../engine/nodeCreation/core/createHierarchy';
import { extractParentDNAContext } from '../../engine/nodeCreation/core/dnaInheritance';
import { storageService } from '../../services/storage/storageService';
import { generateImage } from '../../services/mzoo';
import { getNodeImagePrompt } from '../../engine/nodeCreation/prompts/image';
import mediaService from '../../services/media/mediaService';

const router = Router();

// Track pipeline configurations for SSE initialization
const pipelineConfigs = new Map<string, { pipelineType: string; steps: any[] }>();

/**
 * Parse command flags from text (e.g., --furnish)
 * @param text - The text after the command
 * @returns Object with cleanText (flags removed) and flag values
 */
function parseCommandFlags(text: string | undefined): { 
  cleanText: string | undefined; 
  includeFurnishing: boolean;
} {
  if (!text) {
    return { cleanText: undefined, includeFurnishing: false };
  }
  
  const includeFurnishing = /--furnish\b/i.test(text);
  const cleanText = text.replace(/--furnish\b/gi, '').trim() || undefined;
  
  return { cleanText, includeFurnishing };
}

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

  // Block commands on pass-through regions
  if (context.currentNode.data?.isPassThrough) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Commands cannot be run on pass-through regions. Navigate to a location first.'
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  try {
    // Parse flags from text FIRST (e.g., --furnish) - before building intent
    const { cleanText, includeFurnishing } = parseCommandFlags(text);
    
    // Build intent from command with CLEAN text (flags removed)
    const intent = buildIntentFromCommand(
      command as NavigationCommand,
      cleanText || null,
      context.currentNode.type
    );

    // For GOTO: Send response immediately, run analysis in pipeline
    if (command === 'GOTO' && cleanText) {
      console.log(`[GOTO DEBUG] Raw text received: "${text}"`);
      console.log(`[GOTO DEBUG] Parsed: cleanText="${cleanText}", includeFurnishing=${includeFurnishing}`);
      
      const navigationId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
      
      // Get parent location for sibling niche creation (not current niche)
      const { parentLocationId } = findParentLocationNode(context);
      
      // Use navigationGoto pipeline type (includes destination_analysis step)
      const steps = getStepsForPipeline('navigationGoto');
      pipelineConfigs.set(navigationId, {
        pipelineType: 'navigationGoto',
        steps: steps.map((step, index) => ({
          index,
          id: step.id,
          name: step.name,
          duration: step.duration
        }))
      });
      
      // Build initial result (decision will be updated in pipeline after analysis)
      const initialResult: NavigationAnalysisResult = {
        userCommand: `/${command} ${text}`,
        context,
        intent,
        decision: {
          action: 'create_niche',
          newNodeType: 'niche',
          reasoning: 'GOTO command - destination analysis pending',
          parentNodeId: parentLocationId,  // Use parent location for sibling creation
          newNodeName: cleanText
        }
      };
      
      // Return response immediately (BEFORE analysis)
      res.status(HTTP_STATUS.OK).json({
        data: {
          ...initialResult,
          navigationId,
          eventsUrl
        }
      });

      // Run pipeline asynchronously with destination analysis as first step
      (async () => {
        try {
          await runCreateNodePipeline(
            initialResult.decision,
            context,
            intent,
            apiKey,
            { gotoText: cleanText, includeFurnishing },  // Pass clean text and furnishing flag
            navigationId
          );
        } catch (pipelineError) {
          console.error('[GOTO COMMAND ERROR]', pipelineError);
        } finally {
          pipelineConfigs.delete(navigationId);
        }
      })();
      
      return;
    }

    // For non-GOTO commands, run normal flow
    const routeOptions: RouteOptions = {};
    const decision = routeNavigation(intent, context, routeOptions);

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

    // Handle create_character action (CREATE_CHARACTER_REAL / CREATE_CHARACTER_UNREAL)
    if (decision.action === 'create_character') {
      const navigationId = `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
      
      console.log(`\n🎭 [NAVIGATION] Starting create_character pipeline...`);
      console.log(`[NAVIGATION] Navigation ID: ${navigationId}`);
      console.log(`[NAVIGATION] Character Type: ${decision.metadata?.characterType}`);
      console.log(`[NAVIGATION] Location: ${decision.metadata?.locationName}`);
      
      // Store pipeline configuration for SSE initialization
      const steps = getStepsForPipeline('characterNavigation');
      pipelineConfigs.set(navigationId, {
        pipelineType: 'characterNavigation',
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

      // Run character pipeline asynchronously
      (async () => {
        try {
          await runCreateCharacterPipeline(decision, context, apiKey, navigationId);
          console.log('✅ [NAVIGATION] Character pipeline complete');
        } catch (pipelineError) {
          console.error('\n❌ [NAVIGATION CHARACTER ERROR]', pipelineError);
        } finally {
          pipelineConfigs.delete(navigationId);
        }
      })();
      
      return;
    }

    // If decision is create_niche (e.g., GO_INSIDE), return immediately and run pipeline asynchronously
    let navigationId: string | undefined;
    let eventsUrl: string | undefined;
    
    if (decision.action === 'create_niche') {
      navigationId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
      
      // Store pipeline configuration for SSE initialization (GO_INSIDE uses 'navigation' pipeline)
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

      // Run pipeline asynchronously - use cleanText (already parsed at top of handler)
      (async () => {
        try {
          await runCreateNodePipeline(
            decision, 
            context, 
            intent, 
            apiKey, 
            { 
              userPrompt: cleanText || decision.newNodeName,
              includeFurnishing  // Already parsed at top of handler
            },
            navigationId
          );
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
    NEW_LOCATION: 'location'
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

      // Load parent DNA context if parentId is provided
      let parentContext;
      if (parentId) {
        const worldsData = await storageService.loadWorlds();
        const parentNode = worldsData?.nodes?.[parentId];
        if (parentNode) {
          // Pass FULL parent node data including name, description, structure
          parentContext = extractParentDNAContext(parentNode.dna, {
            name: parentNode.name,
            description: parentNode.description,
            type: parentNode.type,
            dominantElements: parentNode.dominantElements || parentNode.structure?.dominantElements,
            uniqueIdentifiers: parentNode.uniqueIdentifiers || parentNode.structure?.uniqueIdentifiers,
            searchDesc: parentNode.searchDesc,
          });
          console.log(`[CREATE-NODE] Loaded FULL parent context from ${parentNode.name} (${parentNode.type})`);
        }
      }

      const result = await createNode(
        nodeType,
        description || `New ${nodeType}`,
        {
          apiKey,
          parentId,
          parentContext,
          createImage: flags.createImage
        }
      );

      console.log(`✅ [CREATE-NODE] Pipeline complete. Node: ${result.node?.name || 'unknown'}`);
      
      // If image was generated, create media entry and set primaryMedia
      if (result.imageUrl) {
        const mediaEntry = mediaService.createMedia({
          type: 'image',
          url: result.imageUrl,
          metadata: {
            prompt: result.imagePrompt || '',
            model: 'flux',
            width: 1920,
            height: 1080,
            aspectRatio: 'landscape_16_9'
          },
          entityRefs: [result.node.id]
        });
        
        result.node.primaryMedia = mediaEntry.id;
        console.log(`[CREATE-NODE] Created media entry: ${mediaEntry.id}`);
      }
      
      // Save node to storage and update worldTrees
      const updatedWorldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
      
      // Save node to nodes collection
      updatedWorldsData.nodes[result.node.id] = result.node;
      
      // Add to worldTrees based on node type
      if (nodeType === 'host') {
        // Host nodes go directly into worldTrees as root entries
        updatedWorldsData.worldTrees.push({
          id: result.node.id,
          type: 'host',
          children: []
        });
        console.log(`[CREATE-NODE] Added host to worldTrees: ${result.node.id}`);
      } else if (parentId) {
        // Child nodes (region, location, niche) need to be added to their parent's children array
        const addChildToTree = (tree: any[], targetId: string, childEntry: any): boolean => {
          for (const node of tree) {
            if (node.id === targetId) {
              if (!node.children) node.children = [];
              node.children.push(childEntry);
              return true;
            }
            if (node.children && addChildToTree(node.children, targetId, childEntry)) {
              return true;
            }
          }
          return false;
        };
        
        const childEntry = {
          id: result.node.id,
          type: nodeType,
          children: []
        };
        
        const added = addChildToTree(updatedWorldsData.worldTrees, parentId, childEntry);
        if (added) {
          console.log(`[CREATE-NODE] Added ${nodeType} as child of ${parentId}`);
        } else {
          console.log(`[CREATE-NODE] Warning: Could not find parent ${parentId} in worldTrees`);
        }
      }
      
      // Save updated data
      await storageService.saveWorlds(updatedWorldsData);
      console.log(`[CREATE-NODE] Saved to storage`);
      
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
      // Step 1: Load node from storage
      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
        message: 'Loading node data...'
      });

      const worldsData = await storageService.loadWorlds();
      if (!worldsData || !worldsData.nodes) {
        throw new Error('No worlds data found in storage');
      }

      const node = worldsData.nodes[nodeId];
      if (!node) {
        throw new Error(`Node not found: ${nodeId}`);
      }

      console.log(`[CREATE-IMAGE] Found node: ${node.name} (type: ${node.type})`);

      // Step 2: Generate image prompt from node DNA
      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
        message: 'Generating image...'
      });

      const perspective = detectPerspectiveFromNode(node);
      const imagePrompt = getNodeImagePrompt(node, perspective);
      
      console.log(`[CREATE-IMAGE] Image prompt: ${imagePrompt.substring(0, 100)}...`);

      // Step 3: Call FLUX API
      const result = await generateImage(
        apiKey,
        imagePrompt,
        1,
        'landscape_16_9',
        'none'
      );

      if (result.error || !result.data?.images?.[0]?.url) {
        throw new Error(result.error || 'Failed to generate image');
      }

      const imageUrl = result.data.images[0].url;
      console.log(`[CREATE-IMAGE] Image generated: ${imageUrl.substring(0, 50)}...`);

      // Step 4: Create media entry and update node
      sseService.sendEvent(operationId, 'progress', {
        stage: 'save',
        message: 'Saving image...'
      });

      // Create media entry
      const mediaEntry = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imagePrompt,
          model: 'flux',
          width: 1920,
          height: 1080,
          aspectRatio: 'landscape_16_9'
        },
        entityRefs: [nodeId]
      });
      
      console.log(`[CREATE-IMAGE] Media entry created: ${mediaEntry.id}`);

      // Update node with primaryMedia (not just imageUrl)
      node.primaryMedia = mediaEntry.id;
      node.imageUrl = imageUrl; // Keep for backward compatibility
      worldsData.nodes[nodeId] = node;

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);
      console.log(`[CREATE-IMAGE] Node updated with primaryMedia: ${mediaEntry.id}`);

      // Send completion event with mediaId
      sseService.sendEvent(operationId, 'completed', {
        message: 'Image created successfully',
        node,
        imageUrl,
        mediaId: mediaEntry.id
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
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

/**
 * Helper: Detect perspective from node data
 * Uses stored spaceType from LLM analysis (no string matching)
 */
function detectPerspectiveFromNode(node: any): 'interior' | 'exterior' {
  // 1. Use stored spaceType if available (from LLM structure analysis)
  if (node.spaceType === 'interior' || node.spaceType === 'exterior') {
    return node.spaceType;
  }
  
  // 2. Fallback based on node type (domain rules)
  // Location nodes are always exterior (they represent buildings/places)
  if (node.type === 'location' || node.type === 'host' || node.type === 'region') {
    return 'exterior';
  }
  
  // 3. Default for niches without spaceType
  return node.type === 'niche' ? 'interior' : 'exterior';
}

export { router as navigationRouter };
