/**
 * Parent Chain DNA Generation Prompt
 * 
 * Generates DNA for all parent nodes in ONE LLM call, working bottom-up.
 * 
 * CASCADING DNA SYSTEM:
 * - DNA flows DOWN the tree at runtime: Host → Region → Location → Niche
 * - Each node only stores what's DIFFERENT from its parent
 * - null values = "inherit from parent at runtime"
 * - This prompt generates UPWARD (reverse) - inferring parent styles from child
 * 
 * PARALLELISM NOTE:
 * This LLM call runs in parallel with IMAGE GENERATION (not with other DNA calls).
 * The parent nodes are generated in ONE call, ensuring internal consistency.
 * 
 * Key features:
 * - Takes deepest node's DNA as the "truth" to work backwards from
 * - Generates sparse DNA (cascading fields can be null if inherited)
 * - Works bottom-up: Location → Region → Host
 * - Each parent must be COMPATIBLE with its child's established style
 * 
 * @param deepestNodeDNA - DNA from the deepest node (already generated)
 * @param deepestNodeType - Type of the deepest node
 * @param parentNodes - Parent nodes that need DNA generation
 * @param originalPrompt - Original user input
 * @returns Prompt string for LLM
 */

export interface HierarchyNodeInfo {
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
  looks?: string;
  atmosphere?: string;
  mood?: string;
}

