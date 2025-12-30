# Active Context

## 2025-12-30

### Immediate Surroundings for Nested Interiors - COMPLETED (Latest)

Implemented a system to correctly show immediate surroundings through windows for nested interior spaces (e.g., car inside museum, house in basement, spaceship in cave).

#### Problem
When generating a car interior image inside a museum, the windshield/windows showed an **outdoor street scene** instead of the **museum interior** where the car is parked.

#### Root Cause
The existing `surroundingsDNA` concept was designed for "what's visible OUTSIDE through windows" (world exterior), but nested interiors need to show the **immediate parent interior** through windows.

#### Solution
Added `immediateSurroundings` concept that:
1. Detects when a space is inside another interior (parent is a niche)
2. Passes the parent interior's DNA for window views
3. Generates specific constraints telling FLUX to show interior through windows

#### Key Changes

**1. `imagePromptHelpers.ts`**
- Fixed `buildExteriorViewConstraint()` - removed hardcoded anti-nature avoidance lists
- Added `buildImmediateSurroundingsConstraint()` function for nested interiors

**2. `imagePromptGeneration.ts`**
- Added `immediateSurroundings` field to `ImagePromptGenerationInput` interface
- Updated `buildSystemPrompt()` to include `=== CRITICAL: NESTED INTERIOR LOCATION ===` section
- Updated `buildConstraints()` to use immediate surroundings when parent is interior

**3. `nodeBuildingStep.ts`**
- Added `immediateSurroundings` to `ImagePromptInput` interface

**4. `createNodePipeline.ts`**
- Added **STEP 1.5: RESOLVE IMMEDIATE SURROUNDINGS FOR NESTED INTERIORS**
- Logic to detect when parent is a niche (interior space)
- Uses `surroundingsDNA` for immediate surroundings when pass-through exists
- Only applies when `parentNode.type === 'niche'`

#### Logic Summary

| Scenario | Parent Type | Windows Show |
|----------|-------------|--------------|
| Car in museum | niche (interior) | Museum interior |
| House in basement | niche (interior) | Basement |
| Spaceship in cave | niche (interior) | Cave walls |
| Museum from building | location (exterior) | World exterior |
| Room at world edge | location (exterior) | World exterior |

#### Key Rule
**If parent is a niche (interior) → show parent interior through windows**
**If parent is location/region/host (exterior) → show world exterior through windows**

### Previous: Space Type Registry - COMPLETED

Implemented a central registry system for handling different container types (buildings, vehicles, boats, tents, etc.) with proper rules and prompts for each.

## Current Focus

- ✅ **COMPLETED**: Immediate surroundings for nested interiors
- ✅ **COMPLETED**: Space Type Registry for vehicle/boat/tent interiors
- ✅ **COMPLETED**: Structured image prompt system (both pipelines)

## Files Modified (Dec 30 - Immediate Surroundings)

**Modified Files:**
- `packages/backend/src/engine/generation/shared/imagePromptHelpers.ts`
- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`
- `packages/backend/src/engine/navigation/pipelines/helpers/nodeBuildingStep.ts`
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts`
