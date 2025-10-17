# Engine Reassembly Plan

## Overview

This document outlines the step-by-step plan for refactoring the Morfeum world generation system. The old code in `services/spawn/` is being rebuilt incrementally in `engine/` with focus on prompt optimization and cleaner architecture.

## Strategy

1. **Disconnect UI** - Make buttons log only, no actual calls
2. **Rebuild piece by piece** - One pipeline stage at a time
3. **Test manually** - Verify each step works before moving on
4. **Optimize prompts** - Main goal is trimming unnecessary tokens
5. **Reconnect UI** - When engine is complete and tested

## Decisions Made

- ✅ **No unit tests** - Manual testing as we go
- ✅ **Tagged templates** - Type-safe prompts with variable interpolation
- ✅ **Keep locationsSlice** - Don't touch working storage system
- ✅ **Keep SSE** - Don't break event system
- ✅ **Focus on prompt optimization** - Trim verbose prompts, measure impact

## Phase 0: Foundation ✓

**Status:** COMPLETE

**What was done:**
- [x] Created `engine/` folder structure
- [x] Created this reassembly plan
- [x] Added deprecation warnings to old code
- [x] Disconnected UI from backend
- [x] Tested disconnected UI still renders

## Phase 1: Utilities & Prompts ✓

**Status:** COMPLETE

**Goal:** Build foundation pieces that everything else depends on

**Completed Tasks:**
1. [x] JSON Parser (`engine/utils/parseJSON.ts`)
   - Handles markdown fences and raw JSON
   - Safe parsing with null fallback
   
2. [x] Type Definitions (`engine/types/`)
   - Core types: EntitySeed, VisualAnalysis, DeepProfile
   - ImageResult, PipelineTimings interfaces
   
3. [x] Tagged Template System (`engine/prompts/`)
   - Template builder with `buildPrompt()`, `estimateTokens()`, `logPrompt()`
   - Type-safe parameter validation
   - Ready for use

**Result:** Foundation utilities complete and tested

## Phase 2: Character Pipeline Migration ✓

**Status:** COMPLETE

**Goal:** Migrate complete character pipeline to new engine structure

**Completed Tasks:**
1. [x] Read all 4 existing character prompts from old system
2. [x] Migrated character prompts (ZERO content changes - exact copies):
   - `characterSeed.ts` (72 lines) - Seed generation
   - `characterImage.ts` (38 lines) - Image prompt building  
   - `characterVisualAnalysis.ts` (52 lines) - Visual analysis
   - `characterDeepProfile.ts` (189 lines) - Deep profile enrichment
3. [x] Created `characterPipeline.ts` (235 lines) - Complete pipeline implementation
4. [x] Created barrel exports: `prompts/index.ts` and `generation/index.ts`
5. [x] Fixed all TypeScript errors (optional parameter handling)
6. [x] Verified TypeScript compilation successful with zero errors

**Files Created** (9 total):
```
packages/backend/src/engine/generation/
├── characterPipeline.ts - Main pipeline orchestration
├── index.ts - Generation exports
└── prompts/
    ├── index.ts - Prompt exports
    ├── characterSeed.ts - Exact copy from old system
    ├── characterImage.ts - Exact copy from old system
    ├── characterVisualAnalysis.ts - Exact copy from old system
    └── characterDeepProfile.ts - Exact copy from old system
```

**Pipeline Functions:**
- `generateCharacterSeed()` - Generate initial character seed (7 fields)
- `generateCharacterImage()` - Create character portrait with FLUX
- `analyzeCharacterImage()` - Vision analysis of generated image (4 fields)
- `enrichCharacterProfile()` - Deep profile enrichment (16 fields)
- `runCharacterPipeline()` - Complete end-to-end pipeline with timing

**Key Features:**
- 🎯 **Zero Content Changes** - All prompts migrated character-for-character
- 📊 **Token Logging** - Every stage logs approximate token count
- ⏱️ **Performance Tracking** - Pipeline tracks total execution time
- 🔍 **Console Logging** - Detailed progress logs for debugging
- 📦 **Full Type Safety** - Uses existing types from Phase 1
- ♻️ **Reuses Infrastructure** - Uses parseJSON, mzooService, AI_MODELS

