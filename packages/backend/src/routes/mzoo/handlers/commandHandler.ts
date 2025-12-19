/**
 * Command Handler
 * POST /api/mzoo/navigation/command
 * Execute a navigation command directly (without LLM classification)
 * Used for slash commands like /GO_INSIDE, /GOTO, etc.
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import { NAVIGATION_COMMANDS, type NavigationCommand } from '../../../config/navigation';
import { routeNavigation, buildIntentFromCommand } from '../../../engine/navigation';
import type { RouteOptions, NavigationContext, NavigationAnalysisResult } from '../../../engine/navigation';
import type { CommandContext } from '../../../engine/navigation/types';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../../engine/navigation/pipelines/createNodePipeline';
import { runCreateCharacterPipeline } from '../../../engine/navigation/pipelines/createCharacterPipeline';
import { addChildToWorldTree, resolveNavigationParentDNA } from '../../../engine/navigation/navigationHelpers';
import { storageService } from '../../../services/storage/storageService';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { parseEnhancements } from '../../../engine/navigation/utils/enhancementParser';
import { pipelineConfigs } from '../navigation';

export async function commandHandler(req: Request, res: Response): Promise<void> {
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
      await handleGotoCommand(req, res, context, intent, cleanText, parsedEnhancements, apiKey);
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
      await handleCreateCharacter(res, result, decision, context, apiKey);
      return;
    }

    // If decision is create_niche (e.g., GO_INSIDE), return immediately and run pipeline asynchronously
    if (decision.action === 'create_niche') {
      await handleCreateNiche(res, result, decision, context, intent, cleanText, parsedEnhancements, apiKey);
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
}

/**
 * Handle GOTO command - creates sibling location or niche based on context
 */
async function handleGotoCommand(
  req: Request,
  res: Response,
  context: NavigationContext,
  intent: any,
  cleanText: string,
  parsedEnhancements: any,
  apiKey: string
): Promise<void> {
  const text = req.body.text;
  console.log(`[GOTO] Raw text: "${text}", Current node type: ${context.currentNode.type}`);
  
  const navigationId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
  
  // Load worldsData for proper DNA resolution
  const worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
  
  // Use unified DNA resolution helper (single source of truth)
  const dnaResolution = resolveNavigationParentDNA('GOTO', context, worldsData);
  const { parentNodeId, resolvedParentDNA, targetNodeType } = dnaResolution;
  const action: 'create_niche' | 'create_location' = targetNodeType === 'location' ? 'create_location' : 'create_niche';
  
  console.log(`[GOTO] Creating ${targetNodeType} under ${parentNodeId}`);
  if (resolvedParentDNA) {
    console.log(`[GOTO] Parent DNA: architectural_tone="${resolvedParentDNA.architectural_tone || 'null'}"`);
  }
  
  // Build CommandContext for unified pipeline
  const commandContext: CommandContext = {
    command: 'GOTO',
    sourceNodeType: context.currentNode.type as 'location' | 'niche',
    targetNodeType,
    userPrompt: cleanText,
    resolvedParentDNA,
    parsedEnhancements,
    parentNodeId
  };
  
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
    userCommand: `/GOTO ${text}`,
    context,
    intent,
    decision: {
      action,
      newNodeType: targetNodeType,
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
          commandContext  // Pass unified command context (new architecture)
        },
        navigationId
      );
      
      // Save node to storage and update worldTrees
      if (result.node) {
        const updatedWorldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
        
        // Save node to nodes collection
        updatedWorldsData.nodes[result.node.id] = result.node;
        
        // Add to worldTrees under parent using shared utility
        const childEntry = {
          id: result.node.id,
          type: targetNodeType,
          children: []
        };
        
        const added = addChildToWorldTree(updatedWorldsData.worldTrees, parentNodeId, childEntry);
        if (added) {
          console.log(`[GOTO] Added ${targetNodeType} "${result.node.name}" as child of ${parentNodeId}`);
        } else {
          console.log(`[GOTO] Warning: Could not find parent ${parentNodeId} in worldTrees`);
        }
        
        // Save updated data
        await storageService.saveWorlds(updatedWorldsData);
      }
    } catch (pipelineError) {
      console.error('[GOTO COMMAND ERROR]', pipelineError);
    } finally {
      pipelineConfigs.delete(navigationId);
    }
  })();
}

/**
 * Handle create_character action (CREATE_CHARACTER_REAL / CREATE_CHARACTER_UNREAL)
 */
async function handleCreateCharacter(
  res: Response,
  result: NavigationAnalysisResult,
  decision: any,
  context: NavigationContext,
  apiKey: string
): Promise<void> {
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
}

/**
 * Extract clean element name from user input (remove properties if present)
 * "Alien Ship: shape=organic, scale=massive..." → "Alien Ship"
 * "alien ship" → "alien ship"
 */
function extractElementName(text: string): string {
  const colonIndex = text.indexOf(':');
  if (colonIndex > 0) {
    return text.substring(0, colonIndex).trim();
  }
  return text.trim();
}

/**
 * Handle create_niche action (GO_INSIDE command)
 */
async function handleCreateNiche(
  res: Response,
  result: NavigationAnalysisResult,
  decision: any,
  context: NavigationContext,
  intent: any,
  cleanText: string | undefined,
  parsedEnhancements: any,
  apiKey: string
): Promise<void> {
  const navigationId = `nav-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/mzoo/navigation/events/${navigationId}`;
  
  // Load worldsData for proper DNA resolution
  const worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
  
  // Use unified DNA resolution helper (same as GOTO for consistency)
  const dnaResolution = resolveNavigationParentDNA('GO_INSIDE', context, worldsData);
  const { parentNodeId, resolvedParentDNA } = dnaResolution;
  
  // Extract clean element name from user input
  // If user typed "Alien Ship: shape=organic, scale=massive..." → extract "Alien Ship"
  // The full properties string is still available in cleanText for element matching
  const rawUserInput = cleanText || decision.newNodeName || 'interior space';
  const cleanElementName = extractElementName(rawUserInput);
  
  console.log(`[GO_INSIDE] Raw input: "${rawUserInput}"`);
  console.log(`[GO_INSIDE] Clean element name: "${cleanElementName}"`);
  
  // Build CommandContext for unified pipeline
  // Use clean element name for userPrompt (for naming), but keep raw input available
  const commandContext: CommandContext = {
    command: 'GO_INSIDE',
    sourceNodeType: context.currentNode.type as 'location' | 'niche',
    targetNodeType: 'niche',
    userPrompt: cleanElementName,  // Use clean name for node naming
    resolvedParentDNA,
    parsedEnhancements,
    parentNodeId
  };
  
  console.log(`[GO_INSIDE] Creating niche under ${parentNodeId}`);
  if (resolvedParentDNA) {
    console.log(`[GO_INSIDE] Parent DNA: architectural_tone="${resolvedParentDNA.architectural_tone || 'null'}"`);
  }
  
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

  // Run pipeline asynchronously with unified CommandContext
  (async () => {
    try {
      await runCreateNodePipeline(
        decision, 
        context, 
        intent, 
        apiKey, 
        { 
          commandContext  // Pass unified command context (new architecture)
        },
        navigationId
      );
    } catch (pipelineError) {
      console.error('[GO_INSIDE COMMAND ERROR]', pipelineError);
    } finally {
      pipelineConfigs.delete(navigationId);
    }
  })();
}
