# Morfeum 2 - Development Progress

## Recent Updates

### Spawn Cancellation Fix (October 30, 2025 - 11:56 AM)

**Completed:**
- ✅ Added AbortController tracking in spawn routes
- ✅ Implemented abort signal checks between pipeline stages
- ✅ Wired DELETE endpoint to properly cancel active pipelines
- ✅ Added `hierarchy:cancelled` event type to SpawnEvent interface
- ✅ Added frontend event listeners for cancellation events
- ✅ Pipelines now stop immediately when X button clicked

**Problem Identified:**
The new engine routes (`/api/spawn/engine/start` and `/api/spawn/location/start`) were running pipelines in async IIFE functions without any abort mechanism. When users clicked the X button to cancel a spawn, the frontend called DELETE but the backend continued executing all pipeline stages, wasting API calls and resources.

**Solution:**
Implemented proper cancellation using AbortController pattern:
1. **Tracking Map**: Created `activeAbortControllers` Map to store controllers by spawnId
2. **Controller Creation**: Each spawn creates an AbortController when starting
3. **Checkpoint Pattern**: Added abort signal checks after each major pipeline stage
4. **Cleanup**: Controllers removed from Map in finally blocks
5. **Event Flow**: Emit `spawn:cancelled` or `hierarchy:cancelled` when aborted
6. **Frontend Handling**: Event listeners remove spawn from UI immediately

**Files Modified:**
- `packages/backend/src/routes/spawn.ts`:
  - Added `activeAbortControllers` Map for tracking
  - Character pipeline: 4 abort checkpoints (after seed, image, analysis, enrichment)
  - Location pipeline: 4 abort checkpoints (after classification, image, analysis, DNA)
  - DELETE endpoint: Aborts controller and cleans up from Map
  - Error handling: Distinguishes between abort and other errors

- `packages/backend/src/services/eventEmitter.ts`:
  - Added `hierarchy:cancelled` to SpawnEvent type union

- `packages/frontend/src/hooks/useSpawnEvents.ts`:
  - Added `hierarchy:cancelled` event listener
  - Added `hierarchy:error` event listener
  - Both remove spawn from active spawns UI

**Result:**
Cancellation works correctly for both character and location pipelines:
- Click X → Frontend calls DELETE → Backend aborts controller
- Pipeline checks abort signal between stages → Exits immediately if aborted
- Cancellation event emitted → Frontend removes spawn from UI
- No wasted API calls after cancellation
- Proper cleanup prevents memory leaks

**Checkpoint Locations:**

*Character Pipeline:*
1. After seed generation
2. After image generation
3. After visual analysis
4. After profile enrichment

*Location Pipeline:*
1. After hierarchy classification
2. After image generation
3. After visual analysis
4. After DNA generation

Each checkpoint exits early if `abortController.signal.aborted` is true.

---

### Backend Prompts System Consolidation (October 30, 2025 - 10:06 AM)

**Completed:**
- ✅ Moved entire prompts system into `engine/generation/prompts/` structure
- ✅ Consolidated types.ts and languages/en into engine
- ✅ Merged getPrompt() API into engine/generation/prompts/index.ts
- ✅ Updated 4 import paths across codebase
- ✅ Deleted old `packages/backend/src/prompts/` directory
- ✅ TypeScript compilation clean

**Problem Identified:**
Prompts system split between `src/prompts/` (API layer) and `engine/generation/prompts/` (content). This created:
1. Duplication and confusion about where prompts live
2. Extra directory to maintain
3. Import paths spanning multiple directories

**Solution:**
Consolidated everything into engine structure:
- Moved `prompts/types.ts` → `engine/generation/prompts/types.ts`
- Moved `prompts/languages/en/index.ts` → `engine/generation/prompts/languages/en.ts`
- Added `getPrompt()` function to `engine/generation/prompts/index.ts`
- Updated all import paths to point to engine
- Deleted entire old prompts directory

