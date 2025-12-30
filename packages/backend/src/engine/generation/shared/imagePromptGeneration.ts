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
 * 
 * Returns STRUCTURED output (ImagePromptStructure) for:
 * - Layer-based scene composition
 * - Character placement in specific layers
 * - Reusable scene generation
 */

import { generateText } from '../../../services/mzoo';
import { AI_MODELS } from '../../../config/constants';
import { fluxInstructionsShort } from '../prompts/shared/constants';
import type { StructureAnalysis } from '../../navigation/types';
import { 
  buildDominantElementsContext, 
  buildShapeConstraints, 
  buildExteriorViewConstraint,
  buildImmediateSurroundingsConstraint
} from './imagePromptHelpers';
import type { ImagePromptStructure } from './imagePromptTypes';
import { assembleImagePrompt } from './imagePromptAssembler';
import { getImageConstraints, type ContainerType, type SpacePerspective } from './spaceTypeRegistry';

export interface ImagePromptGenerationInput {
  /** Structure analysis result (form, scale, navigableElements, etc.) */
  structureAnalysis?: StructureAnalysis;
  /** DNA result (looks, atmosphere, materials, mood, etc.) */
  dna: Record<string, any>;
  /** Parent DNA for inheritance (cascaded from all ancestors) */
  parentDNA?: Record<string, any>;
  /** 
   * Surroundings DNA - resolved ancestry DNA for window/view context
   * Used when parent is pass-through (empty DNA) to show correct exterior through windows
   */
  surroundingsDNA?: Record<string, any>;
  /**
   * Immediate surroundings - the space this container is INSIDE OF
   * Used for vehicles inside buildings - shows interior through windows, not world exterior
   * Example: Car inside museum → immediateSurroundings = museum DNA/description
   */
  immediateSurroundings?: {
    name: string;
    description: string;
    dna: Record<string, any>;
    spaceType: 'interior' | 'exterior';
  };
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
  let elevationContext = '';
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

    // Add elevation context based on LLM-determined elevation field
    if (s.elevation === 'rooftop' || s.elevation === 'elevated') {
      const architecturalStyle = parentDNA?.architectural_tone || dna?.architectural_tone || 'monolithic';
      const surfaceType = parentDNA?.materials_base || 'surface';
      const elevationType = s.elevation === 'rooftop' ? 'rooftop of' : 'elevated position in';
      
      elevationContext = `
[CRITICAL: ${s.elevation.toUpperCase()} POSITION]
This space is located at an ${elevationType} a tall ${architecturalStyle} building or structure.
- The building rises significantly from the ${surfaceType} below
- The viewpoint is from an ELEVATED POSITION, looking DOWN at the surroundings
- The structure's base and foundation are FAR BELOW, NOT visible from this elevated perspective
- DO NOT show ground-level elements like "at the base of the structure"
- This is a view FROM ABOVE, not a ground-level view
- The surrounding environment should be visible BELOW the elevation level
`;
    } else if (s.elevation === 'underground') {
      elevationContext = `
[CRITICAL: UNDERGROUND POSITION]
This space is located BELOW ground level.
- No natural sky or horizon visible (unless there are specific openings to surface)
- Surrounded by earth, rock, or structural foundation
- Lighting comes from artificial sources or bioluminescence
- May show ceiling/walls of excavated or constructed underground space
`;
    } else if (s.elevation === 'floating' || s.elevation === 'suspended') {
      elevationContext = `
[CRITICAL: ${s.elevation.toUpperCase()} POSITION]
This space is ${s.elevation === 'floating' ? 'floating' : 'suspended'} in the air.
- The structure has NO ground-level foundation visible
- Far below, the surface/ground is visible at a great distance
- The space is suspended or floating freely
- Emphasize the aerial, disconnected nature of the positioning
`;
    }
    
    // Build enhanced dominant elements context with visual emphasis
    const dominantElementsContext = s.dominantElements && s.dominantElements.length > 0 
      ? buildDominantElementsContext(s.dominantElements)
      : '';
    
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
Elevation: ${s.elevation || 'ground-level'}
Spatial Layout: ${s.spatialLayout || 'not specified'}
${enclosedInteriorConstraint}
${elevationContext}
${s.requiredElements && s.requiredElements.length > 0 ? `MUST INCLUDE (User-specified): ${s.requiredElements.join(', ')}` : ''}
${s.suggestedFixtures && s.suggestedFixtures.length > 0 ? `Suggested Fixtures: ${s.suggestedFixtures.join(', ')}` : ''}
${s.navigableElements && s.navigableElements.length > 0 ? `Navigable Elements: ${s.navigableElements.map(n => `${n.type} at ${n.position}: ${n.description}`).join('; ')}` : ''}
${dominantElementsContext}
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

