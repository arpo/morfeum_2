# Active Context

## 2026-01-20 - Image Settings Optimization ✅

Optimized Flux 2 Turbo Edit and SeedVR Upscale settings for better image quality.

### Configuration Changes

**File:** `packages/backend/src/services/mzoo/config/endpoints.ts`

**Flux 2 Turbo Edit (`DEFAULT_IMAGE_EDIT_SETTINGS`):**
```typescript
{
  NUM_IMAGES: 1,
  IMAGE_SIZE: { width: 1440, height: 816 },  // Max 1440px, 16:9 ratio, ÷16
  GUIDANCE_SCALE: 2.5,
  OUTPUT_FORMAT: 'png',  // PNG for quality before upscaling
  ENABLE_SAFETY_CHECKER: false
}
```

**SeedVR Upscale (`DEFAULT_IMAGE_UPSCALE_SETTINGS`):**
```typescript
{
  UPSCALE_MODE: 'factor',
  UPSCALE_FACTOR: 2,        // 2x upscale (fast, ~4 seconds)
  TARGET_RESOLUTION: '1080p',
  NOISE_SCALE: 0.15,        // 0.1-0.2 range avoids hallucination
  OUTPUT_FORMAT: 'png'      // PNG mandatory for quality
}
```

### Key Decisions

| Setting | Value | Reason |
|---------|-------|--------|
| Width | 1440px | API max limit (256-1440px) |
| Height | 816px | Close to 16:9, divisible by 16 |
| Edit format | PNG | Better quality for upscaling |
| Upscale factor | 2x | Faster (~4s vs ~10s for 4x) |
| Noise scale | 0.15 | Sweet spot to avoid AI hallucination |
| Upscale format | PNG | Mandatory per SeedVR pro-tips |

### The "1088 Rule" (Reference)
AI models process images in blocks of 8/16 pixels. Heights like 1080 cause artifacts. Use 1088 instead - but our API max is 1440px, so we use 816 (divisible by 16).

---

## 2026-01-20 - V1 Command Cleanup ✅

Cleaned up old V1 navigation/node creation commands that have been replaced by V2.

### Commands Removed (Complete Deletion)

| V1 Command | V2 Replacement | Status |
|------------|----------------|--------|
| `NEW_WORLD` | `NEW_WORLD_LOCATION` | DELETED |
| `NEW_REGION` | `NEW_REGION2` | DELETED |
| `NEW_LOCATION` | `NEW_LOCATION2` | DELETED |
| `VIEW` | `DISPLAY` | DELETED |

### Commands Renamed (V2 → Clean Names)

| Old Name | New Name | Description |
|----------|----------|-------------|
| `GO_INSIDE2` | `GO_INSIDE` | Enter a space (V2 navigation) |
| `GOTO2` | `GOTO` | Create sibling space within same container |

The "2" suffix has been removed - V2 commands now use the clean original names.

### Files Modified

**Backend:**
- `packages/backend/src/config/navigation.ts` - Removed V1 commands, renamed V2 commands
- `packages/backend/src/worldV2/routes.ts` - Updated comments
- `packages/backend/src/worldV2/handlers/goInsideHandler.ts` - Updated references
- `packages/backend/src/worldV2/handlers/gotoHandler.ts` - Updated references
- `packages/backend/src/worldV2/prompts/goInside.ts` - Updated references
- `packages/backend/src/worldV2/prompts/imageEditPrompt.ts` - Updated references
- `packages/backend/src/worldV2/prompts/navigationAssistant.ts` - Updated references
- `packages/backend/src/worldV2/utils/styleLockCompiler.ts` - Updated comments
- `packages/backend/src/engine/pipelines/shared/pipelineConfig.ts` - Updated comments
- `packages/backend/src/engine/generation/prompts/cacheContent/index.ts` - Updated comments
- `packages/backend/src/engine/nodeCreation/types/nodes.ts` - Updated comments

**Frontend:**
- `packages/frontend/src/worldV2/commands/index.ts` - Updated V2_COMMANDS array
- `packages/frontend/src/worldV2/commands/handlers/goInsideHandler.ts` - Updated references
- `packages/frontend/src/worldV2/commands/handlers/gotoHandler.ts` - Updated references
- `packages/frontend/src/features/spawn-input/SpawnInputBar/commandParser.ts` - Deprecated V1 functions
- `packages/frontend/src/features/spawn-input/SpawnInputBar/useNavigationLogic.ts` - Removed V1 references
- `packages/frontend/src/features/spawn-input/SpawnInputBar/creationCommands.ts` - Deprecated V1 handler
- `packages/frontend/src/features/spawn-input/SpawnInputBar/mediaCommands.ts` - Deprecated VIEW handler
- `packages/frontend/src/utils/spawn/completionHandlers.ts` - Updated comments

**Documentation:**
- `memory-bank/systemPatterns.md` - Updated command names
- `memory-bank/progress.md` - Updated command names
- `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md` - Updated command names
- `docs/go-inside-test-scenarios.md` - Updated command names

---

## Current Available Commands

| Command | Category | Description |
|---------|----------|-------------|
| `/NEW_HOST` | Creation | Create world with DNA |
| `/NEW_REGION2` | Creation | Create region (delta DNA) |
| `/NEW_LOCATION2` | Creation | Create location (delta DNA) |
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

## Next Steps

- [ ] Consider renaming `NEW_REGION2` → `NEW_REGION` (after full V1 cleanup)
- [ ] Consider renaming `NEW_LOCATION2` → `NEW_LOCATION` (after full V1 cleanup)
- [ ] Future: Add season support to Host node
