/**
 * Structure Analysis Prompt
 * LLM prompt for analyzing physical/spatial properties of a new space
 * Runs in parallel with DNA analysis for both GO_INSIDE and GOTO commands
 */

import type { NavigationContext } from '../../../navigation/types';

export interface StructureAnalysisInput {
  /** User's description of the space (e.g., "Parisian Café, cozy and charming...") */
  userPrompt: string;
  /** Context including current node and parent location */
  context: NavigationContext;
  /** Whether this is an interior or exterior space */
  perspective: 'interior' | 'exterior';
  /** Whether to include furnishing instructions */
  includeFurnishing?: boolean;
}

/**
 * Generate prompt for LLM to analyze physical structure of a space
 */
import { furnishingInstructions } from './furnishingInstructions';

/* (already exported above, remove duplicate) */

/**
 * Extract window/opening shapes from parent's dominant elements or description
 * Returns array of detected shapes (e.g., ['rectangular', 'circular'])
 */
function extractOpeningShapesFromParent(parentStructure: any, parentDna: any): string[] {
  const shapes: string[] = [];
  
  // Check dominantElements and uniqueIdentifiers
  const elements = [
    ...(parentStructure?.dominantElements || []),
    ...(parentStructure?.uniqueIdentifiers || []),
    parentDna?.looks || '',
    parentDna?.accent_features || ''
  ].join(' ').toLowerCase();
  
  // Detect rectangular/square windows
  if (/rectangular window|square window|rectangle window/.test(elements)) {
    shapes.push('rectangular');
  }
  
  // Detect circular/round windows
  if (/circular|porthole|round window|round opening/.test(elements)) {
    shapes.push('circular');
  }
  
  // Detect arched windows
  if (/arched window|arch window|pointed arch/.test(elements)) {
    shapes.push('arched');
  }
  
  return [...new Set(shapes)]; // Remove duplicates
}

/**
 * Infer scale from description text when no explicit scale is set
 * Looks for keywords indicating size
 */
function inferScaleFromDescription(dna: any, description?: string): 'small' | 'medium' | 'large' | null {
  const text = [
    dna?.looks || '',
    dna?.description || '',
    description || ''
  ].join(' ').toLowerCase();

  // Small indicators
  if (/\b(modest|small|compact|intimate|cozy|tiny|cramped|narrow|pod|booth|closet|cubicle|cabin)\b/.test(text)) {
    return 'small';
  }
  
  // Large indicators
  if (/\b(vast|immense|enormous|massive|grand|huge|cathedral|warehouse|hall|arena|stadium|expansive|towering)\b/.test(text)) {
    return 'large';
  }
  
  // Medium indicators (or default if no strong signal)
  if (/\b(standard|regular|moderate|typical|average|room|shop|café|cafe|store)\b/.test(text)) {
    return 'medium';
  }
  
  return null; // No clear signal
}

