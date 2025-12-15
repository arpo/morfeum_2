# Active Context

## Recent Changes (2025-12-15)

### DNA & Prompt Optimization (Dec 15, Latest)

#### Goal: Reduce Pipeline Execution Time
- Investigated DNA structure size and prompt verbosity to reduce tokens and speed up pipelines
- Target commands: `NEW_WORLD`, `GOTO`, `GO_INSIDE`

#### DNA Structure Optimization
- **Removed redundant fields from dnaSchema.ts:**
  - `materials_base` (duplicates `materials`)
  - `mood_baseline` (duplicates `mood`)
  - `soundscape_base` (duplicates `sounds`)
- **Skip structural fields for Host/Region:**
  - `navigableElements`, `dominantElements`, `uniqueIdentifiers` only for location/niche (not needed at city/district level)
- **Fixed structure duplication in builder.ts:**
  - Structural fields now stored at node ROOT level only, not in structure object

#### Prompt Verbosity Optimization (Major Speed Win)
Reduced all prompt files significantly:

| File | Before | After | Reduction |
|------|--------|-------|-----------|
| `deepestNodeDNA.ts` | ~85 lines | ~75 lines | ~12% |
| `parentChainDNA.ts` | ~290 lines | ~110 lines | **~62%** |
| `structureAnalysis.ts` | ~250 lines | ~90 lines | **~64%** |
| `nodeDNAGeneration.ts` | ~170 lines | ~75 lines | **~56%** |

**Key optimizations:**
- Removed ASCII box diagrams and long explanations
- Condensed repeated form inheritance rules (3x → 1x)
- Removed markdown tables, replaced with compact rule lists
- Used compact JSON templates instead of verbose field descriptions

#### Results
- **NEW_WORLD pipeline: 24.25s → 19.97s** (~4.28s faster, 17.6% improvement)
- Parent DNA Generation: 9.90s → 5.24s (**47% faster** - biggest win from parentChainDNA.ts optimization)
- GO_INSIDE/GOTO expected to see similar improvements

### Pipeline Optimization & Prompt Enhancer (Dec 15)

#### Removed NavigableElements/Furnishing from Pipeline LLM
- **Goal**: Make pipelines faster and cheaper by removing LLM-generated navigableElements and furnishing
- **Change**: These are now user-controlled via the Prompt Enhancer
- **Implementation**:
  - Removed `navigableElements` and `furnishing` generation from `structureAnalysis.ts`
  - Removed `includeFurnishing` parameter from `structureAnalyzer.ts`
  - Updated `createNodePipeline.ts` to accept parsed enhancements from command
  - Deleted `furnishingInstructions.ts` (content moved to enhancer template)

#### New Prompt Enhancer Feature
- **Purpose**: User clicks Enhance button to get AI-suggested navigable elements and furnishing
- **Frontend**:
  - Added `handleEnhance()` and `canEnhance()` to `useNavigationLogic.ts`
  - Added Enhance button (sparkles icon) in `SpawnInputBar.tsx`
  - Added `IconSparkles` to icons index
- **Backend**:
  - Created `promptEnhancer.ts` service
  - Created `enhancerPromptTemplate.ts` with saved prompt text
  - Added `POST /api/mzoo/navigation/enhance-prompt` endpoint
  - Created `enhancementParser.ts` to parse "navigable elements:", "furnish:", "facade:" from commands

## Current Focus

- Prompt optimization complete for all pipelines
- Interior surfaces properly transform from facade materials
- User can override any surface with explicit command text

## Key Files Modified (DNA/Prompt Optimization)

- `packages/backend/src/engine/generation/prompts/shared/dnaSchema.ts` - Removed redundant fields
- `packages/backend/src/engine/hierarchyAnalysis/types.ts` - Updated NodeDNA interface
- `packages/backend/src/engine/generation/prompts/locations/deepestNodeDNA.ts` - Optimized
- `packages/backend/src/engine/generation/prompts/locations/parentChainDNA.ts` - Major optimization
- `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts` - Major optimization
- `packages/backend/src/engine/generation/prompts/locations/nodeDNAGeneration.ts` - Major optimization
- `packages/backend/src/services/worldTree/builder.ts` - Fixed duplication

## Next Steps

- Test GO_INSIDE/GOTO with optimized prompts to measure time improvement
- Implement `/SCENE_IMAGE` command for generating new images of existing characters
- Further optimization: Consider combining DNA LLM calls into single request
