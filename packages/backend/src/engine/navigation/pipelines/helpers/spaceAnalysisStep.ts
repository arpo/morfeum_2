/**
 * Space Analysis Step (STEP 1)
 * Runs parallel Structure + DNA analysis for space understanding
 */

import type { NavigationContext, StructureAnalysis, CommandContext } from '../../types';
import type { LayerType } from '../../../hierarchyAnalysis/types';
import { generateNodeDNA, extractParentContext, mergeDNAWithParent } from '../../../hierarchyAnalysis/nodeDNAGenerator';
import { analyzeStructure, ParsedEnhancements } from '../../analyzers/structureAnalyzer';
import { findParentLocationNode, findParentRegionNode } from '../../navigationHelpers';
import { PipelineHelper } from '../../../pipelines/shared/pipelineHelpers';
import { resolveAncestryDNASkippingPassThrough, findAncestryChain } from '../../../hierarchyAnalysis/dnaMerge';
import { storageService } from '../../../../services/storage/storageService';

export interface SpaceAnalysisInput {
  userPrompt: string;
  nodeName: string;
  nodeType: string;
  perspective: 'interior' | 'exterior' | 'open-air';
  context: NavigationContext;
  apiKey: string;
  helper: PipelineHelper | null;
  isGotoCommand: boolean;
  isFromLocation: boolean;
  parsedEnhancements?: ParsedEnhancements;
  cmdCtx?: CommandContext;
  resolvedParentDNA?: any;
}

export interface SpaceAnalysisOutput {
  structureAnalysis: StructureAnalysis;
  dnaResult: any;
  updatedPerspective: 'interior' | 'exterior' | 'open-air';
  parentDNAForImagePrompt: any;
  /** 
   * Surroundings DNA for window/view context
   * Resolved from ancestry, skipping pass-through nodes
   * Shows correct world DNA through windows even when parent is pass-through
   */
  surroundingsDNA?: any;
}

/**
 * Run space analysis step (parallel structure + DNA generation)
 */
