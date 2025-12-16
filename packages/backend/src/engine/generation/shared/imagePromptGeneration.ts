/**
 * Unified Image Prompt Generation Module
 * 
 * LLM-based image prompt generation used by BOTH:
 * - nodeCreationPipeline.ts (spawn flow)
 * - createNodePipeline.ts (navigation flow)
 * 
 * Takes structure analysis + DNA + parent DNA and generates creative image prompts.
 * All analysis (form, materials, scale, etc.) is ALREADY DONE by structureAnalysis.ts
 * This module just creates an image prompt from that pre-analyzed data.
 */

import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { fluxInstructionsShort } from '../prompts/shared/constants';
import type { StructureAnalysis } from '../../navigation/types';

export interface ImagePromptGenerationInput {
  /** Structure analysis result (form, scale, navigableElements, etc.) */
  structureAnalysis?: StructureAnalysis;
  /** DNA result (looks, atmosphere, materials, mood, etc.) */
  dna: Record<string, any>;
  /** Parent DNA for inheritance (cascaded from all ancestors) */
  parentDNA?: Record<string, any>;
  /** User's original prompt/description */
  userPrompt: string;
  /** Node type being created */
  nodeType: 'host' | 'region' | 'location' | 'niche' | 'feature' | 'detail';
  /** Perspective (interior/exterior) */
  perspective: 'interior' | 'exterior';
  /** Parent chain for context */
  parentChain?: Array<{ type: string; name: string; description: string }>;
  /** 
   * Include current node's DNA in inherited fields (default: false)
   * When false: Only parentDNA is used for inheritance fields
   * When true: Current node's DNA is also shown in inheritance section
   * 
   * IMPORTANT: For /goto from a niche, this should be FALSE to avoid
   * the current niche's DNA bleeding into the new location's image.
   */
  includeCurrentNodeDNA?: boolean;
}

/**
 * Build the system prompt - passes all pre-analyzed data to the LLM
 * No hardcoded rules - the LLM creates the image prompt from the data
 */
