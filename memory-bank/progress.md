# Progress

## Recent Completed Work (2026-01)

- ✅ Image settings optimization (Flux 2 Turbo Edit + SeedVR Upscale)
- ✅ NEW_WORLD_LOCATION_INTERIOR command (4-node hierarchy)
- ✅ MZOO Vision API update (internal caching)
- ✅ NEW_WORLD_LOCATION single LLM call optimization
- ✅ Weather & time commands (/SET_TIME, /SET_WEATHER)
- ✅ V2 code cleanup and modularization
- ✅ DNA cascading fix (CSS-style inheritance)
- ✅ V1 command cleanup (removed OLD commands, renamed V2 commands)
- ✅ EDIT_IMAGE refactor to view pattern
- ✅ ViewSlider/slideshow component removal (278 lines)
- ✅ Media URL variants system (upscaled + depth maps)
- ✅ Model name obfuscation + CSS filter consolidation
- ✅ NEW_LOCATION2 → NEW_LOCATION rename
- ✅ Progressive image loading (original → upscaled crossfade)
- ✅ Per-node upscaling state with tree view spinners
- ✅ HD badge for upscaled nodes in tree view
- ✅ /REDRAW command (wrapper around EDIT_IMAGE)
- ✅ Wrapper commands documentation (`docs/wrapper-commands.md`)
- ✅ PipelineHelper refactor for editImageHandler/redrawHandler
- ✅ Crossfade gray gap fix (inline mesh creation)
- ✅ High-res image crossfade logging
- ✅ Video-aware overlay timing (wait for video playback)

---

## World V2 System

### Commands: ✅ COMPLETE

| Command | Description | Status |
|---------|-------------|--------|
| `/NEW_HOST` | Create world with DNA | ✅ |
| `/NEW_REGION2` | Create region (delta DNA) | ✅ |
| `/NEW_LOCATION` | Create location (delta DNA) | ✅ |
| `/NEW_WORLD_LOCATION` | Create Host+Region+Location (3 nodes) | ✅ |
| `/NEW_WORLD_LOCATION_INTERIOR` | Create Host+Region+Exterior+Interior (4 nodes) | ✅ |
| `/DISPLAY` | Generate image via LLM layers | ✅ |
| `/SET_TIME` | Set time of day for world | ✅ |
| `/SET_WEATHER` | Set weather conditions for world | ✅ |
| `/GO_INSIDE` | Enter structures (image edit) | ✅ |
| `/GOTO` | Create sibling space in container | ✅ |
| `/LOOK` | Camera control within same space | ✅ |
| `/EDIT_IMAGE` | Edit existing image with prompt | ✅ |
| `/REDRAW` | Redraw scene with host time/weather | ✅ |
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
├── editImageHandler.ts
├── redrawHandler.ts        ← NEW (wrapper command)
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
- [x] NEW_LOCATION2 → NEW_LOCATION rename (2026-01-21) ← COMPLETE
- [ ] Future: Season support for Host node
- [ ] Future: Rename NEW_REGION2 → NEW_REGION

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

---

## 2026-01-21 - Media URL Variants System ✅

Refactored media management to store upscaled images and depth maps as URL variants on the same media entry.

**Problem:** Upscaling replaced original URLs; depth maps created separate entries with `type: 'depth-map'`.

**Solution:** Added `urls` object to `MediaItem`:
```typescript
urls?: {
  original?: string;    // Original generated image
  upscaled?: string;    // Upscaled version
  depthMap?: string;    // Depth map
}
```

**Backend Changes:**
- `types.ts` - Added `urls` interface to `MediaItem`
- `mediaService.ts` - Added `addUrlVariant(id, variant, url)` method
- `routes/media.ts` - Added POST `/api/media/:id/url-variant` endpoint

**Frontend Changes:**
- `mediaService.ts` - Updated interface, modified `getDepthMapForMedia()` to read from `urls.depthMap`
- `useImageUpscale.ts` - Stores original in `urls.original`, upscaled in `urls.upscaled`, updates display `url`
- `useDepthMapLogic.ts` - Stores depth map in `urls.depthMap` instead of creating separate entry

**Result:** All related URLs (original, upscaled, depth map) now stored on single media node instead of fragmented across multiple entries.

---

## Known Issues 🐛

- Bundle size warning (865KB)
- FLUX 1 may ignore constraints
- DNA generation too dynamic for caching
