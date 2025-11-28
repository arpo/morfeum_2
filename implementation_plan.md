# Implementation Plan: Fix Image Loading for World Trees

## Overview

Fix the broken image loading system for world tree nodes by ensuring all nodes have `primaryMedia` references that link to media entries in the media system, enabling synchronous image loading without async fetching.

The core issue is that while characters properly create media entries and set `primaryMedia` fields, world tree nodes do not. This causes images to disappear after pipeline completion and fail to load when navigating the tree.

## Current Problem

### What's Broken

1. **World Tree Creation**: Images generated during world tree creation are never stored in the media system, and tree nodes never get `primaryMedia` references
2. **Navigation Node Creation**: Images generated when navigating (creating niches/features) are never stored in the media system
3. **Frontend Image Loading**: The `useEntityImage` hook expects `primaryMedia` fields, so without them, no images load
4. **User Experience**: Preview images disappear when pipelines complete, clicking nodes shows skeleton loaders indefinitely

### Root Causes

1. **worldTreePipeline.ts**: Generates images but never creates media entries or sets `primaryMedia` on nodes
2. **WorldTreeBuilder.buildNode**: Has `primaryMedia` commented out and doesn't accept it as a parameter
3. **createNodePipeline.ts**: Generates images but never creates media entries or sets `primaryMedia`
4. **nodeBuilder.ts**: Doesn't create media entries (comment says handled in entityPersistence, but it's never called)

### What Works (Character System)

Characters work correctly because `characterPipeline.ts`:
1. Calls `buildCharacterEntity()` which creates media entry via `mediaService.createMedia()`
2. Sets `primaryMedia` field on character entity
3. Calls `saveAndPinEntity()` to persist everything

## Types

Update type definitions to ensure `primaryMedia` is properly supported across the system.

### Backend Type Changes

**File: `packages/backend/src/services/worldTree/types.ts`**

- Ensure `TreeNode` interface has `primaryMedia?: string` (already present)
- No changes needed - type already supports it

**File: `packages/backend/src/engine/generation/shared/nodeBuilder.ts`**

- Add `primaryMedia?: string` to `NodeBuildOptions` interface
- Update `buildNode` function signature to accept and use `primaryMedia` from options

## Files

Detailed breakdown of all file modifications needed.

### Backend Files to Modify

1. **packages/backend/src/engine/pipelines/worldTreePipeline.ts**
   - Add new function `assignMediaToTreeNodes()` to create media entries and set `primaryMedia`
   - Call this function after `WorldTreeBuilder.build()` and before completing pipeline
   - Recursively traverse tree to find deepest node (the one with the generated image)
   - Create media entry for that node using `mediaService.createMedia()`
   - Set `primaryMedia` on the node

2. **packages/backend/src/services/worldTree/builder.ts**
   - Uncomment and implement `primaryMedia` field in `buildNode()`
   - Accept `primaryMedia` from data parameter: `primaryMedia: data.primaryMedia`
   - Ensure it's included in returned TreeNode

3. **packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts**
   - After image generation and node building, create media entry
   - Import `mediaService` from `'../../../services/media'`
   - Call `mediaService.createMedia()` with image URL and metadata
   - Set `primaryMedia` on the node before returning

4. **packages/backend/src/engine/generation/shared/nodeBuilder.ts**
   - Add `primaryMedia?: string` to `NodeBuildOptions` interface
   - Add `primaryMedia` field to `LocationNode` interface (already present)
   - Update `buildNode()` to accept and set `primaryMedia` from options

5. **packages/backend/src/engine/pipelines/shared/entityPersistence.ts**
   - Update `buildLocationEntity()` to properly handle tree structures
   - Ensure it can recursively assign media to all nodes in a tree

### Frontend Files (No changes needed)

The frontend already supports `primaryMedia`:
- `useEntityImage` hook checks for `primaryMedia` field
- `mediaService.getPrimaryMediaUrl()` handles fetching
- `treesSlice.setCompleteWorldTree()` preserves all fields via spread operator
- `entitySessionLoader.ts` uses `getPrimaryMediaUrl(node)` which will work when `primaryMedia` is present

## Functions

### New Functions to Create

**File: `packages/backend/src/engine/pipelines/worldTreePipeline.ts`**

