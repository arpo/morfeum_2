# Active Context

## Recent Changes (2025-11-25)

### Progress Bar Fix for Navigation Slash Commands (Nov 25, 2025)
- **Fixed missing progress bar for new slash command navigation** - Progress indicators now properly show for `/GO_INSIDE` and other slash commands
- **Root Cause:** 
  - The new slash command implementation in `useLocationPanel.ts` was using manual `EventSource` instead of the unified spawn tracking system
  - This bypassed the `activeSpawns` store that the SpawnInputBar reads from to display progress bars
- **Solution:**
  - Replaced manual EventSource handling with `registerExternalSpawn` call
  - This properly adds navigation commands to the spawn store
  - Now follows the same pattern established on Nov 24 for `locationNavigation.ts`
- **Benefits:**
  - Progress bar now shows and animates through all 4 steps
  - First SSE event delivers `steps` and `pipelineType` from backend
  - Complete integration with shared spawn tracking system
  - Maintains consistent progress tracking across all entity generation
- **Files Modified:**
  - `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts`
- **Result:** Unified progress tracking for all navigation, regardless of whether using LLM classification or direct slash commands

## Recent Changes (2025-11-25)

### Slash Command Input & Navigation Centralization (Nov 25, 2025)
- **Created reusable SlashCommandInput component** - Modern command palette-style input for navigation
- **Component Features:**
  - Type `/` to show dropdown of navigation commands
  - Keyboard navigation (Up/Down arrows, Enter to select, Escape to close)
  - Auto-scrolling active items into view
  - Dark theme styling with white text and light overlay for hover/active states
  - Format: `/COMMAND text` (e.g., `/GO_TO_ROOM go to kitchen`)
  - Props: `commands: readonly string[]`, `value`, `onChange`, `placeholder`, `disabled`, `onKeyPress`, `className`
- **Centralized Navigation Commands:**
  - Created `packages/backend/src/config/navigation.ts` as single source of truth
  - Exported NAVIGATION_COMMANDS array (12 intents: GO_INSIDE, GO_OUTSIDE, GO_TO_ROOM, etc.)
  - Both frontend and backend can import the same constants
- **Monorepo Import Configuration:**
  - Added `@backend/*` path alias to `packages/frontend/tsconfig.json`
  - Added `@backend` alias to `packages/frontend/vite.config.ts`
  - Frontend imports from: `import { NAVIGATION_COMMANDS } from '@backend/config/navigation'`
  - Imports directly from navigation file (browser-safe) to avoid Node.js-specific files
- **Location Panel Updates:**
  - Replaced "Travel" button with "Go"
  - Removed "Create image" checkbox
  - Updated `handleMove` to parse slash command format (`/COMMAND text`)
  - Logs command and text separately to console for debugging
  - Input field uses new SlashCommandInput component
- **CSS Fixes:**
  - SlashCommandInput container uses `flex: 1` for proper flexbox layout
  - Input has `box-sizing: border-box` to prevent overflow with padding
  - Clean layout without wrapper issues
- **Files Created:**
  - `packages/frontend/src/components/ui/SlashCommandInput/SlashCommandInput.tsx`
  - `packages/frontend/src/components/ui/SlashCommandInput/SlashCommandInput.module.css`
  - `packages/backend/src/config/navigation.ts`
- **Files Modified:**
  - `packages/frontend/tsconfig.json` (added @backend path alias)
  - `packages/frontend/vite.config.ts` (added @backend alias)
  - `packages/frontend/src/features/entity-panel/components/LocationPanel/LocationPanel.tsx`
  - `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts`
  - `packages/backend/src/config/index.ts` (exports navigation)
- **Result:** Modern command interface with centralized command definitions accessible to both frontend and backend

## Recent Changes (2025-11-24)