**Files Moved:**
- `src/prompts/types.ts` → `src/engine/generation/prompts/types.ts`
- `src/prompts/languages/en/index.ts` → `src/engine/generation/prompts/languages/en.ts`

**Files Modified:**
- `engine/generation/prompts/index.ts`: Added getPrompt() function and type exports
- `engine/generation/prompts/languages/en.ts`: Fixed import paths to use relative paths
- `engine/generation/characterPipeline.ts`: Changed from `../../prompts` to `./prompts`
- `routes/mzoo/prompts.ts`: Changed from `../../prompts` to `../../engine/generation/prompts`
- `services/navigator/index.ts`: Changed from `../../prompts/languages/en` to `../../engine/generation/prompts/languages/en`

**Files Deleted:**
- Entire `packages/backend/src/prompts/` directory and contents

**Result:**
Single unified location for all prompt-related code:
```
engine/generation/prompts/
├── index.ts              (exports + getPrompt API)
├── types.ts              (type definitions)
├── languages/
│   └── en.ts            (English prompt aggregator)
├── characters/          (character generation)
├── locations/           (location generation)
├── navigation/          (navigation prompts)
├── chat/                (chat interactions)
├── shared/              (constants, filters, instructions)
└── samples/             (sample prompts)
```

All consumers now import from a single location. Clean architecture with co-located content and API.

---

### Save Location Refactoring (October 29, 2025 - 1:13 PM)

**Completed:**
- ✅ Created hierarchyParser utility to convert nested JSON to flat nodes + tree structure
- ✅ Updated terminology throughout codebase: `'world'` → `'host'`, `'sublocation'` → `'niche'`
- ✅ Fixed DNA structure to always use meta/semantic/profile format
- ✅ Fixed array type errors with ensureArray() helper
- ✅ Fixed ChatTabs to display all nodes with hierarchy indicators
- ✅ Fixed entity session creation for manual and auto-load paths
- ✅ Added timing delay fix for React batching issue

**Problem Identified:**
Backend generates nested hierarchies (host → regions → locations → niches), but frontend needs:
1. Flat storage for vector search
2. Tree structure for hierarchy display
3. Entity sessions for all nodes to appear in ChatTabs
4. Consistent terminology throughout codebase

**Solution:**
- Created `hierarchyParser.ts` utility that converts nested JSON into flat nodes + tree structure
- Updated all type references from 'world' to 'host' and 'sublocation' to 'niche'
- Added `ensureArray()` helper to handle string/array field mismatches
- Fixed entity session creation in three code paths:
  1. New generation (useSpawnEvents.ts) - creates sessions for ALL nodes
  2. Manual load (SavedLocationsModal) - creates sessions for ALL nodes in tree
  3. Auto-load (App.tsx) - creates sessions for ALL pinned nodes in tree
- Added 50ms delay before modal close to fix React batching issue

**Files Created:**
- `packages/frontend/src/utils/hierarchyParser.ts` - Hierarchy parser utility with extraction functions

**Files Modified:**
- `packages/frontend/src/store/slices/locationsSlice.ts`: NodeType updated to use 'host' and 'niche'
- `packages/frontend/src/hooks/useSpawnEvents.ts`: 
  - Entity session creation for all nodes in hierarchy
  - Updated type checks from 'world' to 'host'
  - Uses hierarchyParser for all hierarchy:complete events
- `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.tsx`: Updated type check to 'host'
- `packages/frontend/src/features/saved-locations/SavedLocationsModal/useSavedLocationsLogic.ts`:
  - Entity session creation for all nodes in tree
  - 50ms delay before modal close
  - Debug logging for troubleshooting
- `packages/frontend/src/features/app/components/App/App.tsx`: Updated type check from 'world' to 'host' in auto-load

**Result:**
All three location loading paths now work correctly:
1. **New generation** - ChatTabs shows all 4 levels immediately with hierarchy indicators
2. **Manual load** - All nodes appear with proper indentation when loading from modal
3. **Auto-load** - Pinned locations show complete hierarchy on page refresh

