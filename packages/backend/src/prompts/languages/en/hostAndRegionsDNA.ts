/**
 * Host and Regions DNA Batch Generation Prompt
 * 
 * Generates DNA for a Host world and all its Regions in a single LLM call
 * Returns full DNA for Host and sparse DNA for Regions (only overrides)
 * 
 * @param originalPrompt - Original user input
 * @param hostName - Name of the host world
 * @param hostDescription - Description of the host world
 * @param regions - Array of regions with name and description
 * @returns Prompt string for LLM
 */
export function hostAndRegionsDNA(
  originalPrompt: string,
  hostName: string,
  hostDescription: string,
  regions: Array<{ name: string; description: string }>
): string {
  return `Generate DNA for a Host world and all its Regions in one batch.

OBJECTIVE: Create complete DNA for the Host, and sparse override DNA for each Region.

USER INPUT:
${originalPrompt}

HOST:
Name: ${hostName}
Description: ${hostDescription}

REGIONS:
${regions.map(r => `- ${r.name}: ${r.description}`).join('\n')}

OUTPUT STRUCTURE:

{
  "host": {
    // FULL DNA - all 22 fields populated
    "looks": "...",
    "colorsAndLighting": "...",
    "atmosphere": "...",
    "architectural_tone": "...",
    "cultural_tone": "...",
    "materials": "...",
    "mood": "...",
    "sounds": "...",
    "dominantElementsDescriptors": "...",
    "spatialLayout": "...",
    "primary_surfaces": "...",
    "secondary_surfaces": "...",
    "accent_features": "...",
    "dominant": "...",
    "secondary": "...",
    "accent": "...",
    "ambient": "...",
    "uniqueIdentifiers": [...],
    "searchDesc": "..."
  },
  "regions": [
    {
      "name": "Region Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from Host
        // Set to null for fields that should inherit from Host
        "architectural_tone": "different style" or null,
        "cultural_tone": "different culture" or null,
        "looks": null,  // inherits from host
        "atmosphere": null,  // inherits from host
        // ... other fields null if inheriting
      }
    }
  ]
}

CRITICAL GUIDELINES:

1. **Host DNA**: Generate ALL 22 fields with complete descriptions
2. **Region DNA**: ONLY populate fields that are DIFFERENT from Host
   - If a region has same atmosphere as host → null
   - If a region has different architectural style → populate
   - If a region has unique cultural vibe → populate
3. **Inheritance**: Null values mean "inherit from parent"
4. **Clarity**: Make it obvious what makes each region unique
5. **Output**: Flat JSON only, no markdown or comments

Generate now:`;
}