### Old Navigation System Removal (Nov 24, 2025)
- **Removed deprecated LLM-based navigation system** - Complete cleanup of legacy navigator service
- **Investigation findings:**
  - Discovered `navigationDecision.ts` was completely unused (types existed elsewhere, function never called)
  - Found `navigatorSemanticNodeSelector.ts` used only in deprecated `/navigator` service
  - Two parallel navigation systems running: `/navigator` (old) and `/navigation` (new)
  - Old system: Single LLM prompt for all decisions
  - New system: Intent classifier + deterministic routing
- **Complete removal:**
  - Deleted `services/navigator/` directory (5 files: index, types, config, processors)
  - Deleted `navigator.service.ts` re-export file
  - Deleted `routes/mzoo/navigator.ts` endpoint
  - Deleted `engine/generation/prompts/navigation/navigatorSemanticNodeSelector.ts` (500+ line prompt)
  - Removed `/navigator` route registration from mzoo router
- **Updated references:**
  - `routes/mzoo/index.ts` - Removed navigator route import and registration
  - `prompts/navigation/index.ts` - Removed navigatorSemanticNodeSelector export
  - `prompts/languages/en.ts` - Removed import and export
  - `prompts/types.ts` - Removed from PromptTemplates interface
- **Result:** 
  - Clean architecture with single navigation system (engine-based)
  - Only `/mzoo/navigation` endpoint remains
  - Zero TypeScript errors after cleanup
  - Clearer codebase aligned with REASSEMBLY_PLAN.md intent

### Progress Bar Bugfix & Animation Improvements (Nov 24, 2025)
- **Bug Fixed:** Progress bar now appears immediately and animates smoothly for all pipelines (character, location, navigation).
- **Root Cause:** Race condition between backend pipeline start and frontend SSE connection caused the first step's progress event to be missed, so the bar was hidden or static.
- **Frontend Fixes:**
  - `spawnSlice.ts`: Consolidated SSE logic into `monitorSpawnProgress` helper.
  - `locationNavigation.ts`: Removed manual SSE handling logic. Now calls `spawnSlice.registerExternalSpawn()` to delegate progress tracking.
  - `useProgressAnimation.ts`: Now uses `useState`/`useEffect` to animate from 0% to the target progress on mount.
- **Backend/Config:**
  - `createNodePipeline.ts`: Updated to return full data (`imageUrl`, `imagePrompt`, `node`) in the completion event, ensuring frontend receives all context via the unified callback.
- **Result:** Progress bar is visible and animates correctly for all pipelines. Navigation logic is now aligned with the rest of the app (no duplicate SSE code).

### Pipeline Progress Bar Integration (Nov 24, 2025)
- **Fully integrated progress bars for all three pipelines** - Character, Location, and Navigation spawns now show real-time progress
- **Single Source of Truth:** Created `pipelineConfig.ts` for centralized pipeline configuration
  - All step definitions (names, IDs, durations) in one place
  - Navigation intent registry maps intents to pipeline types
  - Easy to update timings and add new pipelines
- **Backend Integration:**
  - Updated all routes (`/spawn/engine/start`, `/spawn/location/start`, `/mzoo/navigation/analyze`)
  - Routes store config in SSEService before starting pipelines
  - SSEService sends config in first SSE event with `pipelineType` and `steps`
  - All three pipelines use PipelineHelper for consistent SSE events
- **Frontend Integration:**
  - Character & Location: Already working via spawnSlice
  - Navigation: Refactored `locationNavigation.ts` to delegate SSE handling to `spawnSlice` via `registerExternalSpawn`.
  - Removed all manual SSE handling code from navigation logic.
  - All spawns now use the exact same `monitorSpawnProgress` logic in `spawnSlice`.
- **Progress Bar Component:**
  - Step-based animation with individual step durations
  - Dynamic color transition (purple → blue)
  - Hover tooltips with step names
  - Auto-removes after completion (2s) or error (5s)
  - Component follows strict separation rules (TSX = JSX only)
