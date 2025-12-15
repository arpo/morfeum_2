# Active Context

## Recent Changes (2025-12-15)

### SpawnInputBar Refactoring & Dead Code Cleanup (Dec 15)

#### Image Drop/Paste Moved to Command Input
- **Change**: Moved image drag/drop/paste functionality from App.tsx to SpawnInputBar
- **Reason**: Image drop was connected to wrong state (store's `spawnInputText` instead of local `movementInput`)
- **Implementation**:
  - `SpawnInputBar.tsx` now uses `useImageDropLogic` hook
  - Drag handlers on spawn-input-bar container div
  - `onPaste` prop added to `SlashCommandInput`
  - Analyzed image descriptions **append** to existing input text (not replace)
- **Visual indicators**: Drop overlay, analyzing spinner, error message all in SpawnInputBar

#### Saved Entities Button Moved to TopButtonRow
- **Change**: Moved "Saved Entities" button from SpawnInputBar to TopButtonRow
- **Location**: Now between sidebar toggle and info button
- **Cleanup**: Added proper `savedEntitiesButton` CSS class (was using `shuffleButton`)

#### Dead Code Cleanup
Removed code from old tab-based spawn input system:
- **Deleted `useSpawnInputLogic.ts`** - Entire hook was unused
- **Deleted `types.ts`** - All types only used by deleted hook
- **Cleaned `index.ts`** - Removed dead exports
- **Cleaned `spawnSlice.ts`** - Removed `spawnInputText`, `setSpawnInputText`, `appendSpawnInputText`
- **Cleaned `App.module.css`** - Removed 9 unused styles (dropOverlay, analyzingOverlay, spinner, etc.)

#### Key Files Modified
- `packages/frontend/src/features/spawn-input/SpawnInputBar/SpawnInputBar.tsx` - Added image drop logic
- `packages/frontend/src/components/ui/SlashCommandInput/SlashCommandInput.tsx` - Added `onPaste` prop
- `packages/frontend/src/features/spawn-input/SpawnInputBar/SpawnInputBar.module.css` - Added drop overlay styles
- `packages/frontend/src/features/app/components/TopButtonRow/TopButtonRow.tsx` - Added saved entities button
- `packages/frontend/src/features/app/components/App/App.tsx` - Removed image drop logic
- `packages/frontend/src/features/app/components/App/App.module.css` - Removed unused styles
- `packages/frontend/src/store/slices/spawnSlice.ts` - Removed unused state

### Previous Changes (Dec 15)
- Pipeline Progress Bar Fix & VIEW Command Alignment
- Fixed GO_INSIDE progress bar not reaching 100%
- Added `view` pipeline to `pipelineConfig.ts`

## Current Focus

- Command-based input system (slash commands only, no tabs)
- Image drop/paste now properly connected to command input
- Clean codebase with no dead code from old tab system
- TopButtonRow contains: sidebar toggle, saved entities, info, chat, depth map, display mode, external view, training data

## Next Steps

- Implement `/SCENE_IMAGE` command for generating new images of existing characters
- Test image drop/paste in command input
- Consider additional command enhancements