export function parentChainDNAGeneration(
  deepestNodeDNA: any,
  deepestNodeType: 'host' | 'region' | 'location' | 'niche',
  parentNodes: HierarchyNodeInfo[],
  originalPrompt: string
): string {
  // If deepest is host, no parent DNA needed
  if (deepestNodeType === 'host' || parentNodes.length === 0) {
    return ''; // No parent DNA generation needed
  }

  // Build the deepest node DNA summary for reference
  const deepestDNASummary = buildDNASummary(deepestNodeDNA);
  
  // Build parent nodes section (what we need to generate)
  const parentNodesSection = parentNodes
    .map(node => `- ${node.type.toUpperCase()}: ${node.name}\n  Description: ${node.description}`)
    .join('\n\n');

  // Determine which node types we're generating
  const nodesToGenerate = parentNodes.map(n => n.type);
  const includesHost = nodesToGenerate.includes('host');
  const includesRegion = nodesToGenerate.includes('region');
  const includesLocation = nodesToGenerate.includes('location');

  return `Generate DNA for PARENT nodes using the CASCADING DNA SYSTEM.

═══════════════════════════════════════════════════════════════════════════════
THE CASCADING DNA SYSTEM (CRITICAL - UNDERSTAND THIS FIRST)
═══════════════════════════════════════════════════════════════════════════════

DNA flows DOWN the tree at runtime:
┌─────────────────────────────────────────────────────────────────────────────┐
│  HOST (ROOT - sets genre + ALL cascading fields)                            │
│    ↓ cascades down                                                          │
│  REGION (only stores what's DIFFERENT from host)                            │
│    ↓ cascades down                                                          │
│  LOCATION (only stores what's DIFFERENT from region)                        │
│    ↓ cascades down                                                          │
│  NICHE (only stores what's DIFFERENT from location)                         │
└─────────────────────────────────────────────────────────────────────────────┘

SPARSE DNA STORAGE:
- Each node's cascading fields are SPARSE (can be null)
- null means "inherit from parent at runtime"
- Only store a value if this node is DISTINCTLY DIFFERENT from its parent
- This enables efficient storage + consistent style inheritance

═══════════════════════════════════════════════════════════════════════════════
YOU ARE WORKING BOTTOM-UP (Reverse Direction)
═══════════════════════════════════════════════════════════════════════════════

The deepest node's DNA already exists. You must now INFER parent DNA by:
1. Looking at the deepest node's specific style
2. Abstracting UPWARD to find the general style that would produce it
3. Each parent must be COMPATIBLE with its children

Example thinking:
- Deepest (Niche): "polished chrome walls with neon accents, industrial aesthetic"
- Location DNA: Must describe a building whose INTERIOR matches this niche
- Region DNA: Must describe a district where THIS building would exist
- Host DNA: Must describe a world where THIS district would exist

═══════════════════════════════════════════════════════════════════════════════

ORIGINAL USER INPUT:
${originalPrompt}

DEEPEST NODE DNA (the established "truth" - work backwards from this):
${deepestDNASummary}

PARENT NODES TO GENERATE (from deepest parent to broadest):
${parentNodesSection}

ABSTRACTION EXAMPLES:
- Deepest has "polished chrome walls with neon accents" 
  → Location architectural_tone: "industrial building with chrome and neon facade"
  → Region architectural_tone: "industrial district with high-tech aesthetics" 
  → Host architectural_tone: null (or set world-level style if different)

- Deepest has "deep burgundy velvet and aged brass fixtures"
  → Location palette_bias: "rich warm tones with brass accents"
  → Region palette_bias: null (inherit from location if same)
  → Host palette_bias: "jewel tones and metallic warmth"

OUTPUT JSON STRUCTURE:

{
  ${includesLocation ? `"location": {
    "name": "Location Name",
    "description": "2-3 sentences about this location",
    
    // Structural fields
    "navigableElements": [{"type": "door|path|gate", "position": "location", "description": "what it is"}],
    "dominantElements": ["Major features visible from outside"],
    "uniqueIdentifiers": ["Distinctive exterior features"],
    "searchDesc": "75-100 char description",
    "slug": "kebab-case-name",
    
    // DNA - can be sparse (null values inherit from region)
    "dna": {
      // Scene fields (ALWAYS populated - what you see at this location)
      "looks": "Exterior appearance description",
      "colorsAndLighting": "Exterior colors and natural lighting",
      "atmosphere": "Outdoor atmosphere around this location",
      "materials": "Exterior building materials",
      "mood": "Emotional tone of approaching this place",
      "sounds": "Ambient sounds near the entrance",
      "spatialLayout": "How the building sits in its environment",
      "primary_surfaces": "Main exterior surfaces",
      "secondary_surfaces": "Secondary exterior elements",
      "accent_features": "Decorative exterior details",
      "dominant": "Dominant exterior colors",
      "secondary": "Secondary exterior colors",
      "accent": "Accent colors on facade",
      "ambient": "Natural light quality",
      
      // Cascading fields (SPARSE - null if same as region)
      "genre": null,
      "architectural_tone": "Building-specific style OR null",
      "cultural_tone": "Building's purpose/identity OR null",
      "materials_base": "Building's material theme OR null",
      "mood_baseline": "Building's emotional character OR null",
      "palette_bias": "Building's color scheme OR null",
      "soundscape_base": "Sounds around building OR null",
      "flora_base": "Plants around building OR null",
      "fauna_base": "Wildlife near building OR null"
    }
  },` : ''}
  ${includesRegion ? `"region": {
    "name": "Region Name",
    "description": "2-3 sentences about this region/district",
    
    // Structural fields
    "navigableElements": [],
    "dominantElements": ["Regional landmarks"],
    "uniqueIdentifiers": ["Distinctive regional features"],
    "searchDesc": "75-100 char description",
    "slug": "kebab-case-name",
    
    // DNA - can be sparse (null values inherit from host)
    "dna": {
      // Scene fields (ALWAYS populated)
      "looks": "Regional visual character",
      "colorsAndLighting": "Regional lighting and colors",
      "atmosphere": "Regional atmosphere and climate",
      "materials": "Common materials in this region",
      "mood": "Regional emotional tone",
      "sounds": "Regional ambient sounds",
      "spatialLayout": "Regional layout and density",
      "primary_surfaces": "Common regional surfaces",
      "secondary_surfaces": "Secondary regional materials",
      "accent_features": "Regional decorative elements",
      "dominant": "Regional dominant colors",
      "secondary": "Regional secondary colors",
      "accent": "Regional accent colors",
      "ambient": "Regional light quality",
      
      // Cascading fields (SPARSE - null if same as host)
      "genre": null,
      "architectural_tone": "Regional architectural style OR null",
      "cultural_tone": "Regional culture/identity OR null",
      "materials_base": "Regional material preferences OR null",
      "mood_baseline": "Regional mood OR null",
      "palette_bias": "Regional color preferences OR null",
      "soundscape_base": "Regional soundscape OR null",
      "flora_base": "Regional vegetation OR null",
      "fauna_base": "Regional wildlife OR null"
    }
  },` : ''}
  ${includesHost ? `"host": {
    "name": "Host Name",
    "description": "2-3 sentences about this world/city",
    
    // Structural fields
    "navigableElements": [],
    "dominantElements": ["World-level landmarks"],
    "uniqueIdentifiers": ["Distinctive world features"],
    "searchDesc": "75-100 char description",
    "slug": "kebab-case-name",
    
    // DNA - FULLY populated (this is the root)
    "dna": {
      // Scene fields
      "looks": "World-level visual character",
      "colorsAndLighting": "World lighting and colors",
      "atmosphere": "World atmosphere and climate",
      "materials": "World material palette",
      "mood": "World emotional tone",
      "sounds": "World ambient sounds",
      "spatialLayout": "World spatial character",
      "primary_surfaces": "World primary materials",
      "secondary_surfaces": "World secondary materials",
      "accent_features": "World accent details",
      "dominant": "World dominant colors",
      "secondary": "World secondary colors",
      "accent": "World accent colors",
      "ambient": "World light quality",
      
      // Cascading fields (ALL populated for host)
      "genre": "The world genre that produces this kind of place",
      "architectural_tone": "World architectural style (abstracted from deepest node)",
      "cultural_tone": "World cultural identity",
      "materials_base": "World material aesthetic",
      "mood_baseline": "World emotional baseline",
      "palette_bias": "World color aesthetic",
      "soundscape_base": "World sound character",
      "flora_base": "World vegetation types",
      "fauna_base": "World wildlife types"
    }
  }` : ''}
}

CRITICAL GUIDELINES:

1. **WORK BACKWARDS FROM DEEPEST NODE**
   - The deepest node's DNA is the SPECIFIC instance
   - Parent DNA should be the GENERAL style that could produce it
   - Don't contradict the deepest node - abstract from it

2. **SPARSE CASCADING FIELDS**
   - Scene fields: ALWAYS populated for all nodes
   - Cascading fields: Set to null if they would be the same as the parent
   - Only override cascading fields if this level is DISTINCTLY different
   - Host MUST have all cascading fields populated (it's the root)

3. **GENRE ONLY IN HOST**
   - Only the host node sets genre
   - All other nodes: "genre": null

4. **COHERENCE IS KEY**
   - Parent DNA must be coherent with the deepest node
   - If deepest is "cyberpunk neon bar" → Host genre could be "cyberpunk" or "sci-fi noir"
   - If deepest is "medieval tavern" → Host genre could be "fantasy" or "historical"

5. **OUTPUT FORMAT**
   - Pure JSON only - no markdown fences, no comments
   - Only include the nodes that need generation (skip what's not needed)

Generate parent chain DNA now:`;
}

