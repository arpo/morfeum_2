# Active Context

## 2025-12-17

- Updated all prompt pipelines to use shared `DOMINANT_ELEMENTS_RULES` and `NAVIGABLE_ELEMENTS_RULES` for `dominantElements` and `navigableElements` fields.
- dominantElements format improved:
  - Now uses explicit field labels: `shape=`, `scale=`, `style=`, `surfaces=`, `light=`
  - SHAPE vocabulary added: rectangular, cylindrical, domed, organic, irregular, pyramidal, modular, tiered, sprawling, compact
  - Removed `interior|exterior|open-air` field
  - Combined floor/walls into `surfaces`
  - Style can be combined with shape (e.g., `rectangular-industrial`)
- Clarified that:
  - `dominantElements` is for GO_INSIDE (enterable structures, seed for interior, main scene target)
  - `navigableElements` is for GOTO (elements used for navigation, e.g. doors, passages)
- Refactored all DNA/prompt files to import these rules from a single source of truth.
- TypeScript build verified clean after changes.
## Recent Changes (2025-12-16)

### GOTO DNA Resolution Fix & Code Cleanup (Dec 16, Latest)

#### Problem: GOTO Creating Generic Locations
When using `/GOTO the playground` from a location within "The Ethereal Gardens", the new location got generic styling instead of inheriting the ethereal/crystalline aesthetic.

#### Root Cause
The `findParentRegionNode()` helper was trying to extract DNA from `context.parentNode` passed from frontend, but the context object doesn't include full ancestry chain with resolved DNA. The region's DNA was often empty or missing.

**Incorrect Pattern:**
```typescript
const { parentRegionDNA } = findParentRegionNode(context);
// Returns empty DNA because context doesn't have full tree
```

**Correct Pattern (from fundamentals.md):**
```typescript
// Load worldsData, then resolve DNA from actual nodes
const worldsData = await storageService.loadWorlds();
const regionNode = worldsData.nodes[regionId];
// For pass-through regions, get host DNA
const hostNode = findHostForRegion(regionId, worldsData.worldTrees, worldsData.nodes);
```

#### Solution: Pre-resolve DNA in Route Handler
Updated `navigation.ts` to resolve DNA before calling pipeline:
1. **Load worldsData** before running pipeline
2. **Resolve parent DNA properly**:
   - GOTO from location → Get region DNA, or host DNA if region is pass-through
   - GOTO from niche → Get location DNA
3. **Pass `resolvedParentDNA`** via CreateNodeOptions to pipeline
4. **Pipeline uses resolved DNA** if available (falls back to context-based resolution)

#### Code Cleanup: Shared Utility Functions
Extracted duplicated functions to `navigationHelpers.ts`:

**`findHostForRegion(regionId, worldTrees, nodes)`**
- Traverses worldTrees to find the host node for a given region
- Used for pass-through regions to get DNA from the host

**`addChildToWorldTree(tree, targetId, childEntry)`**
- Recursively adds a child entry under a target parent
- Was previously duplicated in 2 places (GOTO handler, create-node handler)

#### Documentation Added
- Clear header in `navigationHelpers.ts` explaining DNA resolution architecture
- Notes that `findParent*Node` returns IDs from context only
- Documents that proper cascaded DNA resolution happens in route handler

