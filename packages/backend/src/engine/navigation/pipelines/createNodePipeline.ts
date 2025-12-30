/**
 * Create Location Node Pipeline
 * Generates images and DNA for creating any type of location node
 * Used by navigation intents that need to create new nodes
 * 
 * NEW ARCHITECTURE (v2):
 * - Unified flow for both GOTO and GO_INSIDE commands
 * - Parallel Structure + DNA analysis for faster execution
 * - Structure stored separately from DNA at node level
 */

import type { NavigationDecision, NavigationContext, IntentResult, CommandContext } from '../types';
import type { ParsedEnhancements } from '../analyzers/structureAnalyzer';
import { getPipelineTypeForIntent } from '../../pipelines/shared/pipelineConfig';
import { PipelineHelper } from '../../pipelines/shared/pipelineHelpers';
import { runDestinationAnalysisStep } from './helpers/destinationAnalysisStep';
import { runSpaceAnalysisStep } from './helpers/spaceAnalysisStep';
import { generateNodeImagePrompt, generateImage, buildFinalNode } from './helpers/nodeBuildingStep';

// Navigation-specific node types (excludes host/region which are created by spawn system)
export type NavigationNodeType = 'niche' | 'feature' | 'detail' | 'location';

export interface CreateNodeOptions {
  nodeType?: NavigationNodeType;
  generateImage?: boolean;
  style?: string;        // Visual style from registry
  perspective?: string;  // Perspective (interior/exterior)
  gotoText?: string;     // For GOTO: The destination text to analyze
  userPrompt?: string;   // User's space description (used for structure analysis)
  useUnifiedPipeline?: boolean; // Enable new unified pipeline (defaults to true)
  /** Pre-parsed navigable elements and furnishing from command (user-controlled) */
  parsedEnhancements?: ParsedEnhancements;
  isSubPipeline?: boolean; // Running as sub-pipeline - skip started/completed events
  /** True when GOTO is triggered from a location node (creates sibling location instead of niche) */
  isFromLocation?: boolean;
  /** Pre-resolved parent DNA (from region/host) */
  resolvedParentDNA?: any;
  /** Unified command context (new architecture) */
  commandContext?: CommandContext;
  /** Pass-through location created before entering structure (for GO_INSIDE from niche) */
  passThroughLocation?: {
    node: any;
    parentId: string;  // The niche ID that the location was added under
  };
}

/**
 * Run the complete location node generation pipeline
 * 
 * Generic pipeline that works for any node type (niche, feature, detail, location)
 * Used by navigation intents like GO_INSIDE, EXPLORE_FEATURE, APPROACH, etc.
 */
