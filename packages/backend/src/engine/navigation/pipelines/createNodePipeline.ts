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
import { PipelineHelper } from '../../pipelines/shared/pipelineHelpers';

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
  const helper = navigationId ? new PipelineHelper(navigationId, 'CreateNodePipeline') : null;

  try {
    const nodeType = options?.nodeType || 'niche';
    const shouldGenerateImage = options?.generateImage !== false;

    // Get style and perspective from decision or options
    const style = options?.style || decision.style || intent.style || 'default';
    const perspective = options?.perspective || decision.perspective || intent.spaceType || 'interior';

    if (helper) {
      helper.started('Starting node creation...');
    }

    // Step 1: Generate image prompt using shared module
    if (helper) {
      helper.startStage('prompt_generation', 'Generating image prompt...');
    }

    let imagePrompt = await generateImagePromptForNode(
      context,
      intent,
      decision,
      apiKey,
      { nodeType, style, perspective }
    );

    if (helper) {
      helper.completeStage('prompt_generation', 'Image prompt generated', { imagePrompt });
    }

    // Step 2: Generate FLUX image using shared module
    let imageUrl: string;
    imagePrompt += `${NICHE_CAMERA} `;

    if (shouldGenerateImage) {
      if (helper) {
        helper.startStage('image_generation', 'Generating image...');
      }

      const result = await generateLocationImage(apiKey, imagePrompt);
      imageUrl = result.imageUrl;

      if (helper) {
        helper.completeStage('image_generation', 'Image generated', { imageUrl });
      }
    } else {
      imageUrl = '';
    }

    // Step 3: Generate DNA for the node (now returns both DNA and structural fields)
    if (helper) {
      helper.startStage('dna_generation', 'Generating node DNA...');
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

    if (helper) {
      helper.completeStage('dna_generation', 'Node DNA generated');
    }

    // Step 4: Build complete node using shared builder, passing structural fields
    if (helper) {
      helper.startStage('node_building', 'Building final node...');
    }

    const node = buildNode(nodeType, nodeData.name, nodeData.dna, imageUrl, {
      description: nodeData.description,
      navigableElements: nodeData.navigableElements,
      dominantElements: nodeData.dominantElements,
      uniqueIdentifiers: nodeData.uniqueIdentifiers,
      searchDesc: nodeData.searchDesc,
      slug: nodeData.slug
    });

    if (helper) {
      helper.completeStage('node_building', 'Node built');
    }

    // Log success details
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ NODE CREATED SUCCESSFULLY');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('  ID:', node.id);
    console.log('  Type:', node.type);
    console.log('  Name:', node.name);
    console.log('  Has DNA:', !!node.dna ? '✓' : '✗');
    console.log('  Has Image:', !!node.imagePath ? '✓' : '✗');
    console.log('═══════════════════════════════════════════════════════════\n');

    if (helper) {
      helper.completed('Node created successfully', { node });
    }

    return {
      imageUrl,
      imagePrompt,
      node
    };
  } catch (error: any) {
    if (helper) {
      helper.error(error);
    } else {
      console.error(`[CreateNodePipeline] Pipeline failed:`, error);
    }
    throw error;
  }
}
