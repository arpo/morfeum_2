# Progress

## 2026-01-05 - Interior/Exterior Transition System + Bug Fixes

- [x] **Interior/Exterior Transition Improvements - COMPLETED**
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
  
  **3. Gothic/Horror Special Rules**
  - Added genre-specific concrete description rules
  - Prevents abstract terms: "phantom outline", "oppressive emptiness"
  - Requires physical decay: "crumbling plaster", "rotting wood"
  
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
  - **Files Created**:
    - `services/mzoo/services/imageUpscale.ts` - upscaleImage() function
    - `routes/mzoo/handlers/upscaleImageHandler.ts` - Route handler
    - `features/app/components/TopButtonRow/useImageUpscale.ts` - Frontend hook
  - **Files Modified**:
    - `services/mzoo/config/endpoints.ts` - IMAGE_UPSCALE endpoint
    - `services/mzoo/types.ts` - Request/Response interfaces
    - `services/mzoo/index.ts` - Exports
    - `routes/mzoo/navigation.ts` - Route registration
    - `features/app/components/App/useDisplayMode.ts` - Handler
    - `features/app/components/App/useAppLogic.ts` - Props
    - `features/app/components/App/App.tsx` - Props
    - `features/app/components/TopButtonRow/TopButtonRow.tsx` - Button UI
  - **Duration**: ~8-10 seconds per upscale
  - **Results**: 4x upscaled image (1080p → 4K)

- [x] **Circular Navigation for Multi-View - COMPLETED**
  - **What**: Infinite scrolling through multiple views of an entity
  - **Behavior**: 
    - Left arrow at first view → wraps to last view
    - Right arrow at last view → wraps to first view
  - **Files Modified**:
    - `features/app/components/WorldView/useWorldViewLogic.ts`

- [x] **View Counter in Entity Explorer - COMPLETED**
  - **What**: Live counter showing current view index (e.g., "Node Name (2/3)")
  - **Features**:
    - Fetches view counts for all entities on mount
    - Shows counter only for entities with 2+ views
    - Updates in real-time when navigating
    - 1-based numbering for user-friendliness
  - **Files Modified**:
    - `features/app/components/WorldView/useWorldViewLogic.ts` - Event dispatch
    - `features/app/components/EntityExplorer/EntityExplorer.tsx` - View counting + display

## 2026-01-02 - Image Edit Feature

- [x] **/EDIT_IMAGE Slash Command - COMPLETED**
  - **What**: FAL Flux 2 Turbo Edit API integration with `/EDIT_IMAGE` command
  - **Files Created**:
    - `services/mzoo/services/imageEdit.ts` - editImage() function
    - `routes/mzoo/handlers/editImageHandler.ts` - Route handler
    - `features/spawn-input/SpawnInputBar/editCommands.ts` - Frontend command handler
  - **Files Modified**:
    - `services/mzoo/config/endpoints.ts` - IMAGE_EDIT endpoint
    - `services/mzoo/types.ts` - ImageEditRequest/Response types
    - `services/mzoo/index.ts` - Exports
    - `config/navigation.ts` - EDIT_IMAGE command config
    - `features/spawn-input/SpawnInputBar/commandParser.ts` - isEditCommand()
    - `features/spawn-input/SpawnInputBar/useNavigationLogic.ts` - Command routing
    - `routes/mzoo/navigation.ts` - Route registration
    - `engine/pipelines/shared/pipelineConfig.ts` - edit pipeline (6000ms)
  - **Usage**: `/EDIT_IMAGE change to winter`
  - **Duration**: ~6 seconds per edit

## 2026-01-01 (Evening Update)

- [x] **Extended Caching to Navigation Pipeline - COMPLETED**
  - **Problem**: Only World Creation was using caching; Navigation (GOTO/GO_INSIDE) was not
  - **Solution**: Extended caching to Structure Analysis + Destination Analysis
  - **Results**:
    - GOTO pipeline: 11.56s → **9.91s** (14% faster)
    - Both analyzers now use cached generation
    - 93-96% tokens cached per call
  - **Navigation Cache Fix**:
    - Original bundle was only ~1,344 tokens (below 2,048 minimum)
    - Expanded with element rules + navigation reference → 2,446 tokens
  - **Files Modified**:
    - `navigation/analyzers/structureAnalyzer.ts` - Uses `generateCachedText`
    - `navigation/analyzers/destinationAnalyzer.ts` - Uses `generateCachedText`
    - `prompts/navigation/destinationAnalysis.ts` - Added dynamic function
    - `prompts/cacheContent/index.ts` - Expanded navigation bundle
    - `pipelines/characterPipeline.ts` - Uses cached generation (ready, untested)

