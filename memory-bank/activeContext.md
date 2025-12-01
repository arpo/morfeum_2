# Active Context

## Recent Changes (2025-12-01)

### Training Data Export Feature (Dec 1, 2025)
- **Feature**: Added button to export image/text pairs for AI model (LoRA) training
- **Implementation**:
  - New button with camera icon in TopButtonRow
  - Downloads current WorldView image and pairs with text description
  - Text prefixed with "A portrait of " for characters, "A scene of " for locations
  - Files saved to `training-data/` folder in project root
  - Filename format: `{sanitized-name}-{timestamp}.jpg` and `.txt`
- **Files Added/Modified**:
  - `packages/backend/src/routes/trainingData.ts` - Backend endpoint for saving files
  - `packages/frontend/src/services/trainingDataService.ts` - Frontend service
  - `packages/frontend/src/icons/index.ts` - Added IconCamera
  - `packages/frontend/src/features/app/components/TopButtonRow/TopButtonRow.tsx` - Added button
  - `packages/frontend/src/features/app/components/App/useAppLogic.ts` - Added handler
  - `.gitignore` - Added training-data/ folder
- **Text Sources**:
  - Characters: `details.looks` field
  - Locations: `description` field

### WorldView Effects System Enhancement (Dec 1, 2025)
- **Feature**: Added comprehensive effects system for WorldView with scene presets
- **Implementation**:
  - **Color Effects**:
    - Added bloom effect (brightens bright areas)
    - Added vignette effect (darkens edges)
    - Added color tint system with strength control
    - Added lightning flash effect with auto-decay
    - Added desaturation control (0 = color, 1 = grayscale)
  - **Particle Enhancements**:
    - Added wind gust system with smooth ease-in-out
    - Configurable strength, direction, and duration
  - **Scene Presets**:
    - Created 5 themed scene combinations (sunset, storm, underwater, haunted, magical)
    - Each preset combines particles, displacement, and color effects
    - Includes auto-triggering effects (lightning flashes, wind gusts)
    - Easily configurable via `WORLD_VIEW_3D_CONFIG.SCENE` settings
  - **Renderer API**:
    - Added methods to control all effects individually
    - Added scene preset application and management
  - **Configuration**:
    - Added `SCENE` option to `config.ts` for easy testing
    - Can enable/disable and select preset via config
- **Files Added/Modified**:
  - New files:
    - `effects/scenes/types.ts`: Scene preset interfaces
    - `effects/scenes/presets.ts`: 5 scene configurations
    - `effects/scenes/index.ts`: Scene exports
  - Modified files:
    - `effects/postprocessors/PostProcessorSystem.ts`: Added color effects
    - `effects/particles/ParticleSystem.ts`: Added wind gusts
    - `WorldViewRenderer.ts`: Added scene and effect methods
    - `config.ts`: Added SCENE configuration option
    - `effects/README.md`: Updated with comprehensive documentation
- **Documentation**: Extensive README.md details all effects and usage

## Recent Changes (2025-11-30)

### ExternalView Host Tab Sync Fix (Nov 30, 2025)
- **Problem**: ExternalView did not update when selecting world tree child nodes from Host tab (only worked for characters/pinned locations).
- **Root Cause**: ExternalView only initialized entity sessions for pinned locations/characters, not for world tree children.
- **Solution**: Updated ExternalView to:
  - For each pinned location of type "host", load all child nodes using `collectAllNodeIds` and `createEntitySessionsForNodes` (mirrors App.tsx logic).
  - Now supports real-time sync for all entities, including Host tab children.
- **Result**: Selecting any node (character, pinned location, or world tree child) now updates external view correctly.

## Recent Changes (2025-11-28)

### Depth Map Generation Feature (Nov 28, 2025)
- **Feature**: Added button to generate depth maps for entity primary media using FAL Depth Anything V2 API
- **Implementation**:
  - Created `useDepthMapLogic.ts` hook with depth map generation logic
  - Added depth map button to TopButtonRow (IconStack2 icon)
  - Button shows spinner while generating, disabled when no entity/primaryMedia
  - API endpoint: `/api/mzoo/fal-depth-anything-v2/process`
  - Stores depth maps in media.json with type `depth-map`
- **Bug Fix**: Fixed URL extraction from API response (was looking for `data.image.url`, corrected to `data.depth_map_image.url`)
- **Media Storage Structure**:
  ```json
  {
    "id": "media-xxx-depthmap",
    "type": "depth-map",
    "url": "https://...",
    "parentMedia": "media-xxx-original",
    "metadata": {
      "parentMedia": "media-xxx-original",
      "originalPrompt": "...",
      "model": "fal-depth-anything-v2"
    },
    "entityRefs": ["entity-id"],
    "createdAt": "..."
  }
  ```
- **API Response Format**: FAL API returns PNG despite requesting JPEG (known FAL bug)
- **Files Modified**:
  - `packages/frontend/src/icons/index.ts` - Added IconStack2
  - `packages/frontend/src/features/app/components/TopButtonRow/useDepthMapLogic.ts` - New hook
  - `packages/frontend/src/features/app/components/TopButtonRow/TopButtonRow.tsx` - Added button
  - `packages/frontend/src/features/app/components/TopButtonRow/TopButtonRow.module.css` - Spinner animation
  - `packages/frontend/src/features/app/components/App/App.tsx` - Integrated depth map handler

### Code Cleanup & File Size Reduction (Nov 28, 2025)
- **Problem**: Multiple files exceeded the 300-line limit rule, code duplication across tree utilities
- **Frontend Cleanup**:
  - Consolidated duplicate tree traversal functions to shared `utils/tree/navigation.ts`
  - Added `findDeepestNode()` (returns `{ id, name }`)
  - Added `findParentId()` (find parent in tree hierarchy)
  - Updated `completionHandlers.ts` (127 → 111 lines)
  - Updated `useNavigationLogic.ts` (282 → 263 lines)
