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
| `/REDRAW` | Media | Redraw scene with current time/weather |
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

## 2026-01-21 - Progressive Image Loading & Upscale Improvements ✅

Enhanced the image upscaling experience with progressive loading (original → upscaled crossfade) and per-node upscaling state.

### Progressive Image Loading

**Problem:** When viewing entities with upscaled images, only the upscaled version was shown, causing slow initial load times (4x larger files).

**Solution:** Show low-res original first, then crossfade to upscaled version when loaded:

**Frontend:**
- `useWorldViewLogic.ts`:
  - Uses `getMediaWithUrls()` to fetch both original and upscaled URLs
  - Loads `originalUrl` first for fast display
  - Preloads `upscaledUrl` in background
  - Crossfades to upscaled when ready (0.5s transition)
  - Only crossfades if still showing the same original image

**mediaService.ts:**
- Added `getMediaWithUrls()` helper returning `{ originalUrl, upscaledUrl, displayUrl, depthMapUrl }`

### Per-Node Upscaling State

**Problem:** Upscale button spinner showed globally - couldn't upscale multiple nodes simultaneously, and unclear which node was being processed.

**Solution:** Track upscaling state per entity with visual feedback in tree view:

**Store (`packages/frontend/src/store/`):**
- `slices/mediaSlice.ts` - NEW slice tracking `upscalingEntityIds: Set<string>`
- Actions: `startUpscaling(entityId)`, `finishUpscaling(entityId)`
- Combined into main store via `index.ts`

**Upscale Logic:**
- `useImageUpscale.ts`:
  - Changed from local `useState` to store-based tracking
  - Returns `isEntityUpscaling(entityId)` to check specific entity
  - All success/error paths call `finishUpscaling(entityId)`

**Button State:**
- `useDisplayMode.ts` - Now checks `isEntityUpscaling(activeEntity)` only
- `TopButtonRow.tsx` - Removed spinner from button (now just icon)
- Button only disabled when **current** entity is upscaling

**Tree View Indicators:**
- `TreeView.tsx`:
  - Checks `upscalingEntityIds.has(item.id)` for each node
  - Shows spinner overlay on thumbnail while upscaling
  - CSS: Semi-transparent black overlay with white/black fading spinner

**CSS (`TreeView.module.css`):**
```css
.upscalingOverlay {
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.5);
}

.upscalingSpinner {
  animation: spinFade 1s linear infinite;
}
```

### Upscaled Image Crossfade Event

**Problem:** After upscaling finished, WorldView didn't crossfade to the new upscaled image.

**Solution:** Added `imageUpscaled` event handling in WorldView:

**useImageUpscale.ts:**
- Dispatches event with detail: `{ entityId, newUrl, primaryMediaId }`

**useWorldViewLogic.ts:**
- Listens for `imageUpscaled` event
- Only processes if event is for active entity
- Preloads upscaled image
- Crossfades when loaded (0.5s transition)

**useDisplayMode.ts:**
- Removed redundant event dispatch (was causing null errors)

### HD Badge for Upscaled Nodes

**Problem:** No visual indicator showing which nodes have upscaled versions available.

**Solution:** Small "HD" badge in bottom-right corner of tree thumbnails:

**TreeView:**
- `TreeView.tsx`:
  - Added `isUpscaled?: boolean` to `TreeItem` interface
  - Shows HD badge when `item.isUpscaled && !isUpscaling`
  
**EntityExplorer:**
- `EntityExplorer.tsx`:
  - Tracks `upscaledIds: Set<string>` state
  - Fetches upscaled status on load by checking `media.urls?.upscaled`
  - Listens for `imageUpscaled` events to immediately show badge
  - Passes `isUpscaled` to all tree items (locations & characters)

**CSS (`TreeView.module.css`):**
```css
.hdBadge {
  position: absolute;
  bottom: 0;
  right: 0;
  font-size: 7px;
  font-weight: 700;
  padding: 1px 2px;
  background-color: rgba(59, 130, 246, 0.9);
  color: white;
  border-radius: 2px 0 var(--radius-sm) 0;
}
```

**mediaService.ts:**
- Added `isMediaUpscaled(mediaId)` helper function

### User Experience Flow

