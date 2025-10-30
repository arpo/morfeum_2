# Active Context - Current Work Focus

## Latest Session Summary (October 30, 2025 - 10:06 AM)

### Current Task: Backend Prompts System Consolidation - COMPLETED ✅
Migrated entire prompts system into engine structure, removing separate prompts folder.

### Recently Completed Work

**Backend Prompts Consolidation (NEW - Complete):**
- ✅ Moved `prompts/types.ts` → `engine/generation/prompts/types.ts`
- ✅ Moved `prompts/languages/en/index.ts` → `engine/generation/prompts/languages/en.ts`
- ✅ Merged `prompts/index.ts` logic into `engine/generation/prompts/index.ts`
- ✅ Added `getPrompt()` function to engine/generation/prompts/index.ts
- ✅ Updated 4 import paths (characterPipeline, routes/mzoo/prompts, services/navigator, languages/en)
- ✅ Deleted entire `packages/backend/src/prompts/` directory
- ✅ TypeScript compilation clean - all paths working

**Previous Session: Location Tree Display & Thumbnail Fixes (Complete):**
Fixed node selection, image assignment, info button accessibility, and saved locations thumbnails.

### Recently Completed Work

**Saved Locations Thumbnail Fix (NEW - Complete):**
- ✅ Created `findFirstImageInTree` utility function in treeUtils.ts
- ✅ Updated SavedLocationsModal logic to compute thumbnails from tree hierarchy
- ✅ Saved locations now show meaningful thumbnails (first image found in tree)
- ✅ Maintains separation: tree nodes show own images, saved list shows best available

**Location Tree Display Fixes (Complete):**
- ✅ Added info button (ℹ️) to ChatTabs for all nodes regardless of image status
- ✅ Made EntityPanel info buttons always visible (no longer conditional on image)
- ✅ Fixed host node image assignment - no longer displays deepest node's image incorrectly
- ✅ Fixed duplicate node creation - removed duplicate createEntity call for deepest node
- ✅ Nodes without images now properly show placeholder with first letter of name
- ✅ All nodes can access detail panel via info button in tree view or entity panel

**Previous: Data Preservation Refactoring (Complete):**
- ✅ Simplified hierarchyParser extract functions from 200+ lines to 3 lines each
- ✅ Changed from selective field mapping to complete passthrough (`...location`)
- ✅ Fixed entitySessionLoader to spread ALL fields from `node.dna`
- ✅ Removed all field-picking logic - now preserves everything from backend
- ✅ Updated README with "dumb passthrough" philosophy documentation
- ✅ Tested with saved locations - all visual analysis fields now display correctly

**Previous: Save Location Refactoring (Complete):**
- ✅ Created hierarchyParser utility to convert nested JSON to flat nodes + tree structure
- ✅ Updated terminology throughout codebase: `'world'` → `'host'`, `'sublocation'` → `'niche'`
- ✅ Fixed DNA structure to always use meta/semantic/profile format
- ✅ Fixed array type errors with ensureArray() helper
- ✅ Fixed ChatTabs to display all nodes with hierarchy indicators
- ✅ Fixed entity session creation for manual and auto-load paths
- ✅ Added timing delay fix for React batching issue

**Previous Sessions:**
- Navigation System Cleanup (removed redundant UI, disabled auto-spawning)
- Navigation Decision System (AI-powered navigation analysis)
- Image prompt enhancement (visual enrichment data flow fixed)

### Key Technical Decisions

**Saved Locations Thumbnail Strategy (NEW):**
- **Computed Display Value**: Don't modify stored data, compute thumbnail at render time
- **Tree Traversal**: Use depth-first search to find first non-empty image in hierarchy
- **Fallback Chain**: Host → Region → Location → Niche (first found wins)
- **Maintains Integrity**: Each node still stores only its own image in `imagePath`
- **User Experience**: Saved locations list shows meaningful visual even when host has no image

**Info Button Accessibility:**
- **ChatTabs Integration**: Info button added next to close button for every node
- **Always Visible**: Button shows regardless of image status, disabled until profile loads
- **EntityPanel Updates**: Info button moved outside image conditional blocks
- **Consistent UX**: Users can access node details from tree view without selecting node

**Image Assignment Fix:**
- **Host Node Pattern**: Changed from `imageUrl || host.imageUrl || ''` to `host.imageUrl || ''`
- **Correct Behavior**: Host nodes only display images if backend provides `host.imageUrl`
- **No Fallback**: Removed fallback to hierarchy's main image (which belongs to deepest node)
- **Placeholder Display**: Nodes without images show first letter of name in colored circle

**Duplicate Node Prevention:**
- **Single Entity Creation**: Removed duplicate `createEntity` call for deepest node
- **Loop Handles All**: The `parsed.nodes.forEach` loop creates entity sessions for ALL nodes
- **No Redundancy**: Each node appears exactly once in tree view
- **Image Update Only**: Deepest node gets its image updated separately (not recreated)

