/**
 * Unified Image Prompt Generation Module
 * 
 * LLM-based image prompt generation used by BOTH:
 * - nodeCreationPipeline.ts (spawn flow)
 * - createNodePipeline.ts (navigation flow)
 * 
 * Takes structure analysis + DNA + parent DNA and generates creative image prompts
 * using appropriate system prompts for interior vs exterior spaces.
 */

import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { applyMorfeumStyle } from './applyMorfeumStyle';
import { fluxInstructionsShort } from '../prompts/shared/constants';
import type { StructureAnalysis } from '../../navigation/types';

export interface ImagePromptGenerationInput {
  /** Structure analysis result (form, scale, navigableElements, etc.) */
  structureAnalysis?: StructureAnalysis;
  /** DNA result (looks, atmosphere, materials, mood, etc.) */
  dna: Record<string, any>;
  /** Parent DNA for inheritance */
  parentDNA?: Record<string, any>;
  /** User's original prompt/description */
  userPrompt: string;
  /** Node type being created */
  nodeType: 'host' | 'region' | 'location' | 'niche' | 'feature' | 'detail';
  /** Perspective (interior/exterior) */
  perspective: 'interior' | 'exterior';
  /** Parent chain for context */
  parentChain?: Array<{ type: string; name: string; description: string }>;
}

/**
 * Material translation rules for interior spaces
 * Ensures interior materials match exterior (wood house = wood interior, not stone)
 */
const MATERIAL_TRANSLATION_INSTRUCTIONS = `
=== MATERIAL TRANSLATION LOGIC (CRITICAL) ===
Identify the PRIMARY EXTERIOR WALL MATERIAL and translate it to interior finishes.
IMPORTANT: Foundation material ≠ Wall material. A stone foundation does NOT mean stone interior walls.

MATERIAL PRIORITY (read the parent's materials description):
- If exterior walls are WOOD (clapboard, siding, timber, planks) → Interior MUST be wood paneling, wood plaster walls, or exposed timber
- If exterior walls are STONE (full stone walls, not just foundation) → Interior can be stone/plaster/masonry
- If exterior walls are BRICK → Interior can be exposed brick or plaster
- Foundation material (often stone) affects FLOOR only, not walls

TRANSLATION RULES:
• Ext. Wood Clapboard/Siding → **Int. Wood Paneling, Plaster over Wood Lath, or Exposed Beams**
  - NOT stone walls. A wooden house has wooden interior walls.
  - Typical: whitewashed wood panels, exposed timber frame, painted wood trim
• Ext. Timber Frame → Int. Exposed Beams + Plaster infill or Wood Paneling
• Ext. Stone (full walls) → Int. Polished Stone / Plaster / Masonry
• Ext. Brick → Int. Exposed Brick / Plaster / Painted Brick
• Ext. Glass/Crystal → Int. ARCHITECTURAL GLAZING (High-Tech Atrium style)
• Ext. Metal → Int. Supports / Grating / Plating
• Ext. Concrete → Int. Smooth Industrial

FOUNDATION vs WALLS (CRITICAL):
- Stone foundation + Wood walls = Wood paneled interior, stone may appear on FLOOR only
- Stone foundation does NOT mean stone interior walls
- Read the "materials" field carefully - what is the PRIMARY WALL material?
`;

/**
 * Interior composition instructions
 */
const INTERIOR_COMPOSITION_INSTRUCTIONS = `
=== INTERIOR SPACE COMPOSITION ===

1. CAMERA POSITION
- First-person perspective, as if standing inside the space
- Eye-level or slightly elevated view
- Looking into the depth of the space

2. FORM + ORIENTATION (MUST MATCH PARENT STRUCTURE)
**CRITICAL: The interior MUST match the parent's form and orientation.**

FORM MATCHING RULES (MANDATORY):
- Parent form = "rectangular" → Interior MUST have STRAIGHT WALLS and CORNERS (NOT circular/round)
- Parent form = "round" → Interior can have circular plan
- Parent form = "cylindrical" → Interior has curved walls following cylinder axis
- Parent form = "faceted/geodesic" → Interior has geometric framework
- Parent form = "organic" → Interior has uneven/natural surfaces

ORIENTATION MATCHING RULES (CRITICAL FOR CYLINDRICAL/ELONGATED SHAPES):
- Horizontal cylinder (laying down): Curved walls on LEFT and RIGHT sides, flat ends at FRONT and BACK
- Vertical cylinder (standing up): Curved walls WRAP AROUND in 360° arc, domed or flat ceiling above

3. CEILING (CRITICAL: SOLIDITY & OPACITY)
**ROOF INTEGRITY RULE: Construct a completely solid and continuous roof structure.**
- NO SKYLIGHTS OR HOLES unless explicitly glass material
- Match ceiling to roof type: domed → domed ceiling, flat → flat ceiling, etc.

4. ASYMMETRIC COMPOSITION (CRITICAL)
- Position key navigable elements at 1/3 or 2/3 positions (NOT center)
- Main focal points should NOT be dead center
- Use diagonal sight lines for depth
- Uneven distribution of visual weight
- Avoid: Perfect bilateral symmetry, centered archways, mirror compositions

${MATERIAL_TRANSLATION_INSTRUCTIONS}
`;

