/**
 * World Tree Pipeline
 * Generates DNA for all nodes in a hierarchy using batch LLM calls
 * Creates complete world tree with host → regions → locations → niches
 */

import type { HierarchyStructure, NodeDNA, HierarchyNode } from '../hierarchyAnalysis/types';
import { parseJSON } from '../utils/parseJSON';
import { generateText, generateImage, analyzeImage } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { completeDNAGeneration } from '../generation/prompts/locations/completeDNAGeneration';
import { analyzeHierarchy } from '../hierarchyAnalysis';
import { locationImageGeneration } from '../generation/prompts/locations/locationImageGeneration';
import { locationVisualAnalysisPrompt } from '../generation/prompts';
import { fetchImageAsBase64 } from '../../services/spawn/shared/pipelineCommon';
import { WorldTreeBuilder } from '../../services/worldTree/builder';
import { PipelineHelper } from './shared/pipelineHelpers';
import mediaService from '../../services/media/mediaService';
import type { TreeNode } from '../../services/worldTree/types';
import { applyHostDNA, applyRegionDNA, applyLocationDNA, applyNicheDNA, mergeVisualAnalysis } from './shared/dnaApplication';

/**
 * Assign media to tree nodes
 * Creates media entry and sets primaryMedia on the deepest node
 */
function assignMediaToTreeNodes(
  tree: TreeNode,
  imageUrl: string,
  imagePrompt: string
): TreeNode {
  // Find the deepest node in the tree
  function findDeepestNode(node: TreeNode): TreeNode {
    if (!node.children || node.children.length === 0) {
      return node;
    }
    // Recursively find deepest in first child branch
    return findDeepestNode(node.children[0]);
  }

  const deepestNode = findDeepestNode(tree);

  // Create media entry for the image
  const media = mediaService.createMedia({
    type: 'image',
    url: imageUrl,
    metadata: {
      prompt: imagePrompt,
      model: 'FLUX',
      width: 1024,
      height: 1024
    },
    entityRefs: [deepestNode.id]
  });

  // Set primaryMedia on the deepest node
  deepestNode.primaryMedia = media.id;

  return tree;
}

/**
 * Helper: Build node chain from hierarchy
 */
function buildNodeChain(hierarchy: HierarchyStructure): HierarchyNode[] {
  const chain: HierarchyNode[] = [];
  chain.push(hierarchy.host);
  
  if (hierarchy.host.regions && hierarchy.host.regions.length > 0) {
    const region = hierarchy.host.regions[0];
    chain.push(region);
    
    if (region.locations && region.locations.length > 0) {
      const location = region.locations[0];
      chain.push(location);
      
      if (location.niches && location.niches.length > 0) {
        const niche = location.niches[0];
        chain.push(niche);
      }
    }
  }
  return chain;
}

/**
 * Run the complete World Tree generation pipeline
 */