Data structure:
- Flat `nodes` map for efficient lookup and future vector search
- Nested `worldTrees` array for hierarchy display and depth calculation
- All DNA properly structured as meta/semantic/spatial/render/profile
- No data loss during parse/save/load cycle

---

### Navigation System Cleanup (October 29, 2025 - 7:59 AM)

**Completed:**
- ✅ Removed unused navigation UI components (NavigationInput, LocationTreePanel)
- ✅ Disabled image generation for navigation 'generate' actions
- ✅ Navigation decisions still work and log to console for debugging
- ✅ 'Move' actions still functional for navigating between existing nodes
- ✅ Backend navigation decision system remains intact and working

**Problem Identified:**
Redundant UI components created during navigation system development. User wanted:
1. No automatic spawning/image generation from navigation commands
2. Cleaner UI without duplicate location tree panels

**Solution:**
- Removed entire `packages/frontend/src/features/navigation/` directory
- Modified `useLocationPanel.ts` to comment out `handleGenerateAction()` call
- Added console logging to show what would be generated without actually doing it
- Kept 'move' actions functional for navigating between existing nodes

**Files Removed:**
- `packages/frontend/src/features/navigation/` - Entire directory with NavigationInput and LocationTreePanel

**Files Modified:**
- `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts`:
  - Commented out spawn trigger in 'generate' action handling
  - Added detailed console logging for debugging
  - Preserved 'move' action functionality

**Result:**
Cleaner codebase with navigation analysis working (logs to console) but no automatic spawning or image generation. LocationPanel remains the single source of truth for location navigation UI.

**Current Behavior:**
- Type "Go to kitchen" → AI analyzes command → Logs decision to console → No spawning
- Type "Go to [existing location]" → AI analyzes → Moves to that location
- Backend navigation decision API fully functional and ready for future use

---

### Navigation Decision System (October 28, 2025 - 3:25 PM)

**Completed:**
- ✅ Created AI navigation decision prompt (`navigationDecision.ts`)
- ✅ Implemented `/api/mzoo/navigation/decide` backend route
- ✅ Fixed AI response parsing to extract text from MZOO service wrapper
- ✅ Connected existing LocationPanel to new navigation API
- ✅ Created NavigationInput component with travel suggestions
- ✅ Created LocationTreePanel component for hierarchical display
- ✅ Updated terminology: "world" → "host", "sublocation" → "niche"
- ✅ Added View interface to locationsSlice for multi-view support

**Problem Solved:**
Navigation system was disabled during backend refactoring. Users couldn't travel to new locations or navigate the world tree.

**Solution:**
Built complete AI-powered navigation decision system:
- AI analyzes user commands (e.g., "Go to kitchen")
- Returns structured decisions: `move` (existing node), `generate` (new node), or `look` (view change)
- Provides scale hints (macro/area/site/interior/detail) for proper node generation
- Supports spatial relationships (child/sibling/parent/distant)
- Handles navigableElements as suggestions

**Files Created:**
- `packages/backend/src/engine/generation/prompts/navigationDecision.ts` - AI prompt
- `packages/backend/src/routes/mzoo/navigation.ts` - Navigation route handler
- `packages/frontend/src/features/navigation/NavigationInput/*` - New component
- `packages/frontend/src/features/navigation/LocationTreePanel/*` - Tree display component

**Files Modified:**
- `packages/backend/src/routes/mzoo/index.ts` - Mounted navigation router
- `packages/frontend/src/store/slices/locationsSlice.ts` - Added View interface
- `packages/frontend/src/features/entity-panel/components/LocationPanel/locationNavigation.ts` - Connected to API

**Result:**
Navigation system fully functional. AI correctly analyzes commands and returns:
- Action type (move/generate/look)
- Target information (nodeId, parentId, name)
- Scale hints for generation
- Reasoning for decision

Users can now type "Go to kitchen" and AI determines whether to move to existing kitchen or generate new one as child/sibling with appropriate scale.

