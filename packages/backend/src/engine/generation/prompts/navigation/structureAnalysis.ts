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

// NOTE: All analysis (form, functional type, scale, opening shapes) is now determined by the LLM
// No regex-based inference - we trust the LLM to understand context from the full parent data

export function structureAnalysisPrompt(input: StructureAnalysisInput): string {
  const { userPrompt, context, perspective, includeFurnishing } = input;

  const parentDna = context.parentNode?.dna as any;
  const currentDna = context.currentNode.dna as any;
  // Structure is stored at node level (not inside DNA) - check node data first
  const currentNodeData = context.currentNode.data as any;
  const parentStructure = currentNodeData?.structure || parentDna?.structure || currentDna?.structure;
  
  // Pass full parent context to LLM - no regex inference needed
  // The LLM will understand context from cultural_tone and description

  let prompt = `You are an expert at spatial and architectural analysis.

TASK: Analyze a space description and determine its physical/structural properties.

=== CONTEXT ===
Creating a new ${perspective} space.
${context.currentNode.type === 'location' ? `Parent location: "${context.currentNode.name}"` : `Current niche: "${context.currentNode.name}"`}
${context.parentNode ? `Parent: "${context.parentNode.name}" (${context.parentNode.type})` : ''}

=== PARENT CONTEXT (LLM: USE THIS TO UNDERSTAND THE SPACE) ===

**Parent's Description:** "${context.currentNode.data?.description || 'not specified'}"
**Parent's Cultural Tone:** "${currentDna?.cultural_tone || 'not specified'}"
**Parent's Search Description:** "${context.currentNode.data?.searchDesc || 'not specified'}"
**Parent's Visual Appearance (looks):** "${currentDna?.looks || 'not specified'}"
**Parent's Accent Features:** "${currentDna?.accent_features || 'not specified'}"

**Parent Structure (if available):**
- Form: ${parentStructure?.form || 'not specified - YOU MUST DETERMINE from description'}
- Scale: ${parentStructure?.scale || 'not specified - YOU MUST DETERMINE from description'}
- Orientation: ${parentStructure?.orientation || 'not specified'}
- Functional Type: ${parentStructure?.functionalType || 'not specified - YOU MUST DETERMINE from cultural_tone/description'}
- Opening Shape: ${parentStructure?.openingShape || 'not specified - YOU MUST DETERMINE from looks/accent_features'}
- Dominant Elements: ${parentStructure?.dominantElements?.join(', ') || 'not specified'}
- Unique Identifiers: ${parentStructure?.uniqueIdentifiers?.join(', ') || 'not specified'}

**YOUR TASK: Understand the ACTUAL PURPOSE and FORM from the above context.**

KEY PRINCIPLE: Physical appearance ≠ Functional purpose
- **FORM** = What the building LOOKS like (read the "looks" field for architectural shape)
- **FUNCTIONAL TYPE** = What the space is USED FOR (read "cultural_tone" and "description" for actual purpose)
- A building can LOOK one way but be USED for something completely different
- Always determine functional type from cultural_tone/description, NOT from visual appearance
- Window/opening shapes should match what you see in the parent's looks, accent_features, or dominant elements


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
   - **CRITICAL**: Inherit from parent's cultural_tone and description to determine ACTUAL function.
   - Physical appearance does NOT determine function - read what the space is USED for.

8. **Spatial Layout**: Describe the physical arrangement in 1-2 sentences.

9. **Required Elements**: Extract any SPECIFIC elements the user mentioned that MUST appear.
   Look for phrases like "Include:", "with a", "featuring", specific furniture, fixtures, or features.
   
10. **Suggested Fixtures**: Based on functional type, suggest 4-6 appropriate fixtures/furniture.

11. **Navigable Elements**: Suggest 2-3 navigation points (doors, passages, stairs) with positions.

12. **Dominant Elements**: List 3-5 main physical features that define the space.

13. **Unique Identifiers**: List 2-4 distinctive features that make this space memorable.

IMPORTANT RULES:
- Extract ALL user-specified elements as requiredElements - these MUST appear in the final image
- **FORM INHERITANCE IS MANDATORY**: Interior form MUST match exterior form. NEVER change form based on names or metaphors.
- Interior spaces should logically fit within their parent structure
- Be specific with positions (left, right, center, back, corner, etc.)
- **DO NOT interpret the name literally** - The name may be metaphorical; form comes from the physical building.
- **FUNCTIONAL TYPE IS ABOUT PURPOSE, NOT APPEARANCE**: Read cultural_tone and description to determine actual use.

=== CRITICAL: FORM AND ORIENTATION INHERITANCE (NON-NEGOTIABLE) ===

**FORM INHERITANCE IS ABSOLUTE (MOST IMPORTANT RULE):**
- Interior form MUST match parent's form (determined from the "looks" field)
- RECTANGULAR parent → RECTANGULAR interior
- ROUND parent → ROUND interior
- CYLINDRICAL parent → CYLINDRICAL interior
- **NEVER change form based on the room's NAME** - names can be metaphorical
- The form describes the PHYSICAL SHAPE of the building, not metaphorical meanings

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
- large: ~10-30m+ in primary dimension (halls, grand spaces, cathedrals)

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