1. **Select node with upscaled image:**
   - Original loads instantly (fast, small file)
   - Upscaled crossfades in smoothly after loading

2. **Click upscale on Node A:**
   - Spinner appears on Node A's thumbnail
   - Upscale button disabled for Node A

3. **Switch to Node B:**
   - Upscale button enabled (Node B not upscaling)
   - Can start upscaling Node B while A finishes

4. **Upscaling completes:**
   - Spinner removed from thumbnail
   - HD badge appears in corner
   - WorldView crossfades to upscaled image

### Files Modified

**Store:**
- `packages/frontend/src/store/slices/mediaSlice.ts` - NEW
- `packages/frontend/src/store/index.ts` - Added mediaSlice

**Upscaling:**
- `packages/frontend/src/features/app/components/TopButtonRow/useImageUpscale.ts` - Store integration
- `packages/frontend/src/features/app/components/App/useDisplayMode.ts` - Per-entity check, removed redundant event
- `packages/frontend/src/features/app/components/TopButtonRow/TopButtonRow.tsx` - Removed spinner from button

**WorldView:**
- `packages/frontend/src/features/app/components/WorldView/useWorldViewLogic.ts` - Progressive loading + event handling

**Tree View:**
- `packages/frontend/src/components/ui/TreeView/TreeView.tsx` - Spinner overlay + HD badge
- `packages/frontend/src/components/ui/TreeView/TreeView.module.css` - Spinner & badge styles

**Entity Explorer:**
- `packages/frontend/src/features/app/components/EntityExplorer/EntityExplorer.tsx` - Upscaled tracking

**Services:**
- `packages/frontend/src/services/mediaService.ts` - `getMediaWithUrls()`, `isMediaUpscaled()`

---

## 2026-01-21 - REDRAW Command & Wrapper Pattern ✅

Added `/REDRAW` command as a **wrapper command** around `/EDIT_IMAGE`. Also documented the wrapper command pattern for future commands.

### What is a Wrapper Command?

A **wrapper command** takes simple input and builds a specific prompt based on context, then delegates to a **backbone command**:

- **Backbone commands** (do heavy lifting): `/EDIT_IMAGE`, `/LOOK`
- **Wrapper commands** (convenience): `/REDRAW`, future: `/SEASON`, `/DAMAGE`, `/ZOOM`

### /REDRAW Implementation

**How it works:**
1. Backend finds parent host → gets `timeOfDay` + `weather`
2. Builds prompt: "Transform this scene to {time} lighting conditions with {weather} weather"
3. Generates descriptive view name: "Night view", "Stormy dusk", etc.
4. Delegates to same editImage pipeline as `/EDIT_IMAGE`
5. Creates view node (non-destructive)

**Usage:**
```
/REDRAW                    → Uses host's timeOfDay + weather
/REDRAW add dramatic fog   → Conditions + custom instructions
```

### Files Created/Modified

**Backend:**
- `handlers/redrawHandler.ts` - NEW wrapper handler
- `handlers/editImageHandler.ts` - Refactored to use PipelineHelper
- `handlers/index.ts` - Export redrawHandler
- `routes.ts` - Added `/api/v2/redraw` route
- `config/navigation.ts` - Added REDRAW command config

**Frontend:**
- `commands/handlers/redrawHandler.ts` - NEW thin wrapper
- `commands/handlers/index.ts` - Export
- `commands/index.ts` - Added to V2_COMMANDS + switch

**Documentation:**
- `docs/wrapper-commands.md` - NEW comprehensive guide for creating wrapper commands

### Handler Refactoring

Both handlers now use `PipelineHelper` for proper elapsed time output:
```
[EDIT_IMAGE] completed in 5.40s
  Stage Timings:
    - Loading: 0.05s
    - Editing: 5.23s
    - Saving: 0.12s
  Total: 5.40s
```

---

## 2026-01-21 - Crossfade & Video Overlay Timing Improvements ✅

Fixed crossfade artifacts and improved video loop overlay timing for seamless node transitions.

### Crossfade Gray Gap Fix

**Problem:** During image crossfades, a gray gap appeared between the old and new images.

