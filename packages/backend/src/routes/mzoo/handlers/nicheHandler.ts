/**
 * Niche Creation Handler
 * Handles GO_INSIDE command - creates child niche under current location or niche
 * 
 * When entering a structure from a niche (e.g., "little house" inside a basement):
 * 1. Creates a pass-through location for the structure (no LLM call)
 * 2. Creates the interior niche as child of that location
 * This ensures proper DNA inheritance and GOTO sibling behavior
 */

import { Response } from 'express';
import type { NavigationContext, NavigationAnalysisResult, CommandContext } from '../../../engine/navigation/types';
import { runCreateLocationNodePipeline as runCreateNodePipeline } from '../../../engine/navigation/pipelines/createNodePipeline';
import { resolveNavigationParentDNA } from '../../../engine/navigation/navigationHelpers';
import { storageService } from '../../../services/storage/storageService';
import { getStepsForPipeline } from '../../../engine/pipelines/shared/pipelineConfig';
import { pipelineConfigs } from '../navigation';
import { addChildToWorldTree } from '../../../engine/navigation/navigationHelpers';

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
 * Create a pass-through location node for a structure
 * No LLM call - minimal DNA that inherits from ancestors
 */
function createPassThroughLocation(
  name: string,
  parentNodeId: string
): { id: string; node: any } {
  const locationId = `loc-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  const node = {
    id: locationId,
    type: 'location',
    name: name,
    spaceType: 'structure', // Marks this as an internal structure/building
    dna: {}, // Empty - inherits from ancestors (like pass-through regions)
    description: `Structure: ${name}`,
    searchDesc: name,
    slug: name.toLowerCase().replace(/\s+/g, '-'),
    isPassThrough: true // Marker that this is a wrapper location
  };
  
  return { id: locationId, node };
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
  let worldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
  
  // Use unified DNA resolution helper (same as GOTO for consistency)
  const dnaResolution = resolveNavigationParentDNA('GO_INSIDE', context, worldsData);
  let { parentNodeId, resolvedParentDNA } = dnaResolution;
  
  // Extract clean element name from user input
  // If user typed "Alien Ship: shape=organic, scale=massive..." → extract "Alien Ship"
  // The full properties string is still available in cleanText for element matching
  const rawUserInput = cleanText || decision.newNodeName || 'interior space';
  const cleanElementName = extractElementName(rawUserInput);
  
  console.log(`[GO_INSIDE] Raw input: "${rawUserInput}"`);
  console.log(`[GO_INSIDE] Clean element name: "${cleanElementName}"`);
  
  // ═══════════════════════════════════════════════════════════════════════════
  // NICHE → STRUCTURE: Create pass-through location first
  // When entering a structure from a niche, we create a location wrapper
  // This ensures proper DNA inheritance and GOTO sibling behavior
  // ═══════════════════════════════════════════════════════════════════════════
  let passThroughLocationId: string | null = null;
  let passThroughLocationNode: any = null;  // Store for re-insertion if frontend overwrites
  const originalParentNicheId = context.currentNode.id;  // Store original parent for re-insertion
  
  if (context.currentNode.type === 'niche') {
    console.log(`[GO_INSIDE] Entering structure from niche - creating pass-through location`);
    
    // Create pass-through location for the structure
    const { id: newLocationId, node: locationNode } = createPassThroughLocation(
      cleanElementName,
      context.currentNode.id // Parent is the current niche
    );
    passThroughLocationId = newLocationId;
    passThroughLocationNode = locationNode;  // Store for later re-insertion
    
    // Add to worldsData
    worldsData.nodes[newLocationId] = locationNode;
    
    // Add to world tree under current niche
    addChildToWorldTree(worldsData.worldTrees, context.currentNode.id, {
      id: newLocationId,
      type: 'location',
      children: []
    });
    
    // Save immediately so the interior niche creation can reference it
    await storageService.saveWorlds(worldsData);
    
    console.log(`[GO_INSIDE] Created pass-through location: ${newLocationId} (${cleanElementName})`);
    
    // Update parent for the interior niche to be the new location
    parentNodeId = newLocationId;
    // DNA inheritance continues from ancestors through the pass-through location
  }
  
  // Build CommandContext for unified pipeline
  // Use clean element name for userPrompt (for naming), but keep raw input available
  const commandContext: CommandContext = {
    command: 'GO_INSIDE',
    sourceNodeType: passThroughLocationId ? 'location' : context.currentNode.type as 'location' | 'niche',
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

  // Update decision to use the new parent if pass-through location was created
  if (passThroughLocationId) {
    decision.parentNodeId = passThroughLocationId;
  }

  // Run pipeline asynchronously with unified CommandContext
  (async () => {
    try {
      const result = await runCreateNodePipeline(
        decision, 
        context, 
        intent, 
        apiKey, 
        { 
          commandContext,  // Pass unified command context (new architecture)
          // Include pass-through location for frontend sync via SSE completion event
          ...(passThroughLocationId && passThroughLocationNode ? {
            passThroughLocation: {
              node: passThroughLocationNode,
              parentId: originalParentNicheId
            }
          } : {})
        },
        navigationId
      );
      
      // Save node to storage and update worldTrees
      // IMPORTANT: Frontend may have overwritten our pass-through location during the pipeline
      // We need to re-add it if it's missing
      if (result.node) {
        const updatedWorldsData = await storageService.loadWorlds() || { nodes: {}, worldTrees: [], views: {}, pinnedIds: [] };
        
        // ═══════════════════════════════════════════════════════════════════════
        // RE-ADD PASS-THROUGH LOCATION IF OVERWRITTEN BY FRONTEND
        // The frontend may save its stale store during the pipeline, losing the location
        // ═══════════════════════════════════════════════════════════════════════
        if (passThroughLocationId && passThroughLocationNode) {
          // Check if pass-through location was overwritten
          if (!updatedWorldsData.nodes[passThroughLocationId]) {
            console.log(`[GO_INSIDE] Pass-through location ${passThroughLocationId} was overwritten - re-adding`);
            updatedWorldsData.nodes[passThroughLocationId] = passThroughLocationNode;
          }
          
          // Check if pass-through location is in worldTrees under the original parent
          const locationInTree = addChildToWorldTree(updatedWorldsData.worldTrees, originalParentNicheId, {
            id: passThroughLocationId,
            type: 'location',
            children: []
          });
          
          // Note: addChildToWorldTree returns false if already exists, which is fine
          if (locationInTree) {
            console.log(`[GO_INSIDE] Re-added pass-through location to worldTrees under ${originalParentNicheId}`);
          }
        }
        
        // Save niche node to nodes collection
        updatedWorldsData.nodes[result.node.id] = result.node;
        
        // Add niche to worldTrees under pass-through location (or original parent)
        const childEntry = {
          id: result.node.id,
          type: 'niche' as const,
          children: []
        };
        
        const added = addChildToWorldTree(updatedWorldsData.worldTrees, parentNodeId, childEntry);
        if (added) {
          console.log(`[GO_INSIDE] Added niche "${result.node.name}" as child of ${parentNodeId}`);
        } else {
          console.log(`[GO_INSIDE] Warning: Could not find parent ${parentNodeId} in worldTrees`);
        }
        
        // Save updated data
        await storageService.saveWorlds(updatedWorldsData);
        console.log(`[GO_INSIDE] Saved niche to storage`);
      }
    } catch (pipelineError) {
      console.error('[GO_INSIDE COMMAND ERROR]', pipelineError);
    } finally {
      pipelineConfigs.delete(navigationId);
    }
  })();
}
