/**
 * Create Location Node Pipeline
 * Generates images and DNA for creating any type of location node
 * Used by navigation intents that need to create new nodes
 * 
 * NEW ARCHITECTURE (v2):
 * - Unified flow for both GOTO and GO_INSIDE commands
 * - Parallel Structure + DNA analysis for faster execution
 * - Structure stored separately from DNA at node level
 */

import { generateNodeDNA, extractParentContext, mergeDNAWithParent } from '../../hierarchyAnalysis/nodeDNAGenerator';
import { generateLocationImage } from '../../generation/shared/imageGeneration';
import { buildNode } from '../../generation/shared/nodeBuilder';
// Note: generateImagePromptForNode (legacy) removed - now using composeImagePrompt locally
import type { NavigationDecision, NavigationContext, IntentResult, DestinationAnalysis, StructureAnalysis, Structure } from '../types';
import { NICHE_CAMERA } from '../../generation/prompts/shared/cameraConfig';
import { findParentLocationNode } from '../navigationHelpers';
import { PipelineHelper } from '../../pipelines/shared/pipelineHelpers';
import { getPipelineTypeForIntent } from '../../pipelines/shared/pipelineConfig';
import mediaService from '../../../services/media/mediaService';
import { analyzeDestination } from '../analyzers/destinationAnalyzer';
import { analyzeStructure } from '../analyzers/structureAnalyzer';

// Navigation-specific node types (excludes host/region which are created by spawn system)
export type NavigationNodeType = 'niche' | 'feature' | 'detail' | 'location';

export interface CreateNodeOptions {
  nodeType?: NavigationNodeType;
  generateImage?: boolean;
  style?: string;        // Visual style from registry
  perspective?: string;  // Perspective (interior/exterior)
  gotoText?: string;     // For GOTO: The destination text to analyze
  userPrompt?: string;   // User's space description (used for structure analysis)
  useUnifiedPipeline?: boolean; // Enable new unified pipeline (defaults to true)
  includeFurnishing?: boolean; // Include furnishing details in structure analysis (--furnish flag)
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

    // Determine user prompt (from GOTO text or GO_INSIDE reasoning)
    const userPrompt = options?.userPrompt || options?.gotoText || intent.target || decision.newNodeName || 'interior space';

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 1: SPACE ANALYSIS (Structure + DNA in parallel)
    // ═══════════════════════════════════════════════════════════════════════════
    if (helper) {
      helper.startStage('space_analysis', 'Analyzing space (structure + DNA)...');
    }

    console.log(`\n🔄 [Pipeline] Starting parallel Space Analysis for: "${userPrompt}"`);

    // Run Structure Analysis and DNA Generation in PARALLEL
    const [structureAnalysis, dnaResult] = await Promise.all([
      // Structure Analysis (determines physical/spatial properties)
      analyzeStructure(apiKey, userPrompt, context, perspective as 'interior' | 'exterior', options?.includeFurnishing),
      
      // DNA Generation (determines visual/atmospheric properties)
      (async () => {
        const { parentLocationDNA } = findParentLocationNode(context);
        const parentContext = parentLocationDNA
          ? extractParentContext(parentLocationDNA)
          : undefined;
        
        // Generate DNA with basic info - we'll enhance with structure later
        return generateNodeDNA(
          apiKey,
          userPrompt,
          decision.newNodeName || 'Unnamed Space',
          nodeType,
          userPrompt,
          parentContext
        );
      })()
    ]);

    // Update decision with analysis results
    decision.newNodeName = structureAnalysis.name;
    decision.perspective = structureAnalysis.perspective;
    decision.metadata = decision.metadata || {};
    decision.metadata.structureAnalysis = structureAnalysis;