**Root Cause:** In `WorldViewRenderer.ts`, the `crossfadeTo()` method was calling `createMeshWithDepth()`/`createFlatMesh()`, which internally called `cleanupMesh()`. This removed **ALL meshes** from the scene, including the old mesh that needed to stay visible during the crossfade.

**Solution:** Inline mesh creation in `crossfadeTo()` without calling cleanup functions:

```typescript
// Before: Called createMeshWithDepth() which removed all meshes
await this.createMeshWithDepth(newTexture, depthUrl);

// After: Create mesh inline, keep old mesh in scene
if (depthUrl) {
  const depthData = await loadDepthMapData(depthUrl);
  const geometry = createDepthGeometry(depthData, {...});
  this.material = createDepthShaderMaterial(newTexture, this.focus, this.meshDepth);
  this.mesh = new THREE.Mesh(geometry, this.material);
  this.scaleMesh();
  this.scene.add(this.mesh);
}
```

**Result:** Old mesh stays at opacity 1.0 while new mesh fades 0 → 1, creating seamless crossfade with no gray gap.

### High-Res Crossfade Logging

Added console logging to confirm high-res image crossfade completion:

```javascript
console.log('[WorldView] High-res image crossfade complete:', upscaledUrl);
```

Also added debug logging for image loading decisions:
```javascript
console.log('[WorldView] Image loading decision:', {
  hasVideo,
  hasUpscaled,
  videoSrc,
  upscaledSrc,
  initialSrc,
  upscaledDifferent
});
```

### Video-Aware Overlay Timing

**Problem:** When navigating to nodes with video loops, the black transition overlay faded out before the video started playing, causing a visible jump as the video initialized.

**Solution:** Delay overlay fade-out until video is ready:

1. **VideoLoopOverlay.tsx:**
   - Emits `videoLoopReady` event 150ms after video starts playing
   - Delay allows video to stabilize before revealing

2. **useWorldViewLogic.ts:**
   - For nodes with video: Don't emit `worldViewContentReady` immediately
   - Listen for `videoLoopReady` event and forward it as `worldViewContentReady`
   - For nodes without video: Emit `worldViewContentReady` immediately (unchanged)

**Flow for Video Nodes:**
```
1. Image loads → Overlay stays black
2. Video starts playing → Wait 150ms
3. videoLoopReady event → worldViewContentReady event
4. Overlay fades out → Video already playing smoothly
```

**Flow for Non-Video Nodes:**
```
1. Image loads → worldViewContentReady event
2. Overlay fades out immediately (unchanged)
```

### Files Modified

**Crossfade Fix:**
- `packages/frontend/src/features/app/components/WorldView/WorldViewRenderer.ts`
  - Modified `crossfadeTo()` method to create mesh inline

**Logging:**
- `packages/frontend/src/features/app/components/WorldView/useWorldViewLogic.ts`
  - Added debug logging for image loading decisions
  - Added high-res crossfade completion log

**Video Timing:**
- `packages/frontend/src/features/app/components/WorldView/VideoLoopOverlay.tsx`
  - Emit `videoLoopReady` event after video starts playing
- `packages/frontend/src/features/app/components/WorldView/useWorldViewLogic.ts`
  - Conditional `worldViewContentReady` emission based on video presence
  - Added listener for `videoLoopReady` event

---

---

## 2026-01-22 - Video Progress System & Character Video Fix ✅

Simplified video generation progress tracking with a shared time-based animation hook and fixed character video generation.

### Shared Time-Based Progress Hook

**Problem:** Video and upscale operations had complex stage-based progress tracking (analyzing → prompting → generating) that required SSE events from backend. This was verbose, difficult to maintain, and not accurate since actual timing varied.

**Solution:** Created `useTimedProgress` hook that animates from 0% → 95% over expected duration, then jumps to 100% when operation completes:

**Frontend (`packages/frontend/src/hooks/`):**
- `useTimedProgress.ts` - NEW shared hook
  - Takes `entityId`, `durationMs`, and `operation` type
  - Uses `easeInOutCubic` for smooth acceleration/deceleration
  - Animates 0% → 95% over duration, stops at 95% if taking longer
  - `stop()` method jumps to 100% when operation completes
  - `cancel()` for error cleanup
  - `isRunning(entityId)` to check specific entity status

