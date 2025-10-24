/**
 * Node DNA Generator
 * 
 * Generates simplified, flat DNA structure for each node in the hierarchy
 * Uses LLM to create visual and atmospheric profiles
 * 
 * Supports batched generation:
 * - Host + All Regions (1 call)
 * - Locations + Niches per region (1 call per region)
 */

import { generateText } from '../../services/mzoo';
import { AI_MODELS } from '../../config/constants';
import { parseJSON } from '../utils/parseJSON';
import { formatDNAForContext } from './dnaMerge';
import type { NodeDNA, LayerType, ParentContext, RegionNode, LocationNode, NicheNode } from './types';

/**
 * Build DNA generation prompt for a node
 */
export function buildNodeDNAPrompt(
  originalPrompt: string,
  nodeName: string,
  nodeType: LayerType,
  nodeDescription: string,
  parentContext?: ParentContext
): string {
  const contextSection = parentContext 
    ? `
PARENT CONTEXT (inherit and respect these attributes):
- Architectural Tone: ${parentContext.architectural_tone || 'Not specified'}
- Cultural Tone: ${parentContext.cultural_tone || 'Not specified'}
- Dominant Color: ${parentContext.dominant || 'Not specified'}
- Mood: ${parentContext.mood || 'Not specified'}
`
    : '';

  return `Interpret the user's description into a simplified, flat DNA structure.

OBJECTIVE: Create a single unified node profile that captures the essential visual and atmospheric qualities without hierarchical complexity.

NODE INFORMATION:
Name: ${nodeName}
Type: ${nodeType}
Description: ${nodeDescription}
${contextSection}
ORIGINAL USER INPUT:
${originalPrompt}

OUTPUT JSON STRUCTURE:

{
  "looks": "2-4 sentences describing what is seen — key forms, layout, and notable features.",
  "colorsAndLighting": "1-3 sentences on dominant colors and light behavior.",
  "atmosphere": "2-4 sentences on air, temperature, motion, weather, and sensory feel.",
  "architectural_tone": "Short phrase (10-20 characters) naming architectural style or era (e.g. 'futuristic metal', 'ancient stone').",
  "cultural_tone": "1 sentence on the social or functional identity (e.g. 'financial district', 'artisan quarter', 'market zone').",
  "materials": "1-3 sentences naming main materials and textures, their condition and finish.",
  "mood": "1-2 sentences on the emotional tone this place evokes.",
  "sounds": "5-7 words listing ambient sounds.",
  "dominantElementsDescriptors": "3-5 defining objects or structures.",
  "spatialLayout": "1-3 sentences on space shape, dimensions, entry points, and focal centers.",
  "primary_surfaces": "Main materials on walls, floor, ceiling.",
  "secondary_surfaces": "Supporting materials on furniture or structure.",
  "accent_features": "Decorative or striking details.",
  "dominant": "Primary color family with coverage area.",
  "secondary": "Secondary color and where it appears.",
  "accent": "Accent colors and placement.",
  "ambient": "Overall light tone (warm / cool / neutral).",
  "uniqueIdentifiers": "2-4 distinctive visual features that make this place recognizable.",
  "searchDesc": "1 concise line (≈75-100 characters) for semantic search: type, function, and key visuals."
}

CRITICAL GUIDELINES

1. **Visual Anchors**
   - Extract anchors directly from the description and user input.
   - Note relative size, position, and proportion of key forms.
   - These anchors guarantee scene continuity and must never be skipped.

2. **Clarity Over Volume**
   - Describe only what can be seen or sensed.
   - One field = one purpose.
   - Avoid repetition or nested metadata.

3. **Intent Fidelity**
   - Keep all user-given names, scales, and moods intact.
   - Honor the originating description's genre and tone when expanding DNA.
${parentContext ? '   - INHERIT parent context attributes (architectural_tone, cultural_tone, colors, mood).\n   - Maintain visual consistency with parent node.' : ''}

4. **Search Description**
   - 75–100 characters max.
   - Start with type or function.
   - End with 1–2 defining visual traits.  
     *Example:* "Weathered stone lighthouse on cliff with spiral interior stairs."

5. **Output Rules**
   - Flat JSON only.
   - No markdown, code fences, or comments.
   - All schema fields required unless explicitly null.

RATIONALE
- Keeps nodes lightweight and fast to merge.
- Maintains visual consistency across regenerations.
- Ensures user intent and naming survive each cascade.`;
}

