# Active Context

## 2025-12-30

### Image Prompt DNA & Shape Improvements - COMPLETED (Latest)

Fixed multiple issues with how DNA information and structure shapes are passed to image generation.

#### Problem 1: Interior niches copying parent's dominantElements
When using GO_INSIDE on a structure (e.g., "whimsical house"), the interior niche incorrectly had the same dominantElements as the exterior view (the house itself as a dominant element).

**Solution:** Updated `structureAnalysis.ts` to add explicit instructions for GO_INSIDE interiors:
- Do NOT include the structure being entered as a dominant element
- dominantElements should be OBJECTS/FURNITURE/FIXTURES inside the space
- Use simple format for interiors, NOT enterable structures

#### Problem 2: Non-rectangular shapes rendered as rectangular by FLUX
Structures with `shape=organic`, `shape=round`, etc. were being rendered as rectangular buildings despite the prompt containing the shape info.

**Solution:** Added direct FLUX constraints in `imagePromptGeneration.ts`:
- New `buildShapeConstraints()` function parses dominantElements
- Appends `[CRITICAL SHAPE: ...]` constraint directly to FLUX prompt
- Bypasses LLM and tells FLUX explicitly to render curved forms
- Works for: organic, round, circular, spherical, domed, cylindrical, oval, curved, etc.

#### Problem 3: Windows showing wrong exterior (green forest instead of world DNA)
Interior spaces were showing generic pastoral/forest views through windows instead of the world's DNA (e.g., Post-Apocalyptic wasteland).

**Solution:** Added direct FLUX constraint for exterior views:
- New `buildExteriorViewConstraint()` function uses surroundingsDNA
- Appends `[CRITICAL EXTERIOR VIEWS: ...]` constraint to FLUX prompt
- Specifies what to show (genre, architectural_tone) and what to avoid (green forests, lush vegetation)
- Works for all interior spaces with openings

#### Files Modified
- `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts` - Interior dominantElements instructions
- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`:
  - Added `parseDominantElement()` function
  - Added `buildDominantElementsContext()` function
  - Added `buildShapeConstraints()` function
  - Added `buildExteriorViewConstraint()` function
  - Updated `generateImagePromptForNode()` to append constraints

#### Known FLUX 1 Limitations
- Shape constraints may not always be followed (FLUX defaults to rectangular)
- Exterior view constraints for windows sometimes ignored (FLUX defaults to nature/trees)
- These are model limitations, not prompt issues

## 2025-12-29

### GO_INSIDE Hierarchy Fix - Pass-Through Locations - COMPLETED

Fixed critical hierarchy bug where pass-through locations were created but interior niches were added as siblings instead of children.

#### Problem
When using `/GO_INSIDE` on a structure (e.g., "little house" inside a basement), the system should create:
```
The Basement Hall (niche)
  └── little house (location, isPassThrough=true)
        └── little house interior (niche) ← Should be CHILD
```

But was creating:
```
The Basement Hall (niche)
  ├── little house (location, isPassThrough=true)
  └── little house interior (niche) ← WRONG: SIBLING!
```

#### Solution
Send the correct parent ID (`nicheParentId`) in the SSE completion event.

#### Files Modified
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts`
- `packages/backend/src/routes/mzoo/handlers/nicheHandler.ts`
- `packages/frontend/src/features/spawn-input/SpawnInputBar/creationCommands.ts`
- `packages/frontend/src/features/spawn-input/SpawnInputBar/navigationCommands.ts`

## Current Focus

- ✅ **COMPLETED**: Image prompt DNA & shape improvements
- ✅ **COMPLETED**: GO_INSIDE hierarchy fix for pass-through locations
- ✅ **COMPLETED**: Build verification passed

## Files Modified (Dec 30)

**Backend:**
- `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts` - Interior dominantElements rules
- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts` - Shape and exterior view constraints

## Previous Context (Dec 29)

- GO_INSIDE hierarchy fix for pass-through locations
- Component refactoring (ParticleSystem, entityManagerSlice)
- Dead code cleanup