- **Code Quality:**
  - Consistent architecture across all three pipelines
  - Single SSE utility (`setupSSEConnection`) used by all
  - No code duplication
  - Clean, maintainable, follows .clinerules
- **Result:** Beautiful animated progress bars for all spawn operations! 🎉

## Recent Changes (2025-11-21)

### Unified Utility Architecture (Nov 21, 2025)
- **Created comprehensive utility modules** to eliminate all duplicate logic across spawn management, tree navigation, and entity sessions
- **Backend utilities** (`packages/backend/src/engine/pipelines/shared/`):
  - `pipelineHelpers.ts` - PipelineHelper class for unified SSE events, timing, and logging
  - `entityPersistence.ts` - Unified save/pin logic for all entity types
- **Frontend utilities** (`packages/frontend/src/utils/`):
  - `spawn/sseConnection.ts` - Unified SSE setup for all entity types
  - `spawn/completionHandlers.ts` - Unified completion logic (characters & locations)
  - `tree/navigation.ts` - Tree traversal functions (findDeepestNodeId, getAncestors, findNodeInTree)
  - `tree/expansion.ts` - Tree expansion management (expandTreeToNode, collapseTree)
  - `entity/sessionManager.ts` - Entity session creation and activation
- **Refactored all three pipelines** to use PipelineHelper:
  - `characterPipeline.ts` - Now uses PipelineHelper (~190 lines removed)
  - `worldTreePipeline.ts` - Now uses PipelineHelper (~100 lines removed)
  - `createNodePipeline.ts` - Now uses PipelineHelper (~80 lines removed)
- **Fixed tree unfolding bug**:
  - Added `expandedNodeIds` state to locations store (uiSlice)
  - Updated expansion utility to trigger store updates (not just localStorage)
  - Updated TreeView to listen to store changes and re-render
  - New world trees now automatically unfold to deepest node ✅
- **Code reduction:** ~470 lines of duplicate code eliminated
- **Consistent timing logs:** All pipelines now show formatted timing breakdown
- **Result:** Single source of truth for all spawn/tree/entity operations

### Earlier Changes
- TreeView now persists expanded/collapsed state in localStorage (`persistenceKey`).
- EntityExplorer highlights the selected node with a distinct color.
- Last selected entity is saved to localStorage and restored on app load.
- App.tsx initialization prefers restoring last selected entity from localStorage.
- No breaking changes to store or API.

## Current State (Nov 2025)
The Morfeum application is in active development with core systems operational.

### Recent Work Completed

- **Development Features Cleanup (Nov 20, 2025):**
  - **Removed all development-only UI and SSE infrastructure** - Complete cleanup of temporary dev features
  - **What was removed:**
    1. **SSE (Server-Sent Events) System:**
       - Frontend: Deleted `useSpawnEvents` hook entirely
       - Backend: Removed `/events` SSE endpoint
       - Backend: Deleted `eventEmitter.ts` service
       - Backend: Removed all 14 `eventEmitter.emit()` calls from spawn routes
       - No more real-time progress updates
    2. **UI Components:**
       - Deleted `world-trees-panel/` directory (pinned worlds tree view)
       - Deleted `spawn-panel/` directory (ActiveSpawnsPanel with progress bars)
       - Deleted `entity-tabs/` directory (entity navigation tabs)
       - Removed entire left sidebar from App.tsx
    3. **State Management:**
       - Deleted `spawnManagerSlice.ts` (spawn tracking state)
       - Updated store index to remove spawn manager slice
  - **Impact:**
    - ~500+ lines of development-only code removed
    - Cleaner codebase focused on core custom experiences
    - Spawn functionality still works via direct API calls
    - No progress tracking UI or real-time updates
  - **Files Modified:**
    - `packages/frontend/src/features/app/components/App/App.tsx` (removed imports and sidebar)
    - `packages/frontend/src/store/index.ts` (removed spawn manager slice)
    - `packages/backend/src/routes/spawn.ts` (removed SSE endpoint and emit calls)
  - **Files Deleted:**
    - `packages/frontend/src/hooks/useSpawnEvents.ts`
    - `packages/frontend/src/features/world-trees-panel/` (entire directory)
    - `packages/frontend/src/features/spawn-panel/` (entire directory)
    - `packages/frontend/src/features/entity-tabs/` (entire directory)
    - `packages/frontend/src/store/slices/spawnManagerSlice.ts`
    - `packages/backend/src/services/eventEmitter.ts`
  - **Result:** Streamlined application without development UI clutter

