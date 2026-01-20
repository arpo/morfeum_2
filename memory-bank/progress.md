# Progress

## 2026-01-20 - Image Settings Optimization ✅

Optimized Flux 2 Turbo Edit and SeedVR Upscale settings for better image quality.

**Configuration File:** `packages/backend/src/services/mzoo/config/endpoints.ts`

### Flux 2 Turbo Edit Settings
- `IMAGE_SIZE`: `{ width: 1440, height: 816 }` (custom dimensions, API max 1440px)
- `OUTPUT_FORMAT`: `png` (better quality for upscaling)
- Width 1440px = API maximum (256-1440px range)
- Height 816px = close to 16:9 ratio, divisible by 16

### SeedVR Upscale Settings
- `UPSCALE_FACTOR`: 2 (2x upscale, ~4 seconds)
- `NOISE_SCALE`: 0.15 (0.1-0.2 range avoids AI hallucination)
- `OUTPUT_FORMAT`: `png` (mandatory per pro-tips)

### Pro-Tips Applied
- **Noise Scale 0.1-0.2**: Higher values cause upscaler to "hallucinate" new details
- **PNG Mandatory**: Using JPG causes AI to upscale compression artifacts
- **1088 Rule**: Use heights divisible by 16 (816 in our case) to avoid black bars
- **2x Upscale**: Faster than 4x (~4s vs ~10s) with good quality

---

## 2026-01-12 - NEW_WORLD_LOCATION_INTERIOR Command ✅

Created `/NEW_WORLD_LOCATION_INTERIOR` - creates 4-node hierarchy from single concept.

**Creates:** `Host → Region → Exterior Location → Interior Location` + interior image

**Usage:**
```
/NEW_WORLD_LOCATION_INTERIOR the kitchen of a pub in Camden in London
```

**Pattern:** Same as `/NEW_WORLD_LOCATION` but 4 nodes instead of 3. Single LLM call generates all nodes.

**Files:**
- NEW: `prompts/worldLocationInterior.ts`, `handlers/newWorldLocationInteriorHandler.ts` (backend)
- NEW: `commands/handlers/newWorldLocationInteriorHandler.ts` (frontend)
- UPDATED: routes, indexes, pipelineConfig, navigation.ts

---

## 2026-01-12 - MZOO Vision API Updated ✅

Simplified vision API to use new mzoo endpoint with internal caching.

**Changes:**
- Response: `analysis` instead of `text`
- Caching: Now internal to mzoo (no client-side cache management)
- Code: `cachedVisionAnalysis.ts` simplified from ~120 to ~55 lines

**Files:**
- `packages/backend/src/services/mzoo/types.ts` - Updated `VisionAnalysisResponse`
- `packages/backend/src/services/mzoo/services/cachedVisionAnalysis.ts` - Simplified

---

## 2026-01-12 - NEW_WORLD_LOCATION Single LLM Call ✅

Refactored `/NEW_WORLD_LOCATION` from 4 LLM calls to 1 for performance.

**Before:** Categorization → Host → Region → Location (4 calls)
**After:** worldLocationFull (1 call) → all 3 nodes at once

**Modular Architecture:**
- `shared/dnaSchema.ts` - Shared prompt sections (DNA_SCHEMA, HOST_RULES, etc.)
- `worldLocationFull.ts` - Combined prompt using shared sections

---

## 2026-01-12 - Weather & Time Commands ✅

Added `/SET_TIME` and `/SET_WEATHER` slash commands.

**Commands:**
- `/SET_TIME <time>` - pre_dawn, dawn, morning, midday, afternoon, golden_hour, sunset, dusk, night, midnight
- `/SET_WEATHER <description>` - Free text

**Architecture:** Stored on host node, cascaded to children during `/DISPLAY` image generation.

---

## 2026-01-12 - V2 Code Cleanup ✅

- `promptBuilder.ts`: ~265 → ~70 lines (removed dead code)
- `v2Commands.ts` (Frontend): 1 file → 8 files
- `routes.ts` (Backend): 1 file → 7 files

