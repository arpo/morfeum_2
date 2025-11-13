# Shared Generation Modules

This directory contains reusable modules for location node generation, used across the navigation and spawn systems.

## Modules

### `imagePromptGeneration.ts`
Generates LLM prompts for creating images for different node types.

**Exports:**
- `generateImagePromptForNode(context, intent, decision, apiKey, options?)` - Generate image prompt using LLM
- `ImagePromptOptions` - Optional configuration (nodeType)

**Features:**
- Supports multiple node types: niche, feature, detail, location
- Uses appropriate prompt templates per type
- Extensible for new intent-specific prompts

**Usage:**
```typescript
import { generateImagePromptForNode } from './shared/imagePromptGeneration';

const imagePrompt = await generateImagePromptForNode(
  context,
  intent,
  decision,
  apiKey,
  { nodeType: 'niche' }
);
```

### `imageGeneration.ts`
Centralized image generation for all location nodes.

**Exports:**
- `generateLocationImage(apiKey, imagePrompt, options?)` - Generate FLUX images with consistent error handling
- `ImageGenerationResult` - Return type with imageUrl and imagePrompt
- `ImageGenerationOptions` - Optional configuration (aspectRatio, numImages, safetyFilter)

**Features:**
- Automatic prompt fixes via `generalPromptFix`
- Consistent error handling
- Configurable aspect ratios and safety filters

**Usage:**
```typescript
import { generateLocationImage } from './shared/imageGeneration';

const { imageUrl, imagePrompt } = await generateLocationImage(
  apiKey,
  rawPrompt,
  { aspectRatio: 'landscape_16_9' }
);
```

### `nodeDNAGenerator.ts` (in hierarchyAnalysis/)
Centralized DNA generation for location nodes.

**Exports:**
- `generateNodeDNA(apiKey, originalPrompt, nodeName, nodeType, nodeDescription, parentContext?)` - Generate DNA for any node type
- `extractParentContext(parentDNA)` - Extract parent context for inheritance

**Features:**
- Works for any layer type (host, region, location, niche)
- Centralized JSON parsing via `parseJSON` utility
- Parent context inheritance support

**Usage:**
```typescript
import { generateNodeDNA, extractParentContext } from '../../hierarchyAnalysis/nodeDNAGenerator';

const parentContext = extractParentContext(currentNode.dna);
const dna = await generateNodeDNA(
  apiKey,
  imagePrompt,
  nodeName,
  'niche',
  imagePrompt,
  parentContext
);
```

### `nodeBuilder.ts`
Standardized node construction with consistent structure.

**Exports:**
- `buildNode(type, name, dna, imageUrl, options?)` - Build complete node object
- `LocationNode` - Node interface
- `LayerType` - Type union for node types
- `FocusConfig` - Focus configuration interface

**Features:**
- Automatic unique ID generation
- Default focus configuration based on node type
- Optional fields (parentId, description, data)
- Type-safe node construction

**Usage:**
```typescript
import { buildNode } from './shared/nodeBuilder';

const node = buildNode('niche', nodeName, dna, imageUrl, {
  parentId: parentNode.id,
  description: 'Custom description'
});
```

## Benefits

✅ **No Duplication** - Single source of truth for each operation
✅ **Consistent Behavior** - All intents use same logic
✅ **Easy to Extend** - Add features in one place
✅ **Type-Safe** - Full TypeScript support
✅ **Well-Tested** - Centralized testing surface

## Usage in Navigation Intents

When implementing new navigation intents that need to create nodes:

1. Use `generateLocationImage()` for image generation
2. Use `generateNodeDNA()` for DNA generation
3. Use `buildNode()` for node construction
4. See `createNicheNodePipeline.ts` for complete example

## Phase 2 Additions

**New in Phase 2:**
- `imagePromptGeneration.ts` - Shared module for generating image prompts
- `createLocationNodePipeline.ts` - Renamed and generalized from createNicheNodePipeline
- Generic pipeline supports any navigation node type (niche, feature, detail, location)
- Easy to implement new intents: just call the pipeline with appropriate options

**Example - Implementing a new intent:**
```typescript
// Any intent handler can now create nodes easily:
import { runCreateLocationNodePipeline } from '../pipelines/createLocationNodePipeline';

export async function handleExploreFeature(intent, context, apiKey) {
  const result = await runCreateLocationNodePipeline(
    decision,
    context, 
    intent,
    apiKey,
    { nodeType: 'feature' }  // Specify the node type
  );
  
  return {
    action: 'create_node',
    node: result.node,
    reasoning: 'Created feature node'
  };
}
```

## Migration Notes

**Before Phase 1 Cleanup:**
- DNA generation duplicated in `createNicheNodePipeline.ts` (~50 lines)
- Image generation logic scattered across multiple files
- Node construction inconsistent

**After Phase 1 Cleanup:**
- All DNA generation uses centralized `generateNodeDNA()`
- All image generation uses `generateLocationImage()`
- All node construction uses `buildNode()`
- ~70 lines of duplicate code removed
- Consistent patterns ready for all 12 navigation intents
