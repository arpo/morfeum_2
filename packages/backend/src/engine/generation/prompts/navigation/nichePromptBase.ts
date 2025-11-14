import type { NavigationContext } from '../../../navigation/types';
import { fluxInstructionsShort } from '../shared/constants';
import {
  buildColorsDescription,
  buildDNADescriptors,
  buildLocationDescriptors,
  buildMaterialsDescription,
} from '../shared/contextBuilders';
import {
  buildCameraSpecificationsCondensed,
  buildFluxInstructionsShortSection,
} from '../shared/promptSections';

/**
 * Builds the neutral foundation for niche image prompts.
 * Contains parent context, DNA guidance, camera specs, flux instructions, and output structure.
 */
export function buildNichePromptBase(
  context: NavigationContext
): string {
  const descriptors = buildLocationDescriptors(context.currentNode.data);
  const materials = buildMaterialsDescription(context.currentNode.data);
  const colors = buildColorsDescription(context.currentNode.data);
  const dnaDescriptors = buildDNADescriptors(context.currentNode.dna);
  const cameraSpecs = buildCameraSpecificationsCondensed();
  const fluxInstructions = buildFluxInstructionsShortSection();

  let contextBlock = `PARENT LOCATION CONTEXT:
Name: "${context.currentNode.name}"
${descriptors.join('\n')}
${materials ? `\n${materials}` : ''}
${colors ? `\n${colors}` : ''}${context.currentNode.data.spatialLayout ? `\nSpatial Layout: "${context.currentNode.data.spatialLayout}"` : ''}
${dnaDescriptors.length > 0 ? `\nDNA GUIDANCE (PRIMARY - use this to drive style & atmosphere):\n${dnaDescriptors.join('\n')}` : ''}

${cameraSpecs}

${fluxInstructions}
`;

  return contextBlock;
}