export function structureAnalysisPrompt(input: StructureAnalysisInput): string {
  const { userPrompt, context, perspective, includeFurnishing } = input;

  const parentDna = context.parentNode?.dna as any;
  const currentDna = context.currentNode.dna as any;
  // Structure is stored at node level (not inside DNA) - check node data first
  const currentNodeData = context.currentNode.data as any;
  const parentStructure = currentNodeData?.structure || parentDna?.structure || currentDna?.structure;
  
  // Infer scale from parent if not explicitly set
  const inferredParentScale = parentStructure?.scale || inferScaleFromDescription(currentDna, context.currentNode.data?.description as string);

  let prompt = `You are an expert at spatial and architectural analysis.

TASK: Analyze a space description and determine its physical/structural properties.

=== CONTEXT ===
Creating a new ${perspective} space.
${context.currentNode.type === 'location' ? `Parent location: "${context.currentNode.name}"` : `Current niche: "${context.currentNode.name}"`}
${context.parentNode ? `Parent: "${context.parentNode.name}" (${context.parentNode.type})` : ''}

${parentStructure || inferredParentScale ? (() => {
  const parentWindowShapes = extractOpeningShapesFromParent(parentStructure, currentDna);
  return `=== PARENT STRUCTURE (inherit where appropriate) ===
Form: ${parentStructure?.form || 'not specified'}
Scale: ${parentStructure?.scale || inferredParentScale || 'not specified'}${inferredParentScale && !parentStructure?.scale ? ' (inferred from description)' : ''}
Orientation: ${parentStructure?.orientation || 'not specified'}
Functional Type: ${parentStructure?.functionalType || 'not specified'}
${parentWindowShapes.length > 0 ? `Window/Opening Shapes: ${parentWindowShapes.join(', ')} (MUST match these in interior)` : ''}
`;
})() : ''}

=== USER'S SPACE DESCRIPTION ===
"${userPrompt}"

=== YOUR TASK ===
Analyze the description and determine:

1. **Name**: Extract or create a concise name for this space (e.g., "The Kitchen", "Parisian Café", "Wine Cellar")

2. **Form**: What is the architectural form?
   - rectangular, round, cylindrical, spherical, faceted, organic, arched, gothic, irregular
   - For interiors: Match parent's form unless space requires different (e.g., round tower = round interior)

3. **Roof/Ceiling Type**: What covers this space?
   - domed, flat, vaulted, pitched, geodesic, arched, open-sky, null
   - Interior ceilings should match exterior roof type logically

4. **Scale**: How large is this space?
   - small (cozy room, closet, booth)
   - medium (standard room, shop, café)
   - large (hall, warehouse, cathedral)

5. **Orientation**: Primary spatial emphasis?
   - vertical (tall, tower-like)
   - horizontal (long, corridor-like)
   - wide (expansive, arena-like)
   - cubic (balanced proportions)

6. **Openings**: What kind of windows/openings?
   - large-glass, arched-windows, narrow-slits, open-passages, minimal, none

6b. **Opening Shape**: What SHAPE are the windows/openings? (MUST match parent exterior if available)
   - rectangular (square/rectangular windows)
   - circular (round portholes, circular windows)
   - arched (arched or pointed arch windows)
   - mixed (combination of shapes)
   - irregular (organic, non-standard shapes)

7. **Functional Type**: What is this space used for?
   - residential, commercial, religious, industrial, civic, entertainment

8. **Spatial Layout**: Describe the physical arrangement in 1-2 sentences.

9. **Required Elements**: Extract any SPECIFIC elements the user mentioned that MUST appear.
   Look for phrases like "Include:", "with a", "featuring", specific furniture, fixtures, or features.
   
10. **Suggested Fixtures**: Based on functional type, suggest 4-6 appropriate fixtures/furniture.

11. **Navigable Elements**: Suggest 2-3 navigation points (doors, passages, stairs) with positions.

12. **Dominant Elements**: List 3-5 main physical features that define the space.

13. **Unique Identifiers**: List 2-4 distinctive features that make this space memorable.

IMPORTANT RULES:
- Extract ALL user-specified elements as requiredElements - these MUST appear in the final image
- Inherit form/scale from parent when it makes architectural sense
- Interior spaces should logically fit within their parent structure
- Be specific with positions (left, right, center, back, corner, etc.)

=== CRITICAL: FORM AND ORIENTATION INHERITANCE ===

**Orientation MUST be compatible with parent:**
- Parent HORIZONTAL → Interior MUST be horizontal or wide (NEVER vertical)
- Parent VERTICAL → Interior can be vertical, cubic, or wide
- Parent WIDE → Interior can be wide, horizontal, or cubic
- Parent CUBIC → Interior can be any orientation that fits

**For CYLINDRICAL forms (VERY IMPORTANT):**
- Horizontal cylinder (lying down): Interior has CURVED ceiling following the arc, floor is flat or curved
  → Orientation MUST be "horizontal" (long corridor-like) or "wide" (tunnel-like)
  → NEVER "vertical" - you cannot stand up tall inside a lying cylinder!
- Vertical cylinder (standing up): Interior has flat or domed ceiling, curved walls
  → Orientation should be "cubic" or "vertical"

**For SPHERICAL forms:**
- Interior follows the sphere curve in all directions
- Orientation should typically be "cubic" (balanced) or "wide"
- Scale is constrained by sphere diameter

**Scale Constraints (interior vs exterior):**
- Interior scale CANNOT exceed parent exterior scale
- large exterior → interior can be small, medium, or large
- medium exterior → interior can be small or medium (NOT large)
- small exterior → interior MUST be small

**Opening Shape Inheritance (CRITICAL):**
- Interior window/opening SHAPES must match the exterior
- If parent has "rectangular window" → interior must have rectangular windows
- If parent has "circular porthole" → interior must have circular openings
- If parent has "arched windows" → interior must have arched openings
- Look for window shapes in parent's dominantElements, uniqueIdentifiers, or description

**Approximate Dimension Hints for Image Generation:**
- small: ~2-4m in primary dimension (pods, booths, closets, cabins, compact rooms)
- medium: ~4-10m in primary dimension (standard rooms, shops, cafés)
- large: ~10-30m+ in primary dimension (halls, warehouses, cathedrals)

**CRITICAL SCALE RULE FOR INTERIORS:**
When creating an interior inside a parent structure, the interior MUST be SMALLER than the exterior.
If parent scale is "small" (2-4m exterior), the interior dimensions should be ~1.5-3m.
If parent scale is "medium" (4-10m exterior), the interior can be 3-8m.
If parent scale is "large", the interior can be up to the full range.
`;

  if (includeFurnishing) {
    prompt += furnishingInstructions;
  }

  prompt += `
OUTPUT: Return ONLY valid JSON with this exact structure:
{
  "name": "string - concise space name",
  "perspective": "${perspective}",
  "structure": {
    "form": "rectangular | round | cylindrical | spherical | faceted | organic | arched | gothic | irregular",
    "roofType": "domed | flat | vaulted | pitched | geodesic | arched | open-sky | null",
    "scale": "small | medium | large",
    "orientation": "vertical | horizontal | wide | cubic",
    "openings": "large-glass | arched-windows | narrow-slits | open-passages | minimal | none",
    "openingShape": "rectangular | circular | arched | mixed | irregular",
    "functionalType": "residential | commercial | religious | industrial | civic | entertainment",
    "spatialLayout": "string - 1-2 sentence description of physical arrangement",
    "requiredElements": ["array of user-specified elements that MUST appear"],
    "suggestedFixtures": ["array of 4-6 appropriate fixtures"],
    "navigableElements": [
      { "type": "door | passage | stairs | archway | window", "position": "string", "description": "string" }
    ],
    "dominantElements": ["array of 3-5 main physical features"],
    "uniqueIdentifiers": ["array of 2-4 distinctive features"]
  },
  "description": "string - brief description of the space"
  ${includeFurnishing ? `,
  "furnishingDetails": {
    "userSpecified": ["array of user-specified items"],
    "suggested": ["array of suggested furnishings"],
    "placementNotes": ["array of placement or style notes"]
  }` : ''}
}`;
  return prompt;
}

