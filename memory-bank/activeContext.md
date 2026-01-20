# Active Context

## 2026-01-20 - V1 Command Cleanup ✅

Cleaned up old V1 navigation/node creation commands that have been replaced by V2.

### Commands Removed (Complete Deletion)

| V1 Command | V2 Replacement | Status |
|------------|----------------|--------|
| `NEW_WORLD` | `NEW_WORLD_LOCATION` | DELETED |
| `NEW_REGION` | `NEW_REGION2` | DELETED |
| `NEW_LOCATION` | `NEW_LOCATION2` | DELETED |
| `VIEW` | `DISPLAY` | DELETED |

### Commands Renamed (V2 → Clean Names)

| Old Name | New Name | Description |
|----------|----------|-------------|
| `GO_INSIDE2` | `GO_INSIDE` | Enter a space (V2 navigation) |
| `GOTO2` | `GOTO` | Create sibling space within same container |

The "2" suffix has been removed - V2 commands now use the clean original names.

### Files Modified

**Backend:**
- `packages/backend/src/config/navigation.ts` - Removed V1 commands, renamed V2 commands
- `packages/backend/src/worldV2/routes.ts` - Updated comments
- `packages/backend/src/worldV2/handlers/goInsideHandler.ts` - Updated references
- `packages/backend/src/worldV2/handlers/gotoHandler.ts` - Updated references
- `packages/backend/src/worldV2/prompts/goInside.ts` - Updated references
- `packages/backend/src/worldV2/prompts/imageEditPrompt.ts` - Updated references
- `packages/backend/src/worldV2/prompts/navigationAssistant.ts` - Updated references
- `packages/backend/src/worldV2/utils/styleLockCompiler.ts` - Updated comments
- `packages/backend/src/engine/pipelines/shared/pipelineConfig.ts` - Updated comments
- `packages/backend/src/engine/generation/prompts/cacheContent/index.ts` - Updated comments
- `packages/backend/src/engine/nodeCreation/types/nodes.ts` - Updated comments

**Frontend:**
- `packages/frontend/src/worldV2/commands/index.ts` - Updated V2_COMMANDS array
- `packages/frontend/src/worldV2/commands/handlers/goInsideHandler.ts` - Updated references
- `packages/frontend/src/worldV2/commands/handlers/gotoHandler.ts` - Updated references
- `packages/frontend/src/features/spawn-input/SpawnInputBar/commandParser.ts` - Deprecated V1 functions
- `packages/frontend/src/features/spawn-input/SpawnInputBar/useNavigationLogic.ts` - Removed V1 references
- `packages/frontend/src/features/spawn-input/SpawnInputBar/creationCommands.ts` - Deprecated V1 handler
- `packages/frontend/src/features/spawn-input/SpawnInputBar/mediaCommands.ts` - Deprecated VIEW handler
- `packages/frontend/src/utils/spawn/completionHandlers.ts` - Updated comments

**Documentation:**
- `memory-bank/systemPatterns.md` - Updated command names
- `memory-bank/progress.md` - Updated command names
- `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md` - Updated command names
- `docs/go-inside-test-scenarios.md` - Updated command names

---

## Current Available Commands

| Command | Category | Description |
|---------|----------|-------------|
| `/NEW_HOST` | Creation | Create world with DNA |
| `/NEW_REGION2` | Creation | Create region (delta DNA) |
| `/NEW_LOCATION2` | Creation | Create location (delta DNA) |
| `/NEW_WORLD_LOCATION` | Creation | Create Host+Region+Location (3 nodes) |
| `/NEW_WORLD_LOCATION_INTERIOR` | Creation | Create Host+Region+Exterior+Interior (4 nodes) |
| `/GO_INSIDE` | Navigation | Enter a space (V2 navigation) |
| `/GOTO` | Navigation | Create sibling space in container |
| `/LOOK` | Navigation | Camera control within same space |
| `/DISPLAY` | Media | Generate image via LLM layers |
| `/SET_TIME` | Media | Set time of day for world |
| `/SET_WEATHER` | Media | Set weather conditions |
| `/EDIT_IMAGE` | Media | Edit existing image with prompt |
| `/CREATE_CHARACTER_REAL` | Creation | Create realistic character |
| `/CREATE_CHARACTER_UNREAL` | Creation | Create fantastical character |

---

## Next Steps

- [ ] Consider renaming `NEW_REGION2` → `NEW_REGION` (after full V1 cleanup)
- [ ] Consider renaming `NEW_LOCATION2` → `NEW_LOCATION` (after full V1 cleanup)
- [ ] Future: Add season support to Host node
