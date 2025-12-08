/**
 * Structure Analysis Prompt
 * LLM prompt for analyzing physical/spatial properties of a new space
 * Runs in parallel with DNA analysis for both GO_INSIDE and GOTO commands
 */

import type { NavigationContext } from '../../../navigation/types';

interface StructureAnalysisInput {
  /** User's description of the space (e.g., "Parisian Café, cozy and charming...") */
  userPrompt: string;
  /** Context including current node and parent location */
  context: NavigationContext;
  /** Whether this is an interior or exterior space */
  perspective: 'interior' | 'exterior';
}

/**
 * Generate prompt for LLM to analyze physical structure of a space
 */
export function structureAnalysisPrompt(input: StructureAnalysisInput): string {
  const { userPrompt, context, perspective } = input;
  
  // Get parent structure if available (using type assertion during migration period)
  // Structure may be in dna.structure (old) or node.structure (new after migration)
  const parentDna = context.parentNode?.dna as any;
  const currentDna = context.currentNode.dna as any;
  const parentStructure = parentDna?.structure || currentDna?.structure;
  
  return `You are an expert at spatial and architectural analysis.

TASK: Analyze a space description and determine its physical/structural properties.

=== CONTEXT ===
Creating a new ${perspective} space.
${context.currentNode.type === 'location' ? `Parent location: "${context.currentNode.name}"` : `Current niche: "${context.currentNode.name}"`}
${context.parentNode ? `Parent: "${context.parentNode.name}" (${context.parentNode.type})` : ''}

${parentStructure ? `=== PARENT STRUCTURE (inherit where appropriate) ===
Form: ${parentStructure.form || 'not specified'}
Scale: ${parentStructure.scale || 'not specified'}
Orientation: ${parentStructure.orientation || 'not specified'}
Functional Type: ${parentStructure.functionalType || 'not specified'}
` : ''}

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
}`;
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
