# Active Context

## Recent Changes (2025-12-11)

### Open-Sky Rooftop/Terrace Fix (Dec 11 - Later)
- **Problem**: Rooftop terraces inside "cave dwellings" were generating cave roofs even when `roofType: "open-sky"` was correctly set
- **Root Cause**: 
  1. The OPEN-SKY constraint was only in the system prompt as guidance TO the LLM
  2. LLM ignored the guidance due to overwhelming "cave" references in parent DNA (`architectural_tone: "cave-dwelling"`)
  3. The constraint never appeared in the final FLUX prompt

- **Fix in `imagePromptGeneration.ts`**:
  - Append OPEN-SKY constraint **DIRECTLY to the final FLUX prompt** (not just as LLM guidance)
  ```typescript
  const isOpenSky = input.structureAnalysis?.structure?.roofType === 'open-sky';
  if (isOpenSky) {
    finalPrompt += '\n[CRITICAL: NO ROOF/CEILING - This is an OPEN-SKY outdoor space. The sky is DIRECTLY VISIBLE above. DO NOT show any cave ceiling, dome, vaulted roof, or covered structure overhead. Show natural sky, clouds, or sunset/sunrise above instead.]';
  }
  ```
  - Also added OPEN-SKY guidance in system prompt for LLM awareness
  - Uses `roofType` field from structure analysis (not string matching)

- **roofType-based constraints**:
  - `roofType === 'open-sky'` → Append open-sky constraint (terrace, balcony, rooftop)
  - `roofType !== 'open-sky'` AND `openings === 'none'` → Enclosed interior constraint

### DNA Bleeding Fix for /goto (Dec 11 - Earlier)
- **Problem**: When running `/goto` from a niche, the current niche's DNA was bleeding into the new location's image
- **Root Cause**: `findParentLocationNode()` had a fallback that returned current node's DNA as parent DNA
- **Fix in `navigationHelpers.ts`**:
  - `findParentLocationNode()` now returns `null` for `parentLocationDNA` when no valid location parent found
  - NEVER returns niche DNA as parent DNA
  - Callers must use cascaded DNA functions if parent DNA is null
- **Fix in `createNodePipeline.ts`**:
  - Added `includeCurrentNodeDNA: false` flag to image prompt generation
  - Converts null parentDNA to undefined for cleaner handling
- **Fix in `imagePromptGeneration.ts`**:
  - Added `includeCurrentNodeDNA?: boolean` option to interface (default: false)

### Interior Spawn Pipeline System (Dec 11 - Earlier)
- **Feature**: When spawning interior locations (e.g., "Inside a Victorian pub"), the system now uses a specialized two-phase approach
- **Problem Solved**: 
  1. Interior spawns were not saving worldTree (double completion events)
  2. Two progress bars appearing (inner pipeline creating separate SSE events)
  3. Generate button had no visual feedback (pre-flight detection blocking HTTP response)

- **Architecture - Dynamic Pipeline Config Update**:
  1. Route sends HTTP response immediately with default `worldTree` config (6 steps)
  2. Pipeline's first stage detects if prompt describes an interior
  3. If interior detected, sends SSE `config_update` event with `worldTreeInterior` (8 steps)
  4. Frontend updates its step count based on SSE event
  5. Single progress bar flows 0% → 100%

- **Key Implementation**:
  - `pipelineHelpers.ts`: Added `updatePipelineConfig(newPipelineType, message)` method
  - `nodeCreationPipeline.ts`: Calls `helper.updatePipelineConfig('worldTreeInterior')` when niche detected
  - `createNodePipeline.ts`: Added `isSubPipeline: true` flag to prevent nested pipelines from sending SSE events
  - `spawn.ts`: Removed blocking pre-flight detection, sends response immediately

- **Sub-Pipeline Pattern**:
  ```javascript
  const result = await runCreateLocationNodePipeline(
    decision, context, intent, apiKey,
    { isSubPipeline: true },  // Prevents helper creation, no SSE events
    spawnId
  );
  ```

- **Documentation**: Added comprehensive README at `packages/backend/src/engine/pipelines/README.md`

## Previous Changes (2025-12-10)

### Windowless/Solid Exterior System (Dec 10)
- **Issue**: Solid exterior structures (mushroom, saucer, dome, pod) were generating interiors with windows when they shouldn't
- **Root Cause**: LLM was choosing `openings: "minimal"` instead of `"none"` for solid forms
- **Fix in `structureAnalysis.ts`**:
  - Made windowless rule MUCH stricter: solid forms MUST use `openings: "none"`
  - Added explicit list: dome, mushroom, saucer, capsule, pod, sphere, organic blob
  - "minimal" now ONLY for exteriors that show SOME small openings
  - DEFAULT to "none" when in doubt about solid exteriors
- **Fix in `imagePromptGeneration.ts`**:
  - Added enclosed interior constraint when `openings: "none"`:
  ```
  [CONSTRAINT:] fully enclosed interior; no openings, holes, skylights, or gaps in the roof or ceiling unless explicitly specified; maintain intact, continuous ceiling structure
  ```
- **Other Fixes Today**:
  - Removed duplicate `applyMorfeumStyle()` call from `imagePromptGeneration.ts` (was being called twice)
  - Made material inheritance rules generic in `nodeDNAGeneration.ts` (removed specific examples)

### Pass-Through Region System (Dec 10)
- **Feature**: Generic prompts (e.g., "a building on a planet") now create pass-through regions instead of fully-generated regions
- **Purpose**: Regions should only be created when user explicitly names a known place (e.g., "Ringön in Göteborg")
- Full implementation details in progress.md

## Current Focus

- Open-sky rooftop/terrace system complete
- DNA bleeding fix for /goto complete
- Continue database migration planning (Supabase/PostgreSQL)

## Key Files Modified Today

- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts` - Open-sky constraint, includeCurrentNodeDNA option
- `packages/backend/src/engine/navigation/navigationHelpers.ts` - findParentLocationNode fix
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts` - includeCurrentNodeDNA: false

## Next Steps

- Test open-sky constraint with various rooftop/terrace prompts
- Continue database migration planning
- Consider improvements to DNA inheritance system