**Time Taken:** ~10 minutes

**Result:** Complete character pipeline working in new engine, ready for testing

## Phase 3: Location Seed Generation

**Goal:** Get first location pipeline stage working end-to-end

**Tasks:**
1. [ ] Location Seed Template (`engine/generation/prompts/locationSeed.ts`)
   - Convert `locationSeedGeneration.ts` to tagged template
   - **NO TRIMMING** - Exact copy like character prompts
   - Add token logging

2. [ ] Seed Generator (`engine/generation/locationPipeline.ts`)
   - Copy logic from `LocationSpawnManager.generateSeed()`
   - Use new template system
   - Add detailed logging (inputs, outputs, timing)

3. [ ] Manual Testing
   - Test with 10 different prompts
   - Log: prompt → tokens → response time → output quality
   - Compare with old system
   - Verify output quality matches

**When complete:** Can generate location seeds with new engine

## Phase 3: Image Generation

**Goal:** Generate images from seeds

**Tasks:**
1. [ ] Image Prompt Template (`engine/prompts/templates/locationImage.ts`)
   - Convert `locationImageGeneration.ts`
   - **TRIM:** Simplify FLUX instructions
   - **TEST:** Does simpler prompt still produce good images?

2. [ ] Image Generator (`engine/generation/image/location.ts`)
   - Copy from `LocationSpawnManager.generateImage()`
   - Use new template
   - Add retry logic if needed

3. [ ] Manual Testing
   - Generate images from Phase 2 seeds
   - Verify image quality acceptable
   - Measure generation time
   - Compare old vs new prompt effectiveness

**When complete:** Can generate images from seeds

## Phase 4: Visual Analysis

**Goal:** Analyze generated images to extract details

**Tasks:**
1. [ ] Analysis Prompt Template (`engine/prompts/templates/locationAnalysis.ts`)
   - Convert `locationVisualAnalysis.ts`
   - **TRIM:** Remove verbose examples, keep only necessary guidance
   - Focus on capturing visual anchors

2. [ ] Image Analyzer (`engine/generation/analysis/location.ts`)
   - Copy from `LocationSpawnManager.analyzeImage()`
   - Use new template
   - Parse visual anchors properly

3. [ ] Manual Testing
   - Analyze Phase 3 images
   - Verify visual anchors are specific (not generic)
   - Check all required fields populated
   - Compare with old system output

**When complete:** Can analyze images and extract visual details

## Phase 5: Deep Profile Enrichment

**Goal:** Complete DNA generation with all fields

**Tasks:**
1. [ ] Enrichment Prompt Template (`engine/prompts/templates/locationEnrichment.ts`)
   - Convert `locationDeepProfileEnrichment.ts`
   - **TRIM:** Simplify field instructions
   - Remove redundant explanations

2. [ ] Profile Enricher (`engine/generation/enrichment/location.ts`)
   - Copy from `LocationSpawnManager.enrichProfile()`
   - Use new template
   - Build complete NodeDNA

3. [ ] Full Pipeline Test
   - Run all 4 stages: Seed → Image → Analysis → Enrichment
   - Measure total time
   - Compare with old system
   - Verify DNA completeness

**When complete:** Full location generation pipeline working

## Phase 6: DNA & Storage

**Goal:** Handle DNA inheritance and storage integration

**Tasks:**
1. [ ] DNA Cascading (`engine/dna/cascading.ts`)
   - Copy from `locationCascading.ts` utility
   - Test inheritance: world → region → location
   - Verify sublocation inherits correctly

2. [ ] Storage Interface (`engine/storage/interface.ts`)
   - Thin wrapper over existing `locationsSlice`
   - Don't rebuild storage, just provide clean API
   - Use existing Zustand store

3. [ ] Manual Testing
   - Generate sublocation with cascaded DNA
   - Verify inherits parent atmosphere/materials
   - Check visual consistency

**When complete:** DNA inheritance working, storage integrated

## Phase 7: NavigatorAI

**Goal:** Semantic navigation with LLM

