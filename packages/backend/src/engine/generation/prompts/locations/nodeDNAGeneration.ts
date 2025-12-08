import { buildStructureSchemaString } from '../shared/dnaSchema';
import type { ParentContext } from '../../../hierarchyAnalysis/types';

/**
 * Node DNA Generation Prompt
 * 
 * Generates simplified, flat DNA structure for a single node
 * Now accepts FULL parent DNA for CSS-like inheritance
 * 
 * @param originalPrompt - Original user input
 * @param nodeName - Name of the node to generate DNA for
 * @param nodeType - Type of node (host, region, location, niche, detail)
 * @param nodeDescription - Description of the node
 * @param parentContext - Full parent DNA to inherit from (CSS-like cascade)
 * @returns Prompt string for LLM
 */
export function nodeDNAGeneration(
  originalPrompt: string,
  nodeName: string,
  nodeType: string,
  nodeDescription: string,
  parentContext?: ParentContext
): string {
  // Build comprehensive parent context section from ALL parent DNA fields
  const contextSection = parentContext 
    ? `
PARENT CONTEXT (CSS-like inheritance - inherit ALL these attributes unless overriding):
=== VISUAL STYLE ===
- Looks: ${parentContext.looks || 'Not specified'}
- Colors & Lighting: ${parentContext.colorsAndLighting || 'Not specified'}
- Atmosphere: ${parentContext.atmosphere || 'Not specified'}
- Materials: ${parentContext.materials || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}

=== SURFACES ===
- Primary Surfaces: ${parentContext.primary_surfaces || 'Not specified'}
- Secondary Surfaces: ${parentContext.secondary_surfaces || 'Not specified'}
- Accent Features: ${parentContext.accent_features || 'Not specified'}

=== COLORS ===
- Dominant: ${parentContext.dominant || 'Not specified'}
- Secondary: ${parentContext.secondary || 'Not specified'}
- Accent: ${parentContext.accent || 'Not specified'}
- Ambient Light: ${parentContext.ambient || 'Not specified'}

=== CASCADING STYLE (MUST inherit unless distinctly different) ===
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Materials Base: ${parentContext.materials_base || 'Not specified'}
- Mood Baseline: ${parentContext.mood_baseline || 'Not specified'}
- Palette Bias: ${parentContext.palette_bias || 'Not specified'}
- Soundscape Base: ${parentContext.soundscape_base || 'Not specified'}
- Flora Base: ${parentContext.flora_base || 'Not specified'}
- Fauna Base: ${parentContext.fauna_base || 'Not specified'}

CRITICAL MATERIAL INHERITANCE RULES:
1. This child space MUST use the SAME MATERIALS as the parent. If parent has "weathered brick walls", child has weathered brick walls - NOT stainless steel.
2. You are ADAPTING the parent's visual style to a new function - NOT replacing it with a generic style.
3. A kitchen in a weathered brick building has WEATHERED BRICK walls, not sterile stainless steel.
4. A bathroom in an industrial space has EXPOSED PIPES and CONCRETE, not white tile.
5. The child's "looks", "materials", and "primary_surfaces" fields MUST incorporate the parent's materials.
6. Only ADD function-specific elements (stoves, sinks) - do NOT REPLACE the parent's aesthetic.

WRONG: Parent has "rough brickwork" → Child kitchen has "gleaming stainless steel walls"
RIGHT: Parent has "rough brickwork" → Child kitchen has "rough brick walls with stainless steel prep counters"
`
    : '';

  const ret = `Interpret the user's description into a DNA structure with cascading style attributes.

OBJECTIVE: Create visual/atmospheric DNA that separates scene-specific details from inheritable style attributes.

NODE INFORMATION:
Name: ${nodeName}
Type: ${nodeType}
Description: ${nodeDescription}
${contextSection}
ORIGINAL USER INPUT:
${originalPrompt}

OUTPUT JSON STRUCTURE:

{
  "name": "${nodeName}",
  "description": "Brief description of this node",
  
  // === STRUCTURAL FIELDS (metadata and navigation) ===
  "navigableElements": [
    {"type": "door|passage|stairs|archway|portal|window", "position": "location in scene", "description": "what it is"}
  ],
  "dominantElements": ["List of major positioned objects/features in scene"],
  "uniqueIdentifiers": ["List of distinctive visual features that make this place recognizable"],
  "searchDesc": "75-100 char search-friendly description",
  "slug": "${nodeName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}",
  
  // === DNA: SCENE-SPECIFIC VISUAL FIELDS (always populated) ===
  "dna": {
    "looks": "2-4 sentences describing what is seen — key forms, layout, and notable features.",
    "colorsAndLighting": "1-3 sentences on dominant colors and light behavior.",
    "atmosphere": "2-4 sentences on air, temperature, motion, weather, and sensory feel.",
    "materials": "1-3 sentences naming main materials and textures, their condition and finish.",
    "mood": "1-2 sentences on the emotional tone this place evokes.",
    "sounds": "5-7 words listing ambient sounds.",
    "spatialLayout": "1-3 sentences on space shape, dimensions, entry points, and focal centers.",
    "primary_surfaces": "Main materials on walls, floor, ceiling.",
    "secondary_surfaces": "Supporting materials on furniture or structure.",
    "accent_features": "Decorative or striking details.",
    "dominant": "Primary color family with coverage area.",
    "secondary": "Secondary color and where it appears.",
    "accent": "Accent colors and placement.",
    "ambient": "Overall light tone (warm / cool / neutral).",
    
    // === ARCHITECTURAL STRUCTURE (conditional - for built spaces only) ===
    ${buildStructureSchemaString()},  // OR null if not a built structure (natural landscapes, outdoor areas)
    
    // === CASCADING STYLE ATTRIBUTES (optional - can be null if inherited from parent) ===
    "genre": null,  // NEVER set genre - only host nodes have this
    "architectural_tone": "Short phrase (e.g., 'industrial metallic', 'organic stone') OR null to inherit",
    "cultural_tone": "1 sentence on social/functional identity OR null to inherit",
    "materials_base": "Material palette/style (NOT specific objects) OR null to inherit",
    "mood_baseline": "Emotional baseline OR null to inherit",
    "palette_bias": "Color style/families (NOT specific scene colors) OR null to inherit",
    "soundscape_base": "Ambient sound style OR null to inherit",
    "flora_base": "Plant life types OR 'None' OR null to inherit",
    "fauna_base": "Animal life types OR 'None' OR null to inherit"
  }
}

CRITICAL GUIDELINES

1. **Scene vs. Cascading Fields**
   - Scene fields: Describe THIS specific location's appearance (looks, colors, materials visible)
   - Cascading fields: General style that could produce similar children (architectural style, color palette bias)
   - Example: Scene "polished chrome walls" → Cascade "industrial metallic aesthetic"

2. **Visual Anchors**
   - Extract anchors directly from the description and user input
   - Note relative size, position, and proportion of key forms
   - These anchors guarantee scene continuity

3. **Cascading Inheritance**
   - NEVER set "genre" field (only host nodes have this)
${parentContext ? '   - Parent provides: architectural_tone, cultural_tone, colors, mood\n   - Only override cascading fields if THIS node is distinctly different\n   - Set to null to inherit parent value\n   - Maintain visual consistency with parent' : '   - Set cascading fields only if this node has distinct style characteristics\n   - Use null to indicate no specific style override'}

4. **Clarity Over Volume**
   - Describe only what can be seen or sensed
   - One field = one purpose
   - Avoid repetition across fields

5. **Structure Field (NODE TYPE SPECIFIC)**
   - **LOCATIONS (type=location)**: MUST populate structure if this is a building, shop, or constructed exterior
   - **NICHES (type=niche)**: Set structure to **null** - DO NOT create a new structure object
     * Niches inherit structure from their PARENT location
     * The interior form MUST match the parent's form (rectangular parent = rectangular interior)
     * DO NOT change the form (e.g., don't make a circular interior for a rectangular building)
   - **REGIONS/HOSTS**: Set to NULL
   - **Natural landscapes**: Set to NULL
   - When populated for locations, ALL sub-fields are required
   - Form values: Match exterior geometry (round tower → round, dome → spherical, box → rectangular)
   - Scale values: small (<15m), medium (15-50m), large (>50m) - estimate from description
   - Orientation: vertical (towers/spires), horizontal (halls/corridors), wide (domes/arenas), cubic (balanced)
   - functionalType: CRITICAL for interiors - determines what fixtures/furniture to include
     * retail/commercial: shops, boutiques, stores → shelves, counters, merchandise displays
     * residential: homes, apartments → furniture, beds, tables
     * religious: temples, churches → altars, pews, candles
     * entertainment: clubs, theaters → seating, stages, bars
     * industrial: factories, warehouses → machinery, storage

6. **Output Rules**
   - Flat JSON only (no markdown, code fences, or comments)
   - All scene fields required
   - Cascading fields can be null for inheritance
   - Structure field null for non-architectural spaces

RATIONALE
- Separates scene details from inheritable style
- Enables efficient DNA cascade through hierarchy
- Maintains visual consistency across regenerations
- Supports sparse child DNA (only override what's different)`;
// console.log('---- Prompt of for nde DNA LLM ');
// console.log(ret);
// console.log('------');

  return ret;
}
