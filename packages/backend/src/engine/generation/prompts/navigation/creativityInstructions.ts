/**
 * Creativity Level Instructions
 * Generates dynamic creativity instructions based on creativity level
 * Used by niche image prompt generation
 */

/**
 * Generate dynamic creativity instructions based on creativity level
 * @param level 0.0 (conservative) to 1.0 (bold) - controls how much the niche diverges from parent
 * @returns Creativity-specific instruction text
 */
export function getCreativityInstructions(level: number): string {
  if (level < 0.3) {
    // Conservative: Stay very close to parent
    return `CREATIVE NICHE GENERATION (CONSERVATIVE - Level ${level.toFixed(1)}):
- The parent sets the THEME (materials, mood, style, colors, DNA)
- The niche should use the SAME materials as the parent in slightly different forms
- Think: minor scale variations, repositioning - NOT new material types
- Add subtle details using the existing material palette only
- The space should feel like a natural extension of the parent

Material adherence:
- Use SAME primary materials in different scales or configurations
- Variations are subtle: smaller pieces, grouped differently, different heights
- NO new material types introduced
- Lighting style remains identical
- Form variations are minimal

Pattern: If parent has [X material], niche uses [X material] in varied arrangements only`;
  } else if (level < 0.7) {
    // Moderate: Allow complementary materials
    return `CREATIVE NICHE GENERATION (MODERATE - Level ${level.toFixed(1)}):
- The parent sets the THEME (materials, mood, style, colors, DNA)
- The niche should contain NEW elements that fit this theme but are DISTINCT
- Think: variations, extensions, related features - NOT copies of the parent
- Add creative details that weren't mentioned in the parent description
- The space should feel like a DISCOVERY, not just another view of the same thing

Principles of creative variation (learn the concept, don't copy examples):
- Parent provides MATERIALS → Niche adds new structures/features using those same materials in different forms
- Parent establishes SCALE → Niche includes varied-scale elements (smaller, larger, grouped, scattered)
- Parent sets LIGHTING STYLE → Niche extends that lighting in new creative ways
- Parent defines TERRAIN/FORM → Niche adds new ground/surface features fitting that context
- Parent shows PRIMARY FEATURE → Niche introduces complementary secondary features, interaction points, exploration elements

General pattern to follow:
If parent has [X primary element with Y materials], the niche should add related but NEW elements using Y materials in different configurations, scales, or functions that invite further exploration`;
  } else {
    // Bold: Encourage contrasting elements
    return `CREATIVE NICHE GENERATION (BOLD - Level ${level.toFixed(1)}):
- The parent sets the THEME (mood, DNA, environment) - these are LOCKED
- The niche introduces CONTRASTING materials and UNEXPECTED elements
- Think: Burning Man principle - walking through different art installations on the same playa at the same time
- Add 2-3 unexpected elements that fit the mood/DNA but contrast with parent materials
- The space should feel like a SURPRISING DISCOVERY

LOCKED (cannot change at any creativity level):
- ENVIRONMENT: Desert stays desert, cave stays cave, plaza stays plaza, forest stays forest
- TIME OF DAY: Twilight stays twilight, dawn stays dawn, night stays night
- ATMOSPHERE: Misty stays misty, dusty stays dusty, clear stays clear
- DNA: Genre, architectural tone, cultural tone, mood baseline, palette bias
- WEATHER: Current weather conditions remain the same

FLEXIBLE (creative freedom):
- MATERIALS: Parent materials are INSPIRATION, not restriction
- Introduce CONTRASTING materials that complement the mood (smooth vs rough, organic vs synthetic, light vs heavy, transparent vs opaque)
- Add UNEXPECTED features: water where there was metal, vegetation where there was stone, glass where there was wood, fabric where there was rock
- Scale can vary dramatically: intimate details alongside monumental features
- Lighting SOURCE can vary: if parent had LED lights, try fire bowls, bioluminescence, spotlights, reflective surfaces - BUT maintain same time-of-day lighting quality
- 1-3 elements can be completely new material types not in parent

Pattern: If parent has [X material in Y environment at Z time], niche has [completely different materials] but still in [Y environment at Z time]
Examples: 
- Metal sculptures in desert twilight → Glass pools + wooden platforms in SAME desert twilight
- Stone temple in misty forest → Crystal formations + bioluminescent vegetation in SAME misty forest
- Burning Man principle: Different art, same playa, same atmosphere`;
  }
}
