/**
 * Environment Transition Rules
 * Determines what should be visible through windows/viewports based on the parent environment
 * 
 * This is SEPARATE from interiorTransitionRules.ts which handles material transitions.
 * This handles ENVIRONMENT VISIBILITY - what you see through glass/viewports.
 */

/**
 * Environment types that can be detected from parent DNA
 */
export type EnvironmentType = 
  | 'UNDERWATER'
  | 'SPACE'
  | 'AERIAL'
  | 'SUBTERRANEAN'
  | 'SURFACE'; // Default - regular landscape

/**
 * Keywords that indicate each environment type
 * Searched in parent DNA fields: looks, atmosphere, materials, genre, architectural_tone
 */
const ENVIRONMENT_KEYWORDS: Record<EnvironmentType, string[]> = {
  UNDERWATER: [
    'underwater', 'ocean', 'seabed', 'abyssal', 'aquatic', 'marine',
    'deep sea', 'submarine', 'submerged', 'oceanic', 'hydro',
    'bioluminescent', 'coral', 'kelp', 'aquarium', 'atlantis'
  ],
  SPACE: [
    'space station', 'orbital', 'spacecraft', 'starship', 'asteroid',
    'lunar', 'moon base', 'mars colony', 'cosmic', 'zero-g',
    'interstellar', 'nebula', 'galactic'
  ],
  AERIAL: [
    'floating', 'airship', 'cloud', 'skyborne', 'aerial',
    'zeppelin', 'flying', 'suspended in air', 'sky city',
    'high altitude', 'stratospheric'
  ],
  SUBTERRANEAN: [
    'underground', 'cavern', 'cave', 'mine', 'subterranean',
    'tunnel', 'beneath', 'below ground', 'dwarven', 'bunker',
    'magma', 'volcanic', 'geothermal'
  ],
  SURFACE: [] // Default - no specific keywords needed
};

/**
 * Viewport constraints for each environment type
 * These tell the LLM what should be visible through windows/glass
 */
export const ENVIRONMENT_VIEWPORT_CONSTRAINTS: Record<EnvironmentType, string> = {
  UNDERWATER: `[CRITICAL: UNDERWATER ENVIRONMENT]
Any windows, viewports, or transparent surfaces MUST show the UNDERWATER ocean environment:
- Deep ocean darkness with bioluminescent creatures and flora
- Marine life (fish, jellyfish, distant leviathans)
- Coral formations, kelp forests, or rocky seabed
- Blue-black abyssal depths with scattered points of bioluminescence
- Occasional shafts of light from above (if near surface)
DO NOT show: outer space, stars, nebulas, sky, or terrestrial landscapes.
This is an UNDERWATER environment, NOT a space station.

[TRANSPARENT DOME/ENCLOSURE - UNDERWATER]:
If this is a DOME, HABITAT, or ENCLOSURE with glass/transparent materials:
- The dome/shell structure should be PREDOMINANTLY TRANSPARENT glass
- The underwater ocean view should be visible as the ENTIRE ceiling/sky view
- Structural supports (ribs, frames, girders) should FRAME glass panels, not block/cover them
- The transparent dome is the DOMINANT architectural feature - NOT small windows in opaque walls
- Show the vast underwater expanse (bioluminescence, marine life, blue-black depths) through the transparent shell
- The ceiling/upper walls ARE the window to the ocean - treat them as such
- Metallic supports provide structure, but GLASS dominates the visual

[INTERIOR LIGHTING - UNDERWATER]:
Interior lighting must feel consistent with being underwater:
- Use SUBDUED, DIM lighting with cool BLUE-GREEN color temperature
- Light sources should feel ARTIFICIAL/SUBMARINE - NOT bright daylight white
- Avoid "bright sterile white" lighting - use atmospheric blues and teals
- Shadows should be soft and atmospheric
- The overall mood should be subdued, matching the deep ocean outside
- Think submarine/underwater base lighting, NOT hospital/office lighting`,

  SPACE: `[CRITICAL: SPACE ENVIRONMENT]
Any windows, viewports, or transparent surfaces MUST show OUTER SPACE:
- Star fields, distant galaxies, nebulas
- Planets, moons, or asteroids if nearby
- The void of space with cosmic phenomena
- Solar flares or distant suns
DO NOT show: water, underwater scenes, sky with clouds, or terrestrial landscapes.

[INTERIOR LIGHTING - SPACE]:
Interior lighting should feel like a spacecraft/station:
- Use crisp, artificial lighting with slight cool tones
- Contrast between lit panels and darker corners is appropriate
- Control panels and displays add colored accent lighting
- No natural daylight - all light sources are artificial`,

  AERIAL: `[CRITICAL: AERIAL ENVIRONMENT]
Any windows, viewports, or transparent surfaces MUST show the SKY environment:
- Clouds (above, below, or at level)
- Distant ground far below (miniature landscape)
- Open sky, sun/moon, atmospheric phenomena
- Other flying structures if appropriate
DO NOT show: underwater scenes, space, or ground-level views.`,

  SUBTERRANEAN: `[CRITICAL: SUBTERRANEAN ENVIRONMENT]
Any windows, viewports, or transparent surfaces show the UNDERGROUND environment:
- Rock walls, cave formations, stalactites/stalagmites
- Magma glow or geothermal vents if volcanic
- Mineral veins, crystal formations
- Other tunnel openings or cavern spaces
DO NOT show: sky, surface landscapes, underwater, or space.

[INTERIOR LIGHTING - SUBTERRANEAN]:
Interior lighting should feel underground:
- Use warm amber/orange tones if near volcanic/magma areas
- Use cool mineral tones (blues, greens) if crystalline caverns
- Torch/lantern lighting for fantasy, artificial for sci-fi
- No natural daylight - shadows are deep and atmospheric`,

  SURFACE: '' // No special constraint for regular surface environments
};