**Data Preservation Philosophy:**
- **"Dumb Passthrough" Approach**: No selective field mapping, no transformation
- **Zero Data Loss**: ALL backend fields preserved using object spread (`...location`)
- **Minimal Processing**: Only adds `slug` if missing, everything else untouched
- **Simple Code**: Extract functions reduced from 40+ lines to 3 lines each

**Hierarchy Parser Architecture:**
- New utility: `packages/frontend/src/utils/hierarchyParser.ts`
- Converts nested backend hierarchy into flat nodes + tree structure
- **SIMPLIFIED**: Extract functions now just `{ ...node, slug: generateSlug(node.name) }`
- **Preserves Everything**: dominantElements, navigableElements, materials_*, colors_*, dna, etc.
- Tree structure maintained in `worldTrees` array for depth calculation

**Save Location Structure:**
- **Flat Storage**: Each node stored individually in `nodes` map with structured DNA
- **Tree Index**: `worldTrees` array stores hierarchy as nested ID references
- **Format**: All DNA uses meta/semantic/spatial/render/profile structure
- **Entity Sessions**: Created for ALL nodes in tree, not just one

**Terminology Consistency (FINAL):**
- ✅ `NodeType = 'host' | 'region' | 'location' | 'niche'` (TypeScript)
- ✅ Backend sends: `type: "host"` and `type: "niche"`
- ✅ Frontend stores: `type: "host"` and `type: "niche"`
- ✅ All references updated throughout codebase

**ChatTabs Display Logic:**
- Calculates node depth by traversing `worldTrees`
- Shows hierarchy with indentation and indicators (└─)
- Only displays nodes with entity sessions
- **Info Button**: Now accessible for all nodes in tree view
- **Critical**: ALL nodes must have entity sessions to appear

**Entity Session Creation:**
- **New Locations**: SSE handler creates sessions for all nodes in `useSpawnEvents.ts`
- **Manual Load**: Modal creates sessions for all nodes in tree
- **Auto-Load**: App.tsx creates sessions for all nodes on page refresh
- **Single Creation**: Each node created exactly once (no duplicates)
- **Timing Fix**: 50ms delay before modal close ensures React flushes all updates

**Type Safety:**
- `ensureArray()` helper prevents `.join()` errors on string fields
- Proper type guards for DNA field access
- No unsafe type casts

### Architecture Patterns Used
- **Pure functions**: hierarchyParser receives nested JSON, returns flat nodes + tree
- **Type safety**: Proper TypeScript types throughout
- **Data preservation**: Complete DNA objects with all enrichment fields
- **Component separation**: .tsx (markup), .ts (logic), .module.css (styles)
- **Zustand store integration**: Flat nodes + tree index for efficient lookup
- **React batching awareness**: Timing delays where needed for multiple updates
- **Conditional rendering**: Info buttons always visible, other buttons conditional on image
- **Computed values**: Thumbnails computed at render time, not stored

## Next Priority Items

### Immediate (Ready to Implement)
1. **Test all fixes together**: Generate new location and verify all features work
2. **Clean up debug logging**: Remove console.log statements from load functions
3. **Performance check**: Verify thumbnail computation doesn't slow down modal

### Medium Priority
1. **Vector search preparation**: Saved nodes already flat, ready for vector DB integration
2. **Migration utility**: Add function to rebuild worldTrees from nodes if corrupted
3. **Enhanced tree visualization**: Consider visual improvements to hierarchy display
4. **Image generation per node**: Consider generating images for host/region nodes individually

## Current System State

**Saved Locations Display:** ✅ Fixed
- Thumbnails show first image found in tree hierarchy
- Meaningful visuals even when host nodes have no images
- Computed at render time, no data structure changes
- Falls back to placeholder only if entire tree has no images

**Location Tree Display:** ✅ Fixed
- Info button accessible for all nodes (with or without images)
- Host nodes show correct images (or placeholders)
- No duplicate nodes in tree view
- Entity panels show info button even without images
- Placeholders display first letter of node name

**Location Generation Pipeline:** ✅ Fully Functional
- Hierarchy classification generates nested structure
- Parser splits into flat nodes + tree
- All nodes saved with structured DNA
- Tree structure preserved for hierarchy display
- Each node gets single entity session

**Location Loading:** ✅ Fixed
- Manual load creates entity sessions for ALL nodes
- Auto-load creates entity sessions for ALL nodes
- ChatTabs displays full hierarchy with indentation
- Detail panel shows complete DNA for selected node
- Info button works from tree view and entity panel

**Data Structure:** ✅ Consistent
- All nodes use meta/semantic/profile format
- Arrays properly handled with ensureArray()
- worldTrees maintained for depth calculation
- No data loss during parse/save/load cycle
- Image paths correctly assigned per node

