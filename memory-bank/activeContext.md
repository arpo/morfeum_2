# Active Context

## 2026-01-05 - Interior/Exterior Transition Rules Refinement

### Monastic Styles Added to SAME_MATERIAL Category - COMPLETED

Fixed issue where brick monasteries generated "carved from rock" interiors instead of brick interiors.

#### The Problem

When creating a world with `/NEW_WORLD Cliffside monastery made out of bricks`:
- **Parent location DNA**: materials = "weathered, sturdy brick", looks = "mass of ancient brickwork"
- **Interior niche generated**: looks = "carved directly from the mountain rock", materials = "rough-hewn, unpolished stone"

The LLM was ignoring the explicit "brick" in parent DNA and generating cave-like interiors.

#### Investigation Findings

We investigated the DNA system and confirmed:
1. **DNA system works correctly** - `getResolvedNodeDNA()` returns full parent DNA including all fields
2. **Parent DNA is passed correctly** - The parent "brick" materials ARE being sent to the LLM
3. **extractParentContext()** passes the entire DNA object, not a filtered subset

The issue was that "austere sacred" architectural tone was matching `FANTASY_SPECIFIC` category (via "sacred" keyword), which gave generic "stone walls" guidance instead of "match parent materials".

#### Solution

Added monastic styles to `SAME_MATERIAL` category in `interiorTransitionRules.ts`:
- `austere`
- `monastic`
- `hermitage`
- `abbey`
- `monastery`
- `priory`

Plus added documentation example: "Brick monastery outside → brick walls inside (honest construction)"

#### Why This Works

- Uses the **existing transition rules system** (not hardcoded rules in prompts)
- Follows the pattern documented in `docs/adding-transition-special-cases.md`
- Monastic buildings have honest construction where interior matches exterior
- Easy to extend: just add more styles to the appropriate category

#### Files Modified

- `packages/backend/src/engine/generation/prompts/shared/interiorTransitionRules.ts`
  - Added monastic styles to `sameMaterial` array in `getTransitionCategory()`
  - Updated Category 1 documentation string with monastic styles and brick example

---

### Reverted Hardcoded Prompt Rules - COMPLETED

Removed hardcoded building vs cave rules that were incorrectly added to generic prompts.

#### What Was Reverted

**From `imagePromptGeneration.ts`:**
- Removed "BUILDING INTERIOR vs CAVE INTERIOR" section
- Removed "HOW TO TELL THE DIFFERENCE" section
- Removed "MATERIAL TERMINOLOGY IN BUILDINGS" section
- Removed cliffside/mountain building rules

**From `nodeDNAGeneration.ts`:**
- Removed "PARENT BUILDING → INTERIOR BUILDING (NOT CAVE)" section
- Removed "ARCHITECTURAL STYLE PRESERVATION" section (arch/window/door matching)
- Removed "GOTHIC/HORROR GENRES" section

#### Why This Was Wrong

The user correctly pointed out that:
1. The DNA system is the core of what we're building
2. Hardcoding rules in generic prompts is not scalable
3. The proper place for style-specific rules is `interiorTransitionRules.ts`
4. The DNA inheritance should drive interior appearance, not hardcoded rules

#### The Correct Architecture

1. **Parent DNA** contains building indicators (windows, frames, facades)
2. **Transition rules** (`interiorTransitionRules.ts`) categorize architectural styles
3. **LLM receives guidance** based on the category (SAME_MATERIAL, FINISHED_INTERIOR, etc.)
4. **Generic prompts stay generic** - no hardcoded rules about caves vs buildings

---

## Key Architectural Principle Clarified

**The DNA system IS working correctly.** When testing shows unexpected results:

1. **First**: Check if parent DNA is being passed correctly (it usually is)
2. **Second**: Check which transition category the architectural tone falls into
3. **Third**: Add the style to the appropriate category in `interiorTransitionRules.ts`
4. **Do NOT**: Add hardcoded rules to the generic prompt templates

This follows the pattern documented in `docs/adding-transition-special-cases.md`.

---

## Previous Work (Earlier Today)

### SeedVR Image Upscale Bug Fix - COMPLETED
- Fixed `data.images[0].url` vs `data.image.url` property path

### Interior/Exterior Transition System - COMPLETED
- Image Layer Guidance, DNA Schema Integration, Gothic/Horror rules

### NEW_WORLD Niche Over-Generation Fix - COMPLETED
- Removed conflicting prompts from cache bundle

---

## Current Focus

- ✅ **COMPLETED**: Monastic styles added to SAME_MATERIAL category
- ✅ **COMPLETED**: Reverted hardcoded prompt rules
- ✅ **COMPLETED**: Clarified DNA system architecture
- ⏳ **PENDING**: Test brick monastery interior generation with new rules
- ⏳ **PENDING**: Test character spawn caching

## Files Modified Today

**Transition Rules:**
- `packages/backend/src/engine/generation/prompts/shared/interiorTransitionRules.ts`

**Reverted (removed hardcoded rules):**
- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`
- `packages/backend/src/engine/generation/prompts/locations/nodeDNAGeneration.ts`
