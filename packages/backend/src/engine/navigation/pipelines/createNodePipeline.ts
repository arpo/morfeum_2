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
import type { CreatureMode } from '../../generation/shared/imagePromptTypes';
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
  /** Creature mode for image generation (--populate, --people flags) */
  creatureMode?: CreatureMode;
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
    // STEP 1.5: RESOLVE IMMEDIATE SURROUNDINGS FOR NESTED INTERIORS
    // ═══════════════════════════════════════════════════════════════════════════
    // For any interior space inside another interior (car in museum, house in basement,
    // spaceship in cave), we need to pass the immediate interior space so windows
    // show that interior, not the world exterior.
    // 
    // CRITICAL: Only apply when parent is an INTERIOR space (niche), NOT when parent
    // is exterior (location). If parent is exterior, we're at the world boundary and
    // windows should show the world exterior, not immediate surroundings.
    let immediateSurroundings: {
      name: string;
      description: string;
      dna: Record<string, any>;
      spaceType: 'interior' | 'exterior';
    } | undefined;
    
    // Only resolve immediate surroundings for interior perspectives
    if (finalPerspective === 'interior') {
      // For GO_INSIDE from niche (creates pass-through location), the pass-through's
      // parent is the niche we came from - this is a NESTED INTERIOR case
      if (options?.passThroughLocation) {
        // Use the surroundingsDNA which was resolved from the niche ancestor
        // This contains the parent interior's DNA (skipping the pass-through)
        if (surroundingsDNA) {
          immediateSurroundings = {
            name: 'Interior Space',
            description: surroundingsDNA.looks || surroundingsDNA.atmosphere || '',
            dna: surroundingsDNA,
            spaceType: 'interior'
          };
        }
      }
      
      // If no pass-through, check the direct parent - but ONLY if parent is a niche (interior)
      // If parent is a location (exterior), we're at the world boundary - no immediate surroundings
      if (!immediateSurroundings && context.parentNode) {
        const parentType = context.parentNode.type;
        const isParentInterior = parentType === 'niche'; // Niches are interior spaces
        
        if (isParentInterior) {
          const parentData = context.parentNode.data as Record<string, any> | undefined;
          const isParentPassThrough = parentData?.isPassThrough;
          
          if (!isParentPassThrough && context.parentNode.dna) {
            // Direct parent is interior niche with DNA - use it as immediate surroundings
            immediateSurroundings = {
              name: context.parentNode.name || 'Interior Space',
              description: parentData?.description || parentData?.looks || '',
              dna: context.parentNode.dna || {},
              spaceType: 'interior'
            };
          } else if (isParentPassThrough && surroundingsDNA) {
            // Parent is pass-through, use resolved surroundings DNA
            immediateSurroundings = {
              name: 'Interior Space',
              description: surroundingsDNA.looks || surroundingsDNA.atmosphere || '',
              dna: surroundingsDNA,
              spaceType: 'interior'
            };
          }
        }
        // If parent is location/region/host (exterior), don't set immediateSurroundings
        // Windows should show world exterior via the normal surroundingsDNA path
      }
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: IMAGE PROMPT GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    // Extract creatureMode from commandContext or options (--populate, --people flags)
    const creatureMode = cmdCtx?.parsedEnhancements?.creatureMode || options?.creatureMode || 'none';
    
    // DEBUG: Log creatureMode in pipeline
    console.log(`[CREATURE-MODE DEBUG] In createNodePipeline:`);
    console.log(`  cmdCtx?.parsedEnhancements?.creatureMode: ${cmdCtx?.parsedEnhancements?.creatureMode}`);
    console.log(`  options?.creatureMode: ${options?.creatureMode}`);
    console.log(`  Final creatureMode: ${creatureMode}`);
    
    const imagePromptResult = await generateNodeImagePrompt({
      structureAnalysis,
      dna: dnaResult.dna || {},
      parentDNA: parentDNAForImagePrompt,
      surroundingsDNA, // For window views - shows world DNA, not interior concept
      immediateSurroundings, // For vehicles inside buildings - shows interior through windows
      userPrompt,
      nodeType,
      perspective: finalPerspective,
      context,
      apiKey,
      helper,
      creatureMode  // Pass creature mode for --populate/--people flags
    });

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 3: IMAGE GENERATION
    // ═══════════════════════════════════════════════════════════════════════════
    let imageUrl = '';
    if (shouldGenerateImage) {
      imageUrl = await generateImage(apiKey, imagePromptResult.prompt, helper);
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
      imagePrompt: imagePromptResult.prompt,
      promptStructure: imagePromptResult.structure,
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