- **Architectural Consistency & DNA Enrichment (Nov 19, 2025):**
  - **Fixed major inconsistency** where exterior/interior didn't match:
    - Wood manor exteriors generated stone cathedral interiors
    - Architectural style (Gothic) overrode functional identity (Residential)
    - Missing DNA fields caused incomplete context
  - **Key Changes:**
    1. **Functional Identity Enforcement** (`interiorInstructions.ts`):
       - Added FUNCTIONAL IDENTITY rules (highest priority)
       - Function > Style: "Gothic Manor" = Manor first, Gothic second
       - Anti-Drift rules: Prevent church vocabulary for houses
       - Generic solution works for any structure type (Manor, Factory, Temple, etc.)
    2. **Complete DNA Passing** (`nicheImagePrompt.ts`):
       - Fixed missing scene fields (atmosphere, colorsAndLighting, mood, sounds)
       - Fixed missing material/color breakdowns (primary_surfaces, dominant, ambient)
       - Reorganized into "Scene-Specific Details" vs "Cascading Style Attributes"
       - Added Functional Context injection to guide LLM on building type
    3. **DNA Cascading** (mergeDNA integration):
       - Implemented proper parent→child DNA inheritance using mergeDNA
       - Fixed string "null" vs JSON null issue in completeDNAGeneration.ts
       - cultural_tone and other cascading fields now inherit properly
    4. **Rich DNA Descriptions** (`completeDNAGeneration.ts`):
       - Added examples of detailed architectural_tone
       - "decaying grandeur" → "decaying Victorian grandeur with ornate Gothic arches, weathered neoclassical columns, elaborate carved molding"
       - Fixed JSON null vs string "null" guidance
  - **Files Modified:**
    - `packages/backend/src/engine/generation/prompts/navigation/interiorInstructions.ts`
    - `packages/backend/src/engine/generation/prompts/navigation/nicheImagePrompt.ts`
    - `packages/backend/src/engine/generation/prompts/locations/completeDNAGeneration.ts`
  - **Result:** Interiors now properly reflect exterior function AND style while maintaining consistency

- **Niche Nesting Bug Fix (Nov 18, 2025):**
  - **Fixed critical bug** - Niches were being nested inside other niches instead of being siblings under parent location
  - **Root cause identified:** Frontend was hardcoding `type: 'location'` for all nodes sent to backend
  - **Triple fix required:**
    1. **Backend handler (basicMovement.ts):**
       - Created `findParentLocationNode()` helper in navigationHelpers.ts
       - Updated `handleGoInside()` to traverse up to parent location when current is niche
       - Now creates sibling niches under parent location instead of nested children
    2. **Backend DNA extraction (createNodePipeline.ts):**
       - Fixed DNA inheritance to use parent location's DNA, not current niche's DNA
       - Uses `findParentLocationNode()` to get correct location DNA for cascading
    3. **Frontend context building (locationNavigation.ts):**
       - **Critical fix:** Changed `type: 'location' as const` to `type: currentNode.type`
       - Backend now receives correct node type ('niche' vs 'location') and routes to proper handler
       - Added `type` field to SpatialNode interface
    4. **Frontend tree insertion (useLocationPanel.ts):**
       - Updated to use `parentNodeId` from backend decision instead of `currentNode.id`
       - Respects backend's correct parent location ID
  - **Result:** Clean tree structure with niches as siblings:
    ```
    location
      ├─ niche #1
      └─ niche #2  ✅ Siblings under location
    ```
    Instead of broken nested structure:
    ```
    location
      └─ niche #1
          └─ niche #2  ❌ Nested (old bug)
    ```

