# Active Context

## Current State (Nov 2025)
The Morfeum application is in active development with core systems operational.

### Recent Work Completed

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
