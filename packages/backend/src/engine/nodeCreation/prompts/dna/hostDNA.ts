/**
 * Host DNA Generation Prompt
 * 
 * Generates DNA for host nodes (worlds, settings, top-level places).
 * Host nodes define the genre and foundational style attributes.
 */

import { buildDNAJsonTemplate, buildNodeTypeGuidelines } from '../../../generation/prompts/shared/dnaSchema';

/**
 * Generate DNA prompt for a host node
 * 
 * @param description - User description of the host
 * @returns Prompt string for LLM
 */
export function hostDNAPrompt(description: string): string {
  const jsonTemplate = buildDNAJsonTemplate('host');
  const guidelines = buildNodeTypeGuidelines('host');

  return `You are creating the DNA for a HOST node - the top level of a world hierarchy.

HOST ROLE:
- Defines the world/setting (e.g., "London", "Cyberpunk Metropolis", "Fantasy Kingdom")
- Sets the GENRE which all children inherit
- Establishes foundational style attributes (architectural tone, cultural tone, etc.)
- Children (regions, locations, niches) will inherit and build upon this DNA

USER DESCRIPTION:
${description}

OUTPUT JSON:
${jsonTemplate}
${guidelines}

**Architectural Tone Detail**: Be very specific about architectural style. Include:
   - Era/period influence
   - Material preferences
   - Structural characteristics
   - Decorative elements

**Think Scale**: Host represents the largest scope. Describe what unifies the entire world.

Return ONLY valid JSON, no markdown or explanations.`;
}
