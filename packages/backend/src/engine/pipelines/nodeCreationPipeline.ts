/**
 * Node Creation Pipeline
 * 
 * DNA-FIRST pipeline for world tree creation:
 * 1. Parse prompt → HierarchySpec (detect depth, single branch)
 * 2. Generate DEEPEST NODE DNA first (rich details for image)
 * 3. Generate IMAGE using DNA (parallel with parent DNA)
 * 4. Generate PARENT CHAIN DNA (parallel with image)
 * 5. Build WorldTree for frontend
 * 
 * INTERIOR FLOW (when niche/interior detected):
 * 1. Parse prompt → detect niche intent
 * 2. Create exterior hierarchy (host/region/location) WITHOUT image
 * 3. Run GO_INSIDE pipeline to create niche WITH proper DNA inheritance
 * 4. Attach niche to location in WorldTree
 * 
 * Key optimization: DNA generated BEFORE image for rich prompts
 */

import { PipelineHelper } from './shared/pipelineHelpers';
import { parsePromptToHierarchy } from '../nodeCreation/detection/parsePromptToHierarchy';
import { WorldTreeBuilder } from '../../services/worldTree/builder';
import mediaService from '../../services/media/mediaService';
import { generateImage, generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { deepestNodeDNAGeneration } from '../generation/prompts/locations/deepestNodeDNA';
import { worldTreeImagePromptContext } from '../generation/prompts/locations/worldTreeImagePrompt';
import { parentChainDNAGeneration, type HierarchyNodeInfo } from '../generation/prompts/locations/parentChainDNA';
import { applyMorfeumStyle } from '../generation/shared/applyMorfeumStyle';
import type { TreeNode } from '../../services/worldTree/types';
import { runCreateLocationNodePipeline } from '../navigation/pipelines/createNodePipeline';
import type { NavigationContext, NavigationDecision, IntentResult } from '../navigation/types';

/**
 * Clean unwanted DNA fields that LLM sometimes adds
 */
function cleanDNA(dna: any): any {
  if (!dna) return dna;
  const cleaned = { ...dna };
  delete cleaned.semantic;
  delete cleaned.visual;
  delete cleaned.profile;
  return cleaned;
}

/**
 * Build hierarchy structure from parsed response + DNA data
 * @param regionIsPassThrough - If true, create minimal pass-through region
 */
function buildHierarchyStructure(
  parsedHierarchy: any,
  deepestNodeDNA: any,
  parentDNA: any,
  deepestType: string,
  regionIsPassThrough: boolean = false
): any {
  const structure: any = {
    host: null
  };

  // Get DNA for each level
  const hostDNA = parentDNA?.host || null;
  const regionDNA = parentDNA?.region || null;
  const locationDNA = parentDNA?.location || null;

  // Build host
  if (parsedHierarchy.host) {
    structure.host = {
      type: 'host',
      name: hostDNA?.name || parsedHierarchy.host.name,
      description: hostDNA?.description || parsedHierarchy.host.description,
      dna: cleanDNA(hostDNA?.dna || (deepestType === 'host' ? deepestNodeDNA.dna : null)),
      navigableElements: hostDNA?.navigableElements || (deepestType === 'host' ? deepestNodeDNA.navigableElements : []),
      dominantElements: hostDNA?.dominantElements || (deepestType === 'host' ? deepestNodeDNA.dominantElements : []),
      uniqueIdentifiers: hostDNA?.uniqueIdentifiers || (deepestType === 'host' ? deepestNodeDNA.uniqueIdentifiers : []),
      searchDesc: hostDNA?.searchDesc || (deepestType === 'host' ? deepestNodeDNA.searchDesc : ''),
      slug: hostDNA?.slug || (deepestType === 'host' ? deepestNodeDNA.slug : ''),
      regions: [],
    };
  }

  if (!structure.host) return null;

  // Build region
  if (parsedHierarchy.region) {
    // Check if this should be a pass-through region
    if (regionIsPassThrough && deepestType !== 'region') {
      // Create minimal pass-through region (no DNA, inherits from host)
      structure.host.regions = [{
        type: 'region',
        name: 'Region',
        description: '',
        isPassThrough: true,
        dna: null,
        slug: 'region',
        locations: [],
      }];
    } else {
      // Create normal region with full DNA
      structure.host.regions = [{
        type: 'region',
        name: regionDNA?.name || parsedHierarchy.region.name,
        description: regionDNA?.description || parsedHierarchy.region.description,
        dna: cleanDNA(regionDNA?.dna || (deepestType === 'region' ? deepestNodeDNA.dna : null)),
        navigableElements: regionDNA?.navigableElements || (deepestType === 'region' ? deepestNodeDNA.navigableElements : []),
        dominantElements: regionDNA?.dominantElements || (deepestType === 'region' ? deepestNodeDNA.dominantElements : []),
        uniqueIdentifiers: regionDNA?.uniqueIdentifiers || (deepestType === 'region' ? deepestNodeDNA.uniqueIdentifiers : []),
        searchDesc: regionDNA?.searchDesc || (deepestType === 'region' ? deepestNodeDNA.searchDesc : ''),
        slug: regionDNA?.slug || (deepestType === 'region' ? deepestNodeDNA.slug : ''),
        locations: [],
      }];
    }

    // Build location
    if (parsedHierarchy.location) {
      structure.host.regions[0].locations = [{
        type: 'location',
        name: locationDNA?.name || parsedHierarchy.location.name,
        description: locationDNA?.description || parsedHierarchy.location.description,
        dna: cleanDNA(locationDNA?.dna || (deepestType === 'location' ? deepestNodeDNA.dna : null)),
        navigableElements: locationDNA?.navigableElements || (deepestType === 'location' ? deepestNodeDNA.navigableElements : []),
        dominantElements: locationDNA?.dominantElements || (deepestType === 'location' ? deepestNodeDNA.dominantElements : []),
        uniqueIdentifiers: locationDNA?.uniqueIdentifiers || (deepestType === 'location' ? deepestNodeDNA.uniqueIdentifiers : []),
        searchDesc: locationDNA?.searchDesc || (deepestType === 'location' ? deepestNodeDNA.searchDesc : ''),
        slug: locationDNA?.slug || (deepestType === 'location' ? deepestNodeDNA.slug : ''),
        niches: [],
      }];

      // Build niche
      if (parsedHierarchy.niche) {
        structure.host.regions[0].locations[0].niches = [{
          type: 'niche',
          name: deepestNodeDNA.name || parsedHierarchy.niche.name,
          description: deepestNodeDNA.description || parsedHierarchy.niche.description,
          dna: cleanDNA(deepestNodeDNA.dna),
          navigableElements: deepestNodeDNA.navigableElements || [],
          dominantElements: deepestNodeDNA.dominantElements || [],
          uniqueIdentifiers: deepestNodeDNA.uniqueIdentifiers || [],
          searchDesc: deepestNodeDNA.searchDesc || '',
          slug: deepestNodeDNA.slug || '',
        }];
      }
    }
  }

  return structure;
}

/**
 * Find the deepest node in the tree and assign media
 */
function assignMediaToTree(
  tree: TreeNode,
  imageUrl: string,
  imagePrompt: string
): TreeNode {
  function findDeepestNode(node: TreeNode): TreeNode {
    if (!node.children || node.children.length === 0) {
      return node;
    }
    return findDeepestNode(node.children[0]);
  }

  const deepestNode = findDeepestNode(tree);

  // Create media entry
  const media = mediaService.createMedia({
    type: 'image',
    url: imageUrl,
    metadata: {
      prompt: imagePrompt,
      model: 'FLUX',
    },
    entityRefs: [deepestNode.id]
  });

  deepestNode.primaryMedia = media.id;

  return tree;
}

/**
 * Extract parent nodes for DNA generation
 * @param regionIsPassThrough - If true, skip region DNA generation
 */
function extractParentNodes(
  parsedHierarchy: any,
  deepestType: string,
  regionIsPassThrough: boolean = false
): HierarchyNodeInfo[] {
  const parents: HierarchyNodeInfo[] = [];

  // Add host if deepest is not host
  if (deepestType !== 'host' && parsedHierarchy.host) {
    parents.push({
      type: 'host',
      name: parsedHierarchy.host.name,
      description: parsedHierarchy.host.description,
    });
  }

  // Add region if deepest is location or niche (SKIP if pass-through)
  if ((deepestType === 'location' || deepestType === 'niche') && parsedHierarchy.region && !regionIsPassThrough) {
    parents.push({
      type: 'region',
      name: parsedHierarchy.region.name,
      description: parsedHierarchy.region.description,
    });
  }

  // Add location if deepest is niche
  if (deepestType === 'niche' && parsedHierarchy.location) {
    parents.push({
      type: 'location',
      name: parsedHierarchy.location.name,
      description: parsedHierarchy.location.description,
    });
  }

  // Return in order from deepest parent to host (bottom-up)
  return parents.reverse();
}

/**
 * Build parent chain for context in DNA generation
 */
function buildParentChain(
  parsedHierarchy: any,
  deepestType: string
): Array<{ type: string; name: string; description: string }> {
  const chain: Array<{ type: string; name: string; description: string }> = [];

  if (deepestType === 'host') return chain;

  if (parsedHierarchy.host) {
    chain.push({
      type: 'host',
      name: parsedHierarchy.host.name,
      description: parsedHierarchy.host.description,
    });
  }

  if (deepestType === 'region') return chain;

  if (parsedHierarchy.region) {
    chain.push({
      type: 'region',
      name: parsedHierarchy.region.name,
      description: parsedHierarchy.region.description,
    });
  }

  if (deepestType === 'location') return chain;

  if (parsedHierarchy.location) {
    chain.push({
      type: 'location',
      name: parsedHierarchy.location.name,
      description: parsedHierarchy.location.description,
    });
  }

  return chain;
}

/**
 * Get deepest node info from parsed hierarchy
 */
function getDeepestNodeInfo(parsedHierarchy: any): {
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
} {
  if (parsedHierarchy.niche) {
    return {
      type: 'niche',
      name: parsedHierarchy.niche.name,
      description: parsedHierarchy.niche.description,
    };
  }
  if (parsedHierarchy.location) {
    return {
      type: 'location',
      name: parsedHierarchy.location.name,
      description: parsedHierarchy.location.description,
    };
  }
  if (parsedHierarchy.region) {
    return {
      type: 'region',
      name: parsedHierarchy.region.name,
      description: parsedHierarchy.region.description,
    };
  }
  return {
    type: 'host',
    name: parsedHierarchy.host.name,
    description: parsedHierarchy.host.description,
  };
}

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
async function runInteriorFlow(
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

/**
 * Run the Node Creation Pipeline (DNA-FIRST)
 * 
 * Two flows:
 * 1. EXTERIOR (default): Creates full hierarchy with image on deepest node
 * 2. INTERIOR (when niche detected): Creates exterior hierarchy first, then GO_INSIDE for niche
 * 
 * @param spawnId - Unique spawn identifier
 * @param prompt - User's location prompt
 * @param apiKey - API key for LLM calls
 * @param signal - Abort signal for cancellation
 */
export async function runNodeCreationPipeline(
  spawnId: string,
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<void> {
  // Start with default worldTree pipeline type
  // Will be updated to worldTreeInterior if niche detected during classification
  const helper = new PipelineHelper(spawnId, 'NodeCreationPipeline', 'worldTree');

  try {
    helper.started('Starting location creation...');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 1: Parse prompt into hierarchy structure
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('hierarchy_classification', 'Analyzing your description...');
    const parsed = await parsePromptToHierarchy(prompt, apiKey);
    const { spec, depth, isInterior, regionIsPassThrough, rawResponse } = parsed;
    
    helper.completeStage('hierarchy_classification', `Structure detected: ${depth} level${depth > 1 ? 's' : ''}`, {
      depth,
      isInterior,
      regionIsPassThrough,
      hierarchy: rawResponse,
    });

    if (signal.aborted) throw new Error('Aborted');

    // ═══════════════════════════════════════════════════════════════════════
    // INTERIOR FLOW: If niche/interior detected, use two-phase approach
    // ═══════════════════════════════════════════════════════════════════════
    if (isInterior && rawResponse.niche) {
      // Update frontend with correct pipeline config (8 steps instead of 6)
      helper.updatePipelineConfig('worldTreeInterior', 'Interior detected, updating pipeline...');
      
      await runInteriorFlow(helper, spawnId, prompt, apiKey, signal, rawResponse, regionIsPassThrough);
      return;
    }

    // ═══════════════════════════════════════════════════════════════════════
    // EXTERIOR FLOW: Standard hierarchy creation with image
    // ═══════════════════════════════════════════════════════════════════════
    
    // Get deepest node info
    const deepestInfo = getDeepestNodeInfo(rawResponse);
    const parentChain = buildParentChain(rawResponse, deepestInfo.type);

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 2: Generate DEEPEST NODE DNA (for rich image prompts)
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('deepest_dna_generation', `Creating DNA for ${deepestInfo.type}...`);

    const deepestDNAPrompt = deepestNodeDNAGeneration(
      prompt,
      deepestInfo.type,
      deepestInfo.name,
      deepestInfo.description,
      {}, // No classification data available from parsing
      parentChain
    );

    const deepestDNAResult = await generateText(
      apiKey,
      [{ role: 'user', content: deepestDNAPrompt }],
      AI_MODELS.SEED_GENERATION
    );

    if (deepestDNAResult.error || !deepestDNAResult.data) {
      throw new Error(deepestDNAResult.error || 'Failed to generate deepest node DNA');
    }

    const deepestNodeDNA = parseJSON<any>(deepestDNAResult.data.text);
    
    helper.completeStage('deepest_dna_generation', 'DNA generated', {
      nodeType: deepestInfo.type,
      dna: deepestNodeDNA,
    });

    if (signal.aborted) throw new Error('Aborted');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 3: Generate IMAGE PROMPT using DNA (LLM synthesis)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Build context prompt for LLM to generate FLUX image description
    const imageContextPrompt = worldTreeImagePromptContext({
      nodeType: deepestInfo.type,
      nodeName: deepestNodeDNA.name || deepestInfo.name,
      dna: deepestNodeDNA.dna || {},
      originalPrompt: prompt,
      parentChain,
    });

    helper.startStage('image_prompt_generation', 'Crafting visual description...');

    // Step 1: LLM generates the actual FLUX image description from context
    const imagePromptResult = await generateText(
      apiKey,
      [{ role: 'user', content: imageContextPrompt }],
      AI_MODELS.SEED_GENERATION
    );

    if (imagePromptResult.error || !imagePromptResult.data) {
      throw new Error(imagePromptResult.error || 'Failed to generate image prompt');
    }

    // Apply Morfeum visual style for consistent look
    const imagePrompt = applyMorfeumStyle(imagePromptResult.data.text.trim());

    helper.completeStage('image_prompt_generation', 'Visual description ready', { prompt: imagePrompt });

    if (signal.aborted) throw new Error('Aborted');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 4: Generate IMAGE using FLUX + PARALLEL: Parent Chain DNA
    // ═══════════════════════════════════════════════════════════════════════
    
    helper.startStage('image_generation', 'Generating image...');

    // Step 2: Use the LLM-generated prompt for image generation
    // Start parent chain DNA generation in PARALLEL (silently - no progress event yet)
    const parentNodes = extractParentNodes(rawResponse, deepestInfo.type, regionIsPassThrough);
    let parentDNAPromise: Promise<any> | null = null;

    if (parentNodes.length > 0) {
      const parentDNAPrompt = parentChainDNAGeneration(
        deepestNodeDNA.dna || {},
        deepestInfo.type,
        parentNodes,
        prompt
      );

      if (parentDNAPrompt) {
        // Start API call in parallel, but DON'T emit progress event yet
        // This prevents the progress bar from going backwards
        parentDNAPromise = generateText(
          apiKey,
          [{ role: 'user', content: parentDNAPrompt }],
          AI_MODELS.SEED_GENERATION
        );
      }
    }

    // Start image generation (parallel with parent DNA)
    const imagePromise = generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');

    // Wait for image generation
    const imageResult = await imagePromise;

    if (signal.aborted) throw new Error('Aborted');

    if (imageResult.error || !imageResult.data?.images?.[0]?.url) {
      throw new Error(imageResult.error || 'Image generation failed');
    }

    const imageUrl = imageResult.data.images[0].url;
    helper.completeStage('image_generation', 'Visual ready', { imageUrl });

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 5: Wait for Parent Chain DNA (was started in parallel)
    // ═══════════════════════════════════════════════════════════════════════
    
    // Now emit progress for parent DNA (after image_generation is complete)
    let parentDNA: any = null;
    if (parentDNAPromise) {
      helper.startStage('parent_dna_generation', 'Building world structure...');
      
      const parentDNAResult = await parentDNAPromise;
      
      if (parentDNAResult.error || !parentDNAResult.data) {
        // Log warning but don't fail - we have the deepest node DNA
        console.warn('Parent chain DNA generation failed:', parentDNAResult.error);
        helper.completeStage('parent_dna_generation', 'Using default structure');
      } else {
        parentDNA = parseJSON<any>(parentDNAResult.data.text);
        helper.completeStage('parent_dna_generation', 'World structure complete');
      }
    }

    if (signal.aborted) throw new Error('Aborted');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 5: Build WorldTree structure for frontend
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('tree_building', 'Building world tree...');
    
    // Build the proper nested hierarchy structure with all DNA
    const hierarchyStructure = buildHierarchyStructure(
      rawResponse,
      deepestNodeDNA,
      parentDNA,
      deepestInfo.type,
      regionIsPassThrough
    );
    
    if (!hierarchyStructure) {
      throw new Error('Failed to build hierarchy structure');
    }

    // Use WorldTreeBuilder to create proper TreeNode structure
    const worldTree = WorldTreeBuilder.build(spawnId, hierarchyStructure);

    // Assign media to deepest node
    assignMediaToTree(worldTree, imageUrl, imagePrompt);

    helper.completeStage('tree_building', 'World tree ready');

    // Stage 5: Complete - Send worldTree for frontend compatibility
    helper.completed('Location created successfully', {
      worldTree,
      imageUrl,
    });

  } catch (error: any) {
    if (signal.aborted) {
      helper.cancelled();
    } else {
      helper.error(error);
    }
  }
}
