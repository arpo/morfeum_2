/**
 * World Tree Image Prompt Generation (Two-Step Approach)
 * 
 * Creates a CONTEXT prompt that is sent to an LLM to generate the actual FLUX image description.
 * This mirrors the approach used in nicheImagePrompt.ts for better quality images.
 * 
 * Step 1: Build detailed context prompt with ALL DNA + composition instructions
 * Step 2: LLM generates the actual FLUX image description (in pipeline)
 * 
 * @param nodeType - Type of the deepest node
 * @param nodeName - Name of the deepest node
 * @param dna - DNA object from deepestNodeDNAGeneration
 * @param originalPrompt - Original user input
 * @param parentChain - Parent nodes for context
 * @returns Context prompt string for LLM to create FLUX description
 */

import { applyMorfeumStyle } from '../../shared/applyMorfeumStyle';
import {
  OVERVIEW_SHOT, 
  LOCATION_SHOT, 
  NICHE_SHOT_INTERIOR, 
  ALIGNMENT 
} from '../shared/cameraConfig';
import { fluxInstructionsShort } from '../shared/constants';
import type { NodeDNA } from '../../../hierarchyAnalysis/types';

export interface WorldTreeImagePromptParams {
  nodeType: 'host' | 'region' | 'location' | 'niche';
  nodeName: string;
  dna: Partial<NodeDNA>;
  originalPrompt: string;
  parentChain: Array<{
    type: string;
    name: string;
    description: string;
  }>;
}

/**
 * Exterior composition instructions for location nodes
 */
const EXTERIOR_COMPOSITION_INSTRUCTIONS = `
EXTERIOR BUILDING/LOCATION COMPOSITION (CRITICAL):

1. CAMERA POSITION
- Position at street level, slightly elevated (25-30° downward tilt)
- Building entrance visible but not dominating frame
- Ultra-wide view capturing building in environmental context
- Extensive surroundings visible (street, neighboring buildings, sky)

2. FACADE & ARCHITECTURAL DETAILS (MUST MATCH DNA)
- Building facade MUST reflect the architectural_tone exactly
- Include: signage, windows, doors, decorative elements, material textures
- Show how the building relates to its environment (set back, flush with street, etc.)
- Capture unique identifying features that make this building distinctive

3. COMPOSITION LAYERS
**Foreground:** Street surface, curb, immediate pavement with texture and detail.
MUST include 1 environmental element (e.g., "worn cobblestone with puddles reflecting neon signs").

**Midground:** The building facade as the main subject.
MUST show: entrance, signage, window displays, architectural details.
Position slightly off-center for dynamic composition.

**Background:** Sky, neighboring buildings, environmental context.
MAY include: distant landmarks, atmospheric elements (clouds, haze).

4. LIGHTING & ATMOSPHERE
- Match the DNA's colorsAndLighting and ambient fields
- Consider time of day implied by lighting (neon = night, natural = day)
- Environmental effects (mist, rain, heat shimmer) if mentioned in atmosphere

5. ASYMMETRIC COMPOSITION (CRITICAL)
- Building should NOT be perfectly centered
- Shoot at slight angle to show depth and dimension
- Include environmental asymmetry (more street visible on one side)
- Avoid: Perfectly frontal shots, centered subjects, bilateral symmetry
`;

/**
 * Host/Region overview composition instructions
 */
const OVERVIEW_COMPOSITION_INSTRUCTIONS = `
OVERVIEW/AERIAL COMPOSITION (HOST/REGION):

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

4. ATMOSPHERE & MOOD
- Match the DNA's atmosphere and mood fields
- Include environmental effects (haze, clouds, weather)
- Lighting should establish time of day and overall tone
`;

/**
 * Generate CONTEXT prompt for LLM to create FLUX image description
 * This is sent to an LLM which then generates the actual FLUX prompt
 */
export function worldTreeImagePromptContext(params: WorldTreeImagePromptParams): string {
  const { nodeType, nodeName, dna, originalPrompt, parentChain } = params;
  
  // Get appropriate composition instructions
  const compositionInstructions = nodeType === 'location' 
    ? EXTERIOR_COMPOSITION_INSTRUCTIONS 
    : OVERVIEW_COMPOSITION_INSTRUCTIONS;
  
  // Build parent context
  const parentContext = parentChain.length > 0
    ? parentChain.map(p => `${p.type.charAt(0).toUpperCase() + p.type.slice(1)} "${p.name}": ${p.description}`).join('\n')
    : 'No parent context (this is the root node)';

  const prompt = `
You are an expert at creating image prompts for FLUX image generation.

USER'S ORIGINAL REQUEST:
"${originalPrompt}"

NODE TO VISUALIZE:
Type: ${nodeType}
Name: "${nodeName}"

PARENT CONTEXT (for world coherence):
${parentContext}

${compositionInstructions}

=== SCENE-SPECIFIC DETAILS (from DNA) ===
${dna.looks ? `Looks: ${dna.looks}` : ''}
${dna.spatialLayout ? `Spatial Layout: ${dna.spatialLayout}` : ''}
${dna.atmosphere ? `Atmosphere: ${dna.atmosphere}` : ''}
${dna.colorsAndLighting ? `Colors & Lighting: ${dna.colorsAndLighting}` : ''}
${dna.materials ? `Materials: ${dna.materials}` : ''}
${dna.mood ? `Mood: ${dna.mood}` : ''}
${dna.sounds ? `Sounds (for atmosphere hints): ${dna.sounds}` : ''}

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

${dna.architectural_tone ? `
ARCHITECTURAL TONE (CRITICAL - MUST MATCH EXACTLY): ${dna.architectural_tone}
The building/environment MUST reflect this architectural style in ALL visible details (facade, windows, doors, decorative elements, materials, finishes).` : ''}

${dna.cultural_tone ? `Cultural Tone: ${dna.cultural_tone}` : ''}
${dna.mood_baseline ? `Mood Baseline: ${dna.mood_baseline}` : ''}
${dna.materials_base ? `Materials Base Style: ${dna.materials_base}` : ''}
${dna.palette_bias ? `Palette Bias Style: ${dna.palette_bias}` : ''}

${fluxInstructionsShort}

REQUIREMENTS:
1. Create a detailed, vivid image prompt that captures ALL the DNA details above
2. The image should be visually interesting with ASYMMETRIC composition
3. Include environmental context and atmosphere
4. Match the architectural_tone EXACTLY in all visible architectural details
5. Use the color palette breakdown to inform the visual

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should be rich, specific, and capture the unique character of this ${nodeType}.
`;

  return prompt;
}

