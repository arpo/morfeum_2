# Active Context

## Recent Changes (2025-11-26)

### Keyboard Shortcuts & Focus Mode Implementation (Nov 26, 2025)
- **Centralized keyboard shortcuts system**:
  - Added global keyboard shortcut handling for UI toggles
  - Key `1`: Toggle spawn input (minimize/expand)
  - Key `2`: Toggle entity explorer panel (hide/show)
  - Space: Toggle focus mode (hide all UI to view image)
  - Shortcuts only trigger when not typing in input fields
- **Focus mode feature**:
  - Hides all UI elements when activated (TopButtonRow, SpawnInputBar, EntityExplorer, panels)
  - Shows only the entity background image for distraction-free viewing
  - Displays a temporary hint that fades after 3 seconds
  - Pill-shaped semi-transparent hint with smooth animation
- **Centralized configuration**:
  - Created `packages/frontend/src/config.ts` as centralized application configuration
  - Organized by sections (keyboard shortcuts, app settings)
  - Designed for extensibility (future app-wide configurations)
- **State management**:
  - Added `focusModeEnabled` state to entityManagerSlice
  - Added `toggleFocusMode()` action
  - Each shortcut key automatically exits focus mode when pressed
- **Files created/modified**:
  - `packages/frontend/src/config.ts` - New centralized config file
  - `packages/frontend/src/hooks/useKeyboardShortcuts.ts` - New keyboard handling hook
  - `packages/frontend/src/hooks/index.ts` - Updated exports
  - `packages/frontend/src/store/slices/entityManagerSlice.ts` - Added focus mode state
  - `packages/frontend/src/features/app/components/App/App.tsx` - Updated to support focus mode
  - `packages/frontend/src/features/app/components/App/App.module.css` - Added focus mode hint styles

## Recent Changes (2025-11-25)

### UI Layout Refactor - Fullscreen Background Images (Nov 25, 2025)
- **Removed entitySection** - Eliminated Card wrapper containing CharacterPanel/LocationPanel from main layout
- **Fullscreen Background Image** - Entity images now display behind all UI elements as full viewport backgrounds
- **Responsive Letterbox Behavior** - Implemented aspect-ratio media query for optimal image display:
  - Narrow/tall viewports (≤16:9): `object-fit: contain` - letterbox only above/below
  - Wide viewports (>16:9): `object-fit: cover` - fills completely, no letterbox
  - Ensures 16:9 images only have vertical letterbox, never horizontal pillarbox
- **TopButtonRow Component** - New fixed top-left button row replacing EntityExplorerToggle:
  - Sidebar toggle button (IconLayoutSidebar)
  - Info button (works for both characters and locations, disabled until deepProfile loads)
  - Chat button (characters only, disabled until deepProfile loads)
- **Modal State Lifted to App Level**:
  - CharacterInfoModal and LocationInfoModal now managed by App.tsx
  - Single `isInfoModalOpen` state controls both modals
  - Info button now works for location nodes (was previously broken)
- **Files Modified**:
  - `packages/frontend/src/icons/index.ts` - Added IconMessageCircle
  - `packages/frontend/src/features/app/components/TopButtonRow/` - New component (3 files)
  - `packages/frontend/src/features/app/components/App/App.tsx` - Major layout refactor
  - `packages/frontend/src/features/app/components/App/App.module.css` - Fullscreen image styles
- **Components Now Unused** (preserved for reference):
  - CharacterPanel - image display and button functionality moved to App.tsx
  - LocationPanel - image display and button functionality moved to App.tsx
  - EntityExplorerToggle - replaced by TopButtonRow
- **Result**: Cleaner, more immersive UI with entity images as fullscreen backgrounds


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
- Consider adding more keyboard shortcuts for common actions
- Explore keyboard shortcuts for tab switching

## Previous Context (see below for earlier changes)
