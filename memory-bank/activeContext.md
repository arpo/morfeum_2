# Active Context

## Recent Changes (2025-12-03)

### Interior Generation Improvements (Dec 3, 2025)
- **Problem 1**: Interior niches didn't match parent location's `structure.form` (rectangular building → circular interior)
- **Problem 2**: Wooden houses were getting stone interior walls (LLM used foundation material instead of wall material)
- **Problem 3**: Structure field was only on niches, not on locations

**Root Causes Identified:**
1. Three different DNA generation prompts exist (`deepestNodeDNA.ts`, `parentChainDNA.ts`, `nodeDNAGeneration.ts`) - only one had structure field
2. Niches were generating their own structure instead of setting it to null and inheriting from parent
3. Material translation logic didn't distinguish between primary wall material and foundation material

**Fixes Implemented:**

1. **Added `structure` field to all DNA prompts for locations:**
   - `deepestNodeDNA.ts` - Now includes structure object when nodeType === 'location'
   - `parentChainDNA.ts` - Added structure object to location DNA template
   - `nodeDNAGeneration.ts` - Already had it, but clarified niches must set it to null

2. **Strengthened form matching in `interiorInstructions.ts`:**
   ```
   1. FORM (MUST MATCH EXTERIOR - NO EXCEPTIONS)
   - structure.form = "rectangular" → Interior MUST have STRAIGHT WALLS and CORNERS (NOT circular/round)
   - structure.form = "round" → Interior can have circular plan
   **DO NOT CREATE A CIRCULAR/ROUND INTERIOR FOR A RECTANGULAR BUILDING.**
   ```

3. **Fixed material translation logic:**
   - Added "FOUNDATION vs WALLS" rule: Stone foundation + Wood walls = Wood paneled interior
   - Clarified that foundation material affects FLOOR only, not walls
   - Wood clapboard/siding exterior → Wood paneling interior (NOT stone)

4. **Updated niche structure rules:**
   - Niches must set structure to **null** - DO NOT create a new structure object
   - Interior form MUST match the parent's form (rectangular parent = rectangular interior)

**Files Modified:**
- `packages/backend/src/engine/generation/prompts/locations/deepestNodeDNA.ts`
- `packages/backend/src/engine/generation/prompts/locations/parentChainDNA.ts`
- `packages/backend/src/engine/generation/prompts/locations/nodeDNAGeneration.ts`
- `packages/backend/src/engine/generation/prompts/navigation/interiorInstructions.ts`
- `packages/backend/src/engine/generation/prompts/navigation/nicheImagePrompt.ts`

**Structure Field Details:**
```typescript
structure: {
  form: "rectangular | round | cylindrical | spherical | faceted | organic | arched | gothic | irregular",
  roofType: "domed | flat | vaulted | pitched | geodesic | arched | open-sky",
  scale: "small | medium | large",
  orientation: "vertical | horizontal | wide | cubic",
  openings: "large-glass | arched-windows | narrow-slits | open-passages | minimal | none",
  functionalType: "residential | commercial | religious | industrial | civic | entertainment"
}
```

### Image Generation Optimization (Dec 3, 2025)
- **Problem**: Initial world tree exterior images looked generic and didn't match DNA or interior images
- **Root Cause**: First-step image prompt was too simple - just concatenating DNA fields without proper synthesis
- **Solution**: Implemented two-step LLM approach (matching the successful interior image generation)
  
  **Two-Step Process:**
  1. **Step 1**: LLM synthesizes rich FLUX description from DNA + composition instructions
  2. **Step 2**: FLUX generates image from LLM-crafted description
  
  **Before (1-step - Generic):**
  ```
  DNA → Concatenate fields → FLUX image
  ```
  
  **After (2-step - Rich):**
  ```
  DNA + Composition Instructions → LLM → Rich FLUX description → FLUX image
  ```

- **Implementation**:
  - Created `worldTreeImagePromptContext()` in `worldTreeImagePrompt.ts`
  - Added comprehensive composition instructions:
    - Camera position rules (elevated 25-30° perspective)
    - ASYMMETRIC composition requirements
    - Facade & architectural details
    - Foreground/Midground/Background layers
    - Lighting & atmosphere guidance
  - Updated `nodeCreationPipeline.ts` to use two-step generation
  - Added new pipeline step: `image_prompt_generation` (between DNA and image)

- **Prompt Optimization**:
  - Reduced `deepestNodeDNA.ts` from ~150 lines to ~90 lines
  - Condensed type instructions (8-10 lines → 1 line each)
  - Compact parent context (arrow notation: `host: London → region: Camden`)
  - Removed verbose JSON field comments
  - Reduced guidelines from 5 sections to 3 bullet rules
  
- **Progress Bar Fix**:
  - Fixed "backwards progress" issue in parallel stages
  - Parent DNA API call starts during image generation (for speed)
  - But progress event only emits AFTER image completes
  - Ensures progress bar always moves forward

- **Performance Results**:
  - Deepest DNA Generation: 10s → 5.18s (50% faster!)
  - Total Pipeline: ~23s → ~20.72s
  - All pipeline steps now match actual timings

