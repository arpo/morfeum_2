# Active Context

## 2026-01-02 - Image Edit API & Slash Command

### /EDIT_IMAGE Slash Command - COMPLETED

Implemented FAL Flux 2 Turbo Edit API integration with a new `/EDIT_IMAGE` slash command.

#### What Was Built

**Backend - MZOO Service Layer:**
- `services/mzoo/config/endpoints.ts` - Added `IMAGE_EDIT` endpoint and `DEFAULT_IMAGE_EDIT_SETTINGS`
- `services/mzoo/types.ts` - Added `ImageEditRequest` and `ImageEditResponse` interfaces
- `services/mzoo/services/imageEdit.ts` - New `editImage()` function
- `services/mzoo/index.ts` - Exported new function and settings

**Backend - Route Handler:**
- `routes/mzoo/handlers/editImageHandler.ts` - New POST `/api/mzoo/navigation/edit-image` handler
- `routes/mzoo/navigation.ts` - Registered the route

**Frontend - Slash Command:**
- `config/navigation.ts` - Added `EDIT_IMAGE` to slash commands (media category)
- `features/spawn-input/SpawnInputBar/commandParser.ts` - Added `isEditCommand()` check
- `features/spawn-input/SpawnInputBar/editCommands.ts` - New command handler
- `features/spawn-input/SpawnInputBar/useNavigationLogic.ts` - Wired up command routing

**Pipeline Configuration:**
- `engine/pipelines/shared/pipelineConfig.ts` - Added `edit` pipeline (6000ms duration)

#### Usage
```
/EDIT_IMAGE change to winter
/EDIT_IMAGE make it look like a sunset
/EDIT_IMAGE add snow to the scene
```

The command reads the current node's image, sends it to FAL Flux 2 Turbo Edit with the prompt, and replaces `primaryMedia` with the edited result.

#### API Details
- **Endpoint**: `POST https://www.mzoo.app/api/v1/ai/fal-flux-2-turbo-edit/edit`
- **Duration**: ~6 seconds per edit
- **Response**: Returns edited image URL with metadata

---

## 2026-01-01 (Evening) - Extended Navigation Caching

### Extended Caching to Navigation Pipeline - COMPLETED

Extended Gemini Explicit Caching from just World Creation to include Navigation pipeline (GOTO, GO_INSIDE).

#### Extended Caching Summary

**Cache Bundles Now Active:**
| Cache Bundle | Tokens | Status | Used By |
|--------------|--------|--------|---------|
| `morfeum-world-creation` | 5,366 | ✅ Working | NEW_WORLD, hierarchy parsing |
| `morfeum-navigation` | 2,446 | ✅ Working | GOTO, GO_INSIDE (structure + destination) |
| `morfeum-character-creation` | ~3,800 | ✅ Ready | Character spawn (untested) |
| `morfeum-chat` | ~1,100 | ⏳ Skipped | Below 2,048 token minimum |

#### Navigation Cache Fix

**Problem**: Original `morfeum-navigation` was only ~1,344 tokens (below 2,048 minimum).

**Solution**: Expanded cache bundle with additional content:
- Added `DOMINANT_ELEMENTS_RULES` and `NAVIGABLE_ELEMENTS_RULES`
- Added comprehensive Navigation Command Reference
- Added Perspective, Scale, Elevation, Form, and Functional type definitions

**Result**: Now 2,446 tokens, cache creation successful.

#### Components Now Using Caching

1. **Structure Analysis** (`structureAnalyzer.ts`)
   - Uses `generateCachedText('morfeum-navigation', dynamicPrompt)`
   - 96% tokens cached (2446/2543)

2. **Destination Analysis** (`destinationAnalyzer.ts`) - **NEW**
   - Added `destinationAnalysisDynamic()` function
   - Uses `generateCachedText('morfeum-navigation', dynamicPrompt)`
   - 93% tokens cached (2446/2619)

3. **Character Pipeline** (`characterPipeline.ts`)
   - Uses `generateCachedText('morfeum-character-creation', dynamicPrompt)`
   - Ready but untested

#### GOTO Pipeline Performance

| Stage | Before Caching | After Caching | Change |
|-------|----------------|---------------|--------|
| Destination Analysis | 1.63s | 3.27s* | First fetch |
| Space Analysis | 4.82s → 13.12s | 3.14s | **35% faster** |
| Total GOTO | 11.56s | **9.91s** | **14% faster** |

*First call fetches from server; subsequent calls use IN-MEMORY HIT for instant access.

#### Files Modified (Extended Caching)

**Navigation Prompt Files:**
- `prompts/navigation/destinationAnalysis.ts` - Added `destinationAnalysisDynamic()`
- `prompts/navigation/index.ts` - Exported `destinationAnalysisDynamic`

**Analyzer Files:**
- `navigation/analyzers/structureAnalyzer.ts` - Uses `generateCachedText`
- `navigation/analyzers/destinationAnalyzer.ts` - Uses `generateCachedText`

