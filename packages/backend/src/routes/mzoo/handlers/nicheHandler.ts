/**
 * Niche Creation Handler
 * Handles GO_INSIDE command - creates child niche under current location or niche
 */

import { Response } from 'express';
import type { NavigationContext, NavigationAnalysisResult, CommandContext } from '../../../engine/navigation/types';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../../engine/navigation/pipelines/createNodePipeline';
import { resolveNavigationParentDNA } from '../../../engine/navigation/navigationHelpers';
import { storageService } from '../../../services/storage/storageService';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs } from '../navigation';

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
export async function handleCreateNiche(
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
  res.status(200).json({
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
