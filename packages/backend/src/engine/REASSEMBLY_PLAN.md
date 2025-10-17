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

## Phase 1: Utilities & Prompts

**Goal:** Build foundation pieces that everything else depends on

**Tasks:**
1. [ ] JSON Parser (`engine/utils/parseJSON.ts`)
   - Copy from `spawn/shared/pipelineCommon.ts`
   - Handle markdown fences, raw JSON
   - Test with sample AI responses

2. [ ] Type Definitions (`engine/types/`)
   - Copy core types from `spawn/types.ts`
   - Simplify where possible
   - Add only what's needed

3. [ ] Tagged Template System (`engine/prompts/`)
   - Create template builder with variable interpolation
   - Type-safe parameter validation
   - Test variable substitution

**When complete:** Have working utilities that can parse JSON and build prompts

## Phase 2: Seed Generation

**Goal:** Get first pipeline stage working end-to-end

**Tasks:**
1. [ ] Location Seed Template (`engine/prompts/templates/locationSeed.ts`)
   - Convert `locationSeedGeneration.ts` to tagged template
   - **TRIM:** Remove verbose examples, keep only essential
   - **MEASURE:** Track token count before/after

2. [ ] Seed Generator (`engine/generation/seed/locationSeed.ts`)
   - Copy logic from `LocationSpawnManager.generateSeed()`
   - Use new template system
   - Add detailed logging (inputs, outputs, timing)

3. [ ] Manual Testing
   - Test with 10 different prompts
   - Log: prompt → tokens → response time → output quality
   - Compare with old system
   - Iterate on prompt trimming

**When complete:** Can generate location seeds, faster than old system

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
- [ ] Phase 1: Utilities & Prompts
- [ ] Phase 2: Seed Generation
- [ ] Phase 3: Image Generation
- [ ] Phase 4: Visual Analysis
- [ ] Phase 5: Deep Profile Enrichment
- [ ] Phase 6: DNA & Storage
- [ ] Phase 7: NavigatorAI
- [ ] Phase 8: Sublocation Pipeline
- [ ] Phase 9: Integration
- [ ] Phase 10: Validation & Cleanup

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
