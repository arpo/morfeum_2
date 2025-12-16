# Active Context

## Recent Changes (2025-12-16)

### GO_INSIDE Default Interior Fix (Dec 16, Latest)

#### Problem Solved: GO_INSIDE Creating Exterior Instead of Interior
When using `/GO_INSIDE` on a building (like "Blackwood Manor" with a door entrance), the system was incorrectly creating an exterior courtyard instead of entering the building interior.

#### Root Cause
- `commandBuilder.ts` was returning `null` for GO_INSIDE perspective
- This let the LLM structure analyzer decide the perspective
- LLM incorrectly determined it was exterior because parent location had `spaceType: "exterior"`
- Comment in code said "perspective is now determined by LLM analysis" - this was wrong for GO_INSIDE

#### Fix Implementation
**Backend Change in `commandBuilder.ts`:**
```typescript
case 'GO_INSIDE':
  // GO_INSIDE means entering an enclosed space = interior by default
  // User can override with --exterior or --open-air flags if needed
  return 'interior';
```

#### Result
- `/GO_INSIDE` → always creates **interior** space (entering through a door)
- `/GO_INSIDE --exterior` → user can override if they want courtyard/grounds
- `/GOTO forest` → LLM determines perspective (could be exterior)

#### Files Modified
- `packages/backend/src/engine/navigation/commandBuilder.ts` - Changed GO_INSIDE to return 'interior'

### Pass-Through Region Selection & NEW_LOCATION Support (Dec 16)

#### Problem Solved: Can't Select Pass-Through Regions
Pass-through region nodes in the tree view couldn't be selected, which prevented using `/NEW_LOCATION` to create locations under them.

#### Fix Implementation
**Frontend Changes:**
- `TreeView.tsx` - Removed the block that prevented selecting pass-through nodes
- `TreeView.module.css` - Added proper styling for selectable pass-through nodes
- `useNavigationLogic.ts` - Added `NEW_LOCATION` to allowed commands on pass-through regions

#### Result
- Pass-through regions can now be selected in tree view
- `/NEW_LOCATION` command works on pass-through regions
- Other commands (GOTO, GO_INSIDE, etc.) still blocked on pass-through regions

### Outdoor Location Image Prompts (Dec 16)

#### Problem Solved: Image Prompts Using Building Language for Forests
When creating outdoor locations (forests, parks, gardens), the image prompt was using building-focused language like "Architectural photography" and "Building exterior in focus".

#### Fix Implementation
**Backend Change in `nodeCreation/prompts/image/index.ts`:**
- Added `isOutdoorLocation()` detection function
- Checks navigableElements for outdoor types (trail, path, clearing, etc.)
- Checks DNA and node name for outdoor keywords
- When outdoor detected, uses nature photography language:
  - "Nature/landscape photography" instead of "Architectural photography"
  - "Natural area in focus" instead of "Building exterior in focus"
  - "Natural Environment:" instead of "Building/Site Exterior:"

### Exterior Scenes & Perspective Flags (Dec 16)

#### Problem Solved: --exterior Flag Not Working
When using `GO_INSIDE glowing sculpture area --exterior`, niches were still getting `spaceType: "interior"` due to:
1. **Frontend flag stripping**: `commandParser.ts` was silently dropping any flags starting with `--` that weren't explicitly handled
2. **Missing flag definitions**: Only `--view`, `--noview`, `--bgtask`, and `--furnish` were defined in `COMMAND_FLAGS`
3. **No reconstruction**: Frontend was reconstructing `--furnish` flag but not perspective flags

#### Root Cause Investigation
- Added debug logging to trace perspective flow from frontend → backend → structure analyzer
- Found `perspectiveOverride: undefined` in frontend parsing (flag was being dropped)
- Backend `enhancementParser.ts` worked correctly but never received the flags
- Frontend command parsing had logic gap for perspective flags

#### Fix Implementation
**Backend Changes:**
- `config/navigation.ts` - Added perspective flags to `COMMAND_FLAGS`:
  - `INTERIOR: '--interior'`, `EXTERIOR: '--exterior'`, `OPEN_AIR: '--open-air'`
- `structureAnalyzer.ts` - Enhanced with perspective override logic:
  ```typescript
  if (perspective && perspective !== result.perspective) {
    result.perspective = perspective;
    if (perspective === 'exterior' || perspective === 'open-air') {
      result.structure.roofType = 'open-sky';
    }
  }
  ```

**Frontend Changes:**
- `commandParser.ts` - Added `perspectiveOverride` to `ParsedCommand.flags` interface and parsing logic
- `navigationCommands.ts` - Added perspective flag reconstruction for API calls

#### Cleanup: Removed Unused --furnish Flag
- `--furnish` flag replaced by prompt enhancer with `furnish:` syntax
- Removed from: `navigationCommands.ts`, `commandParser.ts`, `config/navigation.ts`
- Added explanatory comments about replacement

#### Result
Users now have full control over scene perspective:
```bash
/GO_INSIDE sculpture area --exterior   # → spaceType: "exterior", roofType: "open-sky"
/GO_INSIDE reading corner --interior   # → spaceType: "interior"  
/GOTO courtyard --open-air            # → spaceType: "open-air", roofType: "open-sky"
```

## Current Focus

- GO_INSIDE now defaults to interior (no more LLM guessing)
- Pass-through regions can be selected for NEW_LOCATION
- Outdoor locations get nature photography prompts
- User can override any perspective with --exterior or --open-air flags

## Key Files Modified (Dec 16)

- `packages/backend/src/engine/navigation/commandBuilder.ts` - GO_INSIDE defaults to interior
- `packages/frontend/src/components/ui/TreeView/TreeView.tsx` - Pass-through selection enabled
- `packages/frontend/src/components/ui/TreeView/TreeView.module.css` - Pass-through styling
- `packages/frontend/src/features/spawn-input/SpawnInputBar/useNavigationLogic.ts` - NEW_LOCATION on pass-through
- `packages/backend/src/engine/nodeCreation/prompts/image/index.ts` - Outdoor detection for image prompts
- `packages/backend/src/config/navigation.ts` - Perspective flags
- `packages/backend/src/engine/navigation/analyzers/structureAnalyzer.ts` - Perspective override logic
- `packages/frontend/src/features/spawn-input/SpawnInputBar/commandParser.ts` - Perspective flag parsing
- `packages/frontend/src/features/spawn-input/SpawnInputBar/navigationCommands.ts` - Flag reconstruction

## Next Steps

- Test GO_INSIDE with buildings to verify interior creation
- Test /NEW_LOCATION on pass-through regions
- Test outdoor location image prompts (forests, gardens, etc.)
