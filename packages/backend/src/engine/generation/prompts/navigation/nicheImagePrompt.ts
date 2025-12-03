/**
 * Niche Image Prompt Generation
 * Creates image prompts for stepping inside locations (GO_INSIDE intent)
 */

import type { NavigationContext, IntentResult, NavigationDecision } from '../../../navigation/types';
import { fluxInstructionsShort } from '../shared/constants';
import { getCreativityInstructions } from './creativityInstructions';
import { exteriorInstructionsTemplate } from './exteriorInstructions';
import { interiorInstructionsTemplate } from './interiorInstructions';
import { mergeDNA } from '../../../hierarchyAnalysis/dnaMerge';

/**
 * Generate prompt for LLM to create FLUX image description
 * for stepping inside a location
 * @param creativityLevel 0.0 (conservative) to 1.0 (bold) - controls how much the niche diverges from parent
 */
export function nicheImagePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  creativityLevel: number = 0.5
): string {
  // Build dynamic instructions based on creativity level
  const dynamicCreativityInstructions = getCreativityInstructions(creativityLevel);
  
  // Replace placeholder in templates with dynamic creativity instructions
  const exteriorInstructions = exteriorInstructionsTemplate.replace(
    '{{CREATIVITY_INSTRUCTIONS}}',
    dynamicCreativityInstructions
  );
  
  const interiorInstructions = interiorInstructionsTemplate.replace(
    '{{CREATIVITY_INSTRUCTIONS}}',
    dynamicCreativityInstructions
  );
  
  // Merge parent DNA with current node DNA to get complete cascaded values
  // This ensures null values inherit from parent (e.g., cultural_tone from host)
  const mergedDNA = (context.parentNode?.dna && context.currentNode.dna)
    ? mergeDNA(context.parentNode.dna as any, context.currentNode.dna as any)
    : (context.currentNode.dna || {}) as any;
  
  const prompt = `
You are an expert at creating image prompts for FLUX image generation.
PARENT STRUCTURE ANALYSIS (CRITICAL):
You entered through: "${decision.reasoning}"

${context.currentNode.data.looks ? `Parent structure appearance: "${context.currentNode.data.looks}"` : ''}
${intent.spaceType === 'interior' ? interiorInstructions : exteriorInstructions}
You should create a ${intent.spaceType} niche ${intent.spaceType === 'exterior' ? 'within' : 'inside'} ${context.currentNode.name} that has the following features:

${context.currentNode.data?.description ? `Description: ${context.currentNode.data.description}` : ''}
${context.currentNode.data?.dominantElements?.length ? `Dominant elements: ${context.currentNode.data.dominantElements.join(', ')}` : ''}
${context.currentNode.data?.uniqueIdentifiers?.length ? `Unique Identifiers: ${context.currentNode.data.uniqueIdentifiers.join(', ')}` : ''}

=== SCENE-SPECIFIC DETAILS (from merged DNA) ===
${mergedDNA.looks ? `Looks: ${mergedDNA.looks}` : ''}
${mergedDNA.spatialLayout ? `Spatial Layout: ${mergedDNA.spatialLayout}` : ''}
${mergedDNA.atmosphere ? `Atmosphere: ${mergedDNA.atmosphere}` : ''}
${mergedDNA.colorsAndLighting ? `Colors & Lighting: ${mergedDNA.colorsAndLighting}` : ''}
${mergedDNA.materials ? `Materials: ${mergedDNA.materials}` : ''}
${mergedDNA.mood ? `Mood: ${mergedDNA.mood}` : ''}
${mergedDNA.sounds ? `Sounds: ${mergedDNA.sounds}` : ''}

Material Surface Breakdown:
${mergedDNA.primary_surfaces ? `Primary Surfaces: ${mergedDNA.primary_surfaces}` : ''}
${mergedDNA.secondary_surfaces ? `Secondary Surfaces: ${mergedDNA.secondary_surfaces}` : ''}
${mergedDNA.accent_features ? `Accent Features: ${mergedDNA.accent_features}` : ''}

Color Palette Breakdown:
${mergedDNA.dominant ? `Dominant Colors: ${mergedDNA.dominant}` : ''}
${mergedDNA.secondary ? `Secondary Colors: ${mergedDNA.secondary}` : ''}
${mergedDNA.accent ? `Accent Colors: ${mergedDNA.accent}` : ''}
${mergedDNA.ambient ? `Ambient Light: ${mergedDNA.ambient}` : ''}

${mergedDNA.genre ? `Genre: ${mergedDNA.genre}` : ''}

${mergedDNA.architectural_tone ? `
ARCHITECTURAL TONE (CRITICAL - MUST MATCH EXACTLY): ${mergedDNA.architectural_tone}
${intent.spaceType === 'interior' ? 'The interior MUST reflect this architectural complexity level in ALL details (windows, doors, arches, pillars, trim, finishes).' : 'The exterior niche MUST reflect this architectural style consistently.'}` : ''}

${mergedDNA.cultural_tone ? `Cultural Tone: ${mergedDNA.cultural_tone}` : ''}
${mergedDNA.mood_baseline ? `Mood Baseline: ${mergedDNA.mood_baseline}` : ''}
${mergedDNA.materials_base ? `Materials Base Style: ${mergedDNA.materials_base}` : ''}
${mergedDNA.palette_bias ? `Palette Bias Style: ${mergedDNA.palette_bias}` : ''}
${mergedDNA.soundscape_base ? `Soundscape Base: ${mergedDNA.soundscape_base}` : ''}
${mergedDNA.flora_base ? `Flora Base: ${mergedDNA.flora_base}` : ''}
${mergedDNA.fauna_base ? `Fauna Base: ${mergedDNA.fauna_base}` : ''}

${mergedDNA.structure ? `
=== ARCHITECTURAL STRUCTURE (from parent location) ===
Form: ${mergedDNA.structure.form || 'not specified'}
Roof/Ceiling Type: ${mergedDNA.structure.roofType || 'not specified'}
Scale: ${mergedDNA.structure.scale || 'not specified'}
Orientation: ${mergedDNA.structure.orientation || 'not specified'}
Openings: ${mergedDNA.structure.openings || 'not specified'}

FUNCTIONAL TYPE (CRITICAL - DETERMINES INTERIOR FIXTURES):
This is a ${mergedDNA.structure.functionalType || 'general'} space.
${mergedDNA.structure.functionalType === 'commercial' || mergedDNA.structure.functionalType === 'retail' ? 
`MANDATORY FIXTURES FOR COMMERCIAL/RETAIL:
- Display shelves and racks (multiple, positioned throughout)
- Sales counter or checkout area
- Merchandise on display (clothing on racks, items on shelves)
- Mannequins or product displays (2-4 minimum)
- Price tags, signage, branded elements
- Fitting room entrances if clothing store` : ''}
${mergedDNA.structure.functionalType === 'residential' ? 
`MANDATORY FIXTURES FOR RESIDENTIAL:
- Furniture (sofas, chairs, tables)
- Storage (cabinets, shelves, wardrobes)
- Decorative elements (rugs, curtains, art)
- Lighting fixtures (lamps, chandeliers)` : ''}
${mergedDNA.structure.functionalType === 'religious' ? 
`MANDATORY FIXTURES FOR RELIGIOUS:
- Altar or focal religious element
- Pews, benches, or prayer areas
- Religious iconography, statues, symbols
- Candles, incense holders, ceremonial objects` : ''}
${mergedDNA.structure.functionalType === 'entertainment' ? 
`MANDATORY FIXTURES FOR ENTERTAINMENT:
- Seating areas (booths, chairs, sofas)
- Bar counter or service area
- Stage, dance floor, or performance area
- Lighting rigs, speakers, decorative lighting
- Tables for drinks/food` : ''}
${mergedDNA.structure.functionalType === 'industrial' ? 
`MANDATORY FIXTURES FOR INDUSTRIAL:
- Machinery, equipment, or workstations
- Storage racks, pallets, containers
- Control panels, gauges, monitors
- Safety equipment, signage` : ''}
` : ''}

${fluxInstructionsShort}

${intent.spaceType === 'exterior' ? `
REQUIREMENTS (EXTERIOR NICHE - CRITICAL):
1. You have STEPPED THROUGH/WITHIN the outdoor installation. You are OUTSIDE in the open air.
2. SKY MUST BE VISIBLE - this is an EXTERIOR space with open sky above, not an enclosed interior.
3. Maintain OUTDOOR ATMOSPHERE - horizon line visible, natural outdoor lighting (sun/moon/stars), open air.
4. The installation/structure exists around you but does NOT enclose you with walls and ceiling - you can see through/past it to the surrounding outdoor environment.
5. Think: You walked through an outdoor archway/sculpture in a desert/park/plaza - you're still outside, not in a building.
6. Include interesting outdoor navigation details (paths, platforms, other installations) based on the data.
7. The image should be interesting and visually rich, make it unsymmetrical and dynamic.

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe the outdoor area you now stand within.

` : 
`
REQUIREMENTS (INTERIOR NICHE):
1. Imagine what it looks like when we JUST STEPPED INSIDE through the entrance, don't show what you stepped in from like the door, gate etc. That's supposed to be behind the viewer. Show the immediate enclosed space.
2. This is an INTERIOR space - enclosed with ceiling/roof overhead, walls surrounding.
3. Include interesting navigation details (doors, stairs, passages, rooms, paintings etc) if suitable based on the data, be creative.
4. The image should be interesting and visually rich, make it unsymmetrical and dynamic.

OUTPUT: Return ONLY a detailed image prompt for FLUX, no JSON, no explanations.
The prompt should describe what we see immediately after stepping inside.`}`;

  // console.log('\n\n##################### NICHE IMAGE PROMPT MAKER  #####################');
  // console.log(prompt);
  // console.log('##################### NICHE IMAGE PROMPT MAKER END  #####################\n\n');

  return prompt;
}
