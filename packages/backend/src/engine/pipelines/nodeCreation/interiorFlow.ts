/**
 * Interior Flow for Node Creation Pipeline
 * Handles the two-phase approach for interior/niche creation
 */

import { PipelineHelper } from '../shared/pipelineHelpers';
import { WorldTreeBuilder } from '../../../services/worldTree/builder';
import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { parseJSON } from '../../utils/parseJSON';
import { deepestNodeDNAGeneration } from '../../generation/prompts/locations/deepestNodeDNA';
import { parentChainDNAGeneration } from '../../generation/prompts/locations/parentChainDNA';
import type { TreeNode } from '../../../services/worldTree/types';
import { runCreateLocationNodePipeline } from '../../navigation/pipelines/createNodePipeline';
import type { NavigationContext, NavigationDecision, IntentResult } from '../../navigation/types';
import { buildHierarchyStructure, buildParentChain, extractParentNodes } from './helpers';

/**
 * Run the INTERIOR FLOW: Creates exterior hierarchy, then GO_INSIDE for niche
 * 
 * Steps:
 * 1. Generate location DNA (location is now deepest, not niche)
 * 2. Generate parent DNA (host/region)
 * 3. Build WorldTree with host/region/location (no image on location)
 * 4. Create NavigationContext from location
 * 5. Run GO_INSIDE pipeline to create niche with proper DNA inheritance
 * 6. Attach niche to location in WorldTree
 */
