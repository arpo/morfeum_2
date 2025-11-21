/**
 * Create Location Node Pipeline
 * Generates images and DNA for creating any type of location node
 * Used by navigation intents that need to create new nodes
 */

import { generateNodeDNA, extractParentContext } from '../../hierarchyAnalysis/nodeDNAGenerator';
import { generateLocationImage } from '../../generation/shared/imageGeneration';
import { buildNode } from '../../generation/shared/nodeBuilder';
import { generateImagePromptForNode } from '../../generation/shared/imagePromptGeneration';
import type { NavigationDecision, NavigationContext, IntentResult } from '../types';
import { NICHE_CAMERA } from '../../generation/prompts/shared/cameraConfig';
import { findParentLocationNode } from '../navigationHelpers';
import { sseService } from '../../../services/SSEService';

// Navigation-specific node types (excludes host/region which are created by spawn system)
export type NavigationNodeType = 'niche' | 'feature' | 'detail' | 'location';

export interface CreateNodeOptions {
  nodeType?: NavigationNodeType;
  generateImage?: boolean;
  style?: string;        // NEW: Visual style from registry
  perspective?: string;  // NEW: Perspective (interior/exterior)
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
  const pipelineStartTime = Date.now();
  const timings = {
    promptGeneration: 0,
    imageGeneration: 0,
    dnaGeneration: 0,
    nodeBuilding: 0
  };

  try {
    const nodeType = options?.nodeType || 'niche';
    const shouldGenerateImage = options?.generateImage !== false;

    // Get style and perspective from decision or options
    const style = options?.style || decision.style || intent.style || 'default';
    const perspective = options?.perspective || decision.perspective || intent.spaceType || 'interior';

    console.log(`[CreateNodePipeline] Starting pipeline for ${navigationId || 'navigation'}`);
    if (navigationId) {
      sseService.sendEvent(navigationId, 'progress', { 
        stage: 'started', 
        message: 'Starting node creation...' 
      });
    }

    // Step 1: Generate image prompt using shared module
    const promptStart = Date.now();
    if (navigationId) {
      sseService.sendEvent(navigationId, 'progress', { 
        stage: 'prompt_generation', 
        message: 'Generating image prompt...' 
      });
    }

    let imagePrompt = await generateImagePromptForNode(
      context,
      intent,
      decision,
      apiKey,
      { nodeType, style, perspective }
    );
    timings.promptGeneration = Date.now() - promptStart;

    console.log(`[CreateNodePipeline] ${navigationId || 'navigation'} Prompt generation complete`);
    if (navigationId) {
      sseService.sendEvent(navigationId, 'progress', { 
        stage: 'prompt_complete', 
        message: 'Image prompt generated',
        data: { imagePrompt } 
      });
    }

    // Step 2: Generate FLUX image using shared module
    let imageUrl: string;
    imagePrompt += `${NICHE_CAMERA} `;

    if (shouldGenerateImage) {
      const imageStart = Date.now();
      if (navigationId) {
        sseService.sendEvent(navigationId, 'progress', { 
          stage: 'image_generation', 
          message: 'Generating image...' 
        });
      }

      const result = await generateLocationImage(apiKey, imagePrompt);
      imageUrl = result.imageUrl;
      timings.imageGeneration = Date.now() - imageStart;

      console.log(`[CreateNodePipeline] ${navigationId || 'navigation'} Image generation complete`);
      if (navigationId) {
        sseService.sendEvent(navigationId, 'progress', { 
          stage: 'image_complete', 
          message: 'Image generated',
          data: { imageUrl } 
        });
      }
    } else {
      imageUrl = '';
    }

    // Step 3: Generate DNA for the node (now returns both DNA and structural fields)
    const dnaStart = Date.now();
    console.log(`\n🧬 [PIPELINE] Generating DNA for ${nodeType} node...`);
    if (navigationId) {
      sseService.sendEvent(navigationId, 'progress', { 
        stage: 'dna_generation', 
        message: 'Generating node DNA...' 
      });
    }

    const nodeName = decision.newNodeName || 'Unnamed Niche';

    // Extract parent context from parent location (traverse up if current is niche)
    const { parentLocationDNA } = findParentLocationNode(context);
    const parentContext = parentLocationDNA
      ? extractParentContext(parentLocationDNA)
      : undefined;

    // Use centralized DNA generator (now returns { dna, name, description, navigableElements, etc. })
    const nodeData = await generateNodeDNA(
      apiKey,
      imagePrompt,
      nodeName,
      nodeType,
      imagePrompt,
      parentContext
    );
    timings.dnaGeneration = Date.now() - dnaStart;

    console.log('✅ [PIPELINE] DNA generated successfully. Fields:', Object.keys(nodeData.dna).join(', '));
    if (navigationId) {
      sseService.sendEvent(navigationId, 'progress', { 
        stage: 'dna_complete', 
        message: 'Node DNA generated' 
      });
    }

    // Step 4: Build complete node using shared builder, passing structural fields
    const buildStart = Date.now();
    if (navigationId) {
      sseService.sendEvent(navigationId, 'progress', { 
        stage: 'node_building', 
        message: 'Building final node...' 
      });
    }

    const node = buildNode(nodeType, nodeData.name, nodeData.dna, imageUrl, {
      description: nodeData.description,
      navigableElements: nodeData.navigableElements,
      dominantElements: nodeData.dominantElements,
      uniqueIdentifiers: nodeData.uniqueIdentifiers,
      searchDesc: nodeData.searchDesc,
      slug: nodeData.slug
    });
    timings.nodeBuilding = Date.now() - buildStart;

    const totalTime = Date.now() - pipelineStartTime;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ NODE CREATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ID:', node.id);
    console.log('  Type:', node.type);
    console.log('  Name:', node.name);
    console.log('  Has DNA:', !!node.dna ? '✓' : '✗');
    console.log('  Has Image:', !!node.imagePath ? '✓' : '✗');
    console.log(`  Stage Timings:`);
    console.log(`    - Prompt Generation:    ${(timings.promptGeneration / 1000).toFixed(2)}s`);
    console.log(`    - Image Generation:     ${(timings.imageGeneration / 1000).toFixed(2)}s`);
    console.log(`    - DNA Generation:       ${(timings.dnaGeneration / 1000).toFixed(2)}s`);
    console.log(`    - Node Building:        ${(timings.nodeBuilding / 1000).toFixed(2)}s`);
    console.log(`  Total:                    ${(totalTime / 1000).toFixed(2)}s`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (navigationId) {
      sseService.sendEvent(navigationId, 'completed', { 
        message: 'Node created successfully',
        node,
        timings
      });

      // Close connection after completion
      setTimeout(() => sseService.closeConnection(navigationId), 1000);
    }

    return {
      imageUrl,
      imagePrompt,
      node
    };
  } catch (error: any) {
    console.error(`[CreateNodePipeline] Pipeline failed:`, error);
    if (navigationId) {
      sseService.sendEvent(navigationId, 'error', { 
        message: 'Pipeline failed', 
        error: error.message 
      });
      sseService.closeConnection(navigationId);
    }
    throw error;
  }
}
