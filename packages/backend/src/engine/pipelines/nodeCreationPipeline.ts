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
import { generateImage, generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { deepestNodeDNAGeneration } from '../generation/prompts/locations/deepestNodeDNA';
import { worldTreeImagePromptContext } from '../generation/prompts/locations/worldTree';
import { parentChainDNAGeneration } from '../generation/prompts/locations/parentChainDNA';
import { applyMorfeumStyle } from '../generation/shared/applyMorfeumStyle';
import { assembleImagePrompt } from '../generation/shared/imagePromptAssembler';
import type { ImagePromptStructure } from '../generation/shared/imagePromptTypes';
import { runInteriorFlow } from './nodeCreation/interiorFlow';
import {
  buildHierarchyStructure,
  assignMediaToTree,
  extractParentNodes,
  buildParentChain,
  getDeepestNodeInfo,
} from './nodeCreation/helpers';

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

    // Step 1: LLM generates structured JSON image description from context
    const imagePromptResult = await generateText(
      apiKey,
      [{ role: 'user', content: imageContextPrompt }],
      AI_MODELS.SEED_GENERATION
    );

    if (imagePromptResult.error || !imagePromptResult.data) {
      throw new Error(imagePromptResult.error || 'Failed to generate image prompt');
    }

    // Parse the structured JSON response
    let promptStructure: ImagePromptStructure;
    const imagePromptRaw = imagePromptResult.data.text.trim();
    
    try {
      // Try to extract JSON from response
      let jsonStr = imagePromptRaw;
      if (jsonStr.startsWith('```json')) {
        jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
      } else if (jsonStr.startsWith('```')) {
        jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
      }
      const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        jsonStr = jsonMatch[0];
      }
      const parsed = JSON.parse(jsonStr);
      promptStructure = {
        background: parsed.background || '',
        midground: parsed.midground || '',
        foreground: parsed.foreground || '',
        lighting: parsed.lighting || '',
        atmosphere: parsed.atmosphere || '',
        constraints: [],
        negatives: [],
        camera: parsed.camera,
        lens: parsed.lens
      };
    } catch {
      // Fallback: treat as plain text (old format) for backward compatibility
      promptStructure = {
        background: '',
        midground: imagePromptRaw,
        foreground: '',
        lighting: '',
        atmosphere: '',
        constraints: [],
        negatives: []
      };
    }

    // Assemble into string and apply Morfeum visual style
    const imagePrompt = applyMorfeumStyle(assembleImagePrompt(promptStructure, {
      includeNoCreatures: true,
      includeMorfeumStyle: false // applyMorfeumStyle adds it
    }));

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
    // Stage 6: Build WorldTree structure for frontend
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

    // Assign media to deepest node with structured prompt for reuse
    assignMediaToTree(worldTree, imageUrl, imagePrompt, promptStructure);

    helper.completeStage('tree_building', 'World tree ready');

    // Complete - Send worldTree for frontend compatibility
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
