# Active Context

## Current Available Commands

| Command | Category | Description |
|---------|----------|-------------|
| `/NEW_HOST` | Creation | Create world with DNA |
| `/NEW_REGION2` | Creation | Create region (delta DNA) |
| `/NEW_LOCATION` | Creation | Create location (delta DNA) |
| `/NEW_WORLD_LOCATION` | Creation | Create Host+Region+Location (3 nodes) |
| `/NEW_WORLD_LOCATION_INTERIOR` | Creation | Create Host+Region+Exterior+Interior (4 nodes) |
| `/GO_INSIDE` | Navigation | Enter a space (V2 navigation) |
| `/GOTO` | Navigation | Create sibling space in container |
| `/LOOK` | Navigation | Camera control within same space |
| `/DISPLAY` | Media | Generate image via LLM layers |
| `/SET_TIME` | Media | Set time of day for world |
| `/SET_WEATHER` | Media | Set weather conditions |
| `/EDIT_IMAGE` | Media | Edit existing image with prompt |
| `/CREATE_CHARACTER_REAL` | Creation | Create realistic character |
| `/CREATE_CHARACTER_UNREAL` | Creation | Create fantastical character |

---

## 2026-01-20 - EDIT_IMAGE Refactor to View Pattern ✅

Refactored `/EDIT_IMAGE` to create view nodes (like `/LOOK`) instead of replacing the parent's image.

### Problem

Previously `/EDIT_IMAGE` replaced the node's `primaryMedia`, losing the original image. Users wanted to preserve originals and browse between versions.

### Solution

Both `/EDIT_IMAGE` and `/LOOK` now:
1. Create a **view node** as a child of the target node
2. Assign the new/edited image to the view node
3. Keep the parent node's `primaryMedia` unchanged

### Sibling View Pattern

When running `/EDIT_IMAGE` or `/LOOK` on an existing **view node**, the new view is created as a **sibling** (same parent) instead of a child:

```
Location A
├── View 1 (LOOK on Location A)
└── View 2 (LOOK on View 1) ← Sibling, not child
```

### Code Changes

**Shared Utilities (`routeUtils.ts`):**
- `createViewNode()` - Creates view node, adds to tree
- `findTreeEntry()` - Finds node in tree structure
- `generateSlug()` - Creates URL-safe slugs
- `ViewNode` interface

**Backend:**
- `lookHandler.ts` - Uses shared `createViewNode`
- `editImageHandler.ts` - Now creates view nodes instead of replacing primaryMedia

**Frontend:**
- `editImageHandler.ts` - Handles new `view` response from backend
- `useWorldViewLogic.ts` - Removed slow crossfade on new image generation

### Key Logic (routeUtils.ts)

```typescript
// Check if source node is a view - if so, create sibling
const sourceNode = worldsData.nodes[sourceNodeId];
const effectiveParentId = sourceNode?.type === 'view' && sourceNode?.parentId 
  ? sourceNode.parentId 
  : sourceNodeId;
```

---

## 2026-01-21 - ViewSlider/Slideshow Component Removal ✅

Removed the legacy ViewSlider component that allowed navigating between multiple image views with arrow buttons and dot indicators.

### Problem

The slideshow UI was a leftover from when `/EDIT_IMAGE` replaced images. Now that both `/EDIT_IMAGE` and `/LOOK` create view nodes in the tree, the slideshow UI conflicts with the tree-based navigation model.

### What Was Removed

**WorldView.tsx (118 → 85 lines, -33 lines):**
- ❌ Arrow button imports (`IconChevronLeft`, `IconChevronRight`)
- ❌ View state from hook (`views`, `currentViewIndex`, navigation functions)
- ❌ Navigation control variables (`showNavigation`, `canGoPrevious`, `canGoNext`)
- ❌ Entire navigation JSX block (~30 lines of arrow buttons and dot indicators)

**useWorldViewLogic.ts (391 → 219 lines, -172 lines):**
- ❌ `MediaView` interface
- ❌ View state (`views`, `currentViewIndex`, `canShowViews`)
- ❌ `fetchViews()` - loaded all media for entity
- ❌ `goToPreviousView()`, `goToNextView()`, `goToView()` - navigation callbacks
- ❌ Keyboard navigation useEffect (ArrowLeft/ArrowRight)
- ❌ Image generation events useEffect (refreshed view list)
- ❌ Unused imports (`useMemo`, `getEntityMedia`, `clearEntityMediaCache`)

**WorldView.module.css (215 → 142 lines, -73 lines):**
- ❌ `.arrowButton` styles (positioned buttons with backdrop blur)
- ❌ `.arrowLeft` and `.arrowRight` positioning
- ❌ `.viewDots` container (bottom-centered indicator bar)
- ❌ `.viewDot` and `.viewDotActive` indicator styles

### Impact

**Total: 278 lines removed**

Users now navigate between views using the world tree structure (clicking nodes) instead of arrow buttons. This aligns with the hierarchical view model where views are proper nodes in the tree.

### Current State

