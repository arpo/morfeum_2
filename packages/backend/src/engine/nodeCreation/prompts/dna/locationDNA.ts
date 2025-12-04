/**
 * Location DNA Generation Prompt
 * 
 * Generates DNA for location nodes (buildings, sites, specific places).
 * Location nodes inherit from region and define site-specific attributes.
 */

import { buildDNAJsonTemplate, buildNodeTypeGuidelines, buildParentContextSection } from '../../../generation/prompts/shared/dnaSchema';
import type { ParentDNAContext } from '../../types';

/**
 * Generate DNA prompt for a location node
 * 
 * @param description - User description of the location
 * @param parentContext - DNA context inherited from parent region
 * @returns Prompt string for LLM
 */
export function locationDNAPrompt(description: string, parentContext?: ParentDNAContext): string {
  const jsonTemplate = buildDNAJsonTemplate('location');
  const guidelines = buildNodeTypeGuidelines('location');
  const contextSection = buildParentContextSection(parentContext);

  return `You are creating the DNA for a LOCATION node - a specific building or site within a region.

LOCATION ROLE:
- A specific place (e.g., "The Anchor Pub" in "Camden", "Central Tower" in "Industrial District")
- Inherits style from parent region/host
- Defines the exterior appearance of a building/site
- NavigableElements are CRITICAL here - doors, passages, stairs that lead inside
- Children (niches) represent spaces within this location

USER DESCRIPTION:
${description}
${contextSection}
OUTPUT JSON:
${jsonTemplate}
${guidelines}

**NavigableElements are ESSENTIAL**: These define how users can explore further:
   - List ALL visible entrances, passages, stairs, windows, etc.
   - Specify POSITION (left, center, right, foreground, midground, background)
   - Describe where each element leads or what it reveals

**Exterior Focus**: Location DNA describes the OUTSIDE of a building. Interiors are handled by niche nodes.

**Memorable Names**: Give locations evocative names, not generic ones:
   - ❌ "The Pub"
   - ✅ "The Rustic Anchor"

Return ONLY valid JSON, no markdown or explanations.`;
}