#### Files Modified
- `packages/backend/src/routes/mzoo/navigation.ts` - Pre-resolve DNA for GOTO, use shared functions
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts` - Accept and use `resolvedParentDNA`
- `packages/backend/src/engine/navigation/navigationHelpers.ts` - Added shared utility functions with docs

### Exterior Scenes & Perspective Flags (Dec 16)

#### Problem Solved: --exterior Flag Not Working
When using `GO_INSIDE glowing sculpture area --exterior`, niches were still getting `spaceType: "interior"` due to:
1. **Frontend flag stripping**: `commandParser.ts` was silently dropping any flags starting with `--` that weren't explicitly handled
2. **Missing flag definitions**: Only `--view`, `--noview`, `--bgtask`, and `--furnish` were defined in `COMMAND_FLAGS`
3. **No reconstruction**: Frontend was reconstructing `--furnish` flag but not perspective flags

#### Root Cause Investigation
- Added debug logging to trace perspective flow from frontend → backend → structure analyzer
- Found `perspectiveOverride: undefined` in frontend parsing (flag was being dropped)
- Backend `enhancementParser.ts` worked correctly but never received the flags
- Frontend command parsing had logic gap for perspective flags

#### Fix Implementation
**Backend Changes:**
- `config/navigation.ts` - Added perspective flags to `COMMAND_FLAGS`:
  - `INTERIOR: '--interior'`, `EXTERIOR: '--exterior'`, `OPEN_AIR: '--open-air'`
- `structureAnalyzer.ts` - Enhanced with perspective override logic:
  ```typescript
  if (perspective && perspective !== result.perspective) {
    result.perspective = perspective;
    if (perspective === 'exterior' || perspective === 'open-air') {
      result.structure.roofType = 'open-sky';
    }
  }
  ```

**Frontend Changes:**
- `commandParser.ts` - Added `perspectiveOverride` to `ParsedCommand.flags` interface and parsing logic
- `navigationCommands.ts` - Added perspective flag reconstruction for API calls

#### Cleanup: Removed Unused --furnish Flag
- `--furnish` flag replaced by prompt enhancer with `furnish:` syntax
- Removed from: `navigationCommands.ts`, `commandParser.ts`, `config/navigation.ts`
- Added explanatory comments about replacement

#### Result
Users now have full control over scene perspective:
```bash
/GO_INSIDE sculpture area --exterior   # → spaceType: "exterior", roofType: "open-sky"
/GO_INSIDE reading corner --interior   # → spaceType: "interior"  
/GOTO courtyard --open-air            # → spaceType: "open-air", roofType: "open-sky"
```

#### Files Modified
- `packages/backend/src/config/navigation.ts` - Added perspective flags, removed FURNISH
- `packages/backend/src/engine/navigation/analyzers/structureAnalyzer.ts` - Perspective override logic
- `packages/frontend/src/features/spawn-input/SpawnInputBar/commandParser.ts` - Perspective flag parsing
- `packages/frontend/src/features/spawn-input/SpawnInputBar/navigationCommands.ts` - Flag reconstruction

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

### GO_INSIDE & Prompt Enhancer Improvements (Dec 15, Latest)

#### Combined Entrance Target
- **Problem**: GO_INSIDE needed both the structure name AND the entrance
- **Fix**: `findEntrance()` now combines `dominantElements[0]` + `navigableElements[0]`
- **Result**: `"the Lumina Arbor's spherical canopy via a small, rectangular door at the base of the trunk"`

#### DNA Prompts - Ordering Instructions
- All 4 DNA prompts now include:
  - `dominantElements`: "FIRST: main enterable structure if any, then 3-4 other major features"
  - `navigableElements`: "FIRST navigableElement = MAIN ENTRANCE for GO_INSIDE"
- **Files**: `locationDNA.ts`, `deepestNodeDNA.ts`, `nodeDNAGeneration.ts`, `structureAnalysis.ts`

#### Contextual Prompt Enhancer
- **Problem**: Enhancer focused on existing structure even when user specified destination (e.g., "a roof top bar")
- **Fix**: Made enhancer contextual based on `destinationText` presence:
  - If destination provided: Focus on that space, use location style as context only
  - If empty: Use existing structure/entrance as target
- **Example**: `GO_INSIDE a roof top bar` → Suggests bar furnishing matching location's arboreal style

#### Prompt Enhancer - dominantElements Context
- Added `dominantElements` to enhancer context (interface, template, route)
- Enhancer now shows main structure and main entrance to LLM

## Current Focus

- Prompt optimization complete for all pipelines
- Interior surfaces properly transform from facade materials
- User can override any surface with explicit command text
- GO_INSIDE now uses dominantElements[0] as target (main structure name)

## Key Files Modified (GO_INSIDE & dominantElements)

- `packages/backend/src/engine/navigation/handlers/basicMovement.ts` - findEntrance() uses dominantElements[0]
- `packages/backend/src/services/mzoo/promptEnhancer.ts` - Added navigableElements to input interface
- `packages/backend/src/engine/generation/prompts/enhancer/enhancerPromptTemplate.ts` - Shows existing entrances
- `packages/backend/src/routes/mzoo/navigation.ts` - Passes navigableElements to enhancer
- `packages/backend/src/engine/nodeCreation/prompts/dna/locationDNA.ts` - dominantElements ordering
- `packages/backend/src/engine/generation/prompts/locations/deepestNodeDNA.ts` - dominantElements ordering
- `packages/backend/src/engine/generation/prompts/locations/nodeDNAGeneration.ts` - dominantElements ordering
- `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts` - dominantElements ordering

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