- WorldView displays only the active entity's primary image
- No slideshow controls overlay the image
- Navigation happens through the entity tree UI
- View nodes are visible in the tree as children of their parent locations

---

---

## 2026-01-21 - Media URL Variants System ✅

Refactored media management to store upscaled images and depth maps as URL variants on the same media entry instead of creating separate entries.

### Problem

Previously:
- Upscaling an image **replaced** the original URL (stored old URL only in metadata)
- Creating depth maps created **separate media entries** with `type: 'depth-map'` and `parentMedia` link
- This fragmented related media across multiple entries

### Solution

Added `urls` object to store all variants on the same media node:

```typescript
interface MediaItem {
  id: string;
  type: 'image' | 'video';
  url: string;                    // Active/display URL (original or upscaled)
  urls?: {
    original?: string;            // Original generated image
    upscaled?: string;            // Upscaled version
    depthMap?: string;            // Depth map
  };
}
```

### Implementation

**Backend (`packages/backend/`):**

1. **types.ts** - Added `urls` object to `MediaItem` interface
2. **mediaService.ts** - Added `addUrlVariant()` method:
   ```typescript
   addUrlVariant(id: string, variant: 'original' | 'upscaled' | 'depthMap', url: string)
   ```
3. **routes/media.ts** - Added POST `/api/media/:id/url-variant` endpoint

**Frontend (`packages/frontend/`):**

1. **services/mediaService.ts**:
   - Updated `MediaItem` interface to match backend
   - Modified `getDepthMapForMedia()` to read from `urls.depthMap` instead of searching for separate entries

2. **useImageUpscale.ts** (image upscaling):
   - Stores original URL in `urls.original` (if not already stored)
   - Stores upscaled URL in `urls.upscaled`
   - Updates display `url` to show upscaled version
   - Removed `original_url` from metadata

3. **useDepthMapLogic.ts** (depth map generation):
   - Stores depth map URL in `urls.depthMap` via new API endpoint
   - No longer creates separate `type: 'depth-map'` entries
   - Returns `primaryMediaId` as `mediaId` for compatibility

### Result

**Before:**
```json
{
  "media-original": { "url": "original.jpg" },
  "media-upscaled": { "url": "upscaled.jpg", "parentMedia": "media-original" },
  "media-depthmap": { "type": "depth-map", "url": "depth.png", "parentMedia": "media-original" }
}
```

**After:**
```json
{
  "media-original": {
    "url": "upscaled.jpg",
    "urls": {
      "original": "original.jpg",
      "upscaled": "upscaled.jpg",
      "depthMap": "depth.png"
    }
  }
}
```

All related URLs now live on the same node, making the structure cleaner and easier to manage.

### Files Modified

**Backend:**
- `packages/backend/src/services/media/types.ts` - Added `urls` interface
- `packages/backend/src/services/media/mediaService.ts` - Added `addUrlVariant()`
- `packages/backend/src/routes/media.ts` - Added URL variant endpoint

**Frontend:**
- `packages/frontend/src/services/mediaService.ts` - Updated interface and `getDepthMapForMedia()`
- `packages/frontend/src/features/app/components/TopButtonRow/useImageUpscale.ts` - Store variants
- `packages/frontend/src/features/app/components/TopButtonRow/useDepthMapLogic.ts` - Store depth map as variant

**Compatibility:** WorldView and other components work seamlessly through the updated `getDepthMapForMedia()` function.

---

## 2026-01-21 - NEW_LOCATION2 → NEW_LOCATION Rename ✅

Completed the rename of `/NEW_LOCATION2` to `/NEW_LOCATION` for consistency with other V2 commands.

### Commands Renamed

| Old Name | New Name | Status |
|----------|----------|--------|
| `NEW_LOCATION2` | `NEW_LOCATION` | ✅ COMPLETE |

### Files Modified

**Backend:**
- `packages/backend/src/config/navigation.ts` - Updated command name, description, and blockedOnPassThrough condition
- `packages/backend/src/worldV2/handlers/newLocationHandler.ts` - Updated handler comments and command field

**Frontend:**
- `packages/frontend/src/worldV2/commands/index.ts` - Updated V2_COMMANDS array and case statement
- `packages/frontend/src/worldV2/commands/handlers/newLocationHandler.ts` - Updated:
  - Handler documentation comment
  - Error messages (validation messages)
  - Example usage text in error messages
  - Spawn registration call command string

### Current Command Names

All V2 commands now use clean names without "2" suffix:
- ✅ `/NEW_HOST`
- ✅ `/NEW_REGION2` (still has "2" to distinguish from future region types)
- ✅ `/NEW_LOCATION` (renamed from NEW_LOCATION2)
- ✅ `/GO_INSIDE` (renamed from GO_INSIDE2)
- ✅ `/GOTO` (renamed from GOTO2)
- ✅ `/LOOK`
- ✅ `/DISPLAY`

---

## Next Steps

- [ ] Consider renaming `NEW_REGION2` → `NEW_REGION` (after confirming no region type variants needed)
- [ ] Future: Add season support to Host node