export async function runInteriorFlow(
  helper: PipelineHelper,
  spawnId: string,
  prompt: string,
  apiKey: string,
  signal: AbortSignal,
  rawResponse: any,
  regionIsPassThrough: boolean
): Promise<void> {
  // Strip niche from hierarchy - treat location as deepest for exterior creation
  const exteriorHierarchy = {
    ...rawResponse,
    niche: undefined, // Remove niche from hierarchy
  };
  
  // Get niche info for later GO_INSIDE call
  const nicheInfo = {
    name: rawResponse.niche.name,
    description: rawResponse.niche.description,
  };

  // Location is now the deepest node for exterior hierarchy
  const locationInfo = {
    type: 'location' as const,
    name: rawResponse.location.name,
    description: rawResponse.location.description,
  };
  const parentChain = buildParentChain(exteriorHierarchy, 'location');

  // ═══════════════════════════════════════════════════════════════════════
  // Stage 2: Generate LOCATION DNA (location is deepest for exterior)
  // ═══════════════════════════════════════════════════════════════════════
  helper.startStage('location_dna_generation', `Creating DNA for location...`);

  // Create exterior-focused prompt for location DNA generation
  // The user's prompt describes an interior space, but the location needs EXTERIOR DNA
  const exteriorLocationPrompt = `EXTERIOR VIEW of "${locationInfo.name}" - the structure or formation that contains "${nicheInfo.name}".

Interior description: ${nicheInfo.description}

Generate the EXTERIOR appearance - what this location looks like from OUTSIDE:
- The entrance/opening leading to the interior
- External surfaces and materials (consistent with the interior)
- The immediate surrounding environment

Maintain the same architectural style and materials as the interior, viewed from outside.
Original concept: ${prompt}`;

  const locationDNAPrompt = deepestNodeDNAGeneration(
    exteriorLocationPrompt,
    'location',
    locationInfo.name,
    `${locationInfo.description} EXTERIOR VIEW.`,
    {},
    parentChain
  );

  const locationDNAResult = await generateText(
    apiKey,
    [{ role: 'user', content: locationDNAPrompt }],
    AI_MODELS.SEED_GENERATION
  );

  if (locationDNAResult.error || !locationDNAResult.data) {
    throw new Error(locationDNAResult.error || 'Failed to generate location DNA');
  }

  const locationDNA = parseJSON<any>(locationDNAResult.data.text);
  
  helper.completeStage('location_dna_generation', 'Location DNA generated', {
    nodeType: 'location',
    dna: locationDNA,
  });

  if (signal.aborted) throw new Error('Aborted');

  // ═══════════════════════════════════════════════════════════════════════
  // Stage 3: Generate PARENT CHAIN DNA (host/region)
  // ═══════════════════════════════════════════════════════════════════════
  const parentNodes = extractParentNodes(exteriorHierarchy, 'location', regionIsPassThrough);
  let parentDNA: any = null;

  if (parentNodes.length > 0) {
    helper.startStage('parent_dna_generation', 'Building world structure...');
    
    const parentDNAPrompt = parentChainDNAGeneration(
      locationDNA.dna || {},
      'location',
      parentNodes,
      prompt
    );

    if (parentDNAPrompt) {
      const parentDNAResult = await generateText(
        apiKey,
        [{ role: 'user', content: parentDNAPrompt }],
        AI_MODELS.SEED_GENERATION
      );
      
      if (parentDNAResult.error || !parentDNAResult.data) {
        console.warn('Parent chain DNA generation failed:', parentDNAResult.error);
        helper.completeStage('parent_dna_generation', 'Using default structure');
      } else {
        parentDNA = parseJSON<any>(parentDNAResult.data.text);
        helper.completeStage('parent_dna_generation', 'World structure complete');
      }
    } else {
      helper.completeStage('parent_dna_generation', 'No parent DNA needed');
    }
  }

  if (signal.aborted) throw new Error('Aborted');

  // ═══════════════════════════════════════════════════════════════════════
  // Stage 4: Build WorldTree (exterior only, no niche yet)
  // ═══════════════════════════════════════════════════════════════════════
  helper.startStage('tree_building', 'Building exterior world tree...');
  
  // Build hierarchy structure WITHOUT niche
  const hierarchyStructure = buildHierarchyStructure(
    exteriorHierarchy,
    locationDNA,
    parentDNA,
    'location', // Location is deepest
    regionIsPassThrough
  );
  
  if (!hierarchyStructure) {
    throw new Error('Failed to build hierarchy structure');
  }

  // Build the world tree
  const worldTree = WorldTreeBuilder.build(spawnId, hierarchyStructure);
  
  // Find the location node (deepest at this point)
  function findLocationNode(node: TreeNode): TreeNode | null {
    if (node.type === 'location') return node;
    if (node.children) {
      for (const child of node.children) {
        const found = findLocationNode(child);
        if (found) return found;
      }
    }
    return null;
  }
  
  const locationNode = findLocationNode(worldTree);
  if (!locationNode) {
    throw new Error('Failed to find location node in tree');
  }

  helper.completeStage('tree_building', 'Exterior tree ready');

  if (signal.aborted) throw new Error('Aborted');

  // ═══════════════════════════════════════════════════════════════════════
  // Stage 5-8: Run GO_INSIDE pipeline to create niche
  // ═══════════════════════════════════════════════════════════════════════
  
  // Build NavigationContext from the location node
  const navigationContext: NavigationContext = {
    currentNode: {
      id: locationNode.id,
      type: 'location',
      name: locationNode.name,
      parentId: null, // Parent relationship is tracked in tree structure, not on node
      data: {
        description: locationDNA.description || locationInfo.description,
        looks: locationDNA.dna?.looks,
        dominantElements: locationDNA.dominantElements || [],
        navigableElements: locationDNA.navigableElements || [],
        uniqueIdentifiers: locationDNA.uniqueIdentifiers || [],
        searchDesc: locationDNA.searchDesc || '',
      },
      dna: locationDNA.dna,
    },
  };

  // Build NavigationDecision for GO_INSIDE
  const decision: NavigationDecision = {
    action: 'create_niche',
    newNodeType: 'niche',
    newNodeName: nicheInfo.name,
    parentNodeId: locationNode.id,
    perspective: 'interior',
    reasoning: 'Interior spawn: creating niche via GO_INSIDE pipeline',
  };

  // Build IntentResult for GO_INSIDE
  const intent: IntentResult = {
    intent: 'GO_INSIDE',
    target: nicheInfo.description || nicheInfo.name,
    spaceType: 'interior',
  };

  // Run the navigation pipeline for niche creation
  // NOTE: isSubPipeline: true prevents double progress bar - parent pipeline handles started/completed
  const nicheResult = await runCreateLocationNodePipeline(
    decision,
    navigationContext,
    intent,
    apiKey,
    {
      nodeType: 'niche',
      generateImage: true,
      perspective: 'interior',
      userPrompt: `${nicheInfo.name}: ${nicheInfo.description}`,
      isSubPipeline: true, // Parent pipeline (runInteriorFlow) handles started/completed events
    },
    spawnId // Pass spawnId so pipeline uses same SSE channel
  );

  // Attach niche to location's children in the world tree
  if (!locationNode.children) {
    locationNode.children = [];
  }
  locationNode.children.push({
    ...nicheResult.node,
    parentId: locationNode.id,
  });

  // Complete the pipeline
  helper.completed('Interior location created successfully', {
    worldTree,
    imageUrl: nicheResult.imageUrl,
  });
}