- **Backend Route Cleanup**:
  - Refactored `packages/backend/src/routes/media.ts` (363 → 129 lines)
  - Created `asyncHandler` wrapper to eliminate repetitive try/catch blocks
  - Reduced boilerplate by 64%
- **Backend Pipeline Cleanup**:
  - Refactored `worldTreePipeline.ts` (423 → 240 lines)
  - Created new shared module `shared/dnaApplication.ts` (170 lines)
  - Extracted DNA application functions: `applyHostDNA()`, `applyRegionDNA()`, `applyLocationDNA()`, `applyNicheDNA()`, `mergeVisualAnalysis()`
  - Better separation of concerns
- **Results**: All files now comply with 50-300 line limit, TypeScript builds successfully

### Media Cleanup Architecture Improvement (Nov 28, 2025)
- **Root Cause Analysis**: Media cleanup wasn't working because entityRefs were empty in media.json. Navigation pipeline created media with empty entityRefs and updated in-memory object but never saved to database.
- **Architectural Decision**: Switched from using `entityRefs` (redundant data) to using `node.primaryMedia` as single source of truth for media cleanup.
- **Implementation Changes**:
  - Added `deleteMediaByIds(mediaIds: string[])` function to frontend mediaService
  - Updated `deleteWorldTree` to collect primaryMedia IDs while traversing nodes
  - Updated `deleteNodeWithChildren` to use same primaryMedia-based approach
  - Fixed character deletion to also remove from `pinnedIds` array
- **Benefits**:
  - Single source of truth (node.primaryMedia is the only link)
  - No redundancy or sync issues
  - Simpler to maintain
  - Handles orphaned nodes correctly

**Old Approach (using entityRefs):**
- Entity ID stored in both `node.primaryMedia` and `media.entityRefs`
- Required maintaining sync between two places
- Bug: entityRefs updated in-memory but not saved to DB

**New Approach (using primaryMedia):**
- `node.primaryMedia` is the ONLY link to media
- During deletion, traverse nodes and collect their primaryMedia IDs
- Delete media by those IDs directly

### Backend Build Fixes (Nov 28, 2025)
- **Event Emitter Module**: Created missing `eventEmitter.ts` module that was referenced but didn't exist
- **Route Ordering Fix**: Moved `/by-entities` and `/cleanup` routes BEFORE `/:id` wildcard routes in media.ts (Express matches routes in order)
- **Function Signature Fix**: Made `spawnId` parameter optional in `analyzeHierarchy` function (used by standalone hierarchy analysis endpoint)

## Recent Changes (2025-11-27)

### Media System Migration & Cleanup (Nov 27, 2025)
- **Removed Legacy `imagePath` & `imageUrl`**: Completely removed the deprecated `imagePath` and `imageUrl` fields from both frontend and backend persistence logic.
- **Unified Media Handling**: All image handling now uses the centralized `mediaService` and `primaryMedia` ID references.
- **Frontend Cleanup**: Updated `entitySessionLoader`, `useCharacterPanel`, `SavedEntitiesModal`, and documentation to use `imageUrl` (resolved from media service) or `primaryMedia` instead of direct paths.
- **Backend Cleanup**:
    - Updated `entityPersistence.ts` to stop writing `imageUrl` and `imagePrompt` to entity details.
    - Implemented location storage logic in `entityPersistence.ts` to ensure worlds are saved and their media registered in `media.json`.
    - Updated `nodeBuilder.ts`, `createNodePipeline.ts`, `worldTreePipeline.ts`, and `WorldTreeBuilder` to remove `imageUrl` passing and assignment.
    - Updated types to reflect the removal of `imageUrl`.

### Media Metadata Structure Cleanup (Nov 27, 2025)
- **Simplified Metadata**: Removed redundant `seed` object from media metadata that was storing duplicate character information already available in entity data.
- **Added originalPrompt**: Extracted and preserved only the user's original input as `originalPrompt` field at metadata root level.
- **Data Migration**: Created `cleanupMediaMetadata.ts` script that successfully migrated 11 existing media items to the new structure.
- **Type Updates**: Updated `MediaMetadata` interface to include `originalPrompt?: string` field.
- **Migration Script Updates**: Updated `migrateToMediaSystem.ts` to only extract `originalPrompt` from seed data, not the entire object.

**Metadata structure change:**
```typescript
// Before: Had redundant character data
{ prompt: "...", model: "FLUX", seed: { originalPrompt, name, looks, wearing, personality, presence, setting } }

// After: Clean structure with only essential data
{ prompt: "...", model: "FLUX", originalPrompt: "..." }
```

## Recent Changes (2025-11-26)

### Pipeline & Image Streaming Improvements (Nov 26, 2025)
- **Immediate Image Display**: All pipelines (character, worldTree, createNode) now display generated images in the entity background as soon as the image is ready, before the full pipeline completes.
- **Tree Expansion Fix**: Tree unfolding logic updated to support both legacy (`regions`, `locations`, `niches`) and new (`children`) node formats. Ensures correct node is unfolded and selected after pipeline completion.

### Keyboard Shortcuts & Focus Mode Implementation (Nov 26, 2025)
- Centralized keyboard shortcut handling for UI toggles and focus mode.
- Focus mode hides all UI for distraction-free image viewing.
- State management and configuration improvements.

## Current Focus
- Data storage optimization complete
- Removed redundant nested data from both worlds.json and characters.json
- Fixed nested dna.dna issue in world tree generation

## Next Steps
- Test with fresh database to verify clean data structure
- Monitor storage efficiency improvements
- Consider similar cleanup for other data structures if needed