/**
 * Exterior composition instructions
 */
const EXTERIOR_COMPOSITION_INSTRUCTIONS = `
=== EXTERIOR BUILDING/LOCATION COMPOSITION ===

1. CAMERA POSITION
- Position at street level, slightly elevated (25-30° downward tilt)
- Building entrance visible but not dominating frame
- Ultra-wide view capturing building in environmental context

2. FACADE & ARCHITECTURAL DETAILS (MUST MATCH DNA)
- Building facade MUST reflect the architectural_tone exactly
- Include: signage, windows, doors, decorative elements, material textures
- Show how the building relates to its environment

3. COMPOSITION LAYERS
**Foreground:** Street surface, curb, immediate pavement with texture.
**Midground:** The building facade as the main subject (off-center).
**Background:** Sky, neighboring buildings, environmental context.

4. ASYMMETRIC COMPOSITION (CRITICAL)
- Building should NOT be perfectly centered
- Shoot at slight angle to show depth
- Include environmental asymmetry
- Avoid: Perfectly frontal shots, centered subjects
`;

/**
 * Overview composition for host/region
 */
const OVERVIEW_COMPOSITION_INSTRUCTIONS = `
=== OVERVIEW/AERIAL COMPOSITION (HOST/REGION) ===

1. CAMERA POSITION
- Elevated oblique angle (45° tilt)
- Wide view capturing the environment's character
- Layered depth from foreground through distant background

2. ENVIRONMENTAL CHARACTER
- Show the dominant features that define this place
- Include: landmarks, typical architecture, atmospheric conditions
- Capture the scale and scope of the environment

3. COMPOSITION LAYERS
**Foreground:** Immediate terrain, structures, or features with detail.
**Midground:** Major landmarks, characteristic buildings, key features.
**Background:** Horizon, sky, distant elements, atmospheric depth.
`;

/**
 * Build the system prompt based on perspective and node type
 */