export async function runSpaceAnalysisStep(
  input: SpaceAnalysisInput
): Promise<SpaceAnalysisOutput> {
  const {
    userPrompt,
    nodeName,
    nodeType,
    perspective,
    context,
    apiKey,
    helper,
    isGotoCommand,
    isFromLocation,
    parsedEnhancements,
    cmdCtx,
    resolvedParentDNA
  } = input;

  if (helper) {
    helper.startStage('space_analysis', 'Analyzing space (structure + DNA)...');
  }

  console.log(`\n🔄 [Pipeline] Starting parallel Space Analysis for: "${userPrompt}"`);

  // Run Structure Analysis and DNA Generation in PARALLEL
  const [structureAnalysis, dnaResult] = await Promise.all([
    // Structure Analysis (determines physical/spatial properties)
    analyzeStructure(apiKey, userPrompt, context, perspective, parsedEnhancements, { isGotoCommand }),
    
    // DNA Generation (determines visual/atmospheric properties)
    (async () => {
      // CRITICAL: Use pre-resolved parent DNA if available
      let parentDNA: any;
      if (cmdCtx?.resolvedParentDNA) {
        parentDNA = cmdCtx.resolvedParentDNA;
        console.log(`[DNA] Using parent DNA from CommandContext`);
        console.log(`  - architectural_tone: ${parentDNA.architectural_tone || 'null'}`);
        console.log(`  - palette_bias: ${parentDNA.palette_bias || 'null'}`);
      } else if (resolvedParentDNA) {
        parentDNA = resolvedParentDNA;
        console.log(`[DNA] Using PRE-RESOLVED parent DNA from route handler`);
        console.log(`  - architectural_tone: ${parentDNA.architectural_tone || 'null'}`);
        console.log(`  - palette_bias: ${parentDNA.palette_bias || 'null'}`);
      } else if (isGotoCommand && isFromLocation) {
        const { parentRegionDNA } = findParentRegionNode(context);
        parentDNA = parentRegionDNA;
        console.log(`[DNA] GOTO from location: Using REGION DNA from context (fallback)`);
      } else {
        const { parentLocationDNA } = findParentLocationNode(context);
        parentDNA = parentLocationDNA;
      }
      
      const parentContext = parentDNA
        ? extractParentContext(parentDNA)
        : undefined;
      
      return generateNodeDNA(
        apiKey,
        userPrompt,
        nodeName,
        nodeType as LayerType,
        userPrompt,
        parentContext,
        { isGotoCommand }
      );
    })()
  ]);

  // Update perspective from analysis
  let updatedPerspective = structureAnalysis.perspective as 'interior' | 'exterior' | 'open-air';

  // CRITICAL: If roofType is 'open-sky', the space is EXTERIOR
  if (structureAnalysis.structure.roofType === 'open-sky' && updatedPerspective === 'interior') {
    console.log(`[Pipeline] Overriding perspective from '${updatedPerspective}' to 'exterior' (roofType is open-sky)`);
    updatedPerspective = 'exterior';
    structureAnalysis.perspective = 'exterior';
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ SPACE ANALYSIS COMPLETE (Parallel)');
  console.log('═══════════════════════════════════════════════════════════');
  console.log(`  Name: ${structureAnalysis.name}`);
  console.log(`  Perspective: ${structureAnalysis.perspective}`);
  console.log(`  Form: ${structureAnalysis.structure.form}`);
  console.log(`  Scale: ${structureAnalysis.structure.scale}`);
  console.log(`  Functional Type: ${structureAnalysis.structure.functionalType}`);
  console.log(`  Required Elements: ${structureAnalysis.structure.requiredElements?.length || 0}`);
  console.log(`  DNA Generated: ${dnaResult.name ? '✓' : '✗'}`);
  console.log('═══════════════════════════════════════════════════════════\n');

  if (helper) {
    helper.completeStage('space_analysis', 'Space analyzed', {
      name: structureAnalysis.name,
      perspective: structureAnalysis.perspective,
      form: structureAnalysis.structure.form
    });
  }

  // Determine parent DNA for image prompt
  let parentDNAForImagePrompt: any;
  if (cmdCtx?.resolvedParentDNA) {
    parentDNAForImagePrompt = cmdCtx.resolvedParentDNA;
  } else if (resolvedParentDNA) {
    parentDNAForImagePrompt = resolvedParentDNA;
  } else if (isGotoCommand && isFromLocation) {
    const { parentRegionDNA } = findParentRegionNode(context);
    parentDNAForImagePrompt = parentRegionDNA;
  } else {
    const { parentLocationDNA } = findParentLocationNode(context);
    parentDNAForImagePrompt = parentLocationDNA;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // RESOLVE SURROUNDINGS DNA FOR WINDOW VIEWS
  // This ensures windows show the correct world exterior, not the interior concept
  // Uses ancestry resolution that SKIPS pass-through nodes
  // ═══════════════════════════════════════════════════════════════════════════
  let surroundingsDNA: any = undefined;
  
  // Only needed for interior spaces (exterior spaces don't have "windows to outside")
  if (updatedPerspective === 'interior') {
    try {
      // Load worlds data to access nodes and worldTrees
      const worldsData = await storageService.loadWorlds();
      if (worldsData?.nodes && worldsData?.worldTrees) {
        // Get the current node ID (parent of the new node being created)
        const currentNodeId = context.currentNode.id;
        
        // Resolve ancestry DNA, skipping pass-through nodes
        // This gives us the WORLD DNA for window views, not the pass-through location DNA
        surroundingsDNA = resolveAncestryDNASkippingPassThrough(
          currentNodeId,
          worldsData.nodes,
          worldsData.worldTrees
        );
        
        if (surroundingsDNA) {
          console.log(`[SpaceAnalysis] Resolved surroundings DNA for window views:`);
          console.log(`  - genre: ${surroundingsDNA.genre || 'null'}`);
          console.log(`  - architectural_tone: ${surroundingsDNA.architectural_tone || 'null'}`);
        } else {
          console.log(`[SpaceAnalysis] No surroundings DNA found (using parentDNA fallback)`);
        }
      }
    } catch (error) {
      console.warn(`[SpaceAnalysis] Could not resolve surroundings DNA:`, error);
      // Fallback - use parentDNA for surroundings
      surroundingsDNA = parentDNAForImagePrompt;
    }
  }

  return {
    structureAnalysis,
    dnaResult,
    updatedPerspective,
    parentDNAForImagePrompt,
    surroundingsDNA
  };
}

/**
 * Merge DNA with parent DNA for CSS-like inheritance
 */
export function mergeDNA(dna: any, parentDNA: any): any {
  return mergeDNAWithParent(dna, parentDNA);
}