- **Focus System Removal (Nov 18, 2025):**
  - **Removed unused focus tracking system** - Deep investigation revealed focus was never actually used
  - **Analysis findings:**
    - Focus methods existed but had zero actual usage across entire codebase
    - `focus.node_id` was redundant (duplicated `node.name`)
    - `focus.perspective` was misnamed - described space TYPE not navigation state
  - **Replaced with spaceType:**
    - Added `spaceType: 'interior' | 'exterior'` directly to Node interface
    - Logic: 'exterior' for host/region/location, 'interior' for niche nodes
    - Cleaner, more intuitive, describes what the space IS
  - **Backend changes:**
    - `nodeBuilder.ts` - Removed FocusConfig, added SpaceType
    - Nodes now have direct `spaceType` field
  - **Frontend changes:**
    - Removed FocusState interface from types
    - Removed focus methods from uiSlice (updateNodeFocus, getNodeFocus, ensureFocusInitialized)
    - Updated legacySlice to use spaceType
    - Deleted `locationFocus.ts` utility file
    - Fixed 14 TypeScript errors across 5 files:
      - hierarchyParser.ts - Uses spaceType during parsing
      - useSpawnEvents.ts - Uses spaceType when creating nodes
      - useLocationPanel.ts - Removed unused focus update logic
      - LocationInfoModal files - Removed focus state dependency
  - **Data migration:**
    - Removed focus objects from all nodes in worlds.json
    - Added spaceType field to all 4 existing nodes
  - **Result:** Cleaner data model, no redundant state tracking, ~100 lines of code removed

- **DNA Structure Cleanup (Nov 18, 2025):**
  - **Fixed critical DNA nesting bug** - DNA was being double-wrapped in worlds.json storage
  - **Root cause:** `nodeDNAExtractor.ts` was returning entire node instead of just `node.dna`
  - **Backend fixes:**
    - Moved visual analysis merging from `spawn.ts` to `worldTreePipeline.ts`
    - Scene fields now properly go to `node.dna` (looks, atmosphere, colorsAndLighting, etc.)
    - Structural fields go to `node` root (navigableElements, dominantElements, uniqueIdentifiers, slug, searchDesc)
    - Added `imageUrl` to BaseHierarchyNode type
  - **Frontend fixes:**
    - Fixed `nodeDNAExtractor.ts` to return ONLY `node.dna` property
    - Updated `hierarchyParser.ts` to copy structural fields from backend nodes
  - **Navigation generation fixes:**
    - Updated `nodeDNAGeneration.ts` prompt to generate structural fields alongside DNA
    - Changed `generateNodeDNA()` return type to include both DNA and structural fields
    - Updated `buildNode()` to accept structural fields as options
    - Updated `createNodePipeline.ts` to pass structural fields through
  - **Result:** Clean node structure in worlds.json:
    - Root level: `type`, `name`, `navigableElements`, `dominantElements`, `uniqueIdentifiers`, `slug`, `searchDesc`
    - `dna` property: Scene/cascading fields ONLY
    - Works for both world tree generation AND niche creation (GO_INSIDE)

- **Pipeline Architecture Refactor (Nov 18, 2025):**
  - **Unified pipeline structure** - All standalone entity generators consolidated in `engine/pipelines/`
  - **Created shared utilities** - Extracted common code to `pipelines/shared/`:
    - `imageGeneration.ts` - Common image operations (generateImage, fetchImageAsBase64)
    - `visualAnalysis.ts` - Common analysis logic (analyzeImageWithPrompt)
    - `pipelineLogger.ts` - Consistent timing/logging (PipelineTimer class)
  - **Renamed for consistency:**
    - `batchDNAGenerator.ts` → `worldTreePipeline.ts`
    - `createLocationNodePipeline.ts` → `createNodePipeline.ts`
  - **Updated characterPipeline.ts** to use shared utilities
  - **Maintained separation** - Navigation pipelines stay in `navigation/pipelines/` (context-dependent)
  - Deleted duplicate files and verified TypeScript compilation (0 errors)

