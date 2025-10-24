/**
 * Locations and Niches DNA Batch Generation Prompt
 * 
 * Generates DNA for all Locations and Niches in a region in a single LLM call
 * Takes merged parent DNA (Host + Region) as context
 * Returns sparse DNA for Locations and Niches (only overrides)
 * 
 * @param originalPrompt - Original user input
 * @param regionName - Name of the region
 * @param mergedParentDNA - Merged DNA from Host + Region
 * @param locations - Array of locations with name, description, and optional niches
 * @returns Prompt string for LLM
 */
export function locationsAndNichesDNA(
  originalPrompt: string,
  regionName: string,
  mergedParentDNA: string,
  locations: Array<{ 
    name: string; 
    description: string; 
    niches?: Array<{ name: string; description: string }> 
  }>
): string {
  return `Generate DNA for all Locations and Niches in "${regionName}" region.

OBJECTIVE: Create sparse override DNA for each Location and Niche, given the merged parent DNA.

USER INPUT:
${originalPrompt}

PARENT DNA (MERGED HOST + REGION):
${mergedParentDNA}

LOCATIONS:
${locations.map(loc => `
- ${loc.name}: ${loc.description}
  ${loc.niches ? 'Niches:\n' + loc.niches.map(n => `  - ${n.name}: ${n.description}`).join('\n') : ''}
`).join('\n')}

OUTPUT STRUCTURE:

{
  "locations": [
    {
      "name": "Location Name",
      "dna": {
        // SPARSE DNA - only fields that DIFFER from parent
        "mood": "different mood" or null,
        "sounds": "different sounds" or null,
        "looks": null,  // inherits from parent
        // ... other fields null if inheriting
      },
      "niches": [
        {
          "name": "Niche Name",
          "dna": {
            // SPARSE DNA - only fields that DIFFER from location+parent
            "atmosphere": "intimate" or null,
            "materials": "plush velvet" or null,
            // ... other fields null if inheriting
          }
        }
      ]
    }
  ]
}

CRITICAL GUIDELINES:

1. **Sparse DNA Only**: ONLY populate fields that DIFFER from parent DNA
2. **Parent Inheritance**: The parent DNA above is already merged (Host + Region)
3. **Null = Inherit**: Set fields to null if they should inherit from parent
4. **Differentiation**: Focus on what makes each location/niche unique
5. **Consistency**: Respect parent's architectural_tone, cultural_tone, colors, mood
6. **Output**: Flat JSON only, no markdown or comments

Generate now:`;
}