## 2026-01-01 (Earlier)

- [x] **Gemini 2.5 Flash-Lite Caching - COMPLETED + OPTIMIZED**: 90% cost + 70% performance improvement
  - **Final Results**:
    - 99.9% tokens cached (5366/5372)
    - 70% faster hierarchy (23.31s → 7.00s)  
    - 42% faster total pipeline (34.33s → 19.89s)
  - **Critical Discovery**: `/NEW_WORLD` uses `parsePromptToHierarchy.ts`
  - **Bugs Fixed**:
    - MZOO list caches: async iterable iteration
    - httpClient fallback: `data.data ?? data` pattern
    - Thinking mode: disabled for performance

## 2025-12-30

- [x] **Creature Mode System - COMPLETED**: `--populate` and `--people` flags
- [x] **UI: Help Tooltip for Spawn Input - COMPLETED**
- [x] **Prompt Token Optimization - COMPLETED**: ~50% token reduction
- [x] **Immediate Surroundings for Nested Interiors - COMPLETED**
- [x] **Space Type Registry - COMPLETED**
- [x] **Prompt Index Documentation - COMPLETED**
- [x] **Structured Image Prompt System - COMPLETED**

## What Works ✅

### Gemini Caching Architecture

**Cache Bundles Active:**
| Cache Bundle | Tokens | Status | Used By |
|--------------|--------|--------|---------|
| `morfeum-world-creation` | 5,366 | ✅ Working | NEW_WORLD, hierarchy |
| `morfeum-navigation` | 2,446 | ✅ Working | GOTO, GO_INSIDE |
| `morfeum-character-creation` | ~3,800 | ✅ Ready | Character spawn |
| `morfeum-chat` | ~1,100 | ⏳ Skipped | Below 2,048 minimum |

**Components Using Caching:**
- `parsePromptToHierarchy.ts` → `morfeum-world-creation`
- `structureAnalyzer.ts` → `morfeum-navigation`
- `destinationAnalyzer.ts` → `morfeum-navigation`
- `characterPipeline.ts` → `morfeum-character-creation` (untested)

### Performance Metrics (Jan 1, 2026)

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
- **Immediate surroundings** for nested interiors
- **Image editing** via `/EDIT_IMAGE` slash command
- **Image upscaling** via UI button (4x resolution improvement)

### Technical Architecture
- Strict component separation (JSX, logic, styles)
- All files under 300-line limit
- Zustand state management with clean slices
- **Gemini caching** via MZOO API with IN-MEMORY optimization
- **Optimized prompts** using pipe-separated values

### Token Cost & Performance Optimization
| Technique | Description | Savings |
|-----------|-------------|---------|
| **Gemini Caching** | Cache static content | **90%** cost + **70%** speed |
| **Navigation Caching** | Extended to GOTO/GO_INSIDE | **14%** faster GOTO |
| **Thinking Mode Disabled** | Remove reasoning overhead | **70%** faster |
| Pipe-separated values | `a\|b\|c` instead of bullets | ~30% tokens |
| Reduced examples | 2 instead of 4 | ~25% tokens |

## What's Left to Build 🚧

### Caching Extensions
- [ ] Test character spawn caching
- [ ] Consider DNA generation caching (currently too dynamic)
- [ ] Consider image prompt caching

### Feature Development
- Character prompt optimization
- Character placement in structured prompts
- Enhanced chat features
- Advanced navigation
- Media management

### Technical Improvements
- Performance optimization
- Testing
- Documentation
- Accessibility

## Current Status 📊

- All files under size limits
- 100% TypeScript coverage
- All builds passing
- **Gemini caching** active for:
  - World Creation (99.9% cached, 70% faster)
  - Navigation (94% cached, 14% faster)
  - Character (ready, untested)
- **Optimized prompts** for all pipelines
- **Structured image prompts** for both pipelines

## Known Issues 🐛

- Legacy components may not follow latest patterns
- Bundle size warning (865KB) - needs code splitting
- **FLUX 1 limitations**: May ignore shape/exterior view constraints
- DNA generation too dynamic for effective caching

## Development Standards 📋

- File size: 50-300 lines
- Separation: markup (.tsx), logic (.ts), styles (.module.css)
- Zustand slices with clear boundaries
- **Gemini caching** pattern:
  ```typescript
  const result = await generateCachedText(apiKey, 'cache-group-id', dynamicPrompt);
  ```
- **Optimized prompts** using compact formats
- **Structured prompts** for all image generation
