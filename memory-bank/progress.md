# Progress

## 2026-01-05 - Interior/Exterior Transition Refinements

- [x] **Monastic Styles Added to SAME_MATERIAL Category - COMPLETED**
  - **Problem**: Brick monasteries generated "carved from rock" interiors instead of brick interiors
  - **Root Cause**: "austere sacred" architectural tone matched FANTASY_SPECIFIC (via "sacred"), not SAME_MATERIAL
  - **Solution**: Added monastic styles to SAME_MATERIAL category in `interiorTransitionRules.ts`
  - **Styles Added**: `austere`, `monastic`, `hermitage`, `abbey`, `monastery`, `priory`
  - **Files Modified**:
    - `generation/prompts/shared/interiorTransitionRules.ts` - Added styles to array + documentation

- [x] **Reverted Hardcoded Prompt Rules - COMPLETED**
  - **Problem**: Hardcoded building vs cave rules added to generic prompts (wrong approach)
  - **Solution**: Removed all hardcoded rules, use transition rules system instead
  - **Reverted from `imagePromptGeneration.ts`**:
    - "BUILDING INTERIOR vs CAVE INTERIOR" section
    - "HOW TO TELL THE DIFFERENCE" section
    - "MATERIAL TERMINOLOGY IN BUILDINGS" section
  - **Reverted from `nodeDNAGeneration.ts`**:
    - "PARENT BUILDING → INTERIOR BUILDING" section
    - "ARCHITECTURAL STYLE PRESERVATION" section
    - "GOTHIC/HORROR GENRES" section
  - **Files Modified**:
    - `generation/shared/imagePromptGeneration.ts` - Removed hardcoded rules
    - `generation/prompts/locations/nodeDNAGeneration.ts` - Removed hardcoded rules

- [x] **Key Architectural Principle Established**
  - DNA system works correctly - parent DNA IS passed with all fields
  - When interior generation is wrong, fix is in `interiorTransitionRules.ts`
  - Do NOT add hardcoded rules to generic prompts
  - Follow pattern in `docs/adding-transition-special-cases.md`

- [x] **Interior/Exterior Transition Improvements - COMPLETED** (earlier today)
  - **Problem**: GO_INSIDE transitions produced wrong images (desert colors in metallic tower, abstract "ghost poetry" in Gothic manor)
  - **Root Cause**: Image composition system put exterior as entire background instead of interior-dominant
  - **Solution**: Three-part system for transition control
  
  **1. Image Layer Guidance System**
  - Added `imageLayerGuidance` field to `SpaceTypeDefinition`
  - Three priorities: `interior-dominant`, `exterior-dominant`, `balanced`
  - Applied to all space types in `spaceTypeRegistry/`
  
  **2. DNA Schema Integration**
  - Integrated `DNA_SCENE_FIELDS` descriptions into generation templates
  - LLM gets precise format: "2-4 sentences: forms, layout, scale"
  - Prevents vague outputs like "visual description"
  
  **3. Gothic/Horror Special Rules** (later reverted - see above)
  
  **Files Modified**:
  - `generation/shared/spaceTypeRegistry/types.ts`
  - `generation/shared/spaceTypeRegistry/building/*.ts` (all)
  - `generation/shared/spaceTypeRegistry/vehicle/*.ts` (all)
  - `generation/shared/imagePromptGeneration.ts`
  - `generation/prompts/locations/nodeDNAGeneration.ts`
  
  **Documentation Created**:
  - `docs/adding-transition-special-cases.md`
  
  **Results**: Oracle's Spire ✅ metallic interior, Blackwood Manor ✅ physical decay

- [x] **NEW_WORLD Niche Over-Generation Fix - COMPLETED**
  - **Problem**: `/NEW_WORLD a haunted house` incorrectly created interior niche
  - **Root Cause**: Conflicting prompts in cache bundle (auto-niche rule)
  - **Solution**: 
    1. Removed `HIERARCHY_CATEGORIZATION_STATIC` from cache bundle
    2. Added "ATMOSPHERE ≠ INTERIOR" rule to `parsePromptToHierarchy.ts`
    3. Added haunted house/asylum examples showing correct EXTERIOR default
    4. Reduced cache bundle size by ~1,800 tokens (from ~6,500 to ~4,700)
  
  **Files Modified**:
  - `generation/prompts/cacheContent/index.ts` - Removed conflicting prompt
  - `nodeCreation/detection/parsePromptToHierarchy.ts` - Added rules/examples
  - Frontend component - Removed debug-only hierarchy analysis call
  - `generation/prompts/PROMPT_INDEX.md` - Updated documentation
  
  **Results**: `/NEW_WORLD a haunted house` now correctly shows EXTERIOR view