**Memory Management:** ✅ Updated
- Progress documentation current
- Active context tracking functional
- Project patterns documented

## Files Modified in Latest Session

**Modified (Thumbnail Fix):**
- `packages/frontend/src/utils/treeUtils.ts`:
  - Added `findFirstImageInTree` utility function
  - Traverses tree depth-first to find first non-empty imagePath
  - Takes nodeId, getNode function, and worldTrees array
  - Returns first image found or empty string
  - Generic function signature for reusability

- `packages/frontend/src/features/saved-locations/SavedLocationsModal/useSavedLocationsLogic.ts`:
  - Imported `findFirstImageInTree` from treeUtils
  - Added `getNode` and `worldTrees` from store
  - Changed locations from simple filter to computed map
  - Each location gets computed `imagePath` from tree traversal
  - Original node.imagePath used as ultimate fallback

**Modified (Tree Display Fixes):**
- `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.tsx`:
  - Added info button next to close button for every node
  - Added modal state management for LocationInfoModal and CharacterInfoModal
  - Info button disabled until deepProfile is ready
  - Imports IconInfoCircle and modal components

- `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.module.css`:
  - Added `.infoButton` styles matching close button pattern
  - Hover states, disabled states, and active states
  - Color-coded for entity types (character/location)

- `packages/frontend/src/features/entity-panel/components/LocationPanel/LocationPanel.tsx`:
  - Moved info button outside `{state.entityImage && ...}` conditional
  - Info button now always visible (even without image)
  - Fullscreen and save buttons remain conditional on image

- `packages/frontend/src/features/entity-panel/components/CharacterPanel/CharacterPanel.tsx`:
  - Moved info button outside `{state.entityImage && ...}` conditional
  - Info button now always visible (even without image)
  - Fullscreen and save buttons remain conditional on image

- `packages/frontend/src/utils/hierarchyParser.ts`:
  - Fixed host node image assignment from `imageUrl || host.imageUrl || ''` to `host.imageUrl || ''`
  - Host nodes now only use their own image property from backend
  - Consistent with region/location/niche image assignment pattern

- `packages/frontend/src/hooks/useSpawnEvents.ts`:
  - Removed duplicate `createEntity` call for deepest node in `hierarchy:complete` handler
  - Entity sessions now created only once in `parsed.nodes.forEach` loop
  - Deepest node image updated separately without recreating entity session
  - Prevents duplicate nodes appearing in tree view

## Code Examples

**Thumbnail Computation (NEW):**
```typescript
// Find first image in tree hierarchy
const locations = useMemo(() => {
  const hostNodes = Object.values(nodesMap).filter(node => node.type === 'host');
  
  // Add computed thumbnail for each location
  return hostNodes.map(node => ({
    ...node,
    imagePath: findFirstImageInTree(node.id, getNode, worldTrees) || node.imagePath
  }));
}, [nodesMap, getNode, worldTrees]);
```

**Image Assignment Fix:**
```typescript
// Before - Host node incorrectly grabbed hierarchy's main image
const hostNode: Node = {
  imagePath: imageUrl || host.imageUrl || '', // ❌ Wrong fallback
};

// After - Host node only uses its own image
const hostNode: Node = {
  imagePath: host.imageUrl || '', // ✅ Correct - no fallback
};
```

**Duplicate Prevention:**
```typescript
// Before - Created deepest node twice
parsed.nodes.forEach(node => {
  createEntity(node.id, seed, 'location'); // Creates deepest node
});
createEntity(parsed.deepestNodeId, seed, 'location'); // ❌ Duplicate!

// After - Create once, update separately
parsed.nodes.forEach(node => {
  createEntity(node.id, seed, 'location'); // Creates all nodes once
});
// Only update image, don't recreate
if (updateEntityImage && deepestNode.imagePath) {
  updateEntityImage(parsed.deepestNodeId, deepestNode.imagePath); // ✅ Just update
}
```

## Session Results

**Complete Fix Chain:**
1. ✅ Info buttons accessible everywhere (tree view + entity panels)
2. ✅ Host nodes display correct images (not stealing from children)
3. ✅ No duplicate nodes in tree view
4. ✅ Saved locations show meaningful thumbnails (best available from tree)
5. ✅ Placeholders work correctly when no images exist
6. ✅ Clean separation of concerns (stored vs computed vs displayed data)

**Benefits Delivered:**
- **Better UX**: Users can access info for any node, anytime
- **Correct Display**: Each node shows its own image, not borrowed from others
- **Meaningful Thumbnails**: Saved locations list shows visual representation even when host has no image
- **Data Integrity**: Stored data unchanged, computed values separate
- **Maintainability**: Clear, simple code patterns throughout