- **Pipeline Configuration Updates**:
  ```typescript
  worldTree: [
    { id: 'hierarchy_classification', duration: 2000 },   // 1.81s actual
    { id: 'deepest_dna_generation', duration: 6000 },    // 5.18s actual (was 10000!)
    { id: 'image_prompt_generation', duration: 3000 },   // 2.62s actual (new step)
    { id: 'image_generation', duration: 2500 },          // 2.13s actual
    { id: 'parent_dna_generation', duration: 9000 },     // 8.98s actual
    { id: 'tree_building', duration: 500 }               // 0.00s actual
  ]
  ```

- **Files Modified**:
  - `packages/backend/src/engine/generation/prompts/locations/worldTreeImagePrompt.ts` - Added context prompt function
  - `packages/backend/src/engine/generation/prompts/locations/deepestNodeDNA.ts` - Optimized for speed
  - `packages/backend/src/engine/pipelines/nodeCreationPipeline.ts` - Two-step image generation
  - `packages/backend/src/engine/pipelines/shared/pipelineConfig.ts` - Updated timings & added step
  - `packages/backend/src/engine/generation/prompts/locations/index.ts` - Added exports

## Recent Changes (2025-12-02)

### Slash Commands System & CREATE_IMAGE Implementation (Dec 2, 2025)
- **Feature**: Full slash commands system for navigation and node creation
- **Implementation**:
  - **Contextual Command Filtering**: Commands filtered based on current node type
    - Host: NEW_HOST, NEW_REGION, CREATE_IMAGE
    - Region: NEW_LOCATION, CREATE_IMAGE
    - Location/Niche: NEW_NICHE, GO_INSIDE, CREATE_IMAGE
  - **SlashCommandInput Component**: Dropdown autocomplete with descriptions
  - **CREATE_IMAGE Command**: Generate image for existing nodes
    - Loads node from storage
    - Generates image prompt from node DNA using `getNodeImagePrompt()`
    - Calls FLUX API
    - Creates media entry in `media.json`
    - Updates node with `primaryMedia` (not just imageUrl)
    - Returns `mediaId` in SSE completion event
- **CSS Bug Fix**: Fixed dropdown being clipped
  - Root cause: `.content` and `.contentPanel` in `Tabs.module.css` had `overflow: hidden`
  - Solution: Changed to `overflow: visible` to allow dropdown to render outside container
- **Files Added/Modified**:
  - `packages/backend/src/config/navigation.ts` - Command definitions with node type requirements
  - `packages/backend/src/routes/mzoo/navigation.ts` - CREATE_IMAGE endpoint with media service integration
  - `packages/frontend/src/components/ui/SlashCommandInput/` - New autocomplete component
  - `packages/frontend/src/features/spawn-input/SpawnInputBar/useNavigationLogic.ts` - Command handling
  - `packages/frontend/src/components/ui/Tabs/Tabs.module.css` - Fixed overflow clipping

### Full-Screen Image Drag and Drop Feature (Dec 2, 2025)
- **Feature**: Added ability to drag and drop an image file anywhere on the app screen for AI analysis
- **Implementation**:
  - Created shared spawn input text state in Zustand store
  - Full-screen drop zone covers entire application
  - Image description generated via vision AI endpoint
  - Results automatically added to spawn input textarea
- **Components**:
  - App-level drop handling with visual overlays
  - Textarea paste handling for direct image pasting
  - Progress indicators during analysis
- **Files Added/Modified**:
  - `packages/backend/src/engine/generation/prompts/shared/visionDescription.ts` - Neutral image description prompt
  - `packages/backend/src/engine/generation/prompts/shared/index.ts` - Export for vision prompt
  - `packages/backend/src/routes/mzoo/ai.ts` - Updated to import prompt from shared location
  - `packages/frontend/src/store/slices/spawnSlice.ts` - Added spawn input text state
  - `packages/frontend/src/features/spawn-input/SpawnInputBar/useSpawnInputLogic.ts` - Updated to use store state
  - `packages/frontend/src/features/app/components/App/App.tsx` - Added full-screen drop handlers
  - `packages/frontend/src/features/app/components/App/App.module.css` - Added overlay styles
  - `packages/frontend/src/features/spawn-input/SpawnInputBar/SpawnInputBar.tsx` - Updated for paste handling
- **User Experience**:
  - Visual overlay appears when dragging images anywhere
  - Loading spinner during analysis
  - Error handling for invalid files or failed analysis
  - Works for both characters and locations

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
- Added full-screen image drop zone for improved UX
- **World tree pipeline refactored:** Image is now generated immediately after prompt parsing, before DNA, so user sees image ~13s faster.
- **DNA cleanup:** Legacy fields (`semantic`, `visual`, `profile`) are no longer added to DNA in worlds.json.
- **Bugfix:** WorldTreeBuilder no longer injects old schema fields into DNA.
- Data storage optimization complete
- Removed redundant nested data from both worlds.json and characters.json
- Fixed nested dna.dna issue in world tree generation
- Added full-screen image drop zone for improved UX

## Next Steps
- Test with fresh database to verify clean data structure
- Monitor storage efficiency improvements
- Consider similar cleanup for other data structures if needed
- Test image drag and drop feature with different file types and sizes
- Monitor world tree pipeline for correct image timing and DNA structure
- Test with fresh database to verify clean data structure
- Monitor storage efficiency improvements
- Consider similar cleanup for other data structures if needed
- Test image drag and drop feature with different file types and sizes