function buildSystemPrompt(input: ImagePromptGenerationInput): string {
  const { structureAnalysis, dna, parentDNA, userPrompt, nodeType, perspective, parentChain } = input;

  // Build parent context
  const parentContext = parentChain && parentChain.length > 0
    ? parentChain.map(p => `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} "${p.name}": ${p.description}`).join('\n')
    : 'No parent context';

  // Build structure context if available (ALL analysis already done by structureAnalysis.ts)
  let structureContext = '';
  let enclosedInteriorConstraint = '';
  if (structureAnalysis) {
    const s = structureAnalysis.structure;
    
    // Add enclosed interior constraint for windowless spaces
    // Uses roofType to distinguish enclosed spaces from open-air spaces (terrace, rooftop, balcony)
    // - roofType === 'open-sky' → outdoor space, add OPEN-SKY constraint
    // - roofType !== 'open-sky' AND openings === 'none' → enclosed interior, apply enclosed constraint
    const isOpenSky = s.roofType === 'open-sky';
    const isEnclosedInterior = 
      !isOpenSky && 
      s.roofType !== null &&
      s.openings === 'none' && 
      input.perspective === 'interior';

    if (isOpenSky) {
      // CRITICAL: For open-sky spaces (terrace, rooftop, balcony), override any cave/dome ceiling from parent DNA
      enclosedInteriorConstraint = `
[CRITICAL: OPEN-SKY SPACE]
This is an OPEN-AIR space with NO ROOF or CEILING above.
- The architectural_tone from parents applies to WALLS and STYLE only, NOT to any roof/ceiling
- DO NOT add any roof, cave ceiling, dome, or covered structure overhead
- The SKY is directly visible above - show natural sky, clouds, or sunset/sunrise
- Even if parent is a "cave-dwelling", this specific space has open sky above
- Walls can maintain the organic/cave-like style, but there is NO cave ceiling
`;
    } else if (isEnclosedInterior) {
      enclosedInteriorConstraint = `
[CONSTRAINT:] fully enclosed interior; no openings, holes, skylights, or gaps in the roof or ceiling unless explicitly specified; maintain intact, continuous ceiling structure
`;
    }
    
    structureContext = `
=== STRUCTURE (Pre-analyzed by structureAnalysis.ts) ===
Name: ${structureAnalysis.name}
Perspective: ${structureAnalysis.perspective}
Form: ${s.form}
Scale: ${s.scale}
Orientation: ${s.orientation}
Roof/Ceiling Type: ${s.roofType || 'not specified'}
Openings: ${s.openings || 'not specified'}
Opening Shape: ${s.openingShape || 'not specified'}
Functional Type: ${s.functionalType}
Spatial Layout: ${s.spatialLayout || 'not specified'}
${enclosedInteriorConstraint}
${s.requiredElements && s.requiredElements.length > 0 ? `MUST INCLUDE (User-specified): ${s.requiredElements.join(', ')}` : ''}
${s.suggestedFixtures && s.suggestedFixtures.length > 0 ? `Suggested Fixtures: ${s.suggestedFixtures.join(', ')}` : ''}
${s.navigableElements && s.navigableElements.length > 0 ? `Navigable Elements: ${s.navigableElements.map(n => `${n.type} at ${n.position}: ${n.description}`).join('; ')}` : ''}
${s.dominantElements && s.dominantElements.length > 0 ? `Dominant Elements: ${s.dominantElements.join(', ')}` : ''}
${s.uniqueIdentifiers && s.uniqueIdentifiers.length > 0 ? `Unique Identifiers: ${s.uniqueIdentifiers.join(', ')}` : ''}
`;
  }

  // Build DNA context
  const dnaContext = `
=== DNA (Visual/Atmospheric Properties) ===
${dna.looks ? `Looks: ${dna.looks}` : ''}
${dna.spatialLayout ? `Spatial Layout: ${dna.spatialLayout}` : ''}
${dna.atmosphere ? `Atmosphere: ${dna.atmosphere}` : ''}
${dna.colorsAndLighting ? `Colors & Lighting: ${dna.colorsAndLighting}` : ''}
${dna.materials ? `Materials: ${dna.materials}` : ''}
${dna.mood ? `Mood: ${dna.mood}` : ''}

${dna.primary_surfaces ? `Primary Surfaces: ${dna.primary_surfaces}` : ''}
${dna.secondary_surfaces ? `Secondary Surfaces: ${dna.secondary_surfaces}` : ''}
${dna.accent_features ? `Accent Features: ${dna.accent_features}` : ''}

${dna.dominant ? `Dominant Colors: ${dna.dominant}` : ''}
${dna.secondary ? `Secondary Colors: ${dna.secondary}` : ''}
${dna.accent ? `Accent Colors: ${dna.accent}` : ''}
${dna.ambient ? `Ambient Light: ${dna.ambient}` : ''}

${dna.genre ? `Genre: ${dna.genre}` : ''}
${dna.architectural_tone ? `Architectural Tone: ${dna.architectural_tone}` : ''}
${dna.cultural_tone ? `Cultural Tone: ${dna.cultural_tone}` : ''}
${dna.mood_baseline ? `Mood Baseline: ${dna.mood_baseline}` : ''}
${dna.materials_base ? `Materials Base: ${dna.materials_base}` : ''}
${dna.palette_bias ? `Palette Bias: ${dna.palette_bias}` : ''}
`;

  // Build inherited DNA context
  let inheritedContext = '';
  if (parentDNA) {
    inheritedContext = `
=== INHERITED FROM PARENT (for visual consistency) ===
${parentDNA.architectural_tone ? `Architectural Style: ${parentDNA.architectural_tone}` : ''}
${parentDNA.cultural_tone ? `Cultural Context: ${parentDNA.cultural_tone}` : ''}
${parentDNA.palette_bias ? `Color Palette Bias: ${parentDNA.palette_bias}` : ''}
${parentDNA.mood_baseline ? `Mood: ${parentDNA.mood_baseline}` : ''}
${parentDNA.materials_base ? `Materials Base: ${parentDNA.materials_base}` : ''}
${parentDNA.materials ? `Parent Materials: ${parentDNA.materials}` : ''}
`;
  }

  // Build furnishing context if available
  let furnishingContext = '';
  if (structureAnalysis?.furnishingDetails) {
    const f = structureAnalysis.furnishingDetails;
    furnishingContext = `
=== FURNISHING (Space is fully furnished) ===
${f.userSpecified && f.userSpecified.length > 0 ? `User-specified items (MUST INCLUDE): ${f.userSpecified.join(', ')}` : ''}
${f.suggested && f.suggested.length > 0 ? `Suggested furnishings: ${f.suggested.join(', ')}` : ''}
${f.placementNotes && f.placementNotes.length > 0 ? `Placement notes: ${f.placementNotes.join(' ')}` : ''}
`;
  }

  return `
You are an expert at creating image prompts for FLUX image generation.

USER'S ORIGINAL REQUEST:
"${userPrompt}"

NODE TO VISUALIZE:
Type: ${nodeType}
Perspective: ${perspective}
${structureAnalysis ? `Name: "${structureAnalysis.name}"` : ''}

PARENT CONTEXT (for world coherence):
${parentContext}

${structureContext}

${dnaContext}

${inheritedContext}

${furnishingContext}

${fluxInstructionsShort}

YOUR TASK:
Create a detailed, vivid image prompt for FLUX that:
1. Respects the STRUCTURE data (form, scale, orientation, functional type)
2. Uses ALL the DNA details (materials, colors, atmosphere, mood)
3. Includes ALL required elements and navigable elements
4. Creates an ASYMMETRIC, visually interesting composition
5. Matches the architectural_tone and cultural_tone

**CRITICAL FOR INTERIORS - MATERIAL PRIORITY:**
For INTERIOR spaces, the scene-specific DNA fields take PRIORITY over inherited/cascading fields:
- USE: "looks", "materials", "primary_surfaces" from this node's DNA (these describe BUILDING materials)
- IGNORE: landscape/environment references in inherited fields (rock formations, sand, terrain, vegetation)
- The parent's "architectural_tone" and "materials_base" may reference the EXTERIOR landscape - do NOT use landscape materials for interior walls
- Interior walls are made of BUILDING materials (composites, metals, polished surfaces), NOT surrounding landscape (rocks, sand)

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should be rich, specific, and capture the unique character of this ${nodeType}.
`;
}

