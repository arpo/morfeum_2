# Progress

## 2026-01-07 - Unified Image Prompt Generation & Environment Rules

- [x] **Unified Image Prompt Generation - COMPLETED**
  - **Problem**: `/NEW_WORLD` and `GO_INSIDE` used different code paths, constraints only applied to navigation
  - **Root Cause**: `nodeCreationPipeline.ts` had hardcoded `constraints: []` instead of using unified function
  - **Solution**: Replaced Stage 3 with `generateStructuredImagePrompt()` call
  - **Files Modified**:
    - `pipelines/nodeCreationPipeline.ts` - Use unified function
    - Removed `worldTreeImagePromptContext` import

- [x] **Environment Transition Rules System - COMPLETED**
  - **New File**: `generation/prompts/shared/environmentTransitionRules.ts`
  - **Environment Types**: UNDERWATER, SPACE, AERIAL, SUBTERRANEAN, SURFACE
  - **Key Functions**:
    - `detectEnvironmentFromDNA()` - Checks DNA for environment keywords
    - `getEnvironmentViewportConstraint()` - Interior view (through windows)
    - `getEnvironmentExteriorConstraint()` - Exterior view (viewer in environment)
  - **Underwater Constraints**:
    - Interior: "oceanic murk, deep-sea creatures, water particles, bioluminescence"
    - Exterior: "NO puddles, NO wet surfaces - everything ALREADY underwater"

- [x] **Dead Code Cleanup - COMPLETED**
  - **Deleted Files**:
    - `pipelines/worldTreePipeline.ts` - Never called (dead code)
    - `prompts/locations/worldTree/` directory - Only used by dead pipeline
    - `pipelines/worldTree/` directory - Helper files for dead pipeline
  - **Updated Exports**:
    - `prompts/locations/index.ts` - Removed worldTree exports
    - `hierarchyAnalysis/index.ts` - Removed generateBatchDNA export
    - `PROMPT_INDEX.md` - Updated documentation

- [x] **Verified**: Underwater NEW_WORLD now includes `[CRITICAL: UNDERWATER EXTERIOR VIEW]` constraint

## 2026-01-05 - Interior/Exterior Transition Refinements

- [x] **Monastic Styles Added to SAME_MATERIAL Category - COMPLETED**
  - **Problem**: Brick monasteries generated "carved from rock" interiors instead of brick interiors
  - **Root Cause**: "austere sacred" architectural tone matched FANTASY_SPECIFIC (via "sacred"), not SAME_MATERIAL
  - **Solution**: Added monastic styles to SAME_MATERIAL category in `interiorTransitionRules.ts`
  - **Styles Added**: `austere`, `monastic`, `hermitage`, `abbey`, `monastery`, `priory`

- [x] **Reverted Hardcoded Prompt Rules - COMPLETED**
  - **Problem**: Hardcoded building vs cave rules added to generic prompts (wrong approach)
  - **Solution**: Removed all hardcoded rules, use transition rules system instead

- [x] **Interior/Exterior Transition Improvements - COMPLETED** (earlier)
  - Image Layer Guidance System
  - DNA Schema Integration
  - Results: Oracle's Spire ✅ metallic interior, Blackwood Manor ✅ physical decay

- [x] **NEW_WORLD Niche Over-Generation Fix - COMPLETED**
  - Added "ATMOSPHERE ≠ INTERIOR" rule to `parsePromptToHierarchy.ts`
  - `/NEW_WORLD a haunted house` now correctly shows EXTERIOR view

- [x] **SeedVR Image Upscale Database Update Fix - COMPLETED**
  - Fixed `data.images[0].url` vs `data.image.url` property path

## 2026-01-03 - Multi-View System

- [x] **SeedVR Image Upscale Button - COMPLETED**
- [x] **Circular Navigation for Multi-View - COMPLETED**
- [x] **View Counter in Entity Explorer - COMPLETED**

## 2026-01-02 - Image Edit Feature

- [x] **/EDIT_IMAGE Slash Command - COMPLETED**

## 2026-01-01 - Gemini Caching

- [x] **Gemini 2.5 Flash-Lite Caching - COMPLETED**: 90% cost + 70% performance improvement
- [x] **Extended Caching to Navigation Pipeline - COMPLETED**

