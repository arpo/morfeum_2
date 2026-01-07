# Active Context

## 2026-01-07 - Unified Image Prompt Generation & Environment Transition Rules

### Unified Image Prompt Generation - COMPLETED

Fixed issue where `/NEW_WORLD` and `GO_INSIDE` used different code paths for image prompt generation, causing environment constraints to only apply to navigation flow.

#### The Problem

When running `/NEW_WORLD pressurized dome in a Underwater sci-fi colony`:
- Generated exterior image contained terrestrial concepts like "puddles" and "wet seabed"
- The `[CRITICAL: UNDERWATER EXTERIOR VIEW]` constraint was NOT being applied
- Root cause: TWO separate code paths existed:
  - `GO_INSIDE` → Uses `imagePromptGeneration.ts` with `buildConstraints()` → ✅ Worked
  - `/NEW_WORLD` → Uses `nodeCreationPipeline.ts` with hardcoded `constraints: []` → ❌ Broken

#### Solution

Refactored `nodeCreationPipeline.ts` Stage 3 to use the unified `generateStructuredImagePrompt()` function:

**Before (broken):**
```typescript
promptStructure = {
  ...parsedFields,
  constraints: [],  // ← HARDCODED EMPTY
  negatives: []
};
```

**After (unified):**
```typescript
const promptStructure = await generateStructuredImagePrompt(apiKey, {
  dna: deepestNodeDNA.dna || {},
  userPrompt: prompt,
  nodeType: deepestInfo.type,
  perspective: 'exterior',
  parentChain,
});
```

#### Files Modified

- `packages/backend/src/engine/pipelines/nodeCreationPipeline.ts`
  - Replaced Stage 3 with `generateStructuredImagePrompt()` call
  - Removed `worldTreeImagePromptContext` import

---

### Environment Transition Rules System - COMPLETED

Created a comprehensive environment detection system for special environments.

#### Environment Types Supported

| Environment | Keywords Detected | Use Case |
|-------------|-------------------|----------|
| UNDERWATER | underwater, submerged, aquatic, oceanic, marine, deep-sea, submersible | Sci-fi underwater colonies, submarines |
| SPACE | space, orbital, asteroid, lunar, mars, cosmic, zero-g, starship | Space stations, spaceships |
| AERIAL | aerial, airborne, sky, cloud, floating, airship, zeppelin | Cloud cities, airships |
| SUBTERRANEAN | subterranean, cave, cavern, underground, tunnel, mine | Cave dwellings, mines |
| SURFACE | (default) | Normal terrestrial environments |

#### Two Constraint Types

**Interior Constraints** - What's visible through windows/viewports:
- Underwater: "oceanic murk, deep-sea creatures, water particles, bioluminescence"
- Space: "star field, nebula glow, cosmic void, distant planets"

**Exterior Constraints** - The viewer is IN the environment:
- Underwater: "NO puddles, NO wet surfaces, NO dampness - everything ALREADY underwater"
- Space: "NO atmosphere, NO sky gradients, only cosmic void"

#### Key Functions

```typescript
import { 
  detectEnvironmentFromDNA,           // Returns environment type
  getEnvironmentViewportConstraint,   // Interior view constraints
  getEnvironmentExteriorConstraint    // Exterior view constraints
} from './environmentTransitionRules';
```

#### Files Created/Modified

- `packages/backend/src/engine/generation/prompts/shared/environmentTransitionRules.ts`
  - `detectEnvironmentFromDNA()` - Checks parentDNA, surroundingsDNA, currentDNA for keywords
  - `getEnvironmentViewportConstraint()` - Returns interior constraint
  - `getEnvironmentExteriorConstraint()` - Returns exterior constraint
  - `ENVIRONMENT_VIEWPORT_CONSTRAINTS` - Interior constraint definitions
  - `ENVIRONMENT_EXTERIOR_CONSTRAINTS` - Exterior constraint definitions

- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`
  - Updated `buildConstraints()` to call environment detection
  - Passes current node's DNA (for NEW_WORLD with no parent)

---

### Dead Code Cleanup - COMPLETED

Removed unused code after unification:

| Deleted | Reason |
|---------|--------|
| `worldTreePipeline.ts` | Never called anywhere (dead code) |
| `prompts/locations/worldTree/` directory | Only used by dead pipeline |
| `pipelines/worldTree/` directory | Helper files for dead pipeline |
| `generateBatchDNA` export | Deprecated function, never used |

#### Files Updated

- `prompts/locations/index.ts` - Removed worldTree exports
- `hierarchyAnalysis/index.ts` - Removed generateBatchDNA export
- `PROMPT_INDEX.md` - Updated documentation to reflect unified function

---

## Key Architectural Principle Established

**Single Image Prompt Generation Path**

Both `/NEW_WORLD` and `GO_INSIDE` now use the same `generateStructuredImagePrompt()` function, ensuring:
- Environment constraints automatically applied to both flows
- Future environment types work for all creation flows
- No code duplication between pipelines

---

## Previous Work (Jan 5)

### Monastic Styles Added to SAME_MATERIAL Category - COMPLETED
- Fixed brick monastery generating cave-like interiors

### Reverted Hardcoded Prompt Rules - COMPLETED
- Removed building vs cave rules from generic prompts

---

## Current Focus

- ✅ **COMPLETED**: Unified image prompt generation
- ✅ **COMPLETED**: Environment transition rules system
- ✅ **COMPLETED**: Underwater exterior/interior constraints
- ✅ **COMPLETED**: Dead code cleanup
- ✅ **VERIFIED**: Underwater NEW_WORLD includes constraints

## Files Modified Today (Jan 7)

**Unification:**
- `packages/backend/src/engine/pipelines/nodeCreationPipeline.ts` - Use unified function
- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts` - Environment detection
- `packages/backend/src/engine/generation/prompts/shared/environmentTransitionRules.ts` - New system

**Cleanup (deleted):**
- `packages/backend/src/engine/pipelines/worldTreePipeline.ts`
- `packages/backend/src/engine/generation/prompts/locations/worldTree/` (directory)
- `packages/backend/src/engine/pipelines/worldTree/` (directory)

**Exports updated:**
- `packages/backend/src/engine/generation/prompts/locations/index.ts`
- `packages/backend/src/engine/hierarchyAnalysis/index.ts`
- `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md`
