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

### SpawnInputBar Navigate Tab Implementation (Nov 25, 2025)
- **Added Navigate tab to SpawnInputBar** - Navigation functionality now lives alongside Character and Location generation
- **Three-tab interface**: Character, Location, Navigate
- **Navigation logic extracted**:
  - Created `useNavigationLogic.ts` hook with all navigation state/handlers
  - Moved from `useLocationPanel.ts` to centralized location
  - Handles movement input, slash commands, navigation API calls
  - Manages navigation state (isMoving, errorMessage, activeEntity)
- **Navigate tab features**:
  - Shows "Select or generate a location to navigate" when no location active
  - Displays SlashCommandInput and "Go" button when location selected
  - Shows error messages for invalid commands
  - Includes navigation description ("Type / to see navigation commands")
- **LocationPanel cleanup**:
  - Removed travel section UI completely
  - Removed all navigation state/handlers from hook
  - Simplified types to only include base entity panel + saveLocation
  - Removed travel section CSS styles
  - Now focuses purely on location display and info modal
- **Result**: Unified input interface with all entity generation and navigation in one place

## Current Focus
- SpawnInputBar now serves as the central command center for entity generation and navigation
- Navigation moved from LocationPanel to SpawnInputBar for better UX
- LocationPanel simplified to focus on display only
- Clean separation of concerns: display vs. interaction

## Next Steps
- Consider adding more navigation commands beyond GO_INSIDE
- Potential tab state persistence across sessions
- Explore keyboard shortcuts for tab switching

## Previous Context (see below for earlier changes)
