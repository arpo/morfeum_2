/**
 * Node Building Step (STEP 4)
 * Builds the final node with DNA, structure, and media
 */

import type { StructureAnalysis, NavigationContext } from '../../types';
import type { LayerType } from '../../../hierarchyAnalysis/types';
import { buildNode } from '../../../generation/shared/nodeBuilder';
import { generateLocationImage } from '../../../generation/shared/imageGeneration';
import { generateImagePromptForNode } from '../../../generation/shared/imagePromptGeneration';
import { NICHE_CAMERA } from '../../../generation/prompts/shared/cameraConfig';
import { PipelineHelper } from '../../../pipelines/shared/pipelineHelpers';
import mediaService from '../../../../services/media/mediaService';
import { mergeDNA } from './spaceAnalysisStep';

export interface ImagePromptInput {
  structureAnalysis: StructureAnalysis;
  dna: any;
  parentDNA: any;
  userPrompt: string;
  nodeType: string;
  perspective: 'interior' | 'exterior' | 'open-air';
  context: NavigationContext;
  apiKey: string;
  helper: PipelineHelper | null;
}

export interface NodeBuildingInput {
  nodeType: string;
  structureAnalysis: StructureAnalysis;
  dnaResult: any;
  parentDNA: any;
  imageUrl: string;
  imagePrompt: string;
  shouldGenerateImage: boolean;
  helper: PipelineHelper | null;
}

export interface NodeBuildingOutput {
  node: any;
  imageUrl: string;
  imagePrompt: string;
}

/**
 * Generate image prompt for node using LLM
 */
export async function generateNodeImagePrompt(
  input: ImagePromptInput
): Promise<string> {
  const {
    structureAnalysis,
    dna,
    parentDNA,
    userPrompt,
    nodeType,
    perspective,
    context,
    apiKey,
    helper
  } = input;

  if (helper) {
    helper.startStage('image_prompt', 'Generating image prompt...');
  }

  // Map open-air to exterior for image generation (which only supports interior/exterior)
  const imageGenPerspective: 'interior' | 'exterior' = perspective === 'open-air' ? 'exterior' : perspective;
  
  const imagePrompt = await generateImagePromptForNode(apiKey, {
    structureAnalysis,
    dna: dna || {},
    parentDNA: parentDNA || undefined,
    userPrompt,
    nodeType: nodeType as LayerType,
    perspective: imageGenPerspective,
    parentChain: context.parentNode ? [{
      type: context.parentNode.type,
      name: context.parentNode.name,
      description: context.parentNode.data?.description || ''
    }] : [],
    includeCurrentNodeDNA: false // NEVER include current niche DNA in /goto image generation
  });

  if (helper) {
    helper.completeStage('image_prompt', 'Image prompt generated', { imagePrompt });
  }

  return imagePrompt;
}

/**
 * Generate image from prompt
 */
export async function generateImage(
  apiKey: string,
  imagePrompt: string,
  helper: PipelineHelper | null
): Promise<string> {
  const promptWithCamera = `${imagePrompt}${NICHE_CAMERA} `;

  if (helper) {
    helper.startStage('image_generation', 'Generating image...');
  }

  const result = await generateLocationImage(apiKey, promptWithCamera);

  if (helper) {
    helper.completeStage('image_generation', 'Image generated', { imageUrl: result.imageUrl });
  }

  return result.imageUrl;
}

/**
 * Build the final node with all data
 */
export function buildFinalNode(
  input: NodeBuildingInput
): NodeBuildingOutput {
  const {
    nodeType,
    structureAnalysis,
    dnaResult,
    parentDNA,
    imageUrl,
    imagePrompt,
    shouldGenerateImage,
    helper
  } = input;

  if (helper) {
    helper.startStage('node_building', 'Building final node...');
  }

  // Merge DNA with parent DNA for CSS-like inheritance
  const mergedDNA = mergeDNA(dnaResult.dna, parentDNA);
  const nodeData = { ...dnaResult, dna: mergedDNA };

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

  // Extract structural fields from structure object to store at ROOT level only
  const { 
    dominantElements, 
    uniqueIdentifiers, 
    navigableElements, 
    ...cleanStructure 
  } = structureAnalysis.structure;

  // Build node with SEPARATE structure (new architecture)
  const node = buildNode(nodeType as LayerType, structureAnalysis.name, nodeData.dna, {
    description: structureAnalysis.description || nodeData.description,
    structure: cleanStructure,
    furnishingDetails: structureAnalysis.furnishingDetails,
    navigableElements: navigableElements || nodeData.navigableElements,
    dominantElements: dominantElements || nodeData.dominantElements,
    uniqueIdentifiers: uniqueIdentifiers || nodeData.uniqueIdentifiers,
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

  return {
    node,
    imageUrl,
    imagePrompt
  };
}