**Tasks:**
1. [ ] Navigator Prompt Template (`engine/prompts/templates/navigator.ts`)
   - Convert `navigatorSemanticNodeSelector.ts`
   - **TRIM:** Keep only best examples (remove redundant ones)
   - Test decision quality

2. [ ] Navigator Service (`engine/navigation/navigator.ts`)
   - Copy from `navigator/index.ts`
   - Use new template
   - Clean up validation logic

3. [ ] Focus System (`engine/navigation/focus.ts`)
   - Copy from `utils/locationFocus.ts`
   - Keep as-is (already clean)

4. [ ] Manual Testing
   - Test 20+ navigation commands
   - Verify move vs generate decisions correct
   - Check perspective inference working
   - Test edge cases (exit at top level, etc.)

**When complete:** Navigation system working

## Phase 8: Sublocation Pipeline

**Goal:** Interior/detail view generation

**Tasks:**
1. [ ] Sublocation Prompts (`engine/prompts/templates/`)
   - Convert `sublocationGeneration.ts`
   - Convert `sublocationImagePromptGeneration.ts`
   - **OPTIMIZE:** For speed (sublocations should be fast)

2. [ ] Sublocation Pipeline (`engine/generation/sublocation/`)
   - Copy from `SublocPipelineManager.ts`
   - Simplify 3-stage process
   - Use new templates

3. [ ] Manual Testing
   - Generate interiors from locations
   - Verify inherits parent atmosphere
   - Check images correctly framed
   - Measure speed

**When complete:** Can generate sublocations with proper inheritance

## Phase 9: Integration

**Goal:** Connect engine to live system

**Tasks:**
1. [ ] Engine API (`engine/index.ts`)
   - Create public API facade
   - Match old SpawnManager interface
   - Add comprehensive logging

2. [ ] Update Route Handler (`routes/spawn.ts`)
   - Replace old SpawnManager with engine
   - Keep SSE event format identical
   - Add feature flag for A/B testing

3. [ ] Reconnect Frontend
   - Remove console.log stubs
   - Connect to new engine
   - Keep old system as fallback

4. [ ] A/B Testing
   - Feature flag: `USE_ENGINE=true/false`
   - Run both systems in parallel
   - Compare outputs
   - Monitor performance

**When complete:** Engine running in production, old system as backup

## Phase 10: Validation & Cleanup

**Goal:** Verify everything works, remove old code

**Tasks:**
1. [ ] Full System Test
   - Generate 10+ complete worlds
   - Navigate extensively  
   - Create characters
   - Test all features

2. [ ] Performance Analysis
   - Compare old vs new timing
   - Identify remaining bottlenecks
   - Final prompt optimizations

3. [ ] Delete Old Code
   - Remove `services/spawn/` (old pipeline)
   - Remove old prompt files
   - Clean up imports

4. [ ] Documentation
   - Update README
   - Document new engine architecture
   - Create migration guide

**When complete:** Refactoring complete! 🎉

## Progress Tracking

Update this checklist as phases complete:

- [x] Phase 0: Foundation
- [x] Phase 1: Utilities & Prompts
- [x] Phase 2: Character Pipeline Migration
- [ ] Phase 3: Location Seed Generation
- [ ] Phase 4: Image Generation
- [ ] Phase 5: Visual Analysis
- [ ] Phase 6: Deep Profile Enrichment
- [ ] Phase 7: DNA & Storage
- [ ] Phase 8: NavigatorAI
- [ ] Phase 9: Sublocation Pipeline
- [ ] Phase 10: Integration
- [ ] Phase 11: Validation & Cleanup

## Optimization Tracking

Track prompt improvements here:

| Prompt | Old Tokens | New Tokens | Savings | Quality |
|--------|------------|------------|---------|---------|
| locationSeed | TBD | TBD | TBD | TBD |
| locationImage | TBD | TBD | TBD | TBD |
| locationAnalysis | TBD | TBD | TBD | TBD |
| locationEnrichment | TBD | TBD | TBD | TBD |
| navigator | TBD | TBD | TBD | TBD |
| sublocation | TBD | TBD | TBD | TBD |

## Notes & Learnings

Document insights as you go:

- What worked well?
- What didn't work?
- Unexpected discoveries?
- Future improvements?

---

**Last Updated:** October 17, 2025