**Cache Bundle:**
- `prompts/cacheContent/index.ts` - Expanded `CACHE_NAVIGATION` to ~2,446 tokens

**Character Pipeline:**
- `pipelines/characterPipeline.ts` - Uses `generateCachedText` for seed + profile

---

## 2026-01-01 (Earlier) - Initial Caching Implementation

### Gemini 2.5 Flash-Lite Caching Implementation - COMPLETED + OPTIMIZED

Full implementation and optimization of Gemini Explicit Caching for 90% token cost reduction + 70% performance improvement.

#### Final Results
- **99.9% tokens cached** (5366/5372 tokens)
- **70% faster hierarchy** (23.31s → 7.00s)
- **42% faster total pipeline** (34.33s → 19.89s)
- **90% cost reduction** on cached content

#### Critical Discovery
The actual file used by `/NEW_WORLD` was `parsePromptToHierarchy.ts` (not `hierarchyAnalyzer.ts`).

#### Issues Found & Fixed
1. **MZOO LIST Bug**: Google SDK returns async iterable, not array
2. **HttpClient Bug**: Missing fallback pattern in `mzooPost()`
3. **Thinking Mode Overhead**: Disabled for 70% performance improvement

---

## 2026-01-03 - Multi-View System Enhancements

### Circular Navigation & View Counter - COMPLETED

Enhanced the multi-view image system with infinite scrolling and live view counter in Entity Explorer.

#### Circular/Infinite Navigation

**Problem**: When viewing multiple images of an entity, navigation stopped at first/last view.

**Solution**: Implemented wrap-around navigation:
- Pressing ← at first view (1) wraps to last view (e.g., 3)
- Pressing → at last view (3) wraps to first view (1)
- Creates infinite carousel experience

**Files Modified:**
- `features/app/components/WorldView/useWorldViewLogic.ts`
  - Updated `goToPreviousView()` to wrap from index 0 to last
  - Updated `goToNextView()` to wrap from last to index 0

#### View Counter in Entity Explorer

**Problem**: Users couldn't see which view they were on or how many views existed.

**Solution**: Added live counter display in tree view (e.g., "The Chroma Tower (2/3)").

**Implementation:**
1. **Event System**: Added `viewIndexChanged` CustomEvent dispatched on navigation
   - Includes `entityId`, `currentIndex`, `totalViews`
   - Dispatched from all navigation functions

2. **View Count Fetching**: EntityExplorer fetches view counts for all entities on mount
   - Uses `getEntityMedia()` to count images per entity
   - Only entities with 2+ images show counter
   - Stored in Map<entityId, {current, total}>

3. **Live Updates**: EntityExplorer subscribes to `viewIndexChanged` events
   - Updates counter in real-time as user navigates
   - Re-renders tree labels automatically

4. **Label Formatting**: Modified all label generation functions
   - Single view: "Node Name"
   - Multiple views: "Node Name (2/3)"
   - 1-based numbering (user-friendly)

**Files Modified:**
- `features/app/components/WorldView/useWorldViewLogic.ts`
  - Added event dispatch to `goToPreviousView()`, `goToNextView()`, `goToView()`
- `features/app/components/EntityExplorer/EntityExplorer.tsx`
  - Added view count state and fetching logic
  - Added event listener for view changes
  - Updated label generation in all mapNode functions
  - Memoization dependencies updated

**How It Works:**
- Fetch phase: Gets image counts for all entities (on mount)
- Navigation phase: Events update current index for active entity
- Render phase: Labels show "(current/total)" when total > 1
- Works for all entity types (locations, characters, niches, regions, hosts)

---

## Current Focus

- ✅ **COMPLETED**: Gemini Explicit Caching (90% token cost reduction)
- ✅ **COMPLETED**: Extended caching to Navigation pipeline (14% faster GOTO)
- ✅ **COMPLETED**: Fixed navigation cache size (1,344 → 2,446 tokens)
- ✅ **COMPLETED**: Multi-view circular navigation
- ✅ **COMPLETED**: View counter in Entity Explorer tree
- ⏳ **PENDING**: Test character spawn caching

## Files Modified (Jan 1 - All Caching Work)

**New Files:**
- `prompts/cacheContent/index.ts`
- `services/mzoo/services/cacheService.ts`
- `services/mzoo/services/cachedTextGeneration.ts`

**Modified Files:**
- `services/mzoo/client/httpClient.ts` (fallback fix)
- `services/mzoo/index.ts`
- `nodeCreation/detection/parsePromptToHierarchy.ts`
- `navigation/analyzers/structureAnalyzer.ts` (cached)
- `navigation/analyzers/destinationAnalyzer.ts` (cached)
- `pipelines/characterPipeline.ts` (cached)
- `prompts/navigation/destinationAnalysis.ts` (dynamic function)
- `prompts/navigation/structureAnalysis.ts` (dynamic function)
- `prompts/navigation/index.ts` (exports)
- 9 prompt files (static exports added)
