# Environment DNA Specification

## Overview

`environmentDNA` is a formatted string that provides LLM prompts with rich context about a location/environment. This enables character generation that creates characters who feel like genuine inhabitants of their environment.

## Purpose

When generating characters, the LLM needs to understand:
1. **For "unreal" characters**: What materials, textures, and environmental elements should shape the character's appearance (70% human, 30% environment)
2. **For "real" characters**: What clothing, accessories, and physical traits are appropriate for someone living in this environment

## Data Sources

The environment DNA is built from two sources:

### 1. Node Data (Current Location)
- `name` - The place name
- `description` - Brief overview
- `spaceType` - "interior" or "exterior"
- `dominantElements` - Key visual features
- `uniqueIdentifiers` - Distinctive elements

### 2. Merged DNA (Inherited Properties)
Cascaded from the hierarchy (Host → Region → Location → Niche):
- Visual fields: `looks`, `materials`, `colorsAndLighting`, `atmosphere`, `mood`
- Style attributes: `genre`, `architectural_tone`, `cultural_tone`, `materials_base`, `mood_baseline`, `palette_bias`

## Output Format

The `buildEnvironmentDNA()` function produces a structured string:

```
ENVIRONMENT: The Little Red House Kitchen
TYPE: interior
GENRE: Rural

DESCRIPTION:
This is the kitchen of a humble dwelling...

VISUAL DESCRIPTION:
This space is a functional kitchen, adhering to the exterior's cottage form...

MATERIALS:
The walls are covered in white wallpaper with a textured finish...

COLORS & LIGHTING:
The primary color is the white of the wallpaper, accented by subtle flower colors...

ATMOSPHERE:
The air is clean and smells faintly of cooking spices...

MOOD:
Evokes a feeling of warm, inviting domesticity...

STYLE CONTEXT:
- Architectural: Simple country cottage with a traditional pitched roof
- Cultural: Residential, humble dwelling, evokes rural life
- Materials: Wood and shingles
- Baseline Mood: Peaceful, cozy, nostalgic
- Color Palette: Warm reds and natural greens

KEY ELEMENTS:
- white floral wallpaper
- wooden siding walls
- natural light source
```

## API Reference

### Functions

```typescript
import { 
  buildEnvironmentDNA, 
  buildCompactEnvironmentDNA, 
  extractEnvironmentDNAInput 
} from '@/engine/generation/prompts/characters';
```

#### `buildEnvironmentDNA(node, mergedDNA?)`

Builds a full environment DNA string with all sections.

```typescript
const environmentDNA = buildEnvironmentDNA(
  {
    name: node.name,
    description: node.description,
    spaceType: node.spaceType,
    dna: node.dna,
    dominantElements: node.dominantElements,
    uniqueIdentifiers: node.uniqueIdentifiers,
  },
  mergedDNA  // Optional: pre-merged DNA with inheritance
);
```

#### `buildCompactEnvironmentDNA(node, mergedDNA?)`

Builds a shorter version with only essential information.

```typescript
const compactDNA = buildCompactEnvironmentDNA(node, mergedDNA);
// Output: "Location: Kitchen (interior)\nGenre: Rural\nVisuals: ...\nMaterials: ...\nMood: ..."
```

#### `extractEnvironmentDNAInput(node)`

Extracts the relevant fields from a raw node object.

```typescript
const input = extractEnvironmentDNAInput(rawNodeFromBackend);
// Returns typed EnvironmentDNAInput object
```

### Types

```typescript
interface EnvironmentDNAInput {
  // Core identity
  name: string;
  description?: string;
  spaceType?: 'interior' | 'exterior';
  
  // Visual DNA
  looks?: string;
  materials?: string;
  colorsAndLighting?: string;
  atmosphere?: string;
  mood?: string;
  
  // Inherited style
  genre?: string;
  architectural_tone?: string;
  cultural_tone?: string;
  materials_base?: string;
  mood_baseline?: string;
  palette_bias?: string;
  
  // Structural context
  dominantElements?: string[];
  uniqueIdentifiers?: string[];
}
```

## Usage in Character Generation

### Example: Unreal Character

```typescript
const environmentDNA = buildEnvironmentDNA(currentNode, mergedDNA);

const prompt = characterPromptEngineeringUnreal(
  "Create a guardian of this place",
  environmentDNA
);

// The LLM will create a character with:
// - 70% human silhouette
// - 30% environment/materials (e.g., "skin of white porcelain with delicate floral patterns")
// - Inner glow or mechanism
// - Materials matching the kitchen's wood and ceramic
```

### Example: Real Character

```typescript
const environmentDNA = buildEnvironmentDNA(currentNode, mergedDNA);

const prompt = characterPromptEngineeringReal(
  "Create a person who lives here",
  environmentDNA
);

// The LLM will create a character with:
// - Realistic human proportions
// - Clothing appropriate for rural cottage life
// - Accessories that fit the domestic setting
// - Physical traits reflecting peaceful, rural lifestyle
```

## Field Priority

When building environment DNA, fields are prioritized in this order:

1. **Always include**: name, spaceType, genre (if present)
2. **Primary visual**: looks, materials (most influence on character appearance)
3. **Secondary visual**: colorsAndLighting, atmosphere, mood
4. **Style context**: architectural_tone, cultural_tone, etc.
5. **Structural**: dominantElements, uniqueIdentifiers

## Best Practices

1. **Use merged DNA** when you want inherited style to influence character creation
2. **Use compact version** for shorter prompts or when token limits are a concern
3. **Include dominantElements** when you want character to embody specific features
4. **Exclude certain fields** by passing a filtered node object if you want more creative freedom

## Related Documentation

- [DNA System Architecture](./dna-system-architecture.md) - How DNA inheritance works
- [Node Creation System](./node-creation-system.md) - How nodes and DNA are generated