```typescript
/**
 * Assign media to tree nodes
 * Creates media entries and sets primaryMedia on nodes that have generated images
 */
function assignMediaToTreeNodes(
  tree: TreeNode, 
  imageUrl: string, 
  imagePrompt: string
): TreeNode
```

Purpose: Recursively traverse tree, find deepest node, create media entry, set `primaryMedia`

### Functions to Modify

**File: `packages/backend/src/engine/pipelines/worldTreePipeline.ts`**

- `runWorldTreePipeline()`: Add call to `assignMediaToTreeNodes()` after `WorldTreeBuilder.build()`

**File: `packages/backend/src/services/worldTree/builder.ts`**

- `buildNode()`: Uncomment and implement `primaryMedia` assignment from `data.primaryMedia`

**File: `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts`**

- `runCreateLocationNodePipeline()`: Add media creation after image generation, set `node.primaryMedia`

**File: `packages/backend/src/engine/generation/shared/nodeBuilder.ts`**

- `buildNode()`: Add support for `options.primaryMedia` parameter

## Classes

No new classes needed. Modifications to existing class:

**File: `packages/backend/src/services/worldTree/builder.ts`**

- Class: `WorldTreeBuilder`
- Method: `buildNode()` - Add `primaryMedia` support

## Dependencies

No new dependencies required. All functionality uses existing modules:

- `mediaService` from `'@/services/media'` (already in use for characters)
- Existing TypeScript types and interfaces

## Testing

### Manual Testing Steps

1. **Create New World Tree**:
   - Spawn a new world/location
   - Verify preview image loads during generation
   - Verify image persists after pipeline completion
   - Click on nodes in tree - verify images load immediately

2. **Navigate Existing Trees**:
   - Click on pinned world nodes
   - Verify images load immediately without skeleton loaders
   - Navigate to child nodes - verify images load

3. **Create Niches via Navigation**:
   - Navigate to a location and create a niche
   - Verify niche image loads and persists

4. **Backend Verification**:
   - Check `temp-db/media.json` - verify media entries created for world nodes
   - Check `temp-db/worlds.json` - verify nodes have `primaryMedia` fields
   - Verify `primaryMedia` values match media IDs in media.json

### Validation Criteria

- ✅ All world tree nodes have `primaryMedia` fields after creation
- ✅ Media entries exist in `media.json` for all generated images
- ✅ Images load immediately when clicking tree nodes (no async fetching)
- ✅ Preview images persist after pipeline completion
- ✅ No console errors about missing images or primaryMedia
- ✅ Existing characters continue to work correctly

## Implementation Order

Follow these steps in sequence to minimize conflicts and ensure successful integration:

### Step 1: Update Type Definitions
- Modify `nodeBuilder.ts` to add `primaryMedia` to `NodeBuildOptions`
- Verify `TreeNode` type already has `primaryMedia?: string`

### Step 2: Update Node Builder
- Modify `buildNode()` in `nodeBuilder.ts` to accept and use `options.primaryMedia`
- Add conditional: `if (options?.primaryMedia) { node.primaryMedia = options.primaryMedia; }`

### Step 3: Update WorldTreeBuilder
- Modify `buildNode()` in `builder.ts` to read and set `primaryMedia` from data
- Uncomment: `primaryMedia: data.primaryMedia`

### Step 4: Update World Tree Pipeline
- Create `assignMediaToTreeNodes()` function
- Import `mediaService`
- Call `assignMediaToTreeNodes()` after `WorldTreeBuilder.build()`
- Pass resulting tree to pipeline completion

### Step 5: Update Navigation Pipeline
- Import `mediaService` in `createNodePipeline.ts`
- After image generation, create media entry
- Set `node.primaryMedia` to media ID
- Return node with `primaryMedia` set

### Step 6: Update Entity Persistence (Optional Enhancement)
- Enhance `buildLocationEntity()` to handle tree structures
- Add recursive media assignment for complex trees

### Step 7: Testing
- Test new world tree creation
- Test navigation node creation
- Test loading existing trees
- Verify media.json and worlds.json structure
- Verify characters still work

### Step 8: Cleanup
- Remove any debug logging added during implementation
- Update documentation if needed
- Verify no TypeScript errors