/**
 * Parse user input to extract required elements
 * Used as fallback if LLM misses them
 */
export function extractRequiredElements(userPrompt: string): string[] {
  const elements: string[] = [];
  
  // Look for "Include:" sections
  const includeMatch = userPrompt.match(/include[:\s]+(.+?)(?:\.|$)/gi);
  if (includeMatch) {
    includeMatch.forEach(match => {
      const content = match.replace(/include[:\s]+/i, '').trim();
      // Split by common delimiters
      const items = content.split(/[,;\n]/).map(s => s.trim()).filter(s => s.length > 0);
      elements.push(...items);
    });
  }
  
  // Look for bullet points or numbered lists
  const listMatches = userPrompt.match(/^[-•*]\s+(.+?)$/gm);
  if (listMatches) {
    listMatches.forEach(match => {
      elements.push(match.replace(/^[-•*]\s+/, '').trim());
    });
  }
  
  // Look for "with a/an" phrases
  const withMatches = userPrompt.match(/with (?:a |an |the )?([^,.]+)/gi);
  if (withMatches) {
    withMatches.forEach(match => {
      const item = match.replace(/^with (?:a |an |the )?/i, '').trim();
      if (item.length > 3 && item.length < 100) {
        elements.push(item);
      }
    });
  }
  
  return [...new Set(elements)]; // Remove duplicates
}