**Hook Usage:**
```typescript
const { start, stop, cancel, isRunning } = useTimedProgress();

// Start 30-second animation for video
start(entityId, 30000, 'video');

// When operation completes
stop(entityId);  // Jumps to 100%, shows briefly, then removes
```

**Simplified Hooks:**
- `useVideoLoop.ts` - Reduced from ~150 to ~100 lines
  - Removed all SSE stage event tracking
  - Uses shared hook with 30 second duration
  - Just starts animation, waits for completion event

- `useImageUpscale.ts` - Reduced from ~200 to ~170 lines
  - Removed manual progress steps (10%, 20%, 50%, etc.)
  - Uses shared hook with 10 second duration
  - Same simple pattern as video

**Backend:**
- `pipelineConfig.ts` - Removed `videoLoop` pipeline definition (no longer needed)
- `generateVideoLoopHandler.ts` - Changed to use generic `v2Edit` pipeline type

### Character Video Generation Fix

**Problem:** Generating videos for characters failed with "Node not found" error because the handler tried to find characters in `worldsData.nodes`, but characters are stored in separate `characters.json` file.

**Solution:** Check if ID starts with `char-` before world data lookup:

**Backend (`packages/backend/src/worldV2/handlers/`):**
- `generateVideoLoopHandler.ts` - Reordered logic:
  ```typescript
  // Check if character first
  const isCharacter = nodeId.startsWith('char-');
  
  if (isCharacter) {
    // Use fixed CHARACTER_VIDEO_PROMPT
    enhancedPrompt = CHARACTER_VIDEO_PROMPT;
  } else {
    // Load world data and generate prompt via LLM
    const worldsData = await storageService.loadWorlds();
    const node = worldsData.nodes[nodeId];
    // ... generate context-aware prompt
  }
  ```

### Progress Bar UI Improvements

**Problem:** Progress bar was positioned inside the tiny 24x24px thumbnail, making it barely visible.

**Solution:** Moved progress bar to span full width of tree node row:

**Frontend (`packages/frontend/src/components/ui/TreeView/`):**
- `TreeView.tsx` - Moved progress bar JSX from `.mediaContainer` to `.itemContent`
- `TreeView.module.css`:
  - Added `position: relative` to `.itemContent`
  - Progress bar now positioned at bottom of full row
  - Height reduced from 3px to 2px per user request
  - Video badge changed from purple to dark gray: `rgba(60, 60, 60, 0.9)`

**Before:**
```
[▼] [tiny-img + tiny-progress] Node Name
```

**After:**
```
[▼] [tiny-img] Node Name
└─────────────────────────────────────────┘
   └── Progress bar spans full row width
```

### Animation Behavior

```
Start → 0%
During operation → 0% ─easing─→ 95%
If takes >expected time → stays at 95%
On completion → jumps to 100%
After 500ms → progress bar removed
```

### Files Modified

**Shared Hook:**
- `packages/frontend/src/hooks/useTimedProgress.ts` - NEW
- `packages/frontend/src/hooks/index.ts` - Export

**Simplified Hooks:**
- `packages/frontend/src/features/app/components/TopButtonRow/useVideoLoop.ts`
- `packages/frontend/src/features/app/components/TopButtonRow/useImageUpscale.ts`

**Backend:**
- `packages/backend/src/engine/pipelines/shared/pipelineConfig.ts` - Removed videoLoop
- `packages/backend/src/worldV2/handlers/generateVideoLoopHandler.ts` - Character fix

**UI:**
- `packages/frontend/src/components/ui/TreeView/TreeView.tsx` - Progress bar position
- `packages/frontend/src/components/ui/TreeView/TreeView.module.css` - Progress bar & badge styles

### Result

- Much cleaner, more maintainable progress tracking
- Same smooth eased animation for both video and upscale
- Character video generation now works correctly
- Progress bar clearly visible spanning full node width
- Subtle dark gray video badge instead of bright purple

---

## Next Steps

- [ ] Consider renaming `NEW_REGION2` → `NEW_REGION` (after confirming no region type variants needed)
- [ ] Future: Add season support to Host node
- [ ] Future wrapper commands: `/SEASON`, `/DAMAGE`, `/POPULATE`, `/ZOOM`, `/AERIAL`
