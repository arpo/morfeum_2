/**
 * Create Location Node Pipeline
 * Generates images and DNA for creating any type of location node
 * Used by navigation intents that need to create new nodes
 */

import { generateNodeDNA, extractParentContext } from '../../hierarchyAnalysis/nodeDNAGenerator';
import { generateLocationImage } from '../../generation/shared/imageGeneration';
import { buildNode } from '../../generation/shared/nodeBuilder';
import { generateImagePromptForNode } from '../../generation/shared/imagePromptGeneration';
import type { NavigationDecision, NavigationContext, IntentResult, DestinationAnalysis } from '../types';
import { NICHE_CAMERA } from '../../generation/prompts/shared/cameraConfig';
import { findParentLocationNode } from '../navigationHelpers';
import { PipelineHelper } from '../../pipelines/shared/pipelineHelpers';
import { getPipelineTypeForIntent } from '../../pipelines/shared/pipelineConfig';
import mediaService from '../../../services/media/mediaService';
import { analyzeDestination } from '../analyzers/destinationAnalyzer';

// Navigation-specific node types (excludes host/region which are created by spawn system)
export type NavigationNodeType = 'niche' | 'feature' | 'detail' | 'location';

export interface CreateNodeOptions {
  nodeType?: NavigationNodeType;
  generateImage?: boolean;
  style?: string;        // Visual style from registry
  perspective?: string;  // Perspective (interior/exterior)
  gotoText?: string;     // For GOTO: The destination text to analyze
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
  // Auto-detect pipeline type from intent (GOTO uses 'navigationGoto', GO_INSIDE uses 'navigation')
  const pipelineType = options?.gotoText ? 'navigationGoto' : getPipelineTypeForIntent(intent.intent);
  const helper = navigationId ? new PipelineHelper(navigationId, 'CreateNodePipeline', pipelineType) : null;

  try {
    const nodeType = options?.nodeType || 'niche';
    const shouldGenerateImage = options?.generateImage !== false;

    // Get style and perspective from decision or options
    let style = options?.style || decision.style || intent.style || 'default';
    let perspective = options?.perspective || decision.perspective || intent.spaceType || 'interior';

    if (helper) {
      helper.started('Starting node creation...');
    }

    // For GOTO: Run destination analysis as FIRST step (with SSE visibility)
    let destinationAnalysis: DestinationAnalysis | undefined = decision.metadata?.destinationAnalysis;
    
    if (options?.gotoText && !destinationAnalysis) {
      if (helper) {
        helper.startStage('destination_analysis', 'Analyzing destination...');
      }

      console.log(`\n🎯 [GOTO Pipeline] Analyzing destination: "${options.gotoText}"`);
      destinationAnalysis = await analyzeDestination(apiKey, options.gotoText, context);
      
      // Update decision with analysis results
      decision.newNodeName = destinationAnalysis.name;
      decision.perspective = destinationAnalysis.perspective;
      decision.metadata = decision.metadata || {};
      decision.metadata.destinationAnalysis = destinationAnalysis;
      
      // Update perspective from analysis
      perspective = destinationAnalysis.perspective;

      console.log('\n═══════════════════════════════════════════════════════════');
      console.log('🎯 DESTINATION ANALYSIS RESULT');
      console.log('═══════════════════════════════════════════════════════════');
      console.log(`  Name: ${destinationAnalysis.name}`);
      console.log(`  Perspective: ${destinationAnalysis.perspective}`);
      console.log(`  Space Type: ${destinationAnalysis.spaceType}`);
      console.log(`  Enclosed: ${destinationAnalysis.isEnclosed}`);
      console.log(`  Atmosphere: ${destinationAnalysis.atmosphereHint}`);
      console.log('═══════════════════════════════════════════════════════════\n');

      if (helper) {
        helper.completeStage('destination_analysis', 'Destination analyzed', { 
          name: destinationAnalysis.name,
          perspective: destinationAnalysis.perspective 
        });
      }
    }

    // Step 1 (or 2 for GOTO): Generate image prompt
    // For GOTO: Use the synthesized description from destination analysis
    // For GO_INSIDE and others: Generate from context using LLM
    if (helper) {
      helper.startStage('prompt_generation', 'Generating image prompt...');
    }

    let imagePrompt: string;
    
    // Check if we have a destination analysis (from GOTO command)
    if (destinationAnalysis?.synthesizedDescription) {
      // GOTO command: Use the pre-computed synthesized description
      imagePrompt = destinationAnalysis.synthesizedDescription;
      console.log(`[GOTO] Using synthesized description for image prompt: "${imagePrompt.substring(0, 100)}..."`);
    } else {
      // GO_INSIDE and other commands: Generate from context using LLM
      imagePrompt = await generateImagePromptForNode(
        context,
        intent,
        decision,
        apiKey,
        { nodeType, style, perspective }
      );
    }

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

    // Create media entry for the node image if we have an imageUrl
    let mediaId: string | undefined;
    let createdMedia: any;
    if (shouldGenerateImage && imageUrl) {
      createdMedia = mediaService.createMedia({
        type: 'image',
        url: imageUrl,
        metadata: {
          prompt: imagePrompt,
          model: 'FLUX',
        },
        entityRefs: [] // Will be updated after node is created
      });
      mediaId = createdMedia.id;
    }

    const node = buildNode(nodeType, nodeData.name, nodeData.dna, {
      description: nodeData.description,
      navigableElements: nodeData.navigableElements,
      dominantElements: nodeData.dominantElements,
      uniqueIdentifiers: nodeData.uniqueIdentifiers,
      searchDesc: nodeData.searchDesc,
      slug: nodeData.slug,
      primaryMedia: mediaId
    });

    // Update media entityRefs with the actual node ID
    if (createdMedia && shouldGenerateImage) {
      createdMedia.entityRefs = [node.id];
    }

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
    console.log('═══════════════════════════════════════════════════════════\n');

    if (helper) {
      helper.completed('Node created successfully', { node, imageUrl, imagePrompt });
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
