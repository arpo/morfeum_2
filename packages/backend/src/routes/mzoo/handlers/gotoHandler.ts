/**
 * GOTO Command Handler
 * Handles GOTO command - creates sibling location or niche based on context
 */

import { Request, Response } from 'express';
import { HTTP_STATUS } from '../../../config';
import type { NavigationContext, NavigationAnalysisResult, CommandContext } from '../../../engine/navigation/types';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../../engine/navigation/pipelines/createNodePipeline';
import { addChildToWorldTree, resolveNavigationParentDNA } from '../../../engine/navigation/navigationHelpers';
import { storageService } from '../../../services/storage/storageService';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs } from '../navigation';

/**
 * Handle GOTO command - creates sibling location or niche based on context
 */
export async function handleGotoCommand(
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
