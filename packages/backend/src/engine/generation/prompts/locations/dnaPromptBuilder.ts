/**
 * DNA Prompt Builder
 * 
 * Assembles the complete DNA generation prompt from templates.
 * Extracted from completeDNAGeneration.ts for maintainability.
 */

import { 
  DOMINANT_ELEMENTS_RULES, 
  NAVIGABLE_ELEMENTS_RULES
} from '../shared/elementRules';
import {
  VISUAL_ANALYSIS_TEMPLATE,
  OUTPUT_STRUCTURE_SECTION,
  CRITICAL_GUIDELINES_SECTION
} from './dnaTemplates';

/**
 * Build complete DNA generation prompt
 * 
 * Generates DNA for entire hierarchy in ONE LLM call:
 * - Host (full DNA)
 * - All Regions (sparse DNA)
 * - All Locations (sparse DNA)
 * - All Niches (sparse DNA)
 * 
 * @param originalPrompt - Original user input
 * @param hostName - Host node name
 * @param hostDescription - Host node description
 * @param regions - Region hierarchy structure
 * @param visualAnalysis - Optional visual analysis from deepest node
 * @returns Complete prompt string for LLM
 */
export function buildCompleteDNAPrompt(
  originalPrompt: string,
  hostName: string,
  hostDescription: string,
  regions: Array<{
    name: string;
    description: string;
    locations?: Array<{
      name: string;
      description: string;
      niches?: Array<{ name: string; description: string }>;
    }>;
  }>,
  visualAnalysis?: any
): string {
  // Build visual analysis section if provided
  let visualAnalysisSection = '';
  if (visualAnalysis) {
    visualAnalysisSection = VISUAL_ANALYSIS_TEMPLATE(visualAnalysis);
  }

  // Build hierarchy structure section
  const hierarchySection = buildHierarchySection(hostName, hostDescription, regions);

  // Assemble complete prompt
  return `Generate complete nodes with DNA for an entire location hierarchy in ONE response.

USER INPUT:
${originalPrompt}

HIERARCHY STRUCTURE:
${hierarchySection}
${visualAnalysisSection}

${NAVIGABLE_ELEMENTS_RULES}

${DOMINANT_ELEMENTS_RULES}

${OUTPUT_STRUCTURE_SECTION}

${CRITICAL_GUIDELINES_SECTION}

Generate now:`;
}

/**
 * Build the hierarchy structure section of the prompt
 */
function buildHierarchySection(
  hostName: string,
  hostDescription: string,
  regions: Array<{
    name: string;
    description: string;
    locations?: Array<{
      name: string;
      description: string;
      niches?: Array<{ name: string; description: string }>;
    }>;
  }>
): string {
  let section = `HOST: ${hostName}\nDescription: ${hostDescription}\n`;

  for (const region of regions) {
    section += `\nREGION: ${region.name}\nDescription: ${region.description}\n`;

    if (region.locations) {
      for (const location of region.locations) {
        section += `\n  LOCATION: ${location.name}\n  Description: ${location.description}\n`;

        if (location.niches) {
          for (const niche of location.niches) {
            section += `\n    NICHE: ${niche.name}\n    Description: ${niche.description}\n`;
          }
        }
      }
    }
  }

  return section;
}