  // Build surroundings context for window views (uses ancestry DNA, skipping pass-through nodes)
  // This ensures windows show the correct exterior even when parent is a pass-through location
  const surroundings = input.surroundingsDNA || parentDNA;
  let surroundingsContext = '';
  if (surroundings && input.perspective === 'interior') {
    surroundingsContext = `
=== SURROUNDINGS (visible through windows/openings) ===
Any windows, openings, or views to the outside should reflect:
- Exterior Style: ${surroundings.architectural_tone || 'consistent with interior'}
- Outside Palette: ${surroundings.palette_bias || 'matching world'}
- Cultural Context Outside: ${surroundings.cultural_tone || 'same as interior'}
- Exterior Mood: ${surroundings.mood || surroundings.mood_baseline || 'consistent'}
- Outside Materials Visible: ${surroundings.materials || surroundings.materials_base || 'world-appropriate'}

CRITICAL: If this interior has windows with "views of surrounding", the view should show:
- The world's aesthetic (${surroundings.genre || 'as defined'})
- NOT generic pastoral/nature views unless the world is pastoral
- The outside should match the world DNA, not the interior concept
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

  // Build immediate surroundings context for any container inside an interior space
  // This applies to: vehicles in museums, houses in basements, spaceships in caves, etc.
  let immediateSurroundingsContext = '';
  
  if (input.immediateSurroundings && input.immediateSurroundings.spaceType === 'interior') {
    const imm = input.immediateSurroundings;
    immediateSurroundingsContext = `
=== CRITICAL: NESTED INTERIOR LOCATION ===
This space is INSIDE "${imm.name}" (an interior space).
It is NOT exposed to the outside world.

What should be visible through any windows/openings:
- Location: ${imm.name} (${imm.spaceType})
- Description: ${imm.description}
${imm.dna?.looks ? `- Visual Details: ${imm.dna.looks}` : ''}
${imm.dna?.materials ? `- Visible Materials: ${imm.dna.materials}` : ''}
${imm.dna?.colorsAndLighting ? `- Lighting: ${imm.dna.colorsAndLighting}` : ''}
${imm.dna?.atmosphere ? `- Atmosphere: ${imm.dna.atmosphere}` : ''}

IMPORTANT: The "background" field (what's visible through windows) must show:
- The INTERIOR of "${imm.name}", NOT the world exterior
- NO outdoor scenes, sky, streets, or nature views
- The surrounding interior space features (walls, ceiling, ambient elements)
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

${surroundingsContext}

${immediateSurroundingsContext}

${furnishingContext}

${fluxInstructionsShort}

YOUR TASK:
Create a structured image prompt for FLUX with SEPARATE sections for each layer.

**OUTPUT FORMAT - STRUCTURED JSON:**
Return a JSON object with these fields:

{
  "background": "Distant elements: sky, horizon, mountains, environmental context at the far back of the scene",
  "midground": "Central focus: main structures, primary subject matter, the main scene elements",
  "foreground": "Closest elements: objects, furniture, details, items near the viewer",
  "lighting": "Light direction, quality, and how it affects each layer",
  "atmosphere": "Mood, tone, atmospheric effects, style qualifiers"
}

**REQUIREMENTS:**
1. Respect the STRUCTURE data (form, scale, orientation, functional type)
2. Use ALL the DNA details (materials, colors, atmosphere, mood)
3. Include ALL required elements and navigable elements
4. Create an ASYMMETRIC, visually interesting composition
5. Match the architectural_tone and cultural_tone

**CRITICAL FOR INTERIORS - MATERIAL PRIORITY:**
For INTERIOR spaces, the scene-specific DNA fields take PRIORITY over inherited/cascading fields:
- USE: "looks", "materials", "primary_surfaces" from this node's DNA (these describe BUILDING materials)
- IGNORE: landscape/environment references in inherited fields (rock formations, sand, terrain, vegetation)
- The parent's "architectural_tone" and "materials_base" may reference the EXTERIOR landscape - do NOT use landscape materials for interior walls
- Interior walls are made of BUILDING materials (composites, metals, polished surfaces), NOT surrounding landscape (rocks, sand)

**LIGHTING DIRECTION:**
Include how light affects each layer (e.g., "warm sunset light catching the foreground details while the background fades into cool shadow").

OUTPUT: Return ONLY the JSON object, no markdown, no explanations, no code blocks.
Each field should be rich, specific, and capture the unique character of this ${nodeType}.
`;
}

/**
 * Parse LLM JSON response into ImagePromptStructure
 * Handles both clean JSON and JSON with surrounding text
 */
function parseStructuredResponse(text: string): Partial<ImagePromptStructure> {
  // Try to extract JSON from the response
  let jsonStr = text.trim();
  
  // Remove markdown code blocks if present
  if (jsonStr.startsWith('```json')) {
    jsonStr = jsonStr.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  } else if (jsonStr.startsWith('```')) {
    jsonStr = jsonStr.replace(/^```\s*/, '').replace(/\s*```$/, '');
  }
  
  // Try to find JSON object in the text
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    jsonStr = jsonMatch[0];
  }
  
  try {
    return JSON.parse(jsonStr);
  } catch {
    // Fallback: treat entire response as a single description
    return {
      background: '',
      midground: text,
      foreground: '',
      lighting: '',
      atmosphere: ''
    };
  }
}

/**
 * Build constraints array based on input analysis
 */
