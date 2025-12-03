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
import { generalPromptFix } from '../generation/prompts/shared/generalPromptFix';
import type { TreeNode } from '../../services/worldTree/types';

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
 */
function buildHierarchyStructure(
  parsedHierarchy: any,
  deepestNodeDNA: any,
  parentDNA: any,
  deepestType: string
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
 */
function extractParentNodes(
  parsedHierarchy: any,
  deepestType: string
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

  // Add region if deepest is location or niche
  if ((deepestType === 'location' || deepestType === 'niche') && parsedHierarchy.region) {
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
 * Run the Node Creation Pipeline (DNA-FIRST)
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

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 1: Parse prompt into hierarchy structure
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('hierarchy_classification', 'Analyzing your description...');
    
    const { spec, depth, isInterior, rawResponse } = await parsePromptToHierarchy(prompt, apiKey);
    
    helper.completeStage('hierarchy_classification', `Structure detected: ${depth} level${depth > 1 ? 's' : ''}`, {
      depth,
      isInterior,
      hierarchy: rawResponse,
    });

    if (signal.aborted) throw new Error('Aborted');

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
    // Stage 3: Generate IMAGE using DNA + PARALLEL: Parent Chain DNA
    // ═══════════════════════════════════════════════════════════════════════
    
    // Build context prompt for LLM to generate FLUX image description
    const imageContextPrompt = worldTreeImagePromptContext({
      nodeType: deepestInfo.type,
      nodeName: deepestNodeDNA.name || deepestInfo.name,
      dna: deepestNodeDNA.dna || {},
      originalPrompt: prompt,
      parentChain,
    });

    helper.startStage('image_generation', 'Creating visual description...');

    // TWO-STEP IMAGE GENERATION:
    // Step 1: LLM generates the actual FLUX image description from context
    const imagePromptResult = await generateText(
      apiKey,
      [{ role: 'user', content: imageContextPrompt }],
      AI_MODELS.SEED_GENERATION
    );

    if (imagePromptResult.error || !imagePromptResult.data) {
      throw new Error(imagePromptResult.error || 'Failed to generate image prompt');
    }

    // Apply generalPromptFix for consistent styling
    const imagePrompt = generalPromptFix(imagePromptResult.data.text.trim());

    // Step 2: Use the LLM-generated prompt for image generation
    const imagePromise = generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');

    // Start parent chain DNA generation in parallel (if needed)
    const parentNodes = extractParentNodes(rawResponse, deepestInfo.type);
    let parentDNAPromise: Promise<any> | null = null;

    if (parentNodes.length > 0) {
      const parentDNAPrompt = parentChainDNAGeneration(
        deepestNodeDNA.dna || {},
        deepestInfo.type,
        parentNodes,
        prompt
      );

      if (parentDNAPrompt) {
        helper.startStage('parent_dna_generation', 'Building world structure (parallel)...');
        parentDNAPromise = generateText(
          apiKey,
          [{ role: 'user', content: parentDNAPrompt }],
          AI_MODELS.SEED_GENERATION
        );
      }
    }

    // Wait for image generation
    const imageResult = await imagePromise;

    if (signal.aborted) throw new Error('Aborted');

    if (imageResult.error || !imageResult.data?.images?.[0]?.url) {
      throw new Error(imageResult.error || 'Image generation failed');
    }

    const imageUrl = imageResult.data.images[0].url;
    helper.completeStage('image_generation', 'Visual ready', { imageUrl });

    // Wait for parent chain DNA (if started)
    let parentDNA: any = null;
    if (parentDNAPromise) {
      const parentDNAResult = await parentDNAPromise;
      
      if (parentDNAResult.error || !parentDNAResult.data) {
        // Log warning but don't fail - we have the deepest node DNA
        console.warn('Parent chain DNA generation failed:', parentDNAResult.error);
      } else {
        parentDNA = parseJSON<any>(parentDNAResult.data.text);
        helper.completeStage('parent_dna_generation', 'World structure complete');
      }
    }

    if (signal.aborted) throw new Error('Aborted');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 4: Build WorldTree structure for frontend
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('tree_building', 'Building world tree...');
    
    // Build the proper nested hierarchy structure with all DNA
    const hierarchyStructure = buildHierarchyStructure(
      rawResponse,
      deepestNodeDNA,
      parentDNA,
      deepestInfo.type
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
