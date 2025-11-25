# Active Context

## Recent Changes (2025-11-25)

### Navigation Command Cleanup & Centralization (Nov 25, 2025)
- **Removed all dummy navigation commands and handlers** - Only `GO_INSIDE` is now implemented
- **Centralized navigation intent registry** in `pipelineConfig.ts` as the single source of truth
- **Cleaned up types, config, and handlers**:
  - `NavigationIntent` type now only includes `GO_INSIDE` and `UNKNOWN`
  - `NAVIGATION_COMMANDS` in `config/navigation.ts` only exports implemented commands
  - All dummy handler files (`viewing.ts`, `special.ts`, `exploration.ts`) deleted
  - `handlers/index.ts` and `basicMovement.ts` only export/implement `handleGoInside`
  - `navigationRouter.ts` only routes `GO_INSIDE`, others return `not_implemented`
  - `intentClassifier.ts` prompt updated to reflect only `GO_INSIDE` as implemented
- **Result:** Codebase is now clean, with a single source of truth for navigation commands and no dead code

## Previous Context (see below for earlier changes)
