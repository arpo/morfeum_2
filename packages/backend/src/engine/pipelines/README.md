# Pipeline Architecture

This directory contains the main pipelines for entity generation in Morfeum.

## Overview

Pipelines orchestrate multi-step generation processes with real-time progress updates via Server-Sent Events (SSE). Each pipeline uses a `PipelineHelper` to manage progress tracking and SSE communication.

## Pipelines

### 1. `nodeCreationPipeline.ts` - Location/World Tree Creation

The main pipeline for creating world hierarchies from user prompts. Supports two flows:

#### Exterior Flow (Default)
For prompts like "Victorian London street" that describe exterior locations.

```
Steps (6 total - worldTree pipeline type):
1. hierarchy_classification - Parse prompt, detect depth
2. deepest_dna_generation - Generate DNA for deepest node
3. image_prompt_generation - Create FLUX image description
4. image_generation - Generate image (parallel with parent DNA)
5. parent_dna_generation - Generate DNA for parent nodes
6. tree_building - Build WorldTree structure
```

#### Interior Flow
For prompts like "Inside a Victorian pub" that describe interior spaces (niches).

```
Steps (8 total - worldTreeInterior pipeline type):
1. hierarchy_classification - Parse prompt, detect interior/niche
2. location_dna_generation - Generate DNA for exterior location
3. parent_dna_generation - Generate DNA for host/region
4. tree_building - Build exterior tree (no image)
5. space_analysis - Analyze interior space structure
6. image_prompt - Generate interior image prompt
7. image_generation - Generate interior image
8. node_building - Build niche node and attach to tree
```

### How Interior Detection Works

The pipeline uses a **dynamic configuration update** approach:

1. **Initial State**: Route sends HTTP response immediately with default `worldTree` config (6 steps)
2. **Detection**: Pipeline's first stage (`hierarchy_classification`) detects if prompt describes an interior
3. **Config Update**: If interior detected, pipeline sends SSE event with updated config:
   ```javascript
   helper.updatePipelineConfig('worldTreeInterior', 'Interior detected...');
   ```
4. **Frontend Updates**: Frontend receives new `pipelineType` and `steps` array, updates progress bar

This approach ensures:
- **Instant UI feedback** (no blocking for pre-flight detection)
- **Smooth progress bar** (correct step count from detection point)
- **Single progress bar** (no mid-stream switching confusion)

### Sub-Pipeline Pattern

When the interior flow runs the niche creation via `createNodePipeline`:

```javascript
const nicheResult = await runCreateLocationNodePipeline(
  decision, context, intent, apiKey,
  {
    nodeType: 'niche',
    generateImage: true,
    perspective: 'interior',
    isSubPipeline: true,  // KEY: Suppresses started/completed events
  },
  spawnId
);
```

The `isSubPipeline: true` flag prevents the inner pipeline from:
- Creating its own `PipelineHelper`
- Sending `started()` event (would create duplicate progress bar)
- Sending `completed()` event (would close SSE prematurely)

The parent pipeline handles all SSE events.

### 2. `characterPipeline.ts` - Character Generation

Generates character entities with visual traits and backgrounds.

```
Steps (5 total - character pipeline type):
1. Trait generation
2. Visual description
3. Image generation
4. Profile building
5. Final assembly
```

### 3. `worldTreePipeline.ts` - Legacy Pipeline

Original world tree pipeline (deprecated, use `nodeCreationPipeline` instead).

## Shared Components

### `shared/pipelineConfig.ts`

Defines pipeline types and their step configurations:

```typescript
export type PipelineType = 
  | 'worldTree'           // 6 steps - exterior locations
  | 'worldTreeInterior'   // 8 steps - interior locations (niches)
  | 'character'           // 5 steps - characters
  | 'navigation'          // 4 steps - navigation commands
  | 'navigationGoto'      // 5 steps - GOTO navigation
  | 'hierarchy';          // Dynamic - full hierarchy creation
```

### `shared/pipelineHelpers.ts`

The `PipelineHelper` class manages:
- **SSE events**: `started()`, `startStage()`, `completeStage()`, `completed()`, `error()`, `cancelled()`
- **Timing**: Records duration for each stage
- **Dynamic config**: `updatePipelineConfig(newType, message)` for mid-stream updates

## SSE Event Flow

```
Backend                          Frontend
   |                                |
   |-- HTTP Response (spawnId) ---->|  (Creates spawn entry, shows progress bar)
   |                                |
   |-- SSE: progress (started) ---->|  (Progress at 0%)
   |                                |
   |-- SSE: progress (stage1) ----->|  (Updates step index)
   |-- SSE: progress (stage1_complete) ->|
   |                                |
   |-- SSE: progress (config_update) ->|  (If interior: updates steps array)
   |                                |
   |    ... more stages ...         |
   |                                |
   |-- SSE: completed (worldTree) ->|  (Saves tree, closes connection)
```

## Adding a New Pipeline

1. Create pipeline file in `packages/backend/src/engine/pipelines/`
2. Add pipeline type to `pipelineConfig.ts` with step definitions
3. Use `PipelineHelper` for SSE management:
   ```typescript
   const helper = new PipelineHelper(spawnId, 'MyPipeline', 'myPipelineType');
   helper.started('Starting...');
   helper.startStage('step1', 'Doing step 1...');
   // ... work ...
   helper.completeStage('step1', 'Step 1 done', { data });
   helper.completed('Done!', { result });
   ```

## Key Design Principles

1. **DNA-First**: Generate DNA before image for richer visual descriptions
2. **Parallel Operations**: Image generation runs parallel with parent DNA
3. **Dynamic Config**: Pipeline type can change mid-stream without blocking
4. **Sub-Pipeline Pattern**: Use `isSubPipeline: true` for nested pipelines
5. **Instant Response**: Never block HTTP response for LLM calls