**Next Steps:**
- Wire up decision actions to actually execute (update focus, trigger spawn, create views)
- Test end-to-end navigation flow with image generation

---

### Image Prompt Generation Enhancement (October 28, 2025 - 2:00 PM)

**Completed:**
- ✅ Fixed `buildNodeChain()` to pass complete node objects instead of simplified copies
- ✅ Updated `locationImageGeneration()` to accept properly typed `HierarchyNode[]`
- ✅ Removed unsafe type casts with type-safe property checks (`'looks' in targetNode`)
- ✅ Removed debug `console.log()` per project logging guidelines
- ✅ Verified build completes successfully with no TypeScript errors

**Problem Solved:**
Visual enrichment fields (`looks`, `atmosphere`, `mood`) from `hierarchyCategorization` were being stripped out by `buildNodeChain` before reaching `locationImageGeneration`. This resulted in weak, generic image prompts.

**Solution:**
- Changed `buildNodeChain` to return complete `HierarchyNode[]` objects
- Updated function signatures and imports for proper type safety
- Data now flows correctly: hierarchyCategorization → buildNodeChain → locationImageGeneration

**Files Modified:**
- `packages/backend/src/routes/spawn.ts`: Updated buildNodeChain function and added HierarchyNode import
- `packages/backend/src/engine/generation/prompts/locationImageGeneration.ts`: Updated types and removed unsafe casts

**Result:**
Image generation prompts now include rich visual descriptions (looks, atmosphere, mood) for significantly better Flux image generation.

### Location Information Modal Enhancement (October 28, 2025 - Earlier)

**Completed:**
- ✅ Updated LocationInfoModal to handle new hierarchy structure from `hierarchy:complete` events
- ✅ Added support for flat structure data mapping (direct properties on location objects)
- ✅ Hidden focus section by default (can be enabled for debugging)
- ✅ Fixed Region and World name mapping to check flat structure first
- ✅ Added visual analysis field support (dominantElements, spatialLayout, uniqueIdentifiers)
- ✅ Added materials and colors mapping for flat structure
- ✅ Added navigableElements display
- ✅ Added DNA subsection display (architectural_tone, cultural_tone, soundscape_base)
- ✅ Imported CollapsiblePanel component for future use

**Key Changes:**
- Modal now properly displays hierarchy data from new generation pipeline
- Supports both old nested structure and new flat structure
- Maps `host` → `world`, `regions[0]` → `region`, `locations[0]` → `location`
- All rich location data now displays correctly (looks, atmosphere, mood, materials, etc.)

**Files Modified:**
- `packages/frontend/src/features/chat/components/LocationInfoModal/LocationInfoModal.tsx`
- `packages/frontend/src/features/chat/components/LocationInfoModal/useLocationInfoLogic.ts`

**Remaining Enhancement (Future):**
- Complete collapsible parent nodes implementation (show current node expanded, parent nodes collapsed)

**Result:**
Information modal now displays comprehensive location data instead of just "N/A" values.

## Previous Work

### World System Architecture (October 2025)
- Hierarchical location generation pipeline implemented
- DNA merging and cascading system functional
- Visual analysis integration working
- Memory system operational with activeContext tracking

### UI Components
- CollapsiblePanel component available for hierarchical displays
- Modal system supports complex nested content
- Entity panels display location information properly

## Current Status

**Location System:** ✅ Fully Operational
- Hierarchies generate correctly with all 4 levels (host/region/location/niche)
- Parser converts nested JSON to flat storage + tree structure
- ChatTabs displays full hierarchy with indentation
- All three load paths working (new/manual/auto)
- Data structure ready for vector search integration

**Navigation System:** ✅ Backend Complete, Frontend Minimal
- AI decision system analyzes travel commands
- Returns action types with context
- Currently logs decisions to console
- Ready to re-enable when needed

**Memory Bank:** ✅ Updated
- Active context reflects latest work
- Progress documentation current
- All architectural decisions documented
