# Active Context

## 2025-12-30

### Creature Mode System - COMPLETED (Latest)

Implemented `--populate` and `--people` flags for image generation to control whether locations show people/creatures.

#### Problem
Location images were always generated with `NoCreatures` filter, preventing populated scene generation even when user wanted to show people/activity.

#### Solution
1. **CreatureMode enum**: `'none' | 'allow' | 'populate'`
   - `none`: Default - adds `[FILTER: NoLivingSubjects]` (no people)
   - `allow`: Allows people but doesn't actively add them
   - `populate`: Adds `[POPULATE:]` directive for busy scenes with ambient figures

2. **Frontend flag passthrough**: Updated `commandParser.ts` to collect unrecognized `--` flags and pass them to backend

3. **Backend parsing**: `enhancementParser.ts` parses `--populate` and `--people` flags

4. **Duplicate style fix**: `imageGeneration.ts` now skips `applyMorfeumStyle` if style already applied (prevents conflicting `[POPULATE:]` + `[NoCreatures]`)

#### Files Modified
- `frontend/commandParser.ts` - Added `passthroughFlags` to collect unknown flags
- `frontend/navigationCommands.ts` - Added passthrough flags to backend request
- `backend/navigation/utils/enhancementParser.ts` - Parse `--populate`/`--people` flags
- `backend/navigation/pipelines/createNodePipeline.ts` - Extract and pass creatureMode
- `backend/navigation/pipelines/helpers/nodeBuildingStep.ts` - Use creatureMode in prompt
- `backend/generation/shared/imageGeneration.ts` - Skip duplicate style application

#### Usage
```
/GOTO market --populate   # Generates busy scene with ambient figures
/GO_INSIDE cafe --people  # Same as --populate
/GOTO park                # Default: no people (NoCreatures filter)
```

### UI: Help Tooltip for Spawn Input - COMPLETED

Added (?) button with interactive tooltip showing available command flags.

- Tooltip with all available flags and descriptions
- Clickable flags insert directly into input field
- Left-aligned text with proper styling

### Prompt Token Optimization - COMPLETED

Optimized 11 prompt files for location/navigation pipelines (NEW_WORLD, GOTO, GO_INSIDE) to reduce token usage by ~50% while maintaining output quality.

#### Problem
Prompts were verbose with redundant examples, bullet lists, and repetitive instructions consuming unnecessary tokens.

#### Solution
Applied aggressive optimization techniques:
1. **Pipe-separated values** instead of bullet lists
2. **Reduced examples** from 4 to 2 per prompt
3. **Condensed prose** to structured shorthand
4. **Removed redundant sections** (negative examples, repeated rules)
5. **Shared constants** extracted to avoid duplication
6. **Conditional field inclusion** (only include DNA fields with values)

#### Files Optimized

| File | Reduction |
|------|-----------|
| `hierarchyCategorization.ts` | 52% |
| `compositionInstructions.ts` | 60% |
| `elementRules.ts` | 50% |
| `dnaSchema.ts` | 50% |
| `deepestNodeDNA.ts` | 38% |
| `parentChainDNA.ts` | 33% |
| `contextPromptBuilder.ts` | 42% |
| `destinationAnalysis.ts` | 44% |
| `structureAnalysis.ts` | 50% |
| `intentClassifier.ts` | 33% |

#### Estimated Per-Call Savings

| Pipeline | Before | After | Savings |
|----------|--------|-------|---------|
| NEW_WORLD | ~5,500 tokens | ~2,500 tokens | **55%** |
| GOTO | ~2,000 tokens | ~1,000 tokens | **50%** |
| GO_INSIDE | ~2,500 tokens | ~1,200 tokens | **52%** |

#### Notes
- Character prompts NOT optimized (planned for later rework)
- Uses Gemini 2.5 Flash Lite (no prompt caching)
- Changes on temporary branch for easy revert if quality issues

### Previous: Immediate Surroundings for Nested Interiors - COMPLETED

Implemented system to correctly show immediate surroundings through windows for nested interior spaces (e.g., car inside museum shows museum through windows, not street).

### Previous: Space Type Registry - COMPLETED

Centralized registry for handling different container types (buildings, vehicles, boats, tents) with specialized rules per type.

## Current Focus

- ✅ **COMPLETED**: Prompt token optimization (50% reduction)
- ✅ **COMPLETED**: Immediate surroundings for nested interiors
- ✅ **COMPLETED**: Space Type Registry for vehicle/boat/tent interiors
- ✅ **COMPLETED**: Structured image prompt system (both pipelines)

## Files Modified (Dec 30 - Prompt Optimization)

**Modified Files (prompts/):**
- `locations/hierarchyCategorization.ts`
- `locations/worldTree/compositionInstructions.ts`
- `locations/worldTree/contextPromptBuilder.ts`
- `locations/deepestNodeDNA.ts`
- `locations/parentChainDNA.ts`
- `shared/elementRules.ts`
- `shared/dnaSchema.ts`
- `navigation/structureAnalysis.ts`
- `navigation/destinationAnalysis.ts`
- `navigation/intentClassifier.ts`