    // Update perspective from analysis
    perspective = structureAnalysis.perspective;

    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('✅ SPACE ANALYSIS COMPLETE (Parallel)');
    console.log('═══════════════════════════════════════════════════════════');
    console.log(`  Name: ${structureAnalysis.name}`);
    console.log(`  Perspective: ${structureAnalysis.perspective}`);
    console.log(`  Form: ${structureAnalysis.structure.form}`);
    console.log(`  Scale: ${structureAnalysis.structure.scale}`);
    console.log(`  Functional Type: ${structureAnalysis.structure.functionalType}`);
    console.log(`  Required Elements: ${structureAnalysis.structure.requiredElements?.length || 0}`);
    console.log(`  DNA Generated: ${dnaResult.name ? '✓' : '✗'}`);
    console.log('═══════════════════════════════════════════════════════════\n');

    if (helper) {
      helper.completeStage('space_analysis', 'Space analyzed', {
        name: structureAnalysis.name,
        perspective: structureAnalysis.perspective,
        form: structureAnalysis.structure.form
      });
    }

    // ═══════════════════════════════════════════════════════════════════════════
    // STEP 2: IMAGE PROMPT COMPOSITION (uses pre-computed data)
    // ═══════════════════════════════════════════════════════════════════════════
    if (helper) {
      helper.startStage('image_prompt', 'Composing image prompt...');
    }

    // Get parent DNA for visual consistency (architectural_tone, cultural_tone, etc.)
    const { parentLocationDNA } = findParentLocationNode(context);
    
    // Build image prompt using structure + DNA data + inherited parent DNA
    let imagePrompt = composeImagePrompt(structureAnalysis, dnaResult, userPrompt, parentLocationDNA);