/**
 * Generate DIRECT FLUX prompt from DNA (fallback/simple approach)
 * Used when LLM synthesis step is not available
 */
export function worldTreeImagePrompt(params: WorldTreeImagePromptParams): string {
  const { nodeType, nodeName, dna, originalPrompt, parentChain } = params;
  
  // Get camera configuration based on node type
  const cameraConfig = getCameraConfig(nodeType);
  
  // Build context from parent chain
  const contextText = buildContextText(parentChain);
  
  // Build scene description from DNA
  const sceneDescription = buildSceneDescription(dna, nodeType);
  
  // Build materials and colors section from DNA
  const materialsSection = buildMaterialsSection(dna);
  
  // Build atmosphere section from DNA
  const atmosphereSection = buildAtmosphereSection(dna);
  
  const prompt = `Original user description: "${originalPrompt}"

${nodeName}, ${cameraConfig.shot}.

[CAMERA ALIGNMENT:] ${ALIGNMENT.CENTERED}
[LIGHT:] ${cameraConfig.light}
[LENS:] ${cameraConfig.lens}

[SCENE:]
${contextText}
${sceneDescription}

${materialsSection}

${atmosphereSection}

[ARCHITECTURAL STYLE:] ${dna.architectural_tone || 'Not specified'}
[MOOD:] ${dna.mood || dna.mood_baseline || 'Not specified'}`;

  return applyMorfeumStyle(prompt);
}

/**
 * Get camera configuration based on node type
 */
function getCameraConfig(nodeType: 'host' | 'region' | 'location' | 'niche') {
  switch (nodeType) {
    case 'host':
      return OVERVIEW_SHOT;
    case 'region':
      return OVERVIEW_SHOT; // Regions also get elevated overview
    case 'location':
      return LOCATION_SHOT; // Exterior shot
    case 'niche':
      return NICHE_SHOT_INTERIOR; // Interior shot
  }
}

/**
 * Build context text from parent chain
 */
function buildContextText(parentChain: Array<{ type: string; name: string; description: string }>): string {
  if (parentChain.length === 0) return '';
  
  return parentChain
    .map(p => {
      const typeLabel = p.type.charAt(0).toUpperCase() + p.type.slice(1);
      return `${typeLabel} ${p.name}: ${p.description}.`;
    })
    .join('\n\n');
}

/**
 * Build scene description from DNA
 */
function buildSceneDescription(dna: Partial<NodeDNA>, nodeType: string): string {
  const parts: string[] = [];
  
  // Main visual description
  if (dna.looks) {
    parts.push(`Looks: ${dna.looks}`);
  }
  
  // Spatial layout
  if (dna.spatialLayout) {
    parts.push(`Layout: ${dna.spatialLayout}`);
  }
  
  // Colors and lighting
  if (dna.colorsAndLighting) {
    parts.push(`Lighting: ${dna.colorsAndLighting}`);
  }
  
  return parts.join('\n\n');
}

/**
 * Build materials section from DNA
 */
function buildMaterialsSection(dna: Partial<NodeDNA>): string {
  const parts: string[] = [];
  
  if (dna.materials) {
    parts.push(`[MATERIALS:] ${dna.materials}`);
  }
  
  if (dna.primary_surfaces || dna.secondary_surfaces || dna.accent_features) {
    const surfaces: string[] = [];
    if (dna.primary_surfaces) surfaces.push(`Primary: ${dna.primary_surfaces}`);
    if (dna.secondary_surfaces) surfaces.push(`Secondary: ${dna.secondary_surfaces}`);
    if (dna.accent_features) surfaces.push(`Accents: ${dna.accent_features}`);
    parts.push(`[SURFACES:] ${surfaces.join(' | ')}`);
  }
  
  return parts.join('\n');
}

/**
 * Build atmosphere section from DNA
 */
function buildAtmosphereSection(dna: Partial<NodeDNA>): string {
  const parts: string[] = [];
  
  if (dna.atmosphere) {
    parts.push(`[ATMOSPHERE:] ${dna.atmosphere}`);
  }
  
  // Color palette
  const colorParts: string[] = [];
  if (dna.dominant) colorParts.push(`Dominant: ${dna.dominant}`);
  if (dna.secondary) colorParts.push(`Secondary: ${dna.secondary}`);
  if (dna.accent) colorParts.push(`Accent: ${dna.accent}`);
  if (dna.ambient) colorParts.push(`Ambient light: ${dna.ambient}`);
  
  if (colorParts.length > 0) {
    parts.push(`[COLOR PALETTE:] ${colorParts.join(' | ')}`);
  }
  
  // Sounds (for atmosphere hints even in images)
  if (dna.sounds) {
    parts.push(`[AMBIENT HINTS:] ${dna.sounds}`);
  }
  
  return parts.join('\n');
}
