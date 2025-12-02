/**
 * Node Creation Pipeline
 * 
 * New pipeline that uses the nodeCreation system with proper SSE events.
 * Replaces worldTreePipeline with cleaner, single-branch approach.
 * 
 * Flow:
 * 1. Parse prompt → HierarchySpec (detect depth, single branch)
 * 2. Create nodes with per-type DNA prompts
 * 3. Generate image on deepest node
 * 4. Build WorldTree for frontend
 * 5. Send completion
 */

import { PipelineHelper } from './shared/pipelineHelpers';
import { parsePromptToHierarchy } from '../nodeCreation/detection/parsePromptToHierarchy';
import { createHierarchy, createProgressConfig } from '../nodeCreation';
import { WorldTreeBuilder } from '../../services/worldTree/builder';
import mediaService from '../../services/media/mediaService';
import { generateImage } from '../../services/mzoo';
import { locationImageGeneration } from '../generation/prompts/locations/locationImageGeneration';
import type { HierarchySpec } from '../nodeCreation/types';
import type { TreeNode } from '../../services/worldTree/types';
import type { HierarchyNode } from '../hierarchyAnalysis/types';

/**
 * Convert rawResponse from parsePromptToHierarchy to nodeChain format
 * for locationImageGeneration
 */
function buildNodeChainFromParsed(rawResponse: any): HierarchyNode[] {
  const chain: HierarchyNode[] = [];
  
  if (rawResponse.host) {
    chain.push({
      type: 'host',
      name: rawResponse.host.name,
      description: rawResponse.host.description,
    } as HierarchyNode);
  }
  
  if (rawResponse.region) {
    chain.push({
      type: 'region',
      name: rawResponse.region.name,
      description: rawResponse.region.description,
    } as HierarchyNode);
  }
  
  if (rawResponse.location) {
    chain.push({
      type: 'location',
      name: rawResponse.location.name,
      description: rawResponse.location.description,
    } as HierarchyNode);
  }
  
  if (rawResponse.niche) {
    chain.push({
      type: 'niche',
      name: rawResponse.niche.name,
      description: rawResponse.niche.description,
    } as HierarchyNode);
  }
  
  return chain;
}

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
 * Build a proper hierarchy structure from our flat nodes
 * This creates the nested structure that WorldTreeBuilder expects
 */
function buildHierarchyStructure(
  nodes: any[],
  parsedHierarchy: any
): any {
  // Find nodes by type
  const hostNode = nodes.find(n => n.type === 'host');
  const regionNode = nodes.find(n => n.type === 'region');
  const locationNode = nodes.find(n => n.type === 'location');
  const nicheNode = nodes.find(n => n.type === 'niche');

  // Build proper nested structure for WorldTreeBuilder
  const structure: any = {
    host: hostNode ? {
      type: 'host',
      name: hostNode.name,
      description: hostNode.description,
      dna: cleanDNA(hostNode.dna),
      navigableElements: hostNode.navigableElements || [],
      dominantElements: hostNode.dominantElements || [],
      uniqueIdentifiers: hostNode.uniqueIdentifiers || [],
      searchDesc: hostNode.searchDesc || '',
      slug: hostNode.slug || '',
      regions: [],
    } : null
  };

  if (!structure.host) return null;

  // Add region
  if (regionNode) {
    structure.host.regions = [{
      type: 'region',
      name: regionNode.name,
      description: regionNode.description,
      dna: cleanDNA(regionNode.dna),
      navigableElements: regionNode.navigableElements || [],
      dominantElements: regionNode.dominantElements || [],
      uniqueIdentifiers: regionNode.uniqueIdentifiers || [],
      searchDesc: regionNode.searchDesc || '',
      slug: regionNode.slug || '',
      locations: [],
    }];

    // Add location
    if (locationNode) {
      structure.host.regions[0].locations = [{
        type: 'location',
        name: locationNode.name,
        description: locationNode.description,
        dna: cleanDNA(locationNode.dna),
        navigableElements: locationNode.navigableElements || [],
        dominantElements: locationNode.dominantElements || [],
        uniqueIdentifiers: locationNode.uniqueIdentifiers || [],
        searchDesc: locationNode.searchDesc || '',
        slug: locationNode.slug || '',
        niches: [],
      }];

      // Add niche
      if (nicheNode) {
        structure.host.regions[0].locations[0].niches = [{
          type: 'niche',
          name: nicheNode.name,
          description: nicheNode.description,
          dna: cleanDNA(nicheNode.dna),
          navigableElements: nicheNode.navigableElements || [],
          dominantElements: nicheNode.dominantElements || [],
          uniqueIdentifiers: nicheNode.uniqueIdentifiers || [],
          searchDesc: nicheNode.searchDesc || '',
          slug: nicheNode.slug || '',
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
 * Run the Node Creation Pipeline
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
  const helper = new PipelineHelper(spawnId, 'NodeCreationPipeline', 'worldTree');

  try {
    helper.started('Starting location creation...');

    // Stage 1: Parse prompt into hierarchy structure
    helper.startStage('hierarchy_classification', 'Analyzing your description...');
    
    const { spec, depth, isInterior, rawResponse } = await parsePromptToHierarchy(prompt, apiKey);
    
    helper.completeStage('hierarchy_classification', `Structure detected: ${depth} level${depth > 1 ? 's' : ''}`, {
      depth,
      isInterior,
      hierarchy: rawResponse,
    });

    if (signal.aborted) throw new Error('Aborted');

    // Stage 2: Generate IMAGE EARLY using just names/descriptions from parsing
    // This allows user to see image ~15s earlier!
    const nodeChain = buildNodeChainFromParsed(rawResponse);
    const imagePrompt = locationImageGeneration(prompt, nodeChain);
    
    helper.startStage('image_generation', 'Creating visual...', { prompt: imagePrompt });
    
    const imageResult = await generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');
    
    if (signal.aborted) throw new Error('Aborted');
    
    if (imageResult.error || !imageResult.data?.images?.[0]?.url) {
      throw new Error(imageResult.error || 'Image generation failed');
    }
    
    const imageUrl = imageResult.data.images[0].url;
    helper.completeStage('image_generation', 'Visual ready', { imageUrl });

    // Calculate progress steps for the hierarchy
    const progressConfig = createProgressConfig(spec, false); // false = no image in DNA stage
    
    // Stage 3: Create all nodes with DNA (NO image - already generated)
    helper.startStage('dna_generation', 'Creating world structure...');

    // Create hierarchy WITHOUT image generation (we already have it)
    const result = await createHierarchy(spec, {
      apiKey,
      spawnId,
      createImage: false, // Image already generated above
      signal,
    });

    if (signal.aborted) throw new Error('Aborted');

    helper.completeStage('dna_generation', `Created ${result.nodes.length} nodes`, {
      nodeCount: result.nodes.length,
    });

    // Stage 4: Build WorldTree structure for frontend
    helper.startStage('tree_building', 'Building world tree...');
    
    // Build the proper nested hierarchy structure
    const hierarchyStructure = buildHierarchyStructure(result.nodes, rawResponse);
    
    if (!hierarchyStructure) {
      throw new Error('Failed to build hierarchy structure');
    }

    // Use WorldTreeBuilder to create proper TreeNode structure
    const worldTree = WorldTreeBuilder.build(spawnId, hierarchyStructure);

    // Assign media to deepest node (using our early-generated image)
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
