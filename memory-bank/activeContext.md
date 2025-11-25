# Active Context

## Recent Changes (2025-11-25)

### Entity Explorer Panel - Draggable UI Refactor (Nov 25, 2025)
- **Moved sidebar to draggable panel** - Entity Explorer (Host/Characters tabs) now lives in a draggable, resizable panel
- **Toggle button in top-left corner** - Uses `IconLayoutSidebar` to show/hide the panel
- **Position persistence** - Panel position saved to localStorage, survives toggles and page refreshes
- **Layout changes**:
  - Removed sidebar column from App layout (3-column → 2-column grid)
  - Entity panel now column 1, chat history column 2
  - Updated responsive breakpoints for new layout
- **State management**:
  - Added `entityExplorerPanelOpen` state to entityManagerSlice
  - Added `toggleEntityExplorerPanel` action
  - Panel open/closed state persists to localStorage
  - Custom `useEntityExplorerPanel` hook manages position persistence
- **DraggablePanel enhancements**:
  - Added `onPositionChange` and `onSizeChange` callback props
  - Callbacks fire when drag/resize completes
  - Enables parent components to track and persist panel state
- **Z-index fix**: Modal overlay increased to z-index 9999 (from 1000) to ensure SavedEntitiesModal appears above all draggable panels
- **Component structure**:
  - `EntityExplorerPanel.tsx` - Draggable wrapper around EntityExplorer
  - `EntityExplorerToggle.tsx` - Toggle button component
  - `useEntityExplorerPanel.ts` - Position persistence hook
- **Result**: Clean, flexible UI with persistent panel positioning and no fixed sidebar

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

## Current Focus
- Entity Explorer panel provides flexible, movable navigation
- Position persistence ensures consistent user experience
- Clean 2-column layout maximizes content space
- Modal z-index hierarchy properly maintained

## Next Steps
- Consider adding panel minimize/maximize functionality
- Explore additional draggable panels for other features
- Potential keyboard shortcuts for toggle button

## Previous Context (see below for earlier changes)
