/**
 * Niche DNA Generation Prompt
 * 
 * Generates DNA for niche nodes (spaces within locations - rooms, areas, etc.).
 * Niche nodes can be interior or exterior and represent the deepest navigable level.
 */

import { buildDNAJsonTemplate, buildNodeTypeGuidelines, buildParentContextSection } from '../../../generation/prompts/shared/dnaSchema';
import type { ParentDNAContext, ScenePerspective } from '../../types';

/**
 * Generate DNA prompt for a niche node
 * 
 * @param description - User description of the niche
 * @param perspective - Interior or exterior
 * @param parentContext - DNA context inherited from parent location
 * @returns Prompt string for LLM
 */
export function nicheDNAPrompt(
  description: string, 
  perspective: ScenePerspective = 'interior',
  parentContext?: ParentDNAContext
): string {
  const jsonTemplate = buildDNAJsonTemplate('niche');
  const guidelines = buildNodeTypeGuidelines('niche');
  const contextSection = buildParentContextSection(parentContext);

  const perspectiveGuidance = perspective === 'interior' 
    ? `
PERSPECTIVE: INTERIOR
- This is an indoor space (room, hall, chamber, etc.)
- Focus on walls, floor, ceiling, furniture, lighting fixtures
- Describe the enclosed feeling, how light enters
- NavigableElements: doors leading to other rooms, stairs, windows with views`
    : `
PERSPECTIVE: EXTERIOR
- This is an outdoor space attached to the location (balcony, terrace, garden, rooftop)
- Focus on the view, surrounding elements, relationship to the building
- Describe open-air feeling, weather, sky visibility
- NavigableElements: doors back inside, paths, stairs, other access points`;

  return `You are creating the DNA for a NICHE node - a specific space within or attached to a location.

NICHE ROLE:
- The deepest level of the hierarchy (e.g., "Main Bar Room" in "The Anchor Pub")
- Can be INTERIOR (room, chamber, hall) or EXTERIOR (balcony, terrace, rooftop)
- This is where the user IS - the most detailed, immersive description
- Inherits style from parent location but describes the specific space
${perspectiveGuidance}

USER DESCRIPTION:
${description}
${contextSection}
OUTPUT JSON:
${jsonTemplate}
${guidelines}

**IMMERSIVE DETAIL**: Since this is where the user "is", be highly specific:
   - Name actual objects (not just "furniture" but "worn leather armchair")
   - Describe positions ("by the window", "centered on the far wall")
   - Include sensory details (sounds, temperature, smell)

**NavigableElements for Expansion**: These enable future exploration:
   - What doors/passages lead elsewhere?
   - What can be seen through windows?
   - What stairs or passages connect to other spaces?

Return ONLY valid JSON, no markdown or explanations.`;
}
