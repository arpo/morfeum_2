# Active Context

## Current State (Nov 2025)
The Morfeum application is in active development with core systems operational.

### Recent Work Completed
- **Navigation Features Parameter Fix (Nov 14, 2025):**
  - Fixed critical bug where "interior" was being passed as navigationFeatures instead of spaceType
  - Removed unused navigationFeatures parameter entirely from the function chain
  - Updated nicheImagePrompt, imagePromptGeneration, and all preset functions
  - Interior scenes now correctly generate with proper interior-specific instructions
  - Cleaner code without unnecessary undefined parameters

- **Prompt Preset Refactor (Nov 14, 2025):**  
  - Removed all hard-coded narrative from both interior and exterior prompt presets.
  - Interior and exterior presets now assemble their output using only shared, reusable prompt sections from `promptSections.ts` and context/DNA data.
  - Added new helpers for exterior prompts: `buildExteriorApproachNote`, `buildExteriorSpaceRulesCondensed`.
  - Created `spaceTypePresets.ts` dispatcher to select the correct preset builder based on `spaceType`.
  - Updated `nicheImagePrompt.ts` to use the dispatcher, ensuring all prompts are data-driven and context-sensitive.
  - Ran full TypeScript build to validate changes.

- **Other Recent Work**
  - [See previous entries for details on camera config, "Go Inside" pipeline, token optimization, parent structure analysis, and navigation classifier improvements.]

### Core Systems Status
- **Prompt Generation:** All narrative blocks now context-driven, using shared builders and node DNA. Fixed parameter ordering issue.
- **Navigation System:** NavigatorAI for spatial movement (frontend generate action still disabled).
- **Tree-Based Architecture:** Nodes (flat storage) + World Trees (nested structure).
- **Event System:** SSE for real-time spawn updates.

### Known Issues
- Navigation generate action still disabled in frontend.
- Some backend route naming inconsistencies in compiled files.

### Next Steps
- Enable navigation generate action in frontend.
- Enhance saved entities browser functionality.
- Add more navigation features (look around, change perspective).
- Add character-to-location chat switching.
- Move from temp-db to real database (when ready).
