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
import { generateImagePromptForNode } from '../../generation/shared/imagePromptGeneration';
import type { NavigationDecision, NavigationContext, IntentResult, DestinationAnalysis, StructureAnalysis, Structure } from '../types';
import { NICHE_CAMERA } from '../../generation/prompts/shared/cameraConfig';
import { findParentLocationNode, findParentRegionNode } from '../navigationHelpers';
import { PipelineHelper } from '../../pipelines/shared/pipelineHelpers';
import { getPipelineTypeForIntent } from '../../pipelines/shared/pipelineConfig';
import mediaService from '../../../services/media/mediaService';
import { analyzeDestination } from '../analyzers/destinationAnalyzer';
import { analyzeStructure, ParsedEnhancements } from '../analyzers/structureAnalyzer';

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
  /** Pre-parsed navigable elements and furnishing from command (user-controlled) */
  parsedEnhancements?: ParsedEnhancements;
  isSubPipeline?: boolean; // Running as sub-pipeline - skip started/completed events (parent handles progress)
  /** True when GOTO is triggered from a location node (creates sibling location instead of niche) */
  isFromLocation?: boolean;
  /** Pre-resolved parent DNA (from region/host) - used when route handler has already resolved DNA */
  resolvedParentDNA?: any;
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
  // Skip helper entirely for sub-pipelines - parent handles all progress events
  const helper = (navigationId && !options?.isSubPipeline) 
    ? new PipelineHelper(navigationId, 'CreateNodePipeline', pipelineType) 
    : null;

  try {
    const nodeType = options?.nodeType || 'niche';
    const shouldGenerateImage = options?.generateImage !== false;

    // Get style and perspective from decision or options
    // IMPORTANT: For location-type nodes (GOTO from location), default to exterior
    let style = options?.style || decision.style || intent.style || 'default';
    
    // Default perspective based on node type being created
    const defaultPerspective = (nodeType === 'location' || options?.isFromLocation) ? 'exterior' : 'interior';
    let perspective = options?.perspective || decision.perspective || intent.spaceType || defaultPerspective;
    
    // DEBUG: Log perspective resolution
    console.log(`[PERSPECTIVE DEBUG] Pipeline perspective resolution:`);
    console.log(`  options?.perspective: ${options?.perspective}`);
    console.log(`  decision.perspective: ${decision.perspective}`);
    console.log(`  intent.spaceType: ${intent.spaceType}`);
    console.log(`  nodeType: ${nodeType}`);
    console.log(`  isFromLocation: ${options?.isFromLocation}`);
    console.log(`  defaultPerspective: ${defaultPerspective}`);
    console.log(`  Final perspective: ${perspective}`);

    // Only send started event if not a sub-pipeline (parent handles progress)
    if (helper && !options?.isSubPipeline) {
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

    // Determine if this is a GOTO command (creates new destination vs entering current location)
    const isGotoCommand = !!options?.gotoText;
    
    // Run Structure Analysis and DNA Generation in PARALLEL
    const [structureAnalysis, dnaResult] = await Promise.all([
      // Structure Analysis (determines physical/spatial properties)
      // NOTE: parsedEnhancements (navigableElements, furnishing) come from user command, not LLM
      // For GOTO: uses destination-focused prompt (user input is PRIMARY)
      analyzeStructure(apiKey, userPrompt, context, perspective as 'interior' | 'exterior', options?.parsedEnhancements, { isGotoCommand }),
      
      // DNA Generation (determines visual/atmospheric properties)
      (async () => {
        // CRITICAL: Use pre-resolved parent DNA if available (from route handler)
        // This ensures proper cascaded DNA from region/host is used
        let parentDNA: any;
        if (options?.resolvedParentDNA) {
          // Route handler already resolved cascaded DNA - use it directly
          parentDNA = options.resolvedParentDNA;
          console.log(`[DNA] Using PRE-RESOLVED parent DNA from route handler`);
          console.log(`  - architectural_tone: ${parentDNA.architectural_tone || 'null'}`);
          console.log(`  - palette_bias: ${parentDNA.palette_bias || 'null'}`);
        } else if (isGotoCommand && options?.isFromLocation) {
          // Fallback: try to get region DNA from context (may be incomplete)
          const { parentRegionDNA } = findParentRegionNode(context);
          parentDNA = parentRegionDNA;
          console.log(`[DNA] GOTO from location: Using REGION DNA from context (fallback)`);
        } else {
          const { parentLocationDNA } = findParentLocationNode(context);
          parentDNA = parentLocationDNA;
        }
        
        const parentContext = parentDNA
          ? extractParentContext(parentDNA)
          : undefined;
        
        // Generate DNA with basic info - we'll enhance with structure later
        // For GOTO: uses simplified parent context (style only, not content)
        return generateNodeDNA(
          apiKey,
          userPrompt,
          decision.newNodeName || 'Unnamed Space',
          nodeType,
          userPrompt,
          parentContext,
          { isGotoCommand }
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

    // CRITICAL: If roofType is 'open-sky', the space is EXTERIOR (not interior)
    // This prevents "interior shot" + "open-sky" contradiction that causes cave-like images
    if (structureAnalysis.structure.roofType === 'open-sky' && perspective === 'interior') {
      console.log(`[Pipeline] Overriding perspective from '${perspective}' to 'exterior' (roofType is open-sky)`);
      perspective = 'exterior';
      structureAnalysis.perspective = 'exterior';
    }

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
    // STEP 2: IMAGE PROMPT GENERATION (LLM-based, unified approach)
    // ═══════════════════════════════════════════════════════════════════════════
    if (helper) {
      helper.startStage('image_prompt', 'Generating image prompt...');
    }

    // Get parent DNA for visual consistency (architectural_tone, cultural_tone, etc.)
    // CRITICAL: Use pre-resolved DNA if available (from route handler)
    let parentDNAForImagePrompt: any;
    if (options?.resolvedParentDNA) {
      // Route handler already resolved cascaded DNA - use it directly
      parentDNAForImagePrompt = options.resolvedParentDNA;
      console.log(`[ImagePrompt] Using PRE-RESOLVED parent DNA from route handler`);
    } else if (isGotoCommand && options?.isFromLocation) {
      const { parentRegionDNA } = findParentRegionNode(context);
      parentDNAForImagePrompt = parentRegionDNA;
      console.log(`[ImagePrompt] GOTO from location: Using REGION DNA from context (fallback)`);
    } else {
      const { parentLocationDNA } = findParentLocationNode(context);
      parentDNAForImagePrompt = parentLocationDNA;
    }
    
    // Use unified LLM-based image prompt generator
    // IMPORTANT: includeCurrentNodeDNA is false by default to prevent
    // the current niche's DNA from affecting the new node's image
    let imagePrompt = await generateImagePromptForNode(apiKey, {
      structureAnalysis,
      dna: dnaResult.dna || {},
      parentDNA: parentDNAForImagePrompt || undefined,
      userPrompt,
      nodeType,
      perspective: perspective as 'interior' | 'exterior',
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
    // Use the same parent DNA as image prompt (region DNA for GOTO from location)
    const mergedDNA = mergeDNAWithParent(dnaResult.dna, parentDNAForImagePrompt);
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

    // Extract structural fields from structure object to store at ROOT level only (not duplicated inside structure)
    const { 
      dominantElements, 
      uniqueIdentifiers, 
      navigableElements, 
      ...cleanStructure 
    } = structureAnalysis.structure;

    // Build node with SEPARATE structure (new architecture)
    const node = buildNode(nodeType, structureAnalysis.name, nodeData.dna, {
      description: structureAnalysis.description || nodeData.description,
      // Structure is now stored separately at node level (not inside DNA)
      // These fields are stripped out and stored at root level to avoid duplication
      structure: cleanStructure,
      // Furnishing details (when --furnish flag is used)
      furnishingDetails: structureAnalysis.furnishingDetails,
      // Structural fields at ROOT level only (not inside structure object)
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
    if (decision.metadata?.promoteParentToLocation) {
      console.log('  Promote Parent: ✓ (parent niche will become location)');
    }
    console.log('═══════════════════════════════════════════════════════════\n');

    // Only send completion event if not a sub-pipeline (parent handles progress)
    if (helper && !options?.isSubPipeline) {
      // Include promoteParentToLocation flag if set (for GO_INSIDE from niche)
      const completedData: any = { node, imageUrl, imagePrompt };
      if (decision.metadata?.promoteParentToLocation) {
        completedData.promoteParentToLocation = true;
        completedData.parentNodeId = decision.parentNodeId;
      }
      helper.completed('Node created successfully', completedData);
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
 * Uses tighter, more realistic ranges especially for small spaces
 */
function getDimensionalHints(scale: string, orientation: string, form: string): string {
  // Tighter dimension ranges for more accurate image generation
  const dimensions: Record<string, { primary: string; secondary: string; height: string }> = {
    small: { primary: '2-4m', secondary: '2-3m', height: '2-3m' },
    medium: { primary: '4-10m', secondary: '3-6m', height: '3-5m' },
    large: { primary: '10-30m', secondary: '8-15m', height: '5-15m' }
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

  // Add opening shape specification (critical for window/porthole consistency)
  if (structure.openingShape) {
    const shapeDescriptions: Record<string, string> = {
      rectangular: 'Windows and openings are rectangular/square-shaped.',
      circular: 'Windows and openings are circular/round (portholes).',
      arched: 'Windows and openings have arched tops.',
      mixed: 'Windows include both rectangular and circular shapes.',
      irregular: 'Windows and openings have organic, non-standard shapes.'
    };
    parts.push(shapeDescriptions[structure.openingShape] || '');
  }

  // Add furnishing details if present (--furnish flag was used)
  // Use STRONG emphasis to ensure FLUX renders furniture prominently
  if (structureAnalysis.furnishingDetails) {
    const { userSpecified, suggested, placementNotes } = structureAnalysis.furnishingDetails;
    console.log('\n🪑 [FURNISHING] --furnish flag detected, adding EMPHASIZED furnishing details to image prompt:');
    
    // CRITICAL: Add strong furnishing emphasis to prevent empty spaces
    parts.push('IMPORTANT: This space is FULLY FURNISHED and IN ACTIVE USE - NOT an empty room.');
    parts.push('Furniture and equipment FILL THE SPACE, distributed throughout the floor area, not just along walls.');
    parts.push('Items are HUMAN-SCALE and PROMINENTLY VISIBLE in foreground and midground.');
    
    if (userSpecified && userSpecified.length > 0) {
      console.log(`  User-specified: ${userSpecified.join(', ')}`);
      parts.push(`MUST INCLUDE these user-specified items (prominently visible): ${userSpecified.join(', ')}.`);
    }
    if (suggested && suggested.length > 0) {
      console.log(`  Suggested: ${suggested.join(', ')}`);
      // Convert list to more descriptive scene setting
      const furnishingCount = suggested.length;
      parts.push(`The space contains at least ${Math.min(furnishingCount, 4)}-${Math.min(furnishingCount + 2, 8)} pieces of furniture/equipment: ${suggested.join(', ')}.`);
      parts.push('These items occupy 40-60% of the visible floor space.');
    }
    if (placementNotes && placementNotes.length > 0) {
      console.log(`  Placement notes: ${placementNotes.join('. ')}`);
      parts.push(`Spatial arrangement: ${placementNotes.join(' ')}`);
    }
  }

  return parts.join(' ');
}
