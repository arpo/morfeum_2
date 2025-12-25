/**
 * World Tree Pipeline
 * 
 * Optimized pipeline for world tree generation:
 * 1. Hierarchy Classification (~1.4s)
 * 2. Deepest Node DNA Generation (~3s)
 * 3. Image Generation (~2s) + PARALLEL: Parent Chain DNA (~14s)
 * 4. Build World Tree
 * 
 * Key optimizations:
 * - DNA generated BEFORE image for rich image prompts
 * - Image shown to user at ~6s instead of ~20s
 * - Visual Analysis stage REMOVED (saves time and cost)
 * - Parent chain DNA runs in parallel with image generation
 */

import type { HierarchyStructure } from '../hierarchyAnalysis/types';
import { parseJSON } from '../utils/parseJSON';
import { generateText, generateImage } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { analyzeHierarchy } from '../hierarchyAnalysis';
import { deepestNodeDNAGeneration } from '../generation/prompts/locations/deepestNodeDNA';
import { worldTreeImagePrompt } from '../generation/prompts/locations/worldTree';
import { parentChainDNAGeneration } from '../generation/prompts/locations/parentChainDNA';
import { WorldTreeBuilder } from '../../services/worldTree/builder';
import { PipelineHelper } from './shared/pipelineHelpers';
import { assignMediaToTreeNodes, extractDeepestNodeInfo, extractParentNodesForDNA } from './worldTree/helpers';
import { applyDeepestNodeDNA, applyParentChainDNA } from './worldTree/dnaApplication';

/**
 * Run the complete World Tree generation pipeline
 * 
 * Optimized flow:
 * 1. Hierarchy Classification
 * 2. Deepest Node DNA Generation
 * 3. Image Generation (parallel with Parent Chain DNA)
 * 4. Build World Tree
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

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 1: Hierarchy Classification (~1.4s)
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('hierarchy_classification', 'Analyzing hierarchy structure...');
    const result = await analyzeHierarchy(prompt, apiKey, spawnId);
    helper.completeStage('hierarchy_classification', 'Hierarchy structure analyzed', { 
      hierarchy: result.hierarchy,
      prompt: result.classificationPrompt 
    });

    if (signal.aborted) throw new Error('Aborted');

    // Extract deepest node info
    const { deepestNode, deepestNodeType, parentChain } = extractDeepestNodeInfo(result.hierarchy);

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 2: Deepest Node DNA Generation (~3s)
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('deepest_dna_generation', `Generating DNA for ${deepestNodeType}...`);
    
    // Build classification data from the deepest node (if available from hierarchyCategorization)
    const classificationData = {
      looks: (deepestNode as any).looks,
      atmosphere: (deepestNode as any).atmosphere,
      mood: (deepestNode as any).mood
    };

    const deepestDNAPrompt = deepestNodeDNAGeneration(
      prompt,
      deepestNodeType,
      deepestNode.name,
      deepestNode.description,
      classificationData,
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
    
    // Apply deepest node DNA to hierarchy
    applyDeepestNodeDNA(result.hierarchy, deepestNodeType, deepestNodeDNA);
    
    helper.completeStage('deepest_dna_generation', 'Deepest node DNA generated', { 
      nodeType: deepestNodeType,
      dna: deepestNodeDNA 
    });

    if (signal.aborted) throw new Error('Aborted');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 3: Image Generation + PARALLEL Parent Chain DNA
    // ═══════════════════════════════════════════════════════════════════════
    
    // Build image prompt using the DNA
    const imagePrompt = worldTreeImagePrompt({
      nodeType: deepestNodeType,
      nodeName: deepestNodeDNA.name || deepestNode.name,
      dna: deepestNodeDNA.dna || {},
      originalPrompt: prompt,
      parentChain
    });

    helper.startStage('image_generation', 'Generating visual representation...', { prompt: imagePrompt });

    // Start image generation
    const imagePromise = generateImage(apiKey, imagePrompt, 1, 'landscape_16_9', 'none');

    // Start parent chain DNA generation in parallel (if needed)
    const parentNodes = extractParentNodesForDNA(result.hierarchy, deepestNodeType);
    let parentDNAPromise: Promise<any> | null = null;

    if (parentNodes.length > 0) {
      const parentDNAPrompt = parentChainDNAGeneration(
        deepestNodeDNA.dna || {},
        deepestNodeType,
        parentNodes,
        prompt
      );

      if (parentDNAPrompt) {
        helper.startStage('parent_dna_generation', 'Generating parent chain DNA (parallel)...');
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
      throw new Error(imageResult.error || 'Image URL not found in response');
    }

    const imageUrl = imageResult.data.images[0].url;
    helper.completeStage('image_generation', 'Visual representation generated', { imageUrl });

    // Wait for parent chain DNA (if started)
    if (parentDNAPromise) {
      const parentDNAResult = await parentDNAPromise;
      
      if (parentDNAResult.error || !parentDNAResult.data) {
        // Log warning but don't fail - we have the deepest node DNA which is most important
        console.warn('Parent chain DNA generation failed:', parentDNAResult.error);
      } else {
        const parentDNA = parseJSON<any>(parentDNAResult.data.text);
        applyParentChainDNA(result.hierarchy, parentDNA);
        helper.completeStage('parent_dna_generation', 'Parent chain DNA generated');
      }
    }

    if (signal.aborted) throw new Error('Aborted');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 4: Build World Tree
    // ═══════════════════════════════════════════════════════════════════════
    helper.startStage('tree_building', 'Building world tree...');
    const worldTree = WorldTreeBuilder.build(spawnId, result.hierarchy);
    helper.completeStage('tree_building', 'World tree built');

    // ═══════════════════════════════════════════════════════════════════════
    // Stage 5: Assign Media to Tree Nodes
    // ═══════════════════════════════════════════════════════════════════════
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

// Legacy export for backward compatibility (deprecated)
export async function generateBatchDNA(
  hierarchy: HierarchyStructure,
  visualAnalysis: any,
  originalPrompt: string,
  apiKey: string
): Promise<{ hierarchy: HierarchyStructure; dnaPrompt: string }> {
  console.warn('generateBatchDNA is deprecated - use the new pipeline flow instead');
  // This function is kept for backward compatibility but should not be used
  return { hierarchy, dnaPrompt: '' };
}
