/**
 * Interior Transition Rules
 * Defines how exterior materials/styles should translate to interior finishes
 * based on architectural style categories.
 * 
 * These rules are included in the CACHE_NAVIGATION cache group for efficiency.
 */

export const INTERIOR_TRANSITION_RULES = `
=== EXTERIOR → INTERIOR TRANSITION RULES ===

When generating DNA for an INTERIOR space from an EXTERIOR parent, follow these rules
based on the parent's architectural_tone:

═══════════════════════════════════════════════════════════════════════════════════
CATEGORY 1: SAME_MATERIAL (Shell IS the interior - use identical materials)
═══════════════════════════════════════════════════════════════════════════════════
Applies to: futuristic, sci-fi, tech, cyberpunk, spacecraft, spaceship, 
           organic, bio, biomech, alien, crystalline, crystal, 
           cave, carved, rock, stone, bunker, military, fortress,
           ice, snow, frozen, submarine, underwater, vault

Rule: The structure's shell IS the interior. Materials must match exterior.
- Metallic hull outside → polished metallic panels inside
- Organic chitin outside → same organic grown surfaces inside
- Crystal formations outside → same faceted crystal inside
- Carved rock outside → same carved stone chambers inside
- Ice walls outside → same ice/snow interior

═══════════════════════════════════════════════════════════════════════════════════
CATEGORY 2: FINISHED_INTERIOR (Exterior is protective shell, interior is finished)
═══════════════════════════════════════════════════════════════════════════════════
Applies to: traditional, country, residential, cottage, farmhouse,
           victorian, colonial, georgian, edwardian, regency,
           mediterranean, spanish, tuscan, greek,
           scandinavian, nordic, modern, contemporary, minimalist,
           japanese traditional, chinese traditional, korean,
           art deco, art nouveau, baroque, rococo, neoclassical

Rule: Exterior cladding is a shell. Interior gets appropriate finished surfaces.
- Painted wood siding → wallpaper, plaster walls, wood trim, crown molding
- Brick facade → decorative wallpaper, wood paneling, plaster
- Stucco exterior → smooth plaster, tile floors, arched doorways
- Wood cladding → painted drywall, hardwood floors, cozy textiles

Colors: Interior palette should HARMONIZE with exterior, not match exactly.
- Red barn outside → warm cream/white walls inside with wood accents
- Blue cottage outside → soft neutral walls with blue accent pieces

═══════════════════════════════════════════════════════════════════════════════════
CATEGORY 3: EXPOSED_MATERIAL (Interior shows raw/honest structure)
═══════════════════════════════════════════════════════════════════════════════════
Applies to: industrial, brutalist, warehouse, loft, factory,
           steampunk, dieselpunk, post-apocalyptic, dystopian,
           rustic, barn, workshop, garage

Rule: Interior celebrates raw structure. Materials are exposed, not concealed.
- Brick exterior → exposed brick walls inside
- Concrete exterior → exposed concrete, utilitarian finishes
- Metal exterior → exposed steel beams, ductwork, pipes
- Riveted metal → visible rivets, brass fittings, gears

═══════════════════════════════════════════════════════════════════════════════════
CATEGORY 4: NATURAL_INTEGRATION (Built INTO nature, blends with environment)
═══════════════════════════════════════════════════════════════════════════════════
Applies to: treehouse, forest, woodland, organic architecture,
           hobbit, underground, burrow, earthship, eco,
           cliffside, canyon, mesa, desert carved

Rule: Structure is integrated with natural surroundings. Interior continues this.
- Living tree → wood interior with branches integrated, bark textures
- Grass-covered hill → cozy wood paneling, round doors, earth tones
- Cliffside → stone interior with natural rock formations visible
- Earth berm → exposed earth walls, natural materials

═══════════════════════════════════════════════════════════════════════════════════
CATEGORY 5: FANTASY/GAME-SPECIFIC (Stylized genre worlds)
═══════════════════════════════════════════════════════════════════════════════════
Applies to: gothic, dark fantasy, castle, medieval fortress,
           elven, high fantasy, ethereal, magical,
           dwarven, mountain hall, forge,
           temple, sacred, religious, shrine

Rule: Interior reflects the cultural/magical nature of the inhabitants.
- Gothic castle → stone walls, tapestries, candelabras, dark wood
- Elven structure → graceful arches, natural light, living wood, leaves
- Dwarven hall → carved stone, metal accents, hearths, geometric patterns
- Temple → stone, religious imagery, altars, sacred geometry

═══════════════════════════════════════════════════════════════════════════════════
ALWAYS PRESERVE (regardless of category):
═══════════════════════════════════════════════════════════════════════════════════
1. GENRE: Sci-fi stays sci-fi, fantasy stays fantasy, etc.
2. PALETTE HARMONY: Colors should be related/complementary, not random
3. MOOD CONSISTENCY: Ominous exterior → mysterious interior (not cheerful)
4. CULTURAL CONTEXT: Medieval culture outside → medieval lifestyle inside
5. SCALE LOGIC: Small building → appropriately sized interior
`;

/**
 * Get the transition category for an architectural tone
 * Used to provide focused guidance based on style
 */
export function getTransitionCategory(architecturalTone: string | null | undefined): string {
  if (!architecturalTone) return 'FINISHED_INTERIOR'; // Default for unknown
  
  const tone = architecturalTone.toLowerCase();
  
  // Category 1: SAME_MATERIAL
  const sameMaterial = [
    'futuristic', 'sci-fi', 'tech', 'cyberpunk', 'spacecraft', 'spaceship',
    'organic', 'bio', 'biomech', 'alien', 'crystalline', 'crystal',
    'cave', 'carved', 'rock', 'stone', 'bunker', 'military', 'fortress',
    'ice', 'snow', 'frozen', 'submarine', 'underwater', 'vault'
  ];
  if (sameMaterial.some(s => tone.includes(s))) return 'SAME_MATERIAL';
  
  // Category 3: EXPOSED_MATERIAL
  const exposedMaterial = [
    'industrial', 'brutalist', 'warehouse', 'loft', 'factory',
    'steampunk', 'dieselpunk', 'post-apocalyptic', 'dystopian',
    'rustic', 'barn', 'workshop', 'garage'
  ];
  if (exposedMaterial.some(s => tone.includes(s))) return 'EXPOSED_MATERIAL';
  
  // Category 4: NATURAL_INTEGRATION
  const naturalIntegration = [
    'treehouse', 'forest', 'woodland', 'organic architecture',
    'hobbit', 'underground', 'burrow', 'earthship', 'eco',
    'cliffside', 'canyon', 'mesa', 'desert carved'
  ];
  if (naturalIntegration.some(s => tone.includes(s))) return 'NATURAL_INTEGRATION';
  
  // Category 5: FANTASY
  const fantasy = [
    'gothic', 'dark fantasy', 'castle', 'medieval', 'fortress',
    'elven', 'high fantasy', 'ethereal', 'magical',
    'dwarven', 'mountain hall', 'forge',
    'temple', 'sacred', 'religious', 'shrine'
  ];
  if (fantasy.some(s => tone.includes(s))) return 'FANTASY_SPECIFIC';
  
  // Category 2: FINISHED_INTERIOR (default for traditional, residential, etc.)
  return 'FINISHED_INTERIOR';
}