    if (helper) {
      helper.completeStage('image_prompt', 'Image prompt composed', { imagePrompt });
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

    // DNA already generated in parallel during space_analysis step
    // Now merge with parent DNA for CSS-like inheritance (fill null values from parent)
    // Note: parentLocationDNA already declared above for image prompt
    const mergedDNA = mergeDNAWithParent(dnaResult.dna, parentLocationDNA);
    const nodeData = { ...dnaResult, dna: mergedDNA };

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

    // Build node with SEPARATE structure (new architecture)
    const node = buildNode(nodeType, structureAnalysis.name, nodeData.dna, {
      description: structureAnalysis.description || nodeData.description,
      // Structure is now stored separately at node level (not inside DNA)
      structure: structureAnalysis.structure,
      // Legacy fields (kept for backward compatibility, but now also in structure)
      navigableElements: structureAnalysis.structure.navigableElements || nodeData.navigableElements,
      dominantElements: structureAnalysis.structure.dominantElements || nodeData.dominantElements,
      uniqueIdentifiers: structureAnalysis.structure.uniqueIdentifiers || nodeData.uniqueIdentifiers,
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

/**
 * Get dimensional hints based on scale for better image generation
 */
function getDimensionalHints(scale: string, orientation: string, form: string): string {
  const dimensions: Record<string, { primary: string; secondary: string; height: string }> = {
    small: { primary: '3-6m', secondary: '3-5m', height: '2.5-4m' },
    medium: { primary: '6-15m', secondary: '5-10m', height: '3-6m' },
    large: { primary: '15-50m', secondary: '10-30m', height: '6-20m' }
  };

  const dim = dimensions[scale] || dimensions.medium;

  // Adjust based on orientation
  if (orientation === 'vertical') {
    return `approximately ${dim.secondary} wide, ${dim.height} to ${dim.primary} tall`;
  } else if (orientation === 'horizontal') {
    return `approximately ${dim.primary} long, ${dim.secondary} wide, ${dim.height} ceiling height`;
  } else if (orientation === 'wide') {
    return `approximately ${dim.primary} wide, ${dim.secondary} deep, ${dim.height} ceiling height`;
  }
  // cubic
  return `approximately ${dim.secondary} in each dimension`;
}

/**
 * Compose image prompt from Structure + DNA analysis results
 * Includes inherited DNA from ancestors for visual consistency
 */
function composeImagePrompt(
  structureAnalysis: StructureAnalysis,
  dnaResult: any,
  userPrompt: string,
  parentDNA?: any
): string {
  const { structure } = structureAnalysis;
  const dna = dnaResult.dna || {};

  // Build the image prompt from pre-computed data
  const parts: string[] = [];

  // Start with perspective and space type
  parts.push(`${structureAnalysis.perspective} of ${structureAnalysis.name}.`);

  // Add structural description
  if (structure.spatialLayout) {
    parts.push(structure.spatialLayout);
  }

  // Add form, scale, and dimensional hints for better FLUX accuracy
  const dimensionalHints = getDimensionalHints(structure.scale, structure.orientation, structure.form);
  parts.push(`A ${structure.scale} ${structure.form} space (${dimensionalHints}).`);

  // Add orientation hint for cylindrical/spherical forms
  if (structure.form === 'cylindrical') {
    if (structure.orientation === 'horizontal') {
      parts.push('The cylinder is oriented horizontally (lying down), with a curved ceiling following the arc.');
    } else if (structure.orientation === 'vertical') {
      parts.push('The cylinder is oriented vertically (standing up), with curved walls and flat ceiling.');
    }
  } else if (structure.form === 'spherical') {
    parts.push('Interior curves follow the sphere in all directions.');
  }

  // Add DNA visual elements
  if (dna.looks) {
    parts.push(dna.looks);
  }

  // Add materials (prefer inherited materials_base if DNA materials missing)
  if (dna.materials) {
    parts.push(`Materials: ${dna.materials}`);
  } else if (parentDNA?.materials_base) {
    parts.push(`Materials: ${parentDNA.materials_base}`);
  }

  // Add colors and lighting
  if (dna.colorsAndLighting) {
    parts.push(dna.colorsAndLighting);
  }

  // Add atmosphere
  if (dna.atmosphere) {
    parts.push(dna.atmosphere);
  }

  // === INHERITED DNA FROM ANCESTORS (CRITICAL FOR VISUAL CONSISTENCY) ===
  // These ensure the niche looks like it belongs in its host (e.g., Parisian style)
  if (parentDNA) {
    if (parentDNA.architectural_tone) {
      parts.push(`ARCHITECTURAL STYLE (from host): ${parentDNA.architectural_tone}`);
    }
    if (parentDNA.cultural_tone) {
      parts.push(`Cultural context: ${parentDNA.cultural_tone}`);
    }
    if (parentDNA.palette_bias) {
      parts.push(`Color palette bias: ${parentDNA.palette_bias}`);
    }
    if (parentDNA.mood_baseline) {
      parts.push(`Mood: ${parentDNA.mood_baseline}`);
    }
  }

  // Add REQUIRED ELEMENTS (user-specified, MUST appear)
  if (structure.requiredElements && structure.requiredElements.length > 0) {
    parts.push(`MUST INCLUDE: ${structure.requiredElements.join('. ')}.`);
  }

  // Add suggested fixtures
  if (structure.suggestedFixtures && structure.suggestedFixtures.length > 0) {
    parts.push(`Fixtures: ${structure.suggestedFixtures.join(', ')}.`);
  }

  // Add navigable elements with visual prominence
  if (structure.navigableElements && structure.navigableElements.length > 0) {
    const navDescriptions = structure.navigableElements
      .map(n => `${n.type} at ${n.position}: ${n.description}`)
      .join('. ');
    parts.push(`Navigation points: ${navDescriptions}.`);
  }

  // Add dominant elements
  if (structure.dominantElements && structure.dominantElements.length > 0) {
    parts.push(`Key features: ${structure.dominantElements.join(', ')}.`);
  }

  // Add furnishing details if present
  if (structureAnalysis.furnishingDetails) {
    const { userSpecified, suggested, placementNotes } = structureAnalysis.furnishingDetails;
    if (userSpecified && userSpecified.length > 0) {
      parts.push(`User-specified furnishings: ${userSpecified.join(', ')}.`);
    }
    if (suggested && suggested.length > 0) {
      parts.push(`Suggested furnishings: ${suggested.join(', ')}.`);
    }
    if (placementNotes && placementNotes.length > 0) {
      parts.push(`Furnishing placement notes: ${placementNotes.join('. ')}.`);
    }
  }

  return parts.join(' ');
}