---

## 2026-01-13 - DNA Cascading Fix ✅

Fixed DNA inheritance to follow CSS-style (per fundamentals.md): empty array = inherit, non-empty = REPLACE.

**Files Modified:**
- `promptBuilder.ts` - Fixed `mergeDNAArrays`
- `goInside.ts` - Improved delta DNA enforcement
- `goInsideHandler.ts` - Updated DNA handling

**Note:** `promptBuilder.ts` has duplicate functions (`cascadeDNA` + `getMergedDNA`) - can consolidate later.

---

## World V2 System

### Commands: ✅ COMPLETE

| Command | Description | Status |
|---------|-------------|--------|
| `/NEW_HOST` | Create world with DNA | ✅ |
| `/NEW_REGION2` | Create region (delta DNA) | ✅ |
| `/NEW_LOCATION2` | Create location (delta DNA) | ✅ |
| `/NEW_WORLD_LOCATION` | Create Host+Region+Location (3 nodes) | ✅ |
| `/NEW_WORLD_LOCATION_INTERIOR` | Create Host+Region+Exterior+Interior (4 nodes) | ✅ NEW |
| `/DISPLAY` | Generate image via LLM layers | ✅ |
| `/SET_TIME` | Set time of day for world | ✅ |
| `/SET_WEATHER` | Set weather conditions for world | ✅ |
| `/GO_INSIDE` | Enter structures (image edit) | ✅ |
| `/GOTO` | Create sibling space in container | ✅ |
| `/LOOK` | Camera control within same space | ✅ |
| `/EDIT_IMAGE` | Edit existing image with prompt | ✅ |
| **Navigation Assistant** | In-app chat for command help | ✅ |

### Phase 5-6: Navigation ✅ COMPLETE

- [x] GO_INSIDE - Enter structures/buildings ← COMPLETE (v1.8)
  - Three prompt builders: indoor, outdoor, semi-enclosed
  - spaceType detection (indoor/outdoor/semi-enclosed/underground/elevated)
  - Time/weather enforcement (MANDATORY section in prompts)
  - 13 test scenarios passed
  - **Description Preservation**: Navigation Assistant preserves full user descriptions
- [x] GOTO - Create sibling spaces within container ← COMPLETE
  - Only available from space nodes (`requiresNodeType: ['space']`)
  - Uses parent location's image (not current space)
  - Reuses GO_INSIDE LLM prompt + image edit logic
- [x] LOOK - Camera control within same space ← COMPLETE (v3 with "see the view from")
  - Creates view nodes (camera angles, not locations)
  - 5 operation types: angle_change, traversal, zoom_in, zoom_out, **immersion**
  - Lens mnemonics: 24mm wide, 35mm medium, 85mm close
  - Fine-tuned for windows, panoramas, details
  - **Immersion v3**: "see the view from X" pattern (canonical)
    - ✅ `/LOOK see the view from the toilet` - camera AT position, looking outward
    - ❌ `/LOOK sit on the toilet` - broken (shows toilet in front)
  - **Spatial boundaries**: Use `/GO_INSIDE` for background→enter transitions
  - First-person POV enforced (no visible body/hands/feet)
  - Duplicate object prohibition added to prevent model adding extras
  - Best practices guide: `docs/look-command-best-practices.md`
- [x] Navigation Assistant Panel ← COMPLETE
  - In-app chat assistant for navigation help
  - Command suggestions with insert button
  - `/bug` command for developer reports
  - Context-aware (passes node ID, image prompt)
  - **GO_INSIDE guidance**: Preserves full descriptive details from user
- [ ] Remove old system

---

## V2 Files Structure

**Backend Handlers:**
```
handlers/
├── newHostHandler.ts
├── newRegionHandler.ts
├── newLocationHandler.ts
├── newWorldLocationHandler.ts
├── newWorldLocationInteriorHandler.ts
├── goInsideHandler.ts
├── gotoHandler.ts
├── lookHandler.ts
├── navigationAssistantHandler.ts  ← NEW
├── setTimeHandler.ts
├── setWeatherHandler.ts
└── eventsHandler.ts
```