/**
 * Detect the environment type from parent DNA chain
 * Scans multiple DNA fields for environment keywords
 * 
 * @param parentChain - Array of parent nodes with their DNA
 * @returns Detected environment type or 'SURFACE' as default
 */
export function detectEnvironmentType(
  parentChain?: Array<{ dna?: Record<string, any>; description?: string }>
): EnvironmentType {
  if (!parentChain || parentChain.length === 0) {
    return 'SURFACE';
  }

  // Collect all text from parent DNA to search
  const searchText: string[] = [];
  
  for (const parent of parentChain) {
    if (parent.dna) {
      // Add relevant DNA fields to search
      if (parent.dna.looks) searchText.push(parent.dna.looks);
      if (parent.dna.atmosphere) searchText.push(parent.dna.atmosphere);
      if (parent.dna.materials) searchText.push(parent.dna.materials);
      if (parent.dna.genre) searchText.push(parent.dna.genre);
      if (parent.dna.architectural_tone) searchText.push(parent.dna.architectural_tone);
      if (parent.dna.primary_surfaces) searchText.push(parent.dna.primary_surfaces);
      if (parent.dna.secondary_surfaces) searchText.push(parent.dna.secondary_surfaces);
    }
    if (parent.description) {
      searchText.push(parent.description);
    }
  }

  const combinedText = searchText.join(' ').toLowerCase();

  // Check each environment type in priority order
  // (UNDERWATER, SPACE, AERIAL, SUBTERRANEAN checked before defaulting to SURFACE)
  for (const envType of ['UNDERWATER', 'SPACE', 'AERIAL', 'SUBTERRANEAN'] as EnvironmentType[]) {
    const keywords = ENVIRONMENT_KEYWORDS[envType];
    for (const keyword of keywords) {
      if (combinedText.includes(keyword.toLowerCase())) {
        return envType;
      }
    }
  }

  return 'SURFACE';
}

/**
 * Get the viewport constraint for a detected environment type
 * Returns empty string for SURFACE (no special constraint needed)
 * 
 * @param environmentType - The detected environment type
 * @returns Constraint string to add to image prompt, or empty string
 */
export function getEnvironmentViewportConstraint(environmentType: EnvironmentType): string {
  return ENVIRONMENT_VIEWPORT_CONSTRAINTS[environmentType];
}

/**
 * Build environment constraint from parent chain
 * Convenience function that combines detection and constraint generation
 * 
 * @param parentChain - Array of parent nodes with their DNA
 * @returns Constraint string if special environment detected, empty string otherwise
 */
export function buildEnvironmentConstraint(
  parentChain?: Array<{ dna?: Record<string, any>; description?: string }>
): string {
  const envType = detectEnvironmentType(parentChain);
  return getEnvironmentViewportConstraint(envType);
}

/**
 * Detect environment type directly from DNA objects
 * Simpler interface for when you have parentDNA/surroundingsDNA directly
 * 
 * @param parentDNA - Parent DNA object
 * @param surroundingsDNA - Optional surroundings DNA object
 * @returns Detected environment type or 'SURFACE' as default
 */
export function detectEnvironmentFromDNA(
  parentDNA?: Record<string, any>,
  surroundingsDNA?: Record<string, any>
): EnvironmentType {
  // Build a simple array to pass to the main detection function
  const dnaArray: Array<{ dna?: Record<string, any> }> = [];
  
  if (surroundingsDNA) {
    dnaArray.push({ dna: surroundingsDNA });
  }
  if (parentDNA) {
    dnaArray.push({ dna: parentDNA });
  }
  
  return detectEnvironmentType(dnaArray);
}