function buildSystemPrompt(
  input: ImagePromptGenerationInput
): string {
  const { structureAnalysis, dna, parentDNA, userPrompt, nodeType, perspective, parentChain } = input;

  // Select composition instructions based on perspective and node type
  let compositionInstructions: string;
  if (nodeType === 'host' || nodeType === 'region') {
    compositionInstructions = OVERVIEW_COMPOSITION_INSTRUCTIONS;
  } else if (perspective === 'interior') {
    compositionInstructions = INTERIOR_COMPOSITION_INSTRUCTIONS;
  } else {
    compositionInstructions = EXTERIOR_COMPOSITION_INSTRUCTIONS;
  }

  // Build parent context
  const parentContext = parentChain && parentChain.length > 0
    ? parentChain.map(p => `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} "${p.name}": ${p.description}`).join('\n')
    : 'No parent context';

  // Build structure context if available
  let structureContext = '';
  if (structureAnalysis) {
    const s = structureAnalysis.structure;
    structureContext = `
=== STRUCTURE ANALYSIS (Physical Properties) ===
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

${s.requiredElements && s.requiredElements.length > 0 ? `MUST INCLUDE (User-specified): ${s.requiredElements.join(', ')}` : ''}
${s.suggestedFixtures && s.suggestedFixtures.length > 0 ? `Suggested Fixtures: ${s.suggestedFixtures.join(', ')}` : ''}
${s.navigableElements && s.navigableElements.length > 0 ? `Navigable Elements: ${s.navigableElements.map(n => `${n.type} at ${n.position}: ${n.description}`).join('; ')}` : ''}
${s.dominantElements && s.dominantElements.length > 0 ? `Dominant Elements: ${s.dominantElements.join(', ')}` : ''}
${s.uniqueIdentifiers && s.uniqueIdentifiers.length > 0 ? `Unique Identifiers: ${s.uniqueIdentifiers.join(', ')}` : ''}
`;
  }

  // Build DNA context
  const dnaContext = `
=== SCENE-SPECIFIC DETAILS (from DNA) ===
${dna.looks ? `Looks: ${dna.looks}` : ''}
${dna.spatialLayout ? `Spatial Layout: ${dna.spatialLayout}` : ''}
${dna.atmosphere ? `Atmosphere: ${dna.atmosphere}` : ''}
${dna.colorsAndLighting ? `Colors & Lighting: ${dna.colorsAndLighting}` : ''}
${dna.materials ? `Materials: ${dna.materials}` : ''}
${dna.mood ? `Mood: ${dna.mood}` : ''}

Material Surface Breakdown:
${dna.primary_surfaces ? `Primary Surfaces: ${dna.primary_surfaces}` : ''}
${dna.secondary_surfaces ? `Secondary Surfaces: ${dna.secondary_surfaces}` : ''}
${dna.accent_features ? `Accent Features: ${dna.accent_features}` : ''}

Color Palette Breakdown:
${dna.dominant ? `Dominant Colors: ${dna.dominant}` : ''}
${dna.secondary ? `Secondary Colors: ${dna.secondary}` : ''}
${dna.accent ? `Accent Colors: ${dna.accent}` : ''}
${dna.ambient ? `Ambient Light: ${dna.ambient}` : ''}

${dna.genre ? `Genre: ${dna.genre}` : ''}

${dna.architectural_tone ? `ARCHITECTURAL TONE (CRITICAL): ${dna.architectural_tone}` : ''}
${dna.cultural_tone ? `Cultural Tone: ${dna.cultural_tone}` : ''}
${dna.mood_baseline ? `Mood Baseline: ${dna.mood_baseline}` : ''}
${dna.materials_base ? `Materials Base: ${dna.materials_base}` : ''}
${dna.palette_bias ? `Palette Bias: ${dna.palette_bias}` : ''}
`;

  // Build inherited DNA context
  let inheritedContext = '';
  if (parentDNA) {
    inheritedContext = `
=== INHERITED DNA FROM PARENT (for visual consistency) ===
${parentDNA.architectural_tone ? `ARCHITECTURAL STYLE (from host): ${parentDNA.architectural_tone}` : ''}
${parentDNA.cultural_tone ? `Cultural context: ${parentDNA.cultural_tone}` : ''}
${parentDNA.palette_bias ? `Color palette bias: ${parentDNA.palette_bias}` : ''}
${parentDNA.mood_baseline ? `Mood: ${parentDNA.mood_baseline}` : ''}
${parentDNA.materials_base ? `Materials base: ${parentDNA.materials_base}` : ''}
`;
  }

  // Build furnishing context if available
  let furnishingContext = '';
  if (structureAnalysis?.furnishingDetails) {
    const f = structureAnalysis.furnishingDetails;
    furnishingContext = `
=== FURNISHING DETAILS (--furnish flag) ===
IMPORTANT: This space is FULLY FURNISHED and IN ACTIVE USE - NOT an empty room.
${f.userSpecified && f.userSpecified.length > 0 ? `User-specified items (MUST INCLUDE): ${f.userSpecified.join(', ')}` : ''}
${f.suggested && f.suggested.length > 0 ? `Suggested furnishings: ${f.suggested.join(', ')}` : ''}
${f.placementNotes && f.placementNotes.length > 0 ? `Placement notes: ${f.placementNotes.join(' ')}` : ''}
Furniture and equipment should FILL THE SPACE, distributed throughout, not just along walls.
`;
  }

  return `
You are an expert at creating image prompts for FLUX image generation.

USER'S ORIGINAL REQUEST:
"${userPrompt}"

NODE TO VISUALIZE:
Type: ${nodeType}
${structureAnalysis ? `Name: "${structureAnalysis.name}"` : ''}

PARENT CONTEXT (for world coherence):
${parentContext}

${compositionInstructions}

${structureContext}

${dnaContext}

${inheritedContext}

${furnishingContext}

${fluxInstructionsShort}

REQUIREMENTS:
1. Create a detailed, vivid image prompt that captures ALL the DNA details above
2. The image should be visually interesting with ASYMMETRIC composition
3. Include environmental context and atmosphere
4. Match the architectural_tone EXACTLY in all visible architectural details
5. Use the color palette breakdown to inform the visual
6. If structure analysis is provided, respect form, scale, and orientation constraints
7. Include ALL required elements and navigable elements in the scene

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
  const systemPrompt = buildSystemPrompt(input);

  const result = await generateText(
    apiKey,
    [{ role: 'user', content: systemPrompt }],
    AI_MODELS.SEED_GENERATION
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'Failed to generate image prompt');
  }

  // Apply Morfeum visual style for consistent look
  return applyMorfeumStyle(result.data.text.trim());
}