/**
 * Generate DNA for a single node
 */
export async function generateNodeDNA(
  apiKey: string,
  originalPrompt: string,
  nodeName: string,
  nodeType: LayerType,
  nodeDescription: string,
  parentContext?: ParentContext
): Promise<NodeDNA> {
  // Build prompt
  const prompt = buildNodeDNAPrompt(
    originalPrompt,
    nodeName,
    nodeType,
    nodeDescription,
    parentContext
  );

  // Call LLM (using fast model for text generation)
  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate DNA for: ${nodeName}` }
  ];

  const result = await generateText(
    apiKey,
    messages,
    AI_MODELS.SEED_GENERATION // Fast model for text-only generation
  );

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA data returned from LLM');
  }

  // Parse JSON response
  const parsedDNA = parseJSON<NodeDNA>(result.data.text);

  if (!parsedDNA) {
    throw new Error('Failed to parse DNA from LLM response');
  }

  return parsedDNA;
}

/**
 * Extract parent context from parent node DNA
 */
export function extractParentContext(parentDNA?: NodeDNA): ParentContext {
  if (!parentDNA) {
    return {};
  }

  return {
    architectural_tone: parentDNA.architectural_tone,
    cultural_tone: parentDNA.cultural_tone,
    dominant: parentDNA.dominant,
    mood: parentDNA.mood
  };
}

/**
 * Generate Host + All Regions in a single LLM call
 * Returns full DNA for Host and sparse DNA for Regions
 */
export async function generateHostAndRegions(
  apiKey: string,
  originalPrompt: string,
  hostName: string,
  hostDescription: string,
  regions: Array<{ name: string; description: string }>
): Promise<{ hostDNA: NodeDNA; regionDNAs: Array<{ name: string; dna: Partial<NodeDNA> }> }> {
  const prompt = `Generate DNA for a Host world and all its Regions in one batch.

OBJECTIVE: Create complete DNA for the Host, and sparse override DNA for each Region.

USER INPUT:
${originalPrompt}

HOST:
Name: ${hostName}
Description: ${hostDescription}

REGIONS:
${regions.map(r => `- ${r.name}: ${r.description}`).join('\n')}

OUTPUT STRUCTURE:

{
  "host": {
    // FULL DNA - all 22 fields populated
    "looks": "...",
    "colorsAndLighting": "...",
    "atmosphere": "...",
    "architectural_tone": "...",
    "cultural_tone": "...",
    "materials": "...",
    "mood": "...",
    "sounds": "...",
    "dominantElementsDescriptors": "...",
    "spatialLayout": "...",
    "primary_surfaces": "...",
    "secondary_surfaces": "...",
    "accent_features": "...",
    "dominant": "...",
    "secondary": "...",
    "accent": "...",
    "ambient": "...",
    "uniqueIdentifiers": [...],
    "searchDesc": "..."
  },
  "regions": [
    {
      "name": "Region Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from Host
        // Set to null for fields that should inherit from Host
        "architectural_tone": "different style" or null,
        "cultural_tone": "different culture" or null,
        "looks": null,  // inherits from host
        "atmosphere": null,  // inherits from host
        // ... other fields null if inheriting
      }
    }
  ]
}

CRITICAL GUIDELINES:

1. **Host DNA**: Generate ALL 22 fields with complete descriptions
2. **Region DNA**: ONLY populate fields that are DIFFERENT from Host
   - If a region has same atmosphere as host → null
   - If a region has different architectural style → populate
   - If a region has unique cultural vibe → populate