- **Niche Image Prompt Modularization (Nov 18, 2025):**
  - Refactored monolithic `nicheImagePrompt.ts` (700 lines) into modular architecture:
    - `nicheImagePrompt.ts` - Main orchestrator (114 lines, 84% reduction)
    - `creativityInstructions.ts` - Conservative/moderate/bold creativity levels (78 lines)
    - `exteriorInstructions.ts` - All exterior space rules (142 lines)
    - `interiorInstructions.ts` - All interior space rules (113 lines)
  - Used template system with `{{CREATIVITY_INSTRUCTIONS}}` placeholder
  - Benefits: Single responsibility, easy updates, clean separation of concerns

- **Cleanup of Unused Prompt System (Nov 18, 2025):**
  - Identified and removed failed modular preset system that was never used:
    - Deleted `presets/` folder (exteriorPreset, interiorPreset, spaceTypePresets)
    - Deleted `nichePromptBase.ts`, `promptSections.ts`, `styles/` folder
    - Cleaned up empty `niches/` folder and backup files
  - Kept working monolithic prompt system (now modularized)
  - Verified no orphaned imports remain

- **Navigation Features Parameter Fix (Nov 14, 2025):**
  - Fixed critical bug where "interior" was being passed as navigationFeatures instead of spaceType
  - Removed unused navigationFeatures parameter entirely from the function chain
  - Updated nicheImagePrompt, imagePromptGeneration, and all preset functions
  - Interior scenes now correctly generate with proper interior-specific instructions
  - Cleaner code without unnecessary undefined parameters

### Core Systems Status
- **Prompt Generation:** All narrative blocks now context-driven, using shared builders and node DNA. Modular architecture for niche prompts.
- **Pipeline Architecture:** Unified structure with shared utilities, consistent naming, DRY code.
- **Navigation System:** NavigatorAI for spatial movement (frontend generate action still disabled).
- **Tree-Based Architecture:** Nodes (flat storage) + World Trees (nested structure).
- **Event System:** SSE for real-time spawn updates.

### Architecture Overview

**Pipelines:**
```
engine/pipelines/              # Standalone entity generators
├── characterPipeline.ts       # Character generation
├── worldTreePipeline.ts       # World tree generation
└── shared/                    # Shared utilities
    ├── imageGeneration.ts
    ├── visualAnalysis.ts
    └── pipelineLogger.ts

navigation/pipelines/          # Navigation utilities
└── createNodePipeline.ts      # Node creation during navigation
```

**Prompt Modules:**
```
prompts/navigation/
├── nicheImagePrompt.ts        # Main orchestrator
├── creativityInstructions.ts  # Creativity levels
├── exteriorInstructions.ts    # Exterior rules
└── interiorInstructions.ts    # Interior rules
```

**UI Components:**
```
components/ui/ProgressBar/
├── ProgressBar.tsx            # Pure JSX component
├── useProgressBar.ts          # State management
├── useProgressAnimation.ts    # Animation logic
├── types.ts                   # TypeScript interfaces
├── ProgressBar.module.css     # Styles
└── index.ts                   # Exports
```

### Known Issues
- Navigation generate action still disabled in frontend.
- Some backend route naming inconsistencies in compiled files.

### Next Steps
- Integrate ProgressBar with real SSE events from spawn pipelines.
- Enable navigation generate action in frontend.
- Implement additional navigation intents (GO_OUTSIDE, GO_TO_ROOM, GO_UP_DOWN) using createNodePipeline
- Enhance saved entities browser functionality.
- Add more navigation features (look around, change perspective).
- Add character-to-location chat switching.
- Move from temp-db to real database (when ready).
