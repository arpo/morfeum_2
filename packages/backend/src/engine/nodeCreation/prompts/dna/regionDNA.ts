/**
 * Region DNA Generation Prompt
 * 
 * Generates DNA for region nodes (districts, biomes, areas within a host).
 * Region nodes inherit from host and can override climate/biome aspects.
 */

import { buildDNAJsonTemplate, buildNodeTypeGuidelines, buildParentContextSection } from '../../../generation/prompts/shared/dnaSchema';
import type { ParentDNAContext } from '../../types';

/**
 * Generate DNA prompt for a region node
 * 
 * @param description - User description of the region
 * @param parentContext - DNA context inherited from parent host
 * @returns Prompt string for LLM
 */
export function regionDNAPrompt(description: string, parentContext?: ParentDNAContext): string {
  const jsonTemplate = buildDNAJsonTemplate('region');
  const guidelines = buildNodeTypeGuidelines('region');
  const contextSection = buildParentContextSection(parentContext);

  return `You are creating the DNA for a REGION node - a district or biome within a larger world.

REGION ROLE:
- A subdivision of a host (e.g., "Camden" within "London", "Industrial District" within "Cyberpunk City")
- Inherits genre and foundational style from parent host
- Can have distinct climate, local culture, or architectural variations
- Children (locations, niches) will inherit and build upon this DNA

USER DESCRIPTION:
${description}
${contextSection}
OUTPUT JSON:
${jsonTemplate}
${guidelines}

**Regional Character**: Focus on what makes THIS district unique:
   - Local architecture variations
   - Climate/weather differences
   - Cultural/economic character
   - Distinctive landmarks

Return ONLY valid JSON, no markdown or explanations.`;
}
