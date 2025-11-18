# Active Context

## Current State (Nov 2025)
The Morfeum application is in active development with core systems operational.

### Recent Work Completed

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

### Known Issues
- Navigation generate action still disabled in frontend.
- Some backend route naming inconsistencies in compiled files.

### Next Steps
- Enable navigation generate action in frontend.
- Implement additional navigation intents (GO_OUTSIDE, GO_TO_ROOM, GO_UP_DOWN) using createNodePipeline
- Enhance saved entities browser functionality.
- Add more navigation features (look around, change perspective).
- Add character-to-location chat switching.
- Move from temp-db to real database (when ready).