export async function runCreateLocationNodePipeline(
  decision: NavigationDecision,
  context: NavigationContext,
  intent: IntentResult,
  apiKey: string,
  options?: CreateNodeOptions,
  navigationId?: string
): Promise<{ imageUrl: string; imagePrompt: string; node: any }> {
  // Auto-detect pipeline type from intent
  const pipelineType = options?.gotoText ? 'navigationGoto' : getPipelineTypeForIntent(intent.intent);
  const helper = (navigationId && !options?.isSubPipeline) 
    ? new PipelineHelper(navigationId, 'CreateNodePipeline', pipelineType) 
    : null;

  try {
    // Extract command context if provided (new unified architecture)
    const cmdCtx = options?.commandContext;
    
    const nodeType = cmdCtx?.targetNodeType || options?.nodeType || 'niche';
    const shouldGenerateImage = options?.generateImage !== false;

    // Determine perspective
    const isFromLocation = cmdCtx ? cmdCtx.sourceNodeType === 'location' : options?.isFromLocation;
    const defaultPerspective = (nodeType === 'location' || isFromLocation) ? 'exterior' : 'interior';
    let perspective = (options?.perspective || decision.perspective || intent.spaceType || defaultPerspective) as 'interior' | 'exterior' | 'open-air';

    // Only send started event if not a sub-pipeline
    if (helper && !options?.isSubPipeline) {
      helper.started('Starting node creation...');
    }

    // Determine user prompt
    const userPrompt = cmdCtx?.userPrompt || options?.userPrompt || options?.gotoText || intent.target || decision.newNodeName || 'interior space';

    // Determine command type
    const command: 'GOTO' | 'GO_INSIDE' = (cmdCtx?.command || (options?.gotoText ? 'GOTO' : 'GO_INSIDE'));
    const isGotoCommand = command === 'GOTO';

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 0.5: DESTINATION ANALYSIS
    // ═══════════════════════════════════════════════════════════════════════════
    const { updatedPerspective } = await runDestinationAnalysisStep({
      command,
      userPrompt,
      context,
      decision,
      apiKey,
      helper
    });
    perspective = updatedPerspective as 'interior' | 'exterior' | 'open-air';

    // CRITICAL: Force exterior for location nodes (GOTO creating new location under region)
    // Locations show building facade from outside, not interior
    // Niches (GOTO under location) keep the LLM-determined perspective
    if (nodeType === 'location' && perspective !== 'exterior') {
      console.log(`[CreateNodePipeline] Forcing exterior perspective for location node (was: ${perspective})`);
      perspective = 'exterior';
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: SPACE ANALYSIS (Structure + DNA in parallel)
    // ═══════════════════════════════════════════════════════════════════════════
    const parsedEnhancements = (cmdCtx?.parsedEnhancements || options?.parsedEnhancements) as ParsedEnhancements | undefined;
    
    const spaceAnalysisResult = await runSpaceAnalysisStep({
      userPrompt,
      nodeName: decision.newNodeName || 'Unnamed Space',
      nodeType,
      perspective,
      context,
      apiKey,
      helper,
      isGotoCommand,
      isFromLocation: !!isFromLocation,
      parsedEnhancements,
      cmdCtx,
      resolvedParentDNA: options?.resolvedParentDNA
    });

    const { structureAnalysis, dnaResult, updatedPerspective: finalPerspective, parentDNAForImagePrompt, surroundingsDNA } = spaceAnalysisResult;
    
    // Update decision with structure analysis results
    decision.newNodeName = structureAnalysis.name;
    decision.perspective = structureAnalysis.perspective;
    decision.metadata = decision.metadata || {};
    decision.metadata.structureAnalysis = structureAnalysis;

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: IMAGE PROMPT GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    const imagePrompt = await generateNodeImagePrompt({
      structureAnalysis,
      dna: dnaResult.dna || {},
      parentDNA: parentDNAForImagePrompt,
      surroundingsDNA, // For window views - shows world DNA, not interior concept
      userPrompt,
      nodeType,
      perspective: finalPerspective,
      context,
      apiKey,
      helper
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: IMAGE GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    let imageUrl = '';
    if (shouldGenerateImage) {
      imageUrl = await generateImage(apiKey, imagePrompt, helper);
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 4: NODE BUILDING
    // ═══════════════════════════════════════════════════════════════════════════
    const nodeResult = buildFinalNode({
      nodeType,
      structureAnalysis,
      dnaResult,
      parentDNA: parentDNAForImagePrompt,
      imageUrl,
      imagePrompt,
      shouldGenerateImage,
      helper
    });

    // Only send completion event if not a sub-pipeline
    if (helper && !options?.isSubPipeline) {
      // Build completion data with optional pass-through location for frontend to sync
      const completionData: Record<string, any> = { 
        node: nodeResult.node, 
        imageUrl: nodeResult.imageUrl, 
        imagePrompt: nodeResult.imagePrompt 
      };
      
      // Include pass-through location if created (GO_INSIDE from niche)
      // Frontend needs this to add to its store before saving
      if (options?.passThroughLocation) {
        completionData.passThroughLocation = options.passThroughLocation;
        // CRITICAL: The niche's parent is the pass-through location, NOT the original parent
        // Frontend needs this because it captured parentNodeId BEFORE pass-through was created
        completionData.nicheParentId = options.passThroughLocation.node.id;
        console.log(`[CreateNodePipeline] Including pass-through location in completion event: ${options.passThroughLocation.node.id}`);
        console.log(`[CreateNodePipeline] Niche parent ID for frontend: ${options.passThroughLocation.node.id}`);
      }
      
      helper.completed('Node created successfully', completionData);
    }

    return nodeResult;
  } catch (error: any) {
    if (helper) {
      helper.error(error);
    } else {
      console.error(`[CreateNodePipeline] Pipeline failed:`, error);
    }
    throw error;
  }
}
