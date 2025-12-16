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
import { findParentLocationNode, findParentRegionNode } from '../../engine/navigation/navigationHelpers';
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
import { parseEnhancements } from '../../engine/navigation/utils/enhancementParser';
import { enhancePrompt } from '../../services/mzoo/promptEnhancer';

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
    // Parse enhancements from text (navigable elements, furnish, facade, perspective flags)
    const parsed = parseEnhancements(text || '');
    const cleanText = parsed.cleanCommand || undefined;
    
    // DEBUG: Log parsed perspective override
    console.log(`[PERSPECTIVE DEBUG] Command: ${command}, Raw text: "${text}"`);
    console.log(`[PERSPECTIVE DEBUG] Parsed perspectiveOverride: ${parsed.perspectiveOverride}`);
    
    // Build intent from command with CLEAN text (enhancements removed)
    // Pass perspectiveOverride if user specified --interior, --exterior, or --open-air
    const intent = buildIntentFromCommand(
      command as NavigationCommand,
      cleanText || null,
      context.currentNode.type,
      parsed.perspectiveOverride  // User-specified perspective flag
    );
    
    // DEBUG: Log intent spaceType
    console.log(`[PERSPECTIVE DEBUG] intent.spaceType after buildIntentFromCommand: ${intent.spaceType}`);

    // Build parsedEnhancements for pipeline
    const parsedEnhancements = (parsed.navigableElements || parsed.furnishing) ? {
      navigableElements: parsed.navigableElements,
      furnishing: parsed.furnishing
    } : undefined;

    // For GOTO: Send response immediately, run analysis in pipeline
    // Context-aware: from niche = sibling niche, from location = sibling location
    if (command === 'GOTO' && cleanText) {
      console.log(`[GOTO DEBUG] Raw text received: "${text}"`);
      console.log(`[GOTO DEBUG] Current node type: ${context.currentNode.type}`);
      console.log(`[GOTO DEBUG] Parsed: cleanText="${cleanText}", enhancements=${JSON.stringify(parsedEnhancements)}`);
      
      const navigationId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
      
      // Load worldsData for proper DNA resolution
      const worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
      
      // Context-aware parent resolution
      const isFromLocation = context.currentNode.type === 'location';
      let parentNodeId: string;
      let nodeType: 'niche' | 'location';
      let action: 'create_niche' | 'create_location';
      let resolvedParentDNA: any = null;
      
      if (isFromLocation) {
        // GOTO from location: create sibling location under parent region
        const { parentRegionId } = findParentRegionNode(context);
        parentNodeId = parentRegionId;
        nodeType = 'location';
        action = 'create_location';
        console.log(`[GOTO DEBUG] From location - creating sibling location under region ${parentRegionId}`);
        
        // CRITICAL: Resolve CASCADED DNA from region (using proper functions)
        // This ensures parent DNA includes inherited values from host
        const parentRegionNode = worldsData.nodes[parentRegionId];
        if (parentRegionNode) {
          // Check if region is pass-through (use host DNA instead)
          const isPassThrough = parentRegionNode.isPassThrough || 
            (parentRegionNode.type === 'region' && (!parentRegionNode.dna || Object.keys(parentRegionNode.dna).length === 0));
          
          if (isPassThrough) {
            // Find host and use its DNA
            const hostNode = findHostForRegion(parentRegionId, worldsData.worldTrees, worldsData.nodes);
            if (hostNode?.dna) {
              resolvedParentDNA = hostNode.dna;
              console.log(`[GOTO DEBUG] Region is pass-through, using HOST DNA from "${hostNode.name}"`);
            }
          } else if (parentRegionNode.dna) {
            resolvedParentDNA = parentRegionNode.dna;
            console.log(`[GOTO DEBUG] Using REGION DNA from "${parentRegionNode.name}"`);
          }
        }
      } else {
        // GOTO from niche: create sibling niche under parent location
        const { parentLocationId } = findParentLocationNode(context);
        parentNodeId = parentLocationId;
        nodeType = 'niche';
        action = 'create_niche';
        console.log(`[GOTO DEBUG] From niche - creating sibling niche under location ${parentLocationId}`);
        
        // Resolve DNA from parent location
        const parentLocationNode = worldsData.nodes[parentLocationId];
        if (parentLocationNode?.dna) {
          resolvedParentDNA = parentLocationNode.dna;
          console.log(`[GOTO DEBUG] Using LOCATION DNA from "${parentLocationNode.name}"`);
        }
      }
      
      // Log resolved DNA for debugging
      if (resolvedParentDNA) {
        console.log(`[GOTO DEBUG] Resolved parent DNA:`);
        console.log(`  - architectural_tone: ${resolvedParentDNA.architectural_tone || 'null'}`);
        console.log(`  - palette_bias: ${resolvedParentDNA.palette_bias || 'null'}`);
        console.log(`  - looks: ${(resolvedParentDNA.looks || 'null').substring(0, 60)}...`);
      } else {
        console.log(`[GOTO DEBUG] WARNING: No parent DNA resolved!`);
      }
      
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
          action,
          newNodeType: nodeType,
          reasoning: `GOTO command from ${context.currentNode.type} - destination analysis pending`,
          parentNodeId,
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
          const result = await runCreateNodePipeline(
            initialResult.decision,
            context,
            intent,
            apiKey,
            { 
              gotoText: cleanText, 
              parsedEnhancements, 
              isFromLocation,
              nodeType: isFromLocation ? 'location' : 'niche',  // Pass correct node type
              resolvedParentDNA  // CRITICAL: Pass pre-resolved DNA to avoid empty parent DNA
            },
            navigationId
          );
          
          // Save node to storage and update worldTrees
          if (result.node) {
            const worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
            
            // Save node to nodes collection
            worldsData.nodes[result.node.id] = result.node;
            
            // Add to worldTrees under parent
            const addChildToTree = (tree: any[], targetId: string, childEntry: any): boolean => {
              for (const treeNode of tree) {
                if (treeNode.id === targetId) {
                  if (!treeNode.children) treeNode.children = [];
                  treeNode.children.push(childEntry);
                  return true;
                }
                if (treeNode.children && addChildToTree(treeNode.children, targetId, childEntry)) {
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
            
            const added = addChildToTree(worldsData.worldTrees, parentNodeId, childEntry);
            if (added) {
              console.log(`[GOTO] Added ${nodeType} "${result.node.name}" as child of ${parentNodeId}`);
            } else {
              console.log(`[GOTO] Warning: Could not find parent ${parentNodeId} in worldTrees`);
            }
            
            // Save updated data
            await storageService.saveWorlds(worldsData);
            console.log(`[GOTO] Saved node to storage: ${result.node.id}`);
          }
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
              parsedEnhancements  // User-controlled navigable elements and furnishing
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
    NEW_WORLD: 'host',
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
      // For pass-through regions, traverse up to find ancestor with DNA
      let parentContext;
      if (parentId) {
        const worldsData = await storageService.loadWorlds();
        const parentNode = worldsData?.nodes?.[parentId];
        if (parentNode) {
          // Check if parent is a pass-through region (empty DNA)
          const isPassThrough = parentNode.isPassThrough || 
            (parentNode.type === 'region' && (!parentNode.dna || Object.keys(parentNode.dna).length === 0));
          
          if (isPassThrough && worldsData?.worldTrees) {
            // Find the host (grandparent) by traversing worldTrees
            const hostNode = findHostForRegion(parentId, worldsData.worldTrees, worldsData.nodes);
            if (hostNode) {
              console.log(`[CREATE-NODE] Parent is pass-through region, using host DNA from ${hostNode.name}`);
              parentContext = extractParentDNAContext(hostNode.dna, {
                name: hostNode.name,
                description: hostNode.description,
                type: hostNode.type,
                dominantElements: hostNode.dominantElements || hostNode.structure?.dominantElements,
                uniqueIdentifiers: hostNode.uniqueIdentifiers || hostNode.structure?.uniqueIdentifiers,
                searchDesc: hostNode.searchDesc,
              });
            }
          } else {
            // Normal case: use parent's DNA directly
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
 * Generate image for an existing node via /VIEW command
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

  console.log(`\n🖼️ [VIEW] Starting image generation pipeline...`);
  console.log(`[VIEW] Operation ID: ${operationId}`);
  console.log(`[VIEW] Node ID: ${nodeId}`);

  // Use pipeline config (single source of truth)
  const steps = getStepsForPipeline('view');
  pipelineConfigs.set(operationId, {
    pipelineType: 'view',
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
    const startTime = Date.now();
    const timings: Record<string, number> = {};
    let stageStart = Date.now();
    
    try {
      // Step 1: Load node and generate image
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

      console.log(`[VIEW] Found node: ${node.name} (type: ${node.type})`);

      // Generate image prompt from node DNA
      sseService.sendEvent(operationId, 'progress', {
        stage: 'generate',
        message: 'Generating image...'
      });

      const perspective = detectPerspectiveFromNode(node);
      const imagePrompt = getNodeImagePrompt(node, perspective);
      
      console.log(`[VIEW] Image prompt: ${imagePrompt.substring(0, 100)}...`);

      // Call FLUX API
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
      timings['generate'] = Date.now() - stageStart;
      console.log(`[VIEW] Image generated (${(timings['generate'] / 1000).toFixed(2)}s)`);

      // Save media entry and update node (silently, no separate step)
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

      // Update node with primaryMedia
      node.primaryMedia = mediaEntry.id;
      node.imageUrl = imageUrl;
      worldsData.nodes[nodeId] = node;

      // Save updated worlds data
      await storageService.saveWorlds(worldsData);
      
      // Log timing summary
      const totalTime = Date.now() - startTime;
      console.log(`\n[VIEW] ${operationId} completed in ${(totalTime / 1000).toFixed(2)}s`);
      console.log(`  Stage Timings:`);
      console.log(`    - Image Generation: ${(timings['generate'] / 1000).toFixed(2)}s`);
      console.log(`  Total: ${(totalTime / 1000).toFixed(2)}s\n`);

      // Send completion event with mediaId
      sseService.sendEvent(operationId, 'completed', {
        message: 'Image created successfully',
        node,
        imageUrl,
        mediaId: mediaEntry.id,
        timings
      });

      setTimeout(() => sseService.closeConnection(operationId), 1000);
    } catch (error) {
      console.error(`\n❌ [VIEW ERROR]`, error);
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
 * POST /api/mzoo/navigation/enhance-prompt
 * Generate enhancement suggestions (navigable elements, furnishing, facade) for a command
 */
router.post('/enhance-prompt', asyncHandler(async (req: Request, res: Response) => {
  const { command, text, nodeId, perspectiveOverride } = req.body as {
    command: string;
    text: string;
    nodeId: string;
    perspectiveOverride?: 'interior' | 'exterior' | 'open-air';
  };

  // Validation
  if (!command || !nodeId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: 'Missing required fields: command, nodeId'
    });
    return;
  }

  // Validate command is one that supports enhancement
  const enhanceableCommands = ['GO_INSIDE', 'GOTO', 'NEW_LOCATION'];
  if (!enhanceableCommands.includes(command)) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({
      error: `Command ${command} does not support enhancement. Valid commands: ${enhanceableCommands.join(', ')}`
    });
    return;
  }

  // Get API key from middleware
  const apiKey = (req as any).mzooApiKey;

  try {
    // Load node data
    const worldsData = await storageService.loadWorlds();
    if (!worldsData || !worldsData.nodes) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: 'No worlds data found'
      });
      return;
    }

    const node = worldsData.nodes[nodeId];
    if (!node) {
      res.status(HTTP_STATUS.NOT_FOUND).json({
        error: `Node not found: ${nodeId}`
      });
      return;
    }

    console.log(`[ENHANCE-PROMPT] Generating enhancement for ${command} at "${node.name}"`);
    console.log(`[ENHANCE-PROMPT] Destination text: "${text || '(none)'}"`);

    // Call prompt enhancer service
    const result = await enhancePrompt(apiKey, {
      commandType: command as 'GO_INSIDE' | 'GOTO' | 'NEW_LOCATION',
      destinationText: text || '',
      currentNode: {
        id: node.id,
        name: node.name,
        type: node.type,
        description: node.description,
        spaceType: node.spaceType,  // Pass spaceType for perspective detection
        dna: node.dna,
        navigableElements: node.navigableElements || node.structure?.navigableElements,
        dominantElements: node.dominantElements || node.structure?.dominantElements
      },
      perspectiveOverride  // Pass user's --exterior, --interior, --open-air flag
    });

    if (!result.success) {
      res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        error: result.error || 'Failed to generate enhancement'
      });
      return;
    }

    res.status(HTTP_STATUS.OK).json({
      data: {
        enhancement: result.enhancement
      }
    });
  } catch (error) {
    console.error('[ENHANCE-PROMPT ERROR]', error);
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      error: `Enhancement failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    });
  }
}));

/**
 * Helper: Find the host node for a given region ID by traversing worldTrees
 * Used for pass-through regions to get DNA from the host
 */
function findHostForRegion(regionId: string, worldTrees: any[], nodes: Record<string, any>): any | null {
  for (const tree of worldTrees) {
    // Check if this tree's host has the region as a child
    if (tree.children) {
      for (const child of tree.children) {
        if (child.id === regionId) {
          // Found the region, return the host node
          return nodes[tree.id];
        }
      }
    }
  }
  return null;
}

/**
 * Helper: Detect perspective from node data
 * Uses stored spaceType from LLM analysis (no string matching)
 */
function detectPerspectiveFromNode(node: any): 'interior' | 'exterior' | 'open-air' {
  // 1. Use stored spaceType if available (from LLM structure analysis)
  if (node.spaceType === 'interior' || node.spaceType === 'exterior' || node.spaceType === 'open-air') {
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