**Backend Prompts:**
```
prompts/
├── shared/dnaSchema.ts
├── worldLocationFull.ts        (3-node: Host+Region+Location)
├── worldLocationInterior.ts    (4-node: +Interior)
├── navigationAssistant.ts      (chat assistant prompt) ← NEW
├── hostDNA.ts, regionDNA.ts, locationDNA.ts
└── index.ts
```

---

## What Works ✅

- V2 World System (all commands above)
- MZOO Vision API with internal caching
- Core features (commands, entities, world tree, navigation, image editing)

---

## What's Left 🚧

- [x] GO_INSIDE navigation ← COMPLETE (v1.8)
- [x] GOTO navigation (sibling spaces) ← COMPLETE
- [x] LOOK command (camera control) ← COMPLETE
- [x] Navigation Assistant chat panel ← COMPLETE
- [x] V1 command cleanup (2026-01-20)
  - Removed: NEW_WORLD, NEW_REGION, NEW_LOCATION, VIEW
  - Renamed: GO_INSIDE2 → GO_INSIDE, GOTO2 → GOTO
- [ ] Character spawn caching test
- [ ] Bundle size optimization
- [ ] Future: Season support for Host node
- [ ] Future: Rename NEW_REGION2 → NEW_REGION, NEW_LOCATION2 → NEW_LOCATION

---

---

## 2026-01-20 - EDIT_IMAGE Refactor to View Pattern ✅

Refactored `/EDIT_IMAGE` to create view nodes (like `/LOOK`) instead of replacing images.

**Problem:** `/EDIT_IMAGE` replaced the node's `primaryMedia`, losing the original image.

**Solution:**
- Both `/EDIT_IMAGE` and `/LOOK` now create **view nodes** as children
- Original node's `primaryMedia` stays unchanged
- When source is a **view node**, creates **sibling** (not child) to avoid nesting

**Tree Structure:**
```
Location A
├── View 1 (LOOK on Location A)
└── View 2 (LOOK/EDIT_IMAGE on View 1) ← Sibling
```

**Shared Utilities (`routeUtils.ts`):**
- `createViewNode()` - Creates view node, adds to tree
- `findTreeEntry()` - Finds node in tree structure
- `generateSlug()` - Creates URL-safe slugs
- `ViewNode` interface

**Files Modified:**
- `packages/backend/src/worldV2/utils/routeUtils.ts` - Added shared view utilities
- `packages/backend/src/worldV2/handlers/lookHandler.ts` - Uses shared utilities
- `packages/backend/src/worldV2/handlers/editImageHandler.ts` - Creates view nodes
- `packages/frontend/src/worldV2/commands/handlers/editImageHandler.ts` - Handles view response
- `packages/frontend/src/features/app/components/WorldView/useWorldViewLogic.ts` - Removed slow crossfade

---

## 2026-01-16 - Model Obfuscation & CSS Consolidation ✅

Implemented model name obfuscation and CSS filter consolidation.

**Problem:** Frontend received actual AI model names, exposing implementation details.

**Solution:**
- Backend maps model names to anonymous classes: `fal-flux-2-turbo-edit` → `model-b`
- `/api/media/bulk` returns `modelClass` instead of `model`
- V2 handlers (LOOK, GO_INSIDE, GOTO) send `modelClass` in completion
- CSS filters use CSS custom properties for single source of truth

**Files:**
- `config/constants.ts` - MODEL_CLASS_MAPPING, getModelClass()
- `routes/media.ts` - sanitizeMediaForFrontend()
- `styles/model-filters.module.css` - CSS custom properties
- `entitySessionLoader.ts` - Loads modelClass for existing entities
- `WorldView`, `LocationPanel` - Apply filter classes

---

## Known Issues 🐛

- Bundle size warning (865KB)
- FLUX 1 may ignore constraints
- DNA generation too dynamic for caching