## What Works ✅

### Unified Image Prompt Generation (NEW - Jan 7)

**Single code path for all image generation:**
- Both `/NEW_WORLD` and `GO_INSIDE` use `generateStructuredImagePrompt()`
- Environment constraints automatically applied to both flows
- File: `generation/shared/imagePromptGeneration.ts`

### Environment Transition Rules (NEW - Jan 7)

**Automatic environment detection from DNA:**
- Detects: UNDERWATER, SPACE, AERIAL, SUBTERRANEAN, SURFACE
- Adds appropriate constraints for interior (viewport) and exterior views
- File: `generation/prompts/shared/environmentTransitionRules.ts`

### Interior Transition Rules System

**How to fix interior generation issues:**
1. Check which category the architectural tone falls into
2. Add the style to the appropriate category in `interiorTransitionRules.ts`
3. Do NOT add hardcoded rules to generic prompts

**Categories:**
- `SAME_MATERIAL` - Interior matches exterior (futuristic, organic, monastic)
- `FINISHED_INTERIOR` - Interior gets finishes (traditional, residential)
- `EXPOSED_MATERIAL` - Interior shows raw structure (industrial, brutalist)
- `NATURAL_INTEGRATION` - Built into nature (treehouse, cliffside)
- `FANTASY_SPECIFIC` - Cultural/magical (elven, dwarven, temple)

### Gemini Caching Architecture

**Cache Bundles Active:**
| Cache Bundle | Tokens | Status | Used By |
|--------------|--------|--------|---------|
| `morfeum-world-creation` | ~4,700 | ✅ Working | NEW_WORLD, hierarchy |
| `morfeum-navigation` | 2,446 | ✅ Working | GOTO, GO_INSIDE |
| `morfeum-character-creation` | ~3,800 | ✅ Ready | Character spawn |

### Performance Metrics

| Pipeline | Before | After | Improvement |
|----------|--------|-------|-------------|
| NEW_WORLD Total | 34.33s | **19.89s** | **42% faster** |
| Hierarchy Classification | 23.31s | **7.00s** | **70% faster** |
| GOTO Total | 11.56s | **9.91s** | **14% faster** |

### Core Application Features
- Contextual slash commands for navigation and node creation
- **Gemini Explicit Caching** for 90% cost + significant performance gains
- **Structured image prompts** with layer-based composition
- **Environment transition rules** for underwater/space/aerial environments
- **Interior transition rules** for proper exterior→interior material handling
- **Unified image prompt generation** - single code path for all flows
- Entity system for character and location creation
- World tree system with hierarchical location structures
- 3D World View with depth rendering and stereo support
- Navigation system with AI-powered spatial navigation
- Image editing via `/EDIT_IMAGE` slash command
- Image upscaling via UI button (4x resolution improvement)

## What's Left to Build 🚧

### Testing
- [ ] Test character spawn caching

### Caching Extensions
- [ ] Consider DNA generation caching (currently too dynamic)
- [ ] Consider image prompt caching

### Feature Development
- Character prompt optimization
- Character placement in structured prompts
- Enhanced chat features
- Advanced navigation
- Media management

## Current Status 📊

- All files under size limits
- 100% TypeScript coverage
- All builds passing
- **Unified image prompt generation** - single code path
- **Environment transition rules** - underwater/space/aerial support
- **Interior transition rules** - properly categorizing architectural styles
- **Gemini caching** - active for World Creation, Navigation, Character

## Known Issues 🐛

- Legacy components may not follow latest patterns
- Bundle size warning (865KB) - needs code splitting
- **FLUX 1 limitations**: May ignore shape/exterior view constraints
- DNA generation too dynamic for effective caching

## Development Standards 📋

- File size: 50-300 lines
- Separation: markup (.tsx), logic (.ts), styles (.module.css)
- Zustand slices with clear boundaries
- **Environment transition rules** for special environment handling
- **Interior transition rules** for style-specific interior generation
- **Unified image prompt** - use `generateStructuredImagePrompt()` for all flows
- **Gemini caching** pattern for LLM calls
- **Structured prompts** for all image generation
