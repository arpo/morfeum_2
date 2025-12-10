# Active Context

## Recent Changes (2025-12-10)

### Pass-Through Region System (Dec 10)
- **Feature**: Generic prompts (e.g., "a building on a planet") now create pass-through regions instead of fully-generated regions
- **Purpose**: Regions should only be created when user explicitly names a known place (e.g., "Ringön in Göteborg")
- **Implementation**:
  1. `parsePromptToHierarchy.ts` - Detects generic vs specific prompts, returns `regionIsPassThrough: true`
  2. `nodeCreationPipeline.ts` - Passes flag to `buildHierarchyStructure()`
  3. `createHierarchy.ts` - Creates region with `isPassThrough: true`, name: "Region", empty DNA
  4. `WorldTreeBuilder.ts` - Preserves `isPassThrough` flag when saving to worlds.json
  5. `worldTree/types.ts` - Added `isPassThrough?: boolean` to `TreeNode` interface
  6. `navigation/types.ts` - Added `isPassThrough?: boolean` to NavigationContext data

### Pass-Through Region UI Protection (Dec 10)
- **TreeView**:
  - Cannot select pass-through nodes (handleSelect returns early)
  - Can still expand/collapse to see children
  - Arrow badge icon (→) indicates pass-through
  - Muted styling (opacity 0.6, italic)
  - No delete button
  - Cursor: `default` (not pointer)
- **SpawnInput**:
  - `useNavigationLogic.ts` blocks commands on pass-through nodes
  - Shows error: "Commands cannot be run on pass-through regions"
- **Backend**:
  - `/api/mzoo/navigation/command` validates and rejects commands on pass-through nodes

### Files Modified for Pass-Through System
- `packages/backend/src/engine/nodeCreation/detection/parsePromptToHierarchy.ts`
- `packages/backend/src/engine/pipelines/nodeCreationPipeline.ts`
- `packages/backend/src/engine/nodeCreation/core/createHierarchy.ts`
- `packages/backend/src/services/worldTree/builder.ts`
- `packages/backend/src/services/worldTree/types.ts`
- `packages/backend/src/engine/navigation/types.ts`
- `packages/backend/src/routes/mzoo/navigation.ts`
- `packages/frontend/src/components/ui/TreeView/TreeView.tsx`
- `packages/frontend/src/components/ui/TreeView/TreeView.module.css`
- `packages/frontend/src/features/spawn-input/SpawnInputBar/useNavigationLogic.ts`
- `packages/frontend/src/icons/index.ts` - Added IconArrowBadgeRight

## Previous Changes (2025-12-10)

### Fixed `--furnish` Flag for GO_INSIDE
- Added `FurnishingDetails` interface and property to nodeBuilder.ts
- Updated `createNodePipeline.ts` to pass furnishingDetails to buildNode()
- Added strong emphasis statements for FLUX rendering

## Current Focus

- Pass-through region system complete and tested
- Monitor hierarchy creation for correct region behavior
- Continue database migration planning (Supabase/PostgreSQL)

## Pass-Through Region Criteria

| Prompt Type | Region Treatment | Example |
|-------------|------------------|---------|
| Generic | Pass-through (empty DNA) | "a building on a planet" |
| Named place | Full DNA generation | "Ringön in Göteborg" |
| Known geography | Full DNA generation | "downtown Tokyo" |

## Next Steps

- Test pass-through region behavior with various prompts
- Consider intentClassifier prompt update (reduce niche creation)
- Continue database migration planning
