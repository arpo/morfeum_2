/**
 * Compose image prompt from Structure + DNA analysis results
 * Includes inherited DNA from ancestors for visual consistency
 */

import type { StructureAnalysis } from '../../types';
import { getDimensionalHints } from './dimensionalHints';

export function composeImagePrompt(
  structureAnalysis: StructureAnalysis,
  dnaResult: any,
  userPrompt: string,
  parentDNA?: any
): string {
  const { structure } = structureAnalysis;
  const dna = dnaResult.dna || {};

  // Build the image prompt from pre-computed data
  const parts: string[] = [];

  // Start with perspective and space type
  parts.push(`${structureAnalysis.perspective} of ${structureAnalysis.name}.`);

  // Add structural description
  if (structure.spatialLayout) {
    parts.push(structure.spatialLayout);
  }

  // Add form, scale, and dimensional hints for better FLUX accuracy
  const dimensionalHints = getDimensionalHints(structure.scale, structure.orientation, structure.form);
  parts.push(`A ${structure.scale} ${structure.form} space (${dimensionalHints}).`);

  // Add orientation hint for cylindrical/spherical forms
  if (structure.form === 'cylindrical') {
    if (structure.orientation === 'horizontal') {
      parts.push('The cylinder is oriented horizontally (lying down), with a curved ceiling following the arc.');
    } else if (structure.orientation === 'vertical') {
      parts.push('The cylinder is oriented vertically (standing up), with curved walls and flat ceiling.');
    }
  } else if (structure.form === 'spherical') {
    parts.push('Interior curves follow the sphere in all directions.');
  }

  // Add DNA visual elements
  if (dna.looks) {
    parts.push(dna.looks);
  }

  // Add materials (prefer inherited materials_base if DNA materials missing)
  if (dna.materials) {
    parts.push(`Materials: ${dna.materials}`);
  } else if (parentDNA?.materials_base) {
    parts.push(`Materials: ${parentDNA.materials_base}`);
  }

  // Add colors and lighting
  if (dna.colorsAndLighting) {
    parts.push(dna.colorsAndLighting);
  }

  // Add atmosphere
  if (dna.atmosphere) {
    parts.push(dna.atmosphere);
  }

  // === INHERITED DNA FROM ANCESTORS (CRITICAL FOR VISUAL CONSISTENCY) ===
  // These ensure the niche looks like it belongs in its host (e.g., Parisian style)
  if (parentDNA) {
    if (parentDNA.architectural_tone) {
      parts.push(`ARCHITECTURAL STYLE (from host): ${parentDNA.architectural_tone}`);
    }
    if (parentDNA.cultural_tone) {
      parts.push(`Cultural context: ${parentDNA.cultural_tone}`);
    }
    if (parentDNA.palette_bias) {
      parts.push(`Color palette bias: ${parentDNA.palette_bias}`);
    }
    if (parentDNA.mood_baseline) {
      parts.push(`Mood: ${parentDNA.mood_baseline}`);
    }
  }

  // Add REQUIRED ELEMENTS (user-specified, MUST appear)
  if (structure.requiredElements && structure.requiredElements.length > 0) {
    parts.push(`MUST INCLUDE: ${structure.requiredElements.join('. ')}.`);
  }

  // Add suggested fixtures
  if (structure.suggestedFixtures && structure.suggestedFixtures.length > 0) {
    parts.push(`Fixtures: ${structure.suggestedFixtures.join(', ')}.`);
  }

  // Add navigable elements with visual prominence
  if (structure.navigableElements && structure.navigableElements.length > 0) {
    const navDescriptions = structure.navigableElements
      .map((n: any) => `${n.type} at ${n.position}: ${n.description}`)
      .join('. ');
    parts.push(`Navigation points: ${navDescriptions}.`);
  }

  // Add dominant elements
  if (structure.dominantElements && structure.dominantElements.length > 0) {
    parts.push(`Key features: ${structure.dominantElements.join(', ')}.`);
  }

  // Add opening shape specification (critical for window/porthole consistency)
  if (structure.openingShape) {
    const shapeDescriptions: Record<string, string> = {
      rectangular: 'Windows and openings are rectangular/square-shaped.',
      circular: 'Windows and openings are circular/round (portholes).',
      arched: 'Windows and openings have arched tops.',
      mixed: 'Windows include both rectangular and circular shapes.',
      irregular: 'Windows and openings have organic, non-standard shapes.'
    };
    parts.push(shapeDescriptions[structure.openingShape] || '');
  }

  // Add furnishing details if present (--furnish flag was used)
  // Use STRONG emphasis to ensure FLUX renders furniture prominently
  if (structureAnalysis.furnishingDetails) {
    const { userSpecified, suggested, placementNotes } = structureAnalysis.furnishingDetails;
    console.log('\n🪑 [FURNISHING] --furnish flag detected, adding EMPHASIZED furnishing details to image prompt:');
    
    // CRITICAL: Add strong furnishing emphasis to prevent empty spaces
    parts.push('IMPORTANT: This space is FULLY FURNISHED and IN ACTIVE USE - NOT an empty room.');
    parts.push('Furniture and equipment FILL THE SPACE, distributed throughout the floor area, not just along walls.');
    parts.push('Items are HUMAN-SCALE and PROMINENTLY VISIBLE in foreground and midground.');
    
    if (userSpecified && userSpecified.length > 0) {
      console.log(`  User-specified: ${userSpecified.join(', ')}`);
      parts.push(`MUST INCLUDE these user-specified items (prominently visible): ${userSpecified.join(', ')}.`);
    }
    if (suggested && suggested.length > 0) {
      console.log(`  Suggested: ${suggested.join(', ')}`);
      // Convert list to more descriptive scene setting
      const furnishingCount = suggested.length;
      parts.push(`The space contains at least ${Math.min(furnishingCount, 4)}-${Math.min(furnishingCount + 2, 8)} pieces of furniture/equipment: ${suggested.join(', ')}.`);
      parts.push('These items occupy 40-60% of the visible floor space.');
    }
    if (placementNotes && placementNotes.length > 0) {
      console.log(`  Placement notes: ${placementNotes.join('. ')}`);
      parts.push(`Spatial arrangement: ${placementNotes.join(' ')}`);
    }
  }

  return parts.join(' ');
}