3. **Inheritance**: Null values mean "inherit from parent"
4. **Clarity**: Make it obvious what makes each region unique
5. **Output**: Flat JSON only, no markdown or comments

Generate now:`;

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate Host DNA for "${hostName}" and Region DNAs for: ${regions.map(r => r.name).join(', ')}` }
  ];

  const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA data returned from LLM');
  }

  const parsed = parseJSON<{ host: NodeDNA; regions: Array<{ name: string; dna: Partial<NodeDNA> }> }>(result.data.text);

  if (!parsed || !parsed.host) {
    throw new Error('Failed to parse batched DNA from LLM response');
  }

  return {
    hostDNA: parsed.host,
    regionDNAs: parsed.regions || []
  };
}

/**
 * Generate Locations + Niches for a region in a single LLM call
 * Takes merged parent DNA (Host + Region) as context
 * Returns sparse DNA for Locations and Niches
 */
export async function generateLocationsAndNiches(
  apiKey: string,
  originalPrompt: string,
  regionName: string,
  mergedParentDNA: NodeDNA,
  locations: Array<{ 
    name: string; 
    description: string; 
    niches?: Array<{ name: string; description: string }> 
  }>
): Promise<Array<{ 
  name: string; 
  dna: Partial<NodeDNA>; 
  niches: Array<{ name: string; dna: Partial<NodeDNA> }> 
}>> {
  const prompt = `Generate DNA for all Locations and Niches in "${regionName}" region.

OBJECTIVE: Create sparse override DNA for each Location and Niche, given the merged parent DNA.

USER INPUT:
${originalPrompt}

PARENT DNA (MERGED HOST + REGION):
${formatDNAForContext(mergedParentDNA)}

LOCATIONS:
${locations.map(loc => `
- ${loc.name}: ${loc.description}
  ${loc.niches ? 'Niches:\n' + loc.niches.map(n => `  - ${n.name}: ${n.description}`).join('\n') : ''}
`).join('\n')}

OUTPUT STRUCTURE:

{
  "locations": [
    {
      "name": "Location Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from parent
        "mood": "different mood" or null,
        "sounds": "different sounds" or null,
        "looks": null,  // inherits from parent
        // ... other fields null if inheriting
      },
      "niches": [
        {
          "name": "Niche Name",
          "dna": {
            // SPARSE DNA - only fields that DIFFER from location+parent
            "atmosphere": "intimate" or null,
            "materials": "plush velvet" or null,
            // ... other fields null if inheriting
          }
        }
      ]
    }
  ]
}

CRITICAL GUIDELINES:

1. **Sparse DNA Only**: ONLY populate fields that DIFFER from parent DNA
2. **Parent Inheritance**: The parent DNA above is already merged (Host + Region)
3. **Null = Inherit**: Set fields to null if they should inherit from parent
4. **Differentiation**: Focus on what makes each location/niche unique
5. **Consistency**: Respect parent's architectural_tone, cultural_tone, colors, mood
6. **Output**: Flat JSON only, no markdown or comments

Generate now:`;

  const messages = [
    { role: 'system', content: prompt },
    { role: 'user', content: `Generate Location DNAs for: ${locations.map(l => l.name).join(', ')}` }
  ];

  const result = await generateText(apiKey, messages, AI_MODELS.SEED_GENERATION);

  if (result.error || !result.data) {
    throw new Error(result.error || 'No DNA data returned from LLM');
  }

  const parsed = parseJSON<{ locations: Array<{ name: string; dna: Partial<NodeDNA>; niches: Array<{ name: string; dna: Partial<NodeDNA> }> }> }>(result.data.text);

  if (!parsed || !parsed.locations) {
    throw new Error('Failed to parse batched location DNA from LLM response');
  }

  return parsed.locations;
}