function buildConstraints(input: ImagePromptGenerationInput): string[] {
  const constraints: string[] = [];
  
  const isOpenSky = input.structureAnalysis?.structure?.roofType === 'open-sky';
  
  // Container type constraints from registry (vehicle, boat, tent, etc.)
  const containerType = input.structureAnalysis?.containerType as ContainerType | undefined;
  if (containerType && containerType !== 'building') {
    // Get container-specific constraints from registry
    const perspective = input.perspective as SpacePerspective;
    const containerConstraints = getImageConstraints(containerType, perspective);
    constraints.push(...containerConstraints);
  }
  
  // Open-sky constraint
  if (isOpenSky) {
    constraints.push('[CRITICAL: NO ROOF/CEILING - This is an OPEN-SKY outdoor space. The sky is DIRECTLY VISIBLE above. DO NOT show any cave ceiling, dome, vaulted roof, or covered structure overhead. Show natural sky, clouds, or sunset/sunrise above instead.]');
  }
  
  // Shape constraints for non-rectangular dominant elements
  const dominantElements = input.structureAnalysis?.structure?.dominantElements;
  if (dominantElements && dominantElements.length > 0) {
    const shapeConstraints = buildShapeConstraints(dominantElements);
    if (shapeConstraints) {
      constraints.push(shapeConstraints);
    }
  }
  
  // Exterior view constraint for interior spaces with windows/openings
  const surroundings = input.surroundingsDNA || input.parentDNA;
  const hasOpenings = input.structureAnalysis?.structure?.openings && 
                      input.structureAnalysis.structure.openings !== 'none';
  
  if (input.perspective === 'interior' && hasOpenings) {
    // If immediate surroundings is an interior space, show that interior through windows
    // This applies to: vehicles in museums, houses in basements, spaceships in caves, etc.
    if (input.immediateSurroundings && input.immediateSurroundings.spaceType === 'interior') {
      // Nested interior - show surrounding interior space through windows
      const immediateConstraint = buildImmediateSurroundingsConstraint(
        input.immediateSurroundings.name,
        input.immediateSurroundings.description,
        input.immediateSurroundings.dna
      );
      constraints.push(immediateConstraint);
    } else if (surroundings) {
      // At world boundary - show world exterior through windows
      const genre = surroundings.genre || '';
      const architecturalTone = surroundings.architectural_tone || '';
      const paletteBias = surroundings.palette_bias || '';
      
      if (genre || architecturalTone) {
        const exteriorConstraint = buildExteriorViewConstraint(genre, architecturalTone, paletteBias);
        constraints.push(exteriorConstraint);
      }
    }
  }
  
  return constraints;
}

/**
 * Generate a STRUCTURED image prompt (ImagePromptStructure)
 * 
 * Returns structured format for:
 * - Layer-based scene composition (background → midground → foreground)
 * - Character placement in specific layers
 * - Reusable scene generation
 * 
 * @param apiKey - MZOO API key
 * @param input - Image prompt generation input
 * @returns Structured image prompt with separate layers
 */
export async function generateStructuredImagePrompt(
  apiKey: string,
  input: ImagePromptGenerationInput
): Promise<ImagePromptStructure> {
  // CRITICAL: Override perspective to 'exterior' when roofType is 'open-sky'
  const isOpenSky = input.structureAnalysis?.structure?.roofType === 'open-sky';
  if (isOpenSky && input.perspective === 'interior') {
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

  // Parse the structured JSON response
  const parsed = parseStructuredResponse(result.data.text);
  
  // Build constraints from input analysis
  const constraints = buildConstraints(input);
  
  // Construct full structure
  const structure: ImagePromptStructure = {
    background: parsed.background || '',
    midground: parsed.midground || '',
    foreground: parsed.foreground || '',
    lighting: parsed.lighting || '',
    atmosphere: parsed.atmosphere || '',
    constraints,
    negatives: [], // Will be populated by assembler based on options
    camera: parsed.camera,
    lens: parsed.lens
  };
  
  return structure;
}

/**
 * Generate an LLM-powered image prompt (STRING format for backward compatibility)
 * 
 * This is the UNIFIED function used by both spawn and navigation pipelines.
 * It takes structure analysis + DNA + parent DNA and generates a creative image prompt.
 * 
 * NOTE: Internally uses generateStructuredImagePrompt and assembles the result.
 * For new code, prefer using generateStructuredImagePrompt directly.
 */
export async function generateImagePromptForNode(
  apiKey: string,
  input: ImagePromptGenerationInput
): Promise<string> {
  // Generate structured prompt
  const structure = await generateStructuredImagePrompt(apiKey, input);
  
  // Assemble into string (without Morfeum style - that's added later by applyMorfeumStyle)
  const prompt = assembleImagePrompt(structure, {
    includeNoCreatures: false,  // Added later by imageGeneration.ts
    includeMorfeumStyle: false  // Added later by applyMorfeumStyle
  });
  
  return prompt;
}

// Re-export types and utilities for consumers
export type { ImagePromptStructure } from './imagePromptTypes';
export { assembleImagePrompt } from './imagePromptAssembler';
