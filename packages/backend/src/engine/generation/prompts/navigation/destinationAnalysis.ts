/**
 * Destination Analysis Prompt
 * LLM prompt for analyzing GOTO command destinations
 * Synthesizes user's destination prompt with parent location context
 */

import type { NavigationContext, ScenePerspective } from '../../../navigation/types';
import { mergeDNA } from '../../../hierarchyAnalysis/dnaMerge';

interface DestinationAnalysisInput {
  /** User's destination prompt (e.g., "the kitchen with a large window") */
  userPrompt: string;
  /** Context including current niche and parent location */
  context: NavigationContext;
}

/**
 * Generate prompt for LLM to analyze destination and synthesize with context
 */
export function destinationAnalysisPrompt(input: DestinationAnalysisInput): string {
  const { userPrompt, context } = input;
  
  // Merge parent DNA with current node DNA for complete cascaded values
  const mergedDNA = (context.parentNode?.dna && context.currentNode.dna)
    ? mergeDNA(context.parentNode.dna as any, context.currentNode.dna as any)
    : (context.currentNode.dna || {}) as any;

  return `You are an expert at spatial navigation and architectural analysis.

TASK: Analyze a destination within a location and determine how to create a cohesive new space.

=== CURRENT CONTEXT ===
You are currently in: "${context.currentNode.name}" (${context.currentNode.type})
${context.currentNode.data?.description ? `Current space description: ${context.currentNode.data.description}` : ''}
${context.currentNode.data?.looks ? `Current space appearance: ${context.currentNode.data.looks}` : ''}

Parent location: "${context.parentNode?.name || 'Unknown'}" (${context.parentNode?.type || 'unknown'})

=== PARENT LOCATION DNA (inherited style) ===
${mergedDNA.genre ? `Genre: ${mergedDNA.genre}` : ''}
${mergedDNA.architectural_tone ? `Architectural Tone: ${mergedDNA.architectural_tone}` : ''}
${mergedDNA.cultural_tone ? `Cultural Tone: ${mergedDNA.cultural_tone}` : ''}
${mergedDNA.mood ? `Mood: ${mergedDNA.mood}` : ''}
${mergedDNA.mood_baseline ? `Mood Baseline: ${mergedDNA.mood_baseline}` : ''}
${mergedDNA.materials_base ? `Materials Base: ${mergedDNA.materials_base}` : ''}
${mergedDNA.materials ? `Materials: ${mergedDNA.materials}` : ''}
${mergedDNA.palette_bias ? `Palette Bias: ${mergedDNA.palette_bias}` : ''}
${mergedDNA.dominant ? `Dominant Colors: ${mergedDNA.dominant}` : ''}
${mergedDNA.atmosphere ? `Atmosphere: ${mergedDNA.atmosphere}` : ''}
${mergedDNA.structure ? `
Structure:
- Form: ${mergedDNA.structure.form || 'not specified'}
- Scale: ${mergedDNA.structure.scale || 'not specified'}
- Functional Type: ${mergedDNA.structure.functionalType || 'not specified'}` : ''}

=== USER'S DESTINATION ===
"${userPrompt}"

=== YOUR TASK ===
Analyze the user's destination and determine:

1. **Name**: Extract or create a concise name for this space (e.g., "The Kitchen", "Rooftop Terrace", "Wine Cellar")

2. **Perspective**: What type of space is this?
   - INTERIOR: Fully enclosed space with roof/ceiling (room, hall, chamber, cave, vehicle interior)
   - EXTERIOR: Fully open outdoor space (park path, plaza, sculpture garden, forest clearing)
   - OPEN-AIR: Semi-enclosed with open sky (balcony, terrace, rooftop, covered patio, pergola)

3. **Space Type**: What type of space is this? (room, outdoor, hallway, cellar, attic, balcony, garden, courtyard, etc.)

4. **Is Enclosed**: Does this space have walls and ceiling? (true for most interiors, false for most exteriors)

5. **Atmosphere Hint**: A brief description of the atmosphere that blends the user's request with the parent location's style

6. **Synthesized Description**: A rich description that combines:
   - The user's specific requests
   - The parent location's architectural style, materials, and mood
   - Logical spatial connection to the current location

IMPORTANT RULES:
- The new space must feel like it BELONGS to the parent location (same architectural style, era, materials)
- Honor the user's specific requests but blend them with the inherited DNA
- A kitchen in a Victorian mansion should feel Victorian; in a medieval castle, it should feel medieval
- Exterior spaces should still match the building's overall style

OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "name": "string - concise space name",
  "perspective": "interior" | "exterior" | "open-air",
  "spaceType": "string - type of space",
  "isEnclosed": boolean,
  "atmosphereHint": "string - brief atmosphere description",
  "synthesizedDescription": "string - rich description blending user prompt with context"
}`;
}