/**
 * Build a summary of the deepest node's DNA for reference
 */
function buildDNASummary(dna: any): string {
  if (!dna) return 'No DNA available';
  
  const parts: string[] = [];
  
  // Key visual fields
  if (dna.looks) parts.push(`Looks: ${dna.looks}`);
  if (dna.materials) parts.push(`Materials: ${dna.materials}`);
  if (dna.colorsAndLighting) parts.push(`Colors/Lighting: ${dna.colorsAndLighting}`);
  if (dna.atmosphere) parts.push(`Atmosphere: ${dna.atmosphere}`);
  if (dna.mood) parts.push(`Mood: ${dna.mood}`);
  
  // Key cascading fields
  if (dna.architectural_tone) parts.push(`Architectural Tone: ${dna.architectural_tone}`);
  if (dna.cultural_tone) parts.push(`Cultural Tone: ${dna.cultural_tone}`);
  if (dna.palette_bias) parts.push(`Palette Bias: ${dna.palette_bias}`);
  if (dna.materials_base) parts.push(`Materials Base: ${dna.materials_base}`);
  
  // Color palette
  if (dna.dominant) parts.push(`Dominant Color: ${dna.dominant}`);
  if (dna.secondary) parts.push(`Secondary Color: ${dna.secondary}`);
  if (dna.accent) parts.push(`Accent Color: ${dna.accent}`);
  
  return parts.join('\n');
}