/**
 * Generate an LLM-powered image prompt
 * 
 * This is the UNIFIED function used by both spawn and navigation pipelines.
 * It takes structure analysis + DNA + parent DNA and generates a creative image prompt.
 */
export async function generateImagePromptForNode(
  apiKey: string,
  input: ImagePromptGenerationInput
): Promise<string> {
  // CRITICAL: Override perspective to 'exterior' when roofType is 'open-sky'
  // This prevents "interior shot" + "open-sky" contradiction that causes cave-like images
  const isOpenSky = input.structureAnalysis?.structure?.roofType === 'open-sky';
  if (isOpenSky && input.perspective === 'interior') {
    console.log(`[ImagePromptGeneration] Overriding perspective from 'interior' to 'exterior' (roofType is open-sky)`);
    input.perspective = 'exterior';
  }

  const systemPrompt = buildSystemPrompt(input);

  const result = await generateText(
    apiKey,
    [{ role: 'user', content: systemPrompt }],
    AI_MODELS.SEED_GENERATION
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate image prompt');
  }

  let finalPrompt = result.data.text.trim();

  // CRITICAL: Append open-sky constraint DIRECTLY to FLUX prompt
  // The LLM often ignores the guidance due to overwhelming "cave" references in DNA
  // By appending directly, FLUX receives the instruction regardless of LLM behavior
  if (isOpenSky) {
    finalPrompt += '\n[CRITICAL: NO ROOF/CEILING - This is an OPEN-SKY outdoor space. The sky is DIRECTLY VISIBLE above. DO NOT show any cave ceiling, dome, vaulted roof, or covered structure overhead. Show natural sky, clouds, or sunset/sunrise above instead.]';
  }

  return finalPrompt;
}