export async function runWorldTreePipeline(
  spawnId: string,
  prompt: string,
  apiKey: string,
  signal: AbortSignal
): Promise<void> {
  const helper = new PipelineHelper(spawnId, 'WorldTreePipeline', 'worldTree');

  try {
    helper.started('Starting World Tree generation...');

    // Stage 1: Hierarchy Classification
    helper.startStage('hierarchy_classification', 'Analyzing hierarchy structure...');
    const result = await analyzeHierarchy(prompt, apiKey, spawnId);
    helper.completeStage('hierarchy_classification', 'Hierarchy structure analyzed', { hierarchy: result.hierarchy });

    if (signal.aborted) throw new Error('Aborted');

    // Stage 2: Image Generation
    helper.startStage('image_generation', 'Generating visual representation...');
    const nodeChain = buildNodeChain(result.hierarchy);
    const imagePrompt = locationImageGeneration(prompt, nodeChain);
    const imageResult = await generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');

    if (signal.aborted) throw new Error('Aborted');

    if (imageResult.error || !imageResult.data?.images?.[0]?.url) {
      throw new Error(imageResult.error || 'Image URL not found in response');
    }

    const imageUrl = imageResult.data.images[0].url;
    helper.completeStage('image_generation', 'Visual representation generated', { imageUrl });

    // Stage 3: Visual Analysis
    helper.startStage('visual_analysis', 'Analyzing visual context...');
    const base64Image = await fetchImageAsBase64(imageUrl);
    const analysisPrompt = locationVisualAnalysisPrompt(prompt, nodeChain);
    
    const analysisResult = await analyzeImage(
      apiKey,
      base64Image,
      analysisPrompt,
      'image/jpeg',
      AI_MODELS.VISUAL_ANALYSIS
    );

    if (analysisResult.error || !analysisResult.data) {
      throw new Error(analysisResult.error || 'No data returned from visual analysis');
    }

    const visualAnalysis = parseJSON(analysisResult.data.text);
    helper.completeStage('visual_analysis', 'Visual context analyzed', { analysis: visualAnalysis });

    if (signal.aborted) throw new Error('Aborted');

    // Stage 4: DNA Generation
    helper.startStage('dna_generation', 'Generating DNA for all nodes...');
    const fullHierarchy = await generateBatchDNA(
      result.hierarchy,
      visualAnalysis,
      prompt,
      apiKey
    );

    // Attach image to deepest node
    // Note: Image assignment is now handled by entityPersistence via mediaService
    // We no longer attach imageUrl directly to nodes in the hierarchy
    
    helper.completeStage('dna_generation', 'DNA generated for all nodes');

    if (signal.aborted) throw new Error('Aborted');

    // Stage 5: Build World Tree
    const worldTree = WorldTreeBuilder.build(
      spawnId, 
      fullHierarchy
    );

    // Stage 6: Assign media to tree nodes
    helper.startStage('media_assignment', 'Assigning media to tree nodes...');
    const treeWithMedia = assignMediaToTreeNodes(worldTree, imageUrl, imagePrompt);
    helper.completeStage('media_assignment', 'Media assigned to tree nodes');

    // Include imageUrl in completion for frontend cache
    helper.completed('World Tree created successfully', { worldTree: treeWithMedia, imageUrl });

  } catch (error: any) {
    if (signal.aborted) {
      helper.cancelled();
    } else {
      helper.error(error);
    }
  }
}

/**
 * Generate DNA for all nodes in the hierarchy using batch calls
 * 
 * @param hierarchy - The hierarchy structure from classification
 * @param visualAnalysis - Visual analysis data from the deepest node
 * @param originalPrompt - Original user input
 * @param apiKey - MZOO API key
 * @returns Complete hierarchy with all DNA populated
 */
export async function generateBatchDNA(
  hierarchy: HierarchyStructure,
  visualAnalysis: any,
  originalPrompt: string,
  apiKey: string
): Promise<HierarchyStructure> {
  const host = hierarchy.host;
  
  // Prepare hierarchy data for single prompt
  const regions = (host.regions || []).map(region => ({
    name: region.name,
    description: region.description,
    locations: (region.locations || []).map(location => ({
      name: location.name,
      description: location.description,
      niches: (location.niches || []).map(niche => ({
        name: niche.name,
        description: niche.description
      }))
    }))
  }));
  
  // Single LLM call to generate ALL DNA
  const prompt = completeDNAGeneration(
    originalPrompt,
    host.name,
    host.description,
    regions,
    visualAnalysis
  );
  
  const messages = [{ role: 'user', content: prompt }];
  const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);
  
  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate complete DNA');
  }
  
  const dnaResult = parseJSON<any>(result.data.text);
  
  // Apply DNA to all node types using shared utilities
  applyHostDNA(host, dnaResult.host);
  applyRegionDNA(host, dnaResult.regions);
  applyLocationDNA(host, dnaResult.locations);
  applyNicheDNA(host, dnaResult.niches);
  mergeVisualAnalysis(host, visualAnalysis);
  
  return hierarchy;
}
