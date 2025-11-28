# Implementation Plan

[Overview]
Remove redundant data from worldTrees storage so it only contains tree structure (id, type, children), while all node data (name, description, dna, spaceType, primaryMedia) is stored exclusively in the nodes map.

This change significantly reduces the size of worlds.json by eliminating duplicate storage. Currently, every node's complete data is stored twice - once in the `nodes` map and again nested in the `worldTrees` array. The worldTrees array should only track parent-child relationships, not store node data.

[Types]
No type changes needed - the frontend `TreeNode` type is already correct.

The existing type definition in `packages/frontend/src/store/slices/locations/types.ts` already defines the correct minimal structure:
```typescript
export interface TreeNode {
  id: string;
  type: NodeType;
  children: TreeNode[];
}
```

The backend type in `packages/backend/src/services/worldTree/types.ts` includes more fields (name, description, dna, etc.) which is fine for in-memory/API use, but these extra fields should be stripped when persisting to worldTrees.

[Files]
Four files need modification to fix the redundant storage issue.

**Files to Modify:**
1. `packages/frontend/src/store/slices/locations/treesSlice.ts`
   - Fix `setCompleteWorldTree` to extract only tree structure
   - Ensure `addNodeToTree` only stores id, type, children

2. `packages/frontend/src/utils/tree/navigation.ts`
   - Update `findDeepestNode` to not rely on `tree.name`

3. `packages/frontend/src/features/app/components/EntityExplorer/EntityExplorer.tsx`
   - Remove fallback to `treeNode.name` (line ~51)

4. `packages/backend/src/services/worldTree/types.ts` (optional documentation)
   - Add comment clarifying that TreeNode is for API/in-memory use, persisted worldTrees only use id/type/children

[Functions]
Three functions need modification.

**Modified Functions:**

1. `setCompleteWorldTree` in `packages/frontend/src/store/slices/locations/treesSlice.ts`
   - Current: Stores entire rootNode object (with all data) into worldTrees
   - Change: Extract tree structure only (id, type, children) before storing to worldTrees
   - Add helper function `extractTreeStructure(node)` to recursively extract only id, type, children

2. `findDeepestNode` in `packages/frontend/src/utils/tree/navigation.ts`
   - Current: Returns `{ id: tree.id, name: tree.name || 'Unknown' }`
   - Change: Return only `id` or look up name from nodes store
   - May need to change return type or accept nodes map as parameter

3. `mapNode` (inline in EntityExplorer.tsx around line 48)
   - Current: Falls back to `treeNode.name` if `fullNode?.name` is missing
   - Change: Only use `fullNode?.name`, fallback to 'Unknown' directly

[Classes]
No class modifications needed.

[Dependencies]
No dependency changes needed.

[Testing]
Manual testing required after implementation.

1. Clear the database: Delete `packages/backend/temp-db/worlds.json`
2. Start the application
3. Spawn a new world with locations
4. Verify `worlds.json` structure:
   - `nodes` map contains full node data (id, type, name, spaceType, dna, description, primaryMedia)
   - `worldTrees` array contains only tree structure (id, type, children)
5. Verify UI still displays location names correctly in EntityExplorer
6. Verify tree navigation still works (expanding/collapsing nodes)

[Implementation Order]
Implement changes in order that minimizes breaking the application during development.

1. **Add helper function** `extractTreeStructure` in treesSlice.ts
2. **Update `setCompleteWorldTree`** to use the helper function
3. **Update `addNodeToTree`** to ensure it only stores minimal structure
4. **Update EntityExplorer.tsx** to remove `treeNode.name` fallback
5. **Update navigation.ts** `findDeepestNode` to handle missing name
6. **Clear database** and test with fresh data
7. **Verify** all tree operations work correctly