- [x] **SeedVR Image Upscale Database Update Fix - COMPLETED**
  - **What**: Fixed critical bug in upscale feature where images weren't being saved to database
  - **Bug**: API returns `data.images[0].url` (array) but code looked for `data.image.url` (singular)
  - **Fix**: Changed property path to `upscaleResult.data?.images?.[0]?.url`
  - **Files Modified**:
    - `features/app/components/TopButtonRow/useImageUpscale.ts`

## 2026-01-03 - Multi-View System

- [x] **SeedVR Image Upscale Button - COMPLETED**
  - **What**: SeedVR 4x image upscaling with UI button in top button row
  - **Duration**: ~8-10 seconds per upscale
  - **Results**: 4x upscaled image (1080p → 4K)

- [x] **Circular Navigation for Multi-View - COMPLETED**
  - **What**: Infinite scrolling through multiple views of an entity

- [x] **View Counter in Entity Explorer - COMPLETED**
  - **What**: Live counter showing current view index (e.g., "Node Name (2/3)")

## 2026-01-02 - Image Edit Feature

- [x] **/EDIT_IMAGE Slash Command - COMPLETED**
  - **What**: FAL Flux 2 Turbo Edit API integration with `/EDIT_IMAGE` command
  - **Usage**: `/EDIT_IMAGE change to winter`
  - **Duration**: ~6 seconds per edit

## 2026-01-01 (Evening Update)

- [x] **Extended Caching to Navigation Pipeline - COMPLETED**
  - GOTO pipeline: 11.56s → **9.91s** (14% faster)
  - Both analyzers now use cached generation
  - 93-96% tokens cached per call

## 2026-01-01 (Earlier)

- [x] **Gemini 2.5 Flash-Lite Caching - COMPLETED + OPTIMIZED**: 90% cost + 70% performance improvement
  - 99.9% tokens cached (5366/5372)
  - 70% faster hierarchy (23.31s → 7.00s)
  - 42% faster total pipeline (34.33s → 19.89s)

## What Works ✅

### Interior Transition Rules System

**How to fix interior generation issues:**
1. Check which category the architectural tone falls into (via `getTransitionCategory()`)
2. Add the style to the appropriate category in `interiorTransitionRules.ts`
3. Do NOT add hardcoded rules to generic prompts

**Categories:**
- `SAME_MATERIAL` - Interior matches exterior (futuristic, organic, monastic, etc.)
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
| `morfeum-chat` | ~1,100 | ⏳ Skipped | Below 2,048 minimum |

### Performance Metrics (Jan 1-5, 2026)

| Pipeline | Before | After | Improvement |
|----------|--------|-------|-------------|
| NEW_WORLD Total | 34.33s | **19.89s** | **42% faster** |
| Hierarchy Classification | 23.31s | **7.00s** | **70% faster** |
| GOTO Total | 11.56s | **9.91s** | **14% faster** |
| Token Caching (World) | 5372 prompt | **5366 cached** | **99.9% cached** |
| Token Caching (Nav) | ~2600 prompt | **2446 cached** | **94% cached** |

### Core Application Features
- Contextual slash commands for navigation and node creation
- **Gemini Explicit Caching** for 90% cost + significant performance gains
- **Structured image prompts** with layer-based composition
- **Optimized prompts** (~50% token reduction)
- Entity system for character and location creation
- World tree system with hierarchical location structures
- 3D World View with depth rendering and stereo support
- Navigation system with AI-powered spatial navigation
- **Interior transition rules** for proper exterior→interior material handling
- **Image editing** via `/EDIT_IMAGE` slash command
- **Image upscaling** via UI button (4x resolution improvement)

## What's Left to Build 🚧

### Testing
- [ ] Test brick monastery interior with new SAME_MATERIAL rules
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
- **Gemini caching** active for World Creation, Navigation, Character
- **Interior transition rules** properly categorizing architectural styles
- **Generic prompts kept clean** - no hardcoded style-specific rules

## Known Issues 🐛

- Legacy components may not follow latest patterns
- Bundle size warning (865KB) - needs code splitting
- **FLUX 1 limitations**: May ignore shape/exterior view constraints
- DNA generation too dynamic for effective caching

## Development Standards 📋

- File size: 50-300 lines
- Separation: markup (.tsx), logic (.ts), styles (.module.css)
- Zustand slices with clear boundaries
- **Transition rules** for style-specific interior generation behavior
- **Generic prompts** should not contain hardcoded style rules
- **Gemini caching** pattern for LLM calls
- **Structured prompts** for all image generation
