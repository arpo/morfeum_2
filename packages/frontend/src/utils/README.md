# Frontend Utilities Documentation

This directory contains centralized utilities for common operations across the frontend application.

## Table of Contents

- [Tree Utilities](#tree-utilities)
- [Entity Session Loader](#entity-session-loader)
- [Hierarchy Parser](#hierarchy-parser)

---

## Tree Utilities

**File:** `treeUtils.ts`

Centralized tree traversal and manipulation functions for location hierarchies.

### When to Use

Use these utilities whenever you need to:
- Find a node in a tree structure
- Traverse a tree hierarchy
- Calculate node depth or relationships
- Collect all nodes in a tree

### Available Functions

#### `findTreeContainingNode(trees, targetId)`

Finds which tree contains a specific node ID.

```typescript
import { findTreeContainingNode } from '@/utils/treeUtils';

const worldTrees = useLocationsStore.getState().worldTrees;
const tree = findTreeContainingNode(worldTrees, nodeId);
```

**Parameters:**
- `trees: TreeNode[]` - Array of tree roots to search
- `targetId: string` - Node ID to find

**Returns:** `TreeNode | undefined` - The tree containing the node, or undefined

---

#### `findNodeInTree(tree, targetId)`

Recursively finds a node in a tree by ID.

```typescript
import { findNodeInTree } from '@/utils/treeUtils';

const node = findNodeInTree(worldTree, 'node-id-123');
if (node) {
  console.log('Found:', node.name);
}
```

**Parameters:**
- `tree: TreeNode` - Tree to search
- `targetId: string` - Node ID to find

**Returns:** `TreeNode | null` - The found node, or null

---

#### `collectAllNodeIds(tree)`

Collects all node IDs in a tree (depth-first traversal).

```typescript
import { collectAllNodeIds } from '@/utils/treeUtils';

const worldTree = findTreeContainingNode(worldTrees, nodeId);
const allIds = collectAllNodeIds(worldTree);
// ['host-id', 'region-id-1', 'location-id-1', 'niche-id-1', ...]
```

**Parameters:**
- `tree: TreeNode` - Tree to traverse

**Returns:** `string[]` - Array of all node IDs in depth-first order

**Usage Example:**
```typescript
// Load all nodes in a tree
const tree = findTreeContainingNode(worldTrees, nodeId);
if (tree) {
  const nodeIds = collectAllNodeIds(tree);
  nodeIds.forEach(id => {
    // Process each node
  });
}
```

---

#### `traverseTree(tree, callback, depth?)`

Traverses a tree and calls a callback for each node with its depth.

```typescript
import { traverseTree } from '@/utils/treeUtils';

traverseTree(worldTree, (node, depth) => {
  console.log(`${'  '.repeat(depth)}${node.name}`);
});
```

**Parameters:**
- `tree: TreeNode` - Tree to traverse
- `callback: (node: TreeNode, depth: number) => void` - Function called for each node
- `depth?: number` - Starting depth (default: 0)

---

#### `getNodeDepth(tree, targetId)`

Gets the depth of a specific node in a tree.

```typescript
import { getNodeDepth } from '@/utils/treeUtils';

const depth = getNodeDepth(worldTree, nodeId);
// 0 = host, 1 = region, 2 = location, 3 = niche
```

**Parameters:**
- `tree: TreeNode` - Tree to search
- `targetId: string` - Node ID to find depth for

**Returns:** `number` - Depth (0 = root), or -1 if not found

---

#### `countNodes(tree)`

Counts total number of nodes in a tree.

```typescript
import { countNodes } from '@/utils/treeUtils';

const total = countNodes(worldTree);
console.log(`Tree contains ${total} nodes`);
```

**Parameters:**
- `tree: TreeNode` - Tree to count nodes in

**Returns:** `number` - Total number of nodes

---

#### `getAncestors(tree, targetId)`

Gets all ancestor nodes from root to parent (excluding the target node).

```typescript
import { getAncestors } from '@/utils/treeUtils';

const ancestors = getAncestors(worldTree, nicheId);
// [hostNode, regionNode, locationNode]
```

**Parameters:**
- `tree: TreeNode` - Tree to search
- `targetId: string` - Node ID to find ancestors for

**Returns:** `TreeNode[]` - Array of ancestor nodes (root to parent)

---

## Entity Session Loader

**File:** `entitySessionLoader.ts`

Centralized entity session creation for location trees. Ensures consistency across all loading paths (new generation, manual load, auto-load).

### Philosophy: Preserve Raw Data

The entity session loader works with the simplified node structure:
- `node.dna` contains ALL backend fields (after hierarchyParser)
- Spreads all fields into entity profile
- No selective field picking

### When to Use

Use this utility whenever you need to:
- Create entity sessions for location nodes
- Load a complete location tree into ChatTabs
- Ensure all nodes appear with proper hierarchy

### Available Functions

#### `createEntitySessionsForNodes(nodeIds, callbacks, options?)`

Creates entity sessions for a list of node IDs.

```typescript
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { useStore } from '@/store';

const createEntity = useStore(state => state.createEntity);
const updateEntityImage = useStore(state => state.updateEntityImage);
const updateEntityProfile = useStore(state => state.updateEntityProfile);

const count = createEntitySessionsForNodes(
  ['node-1', 'node-2', 'node-3'],
  { createEntity, updateEntityImage, updateEntityProfile },
  { logProgress: true, logPrefix: '[MyComponent]' }
);
```

**Parameters:**
- `nodeIds: string[]` - Array of node IDs to create sessions for
- `callbacks: EntitySessionCallbacks` - Entity management callbacks
  - `createEntity(id, seed, type)` - Creates entity session
  - `updateEntityImage(id, imagePath)` - Updates entity image
  - `updateEntityProfile(id, profile)` - Updates entity profile
- `options?: object` - Optional configuration
  - `logProgress?: boolean` - Enable console logging (default: false)
  - `logPrefix?: string` - Prefix for log messages (default: '[EntityLoader]')

**Returns:** `number` - Number of entity sessions created

**What it does:**
1. Gets node data from locationsSlice
2. Gets cascaded DNA for hierarchy (world/region/location structure)
3. Creates seed from `node.dna` (works with any structure)
4. Creates entity session
5. Updates with image if available
6. Spreads ALL fields from `node.dna` into profile

**Data Flow:**
```typescript
// node.dna has ALL backend fields (from hierarchyParser)
const dna = node.dna;  // { looks, dominantElements, materials_*, colors_*, dna, ... }

// Create enriched profile
const enrichedProfile = {
  ...cascadedDNA,  // Hierarchy layers
  location: {
    ...(cascadedDNA as any).location,
    ...dna  // Spread ALL backend fields
  }
};

// Result: profile.location has EVERYTHING
```

---

#### `createEntitySessionsForTree(tree, callbacks, options?)`

Creates entity sessions for an entire location tree.

```typescript
import { createEntitySessionsForTree } from '@/utils/entitySessionLoader';
import { findTreeContainingNode } from '@/utils/treeUtils';

const worldTree = findTreeContainingNode(worldTrees, nodeId);
if (worldTree) {
  const count = createEntitySessionsForTree(
    worldTree,
    { createEntity, updateEntityImage, updateEntityProfile }
  );
  console.log(`Created ${count} entity sessions`);
}
```

**Parameters:**
- `tree: TreeNode` - Tree structure containing all nodes
- `callbacks: EntitySessionCallbacks` - Entity management callbacks
- `options?: object` - Optional configuration

**Returns:** `number` - Number of entity sessions created

---

## Hierarchy Parser

**File:** `hierarchyParser.ts`

Converts nested backend hierarchy JSON into flat node storage + tree structure.

### Philosophy: Preserve Everything

The parser follows a **"dumb passthrough"** approach - it preserves ALL backend data without filtering or transforming:

- ✅ Stores complete backend objects as-is
- ✅ Only adds `slug` if missing
- ❌ No selective field mapping
- ❌ No data transformation
- ❌ No structure normalization

This ensures **zero data loss** from backend to frontend.

### When to Use

Use this parser when receiving new hierarchies from the backend to:
- Convert nested structure to flat node map
- Build tree index for hierarchy display
- Preserve ALL backend fields

### Available Functions

#### `parseNestedHierarchy(hierarchy, spawnId, imageUrl?)`

Main parsing function that converts nested JSON to flat nodes + tree.

```typescript
import { parseNestedHierarchy } from '@/utils/hierarchyParser';

const result = parseNestedHierarchy(backendHierarchy, 'spawn-123', imageUrl);
// {
//   nodes: Node[],
//   tree: TreeNode,
//   deepestNodeId: string
// }
```

**What it does:**
1. Takes nested hierarchy: `{ host: { regions: [{ locations: [{ niches: [] }] }] } }`
2. Flattens into nodes array with preserved backend data
3. Builds tree structure for hierarchy display
4. Returns deepest node ID (for auto-navigation)

**Data Preservation:**
```typescript
// Backend sends:
{
  "location": {
    "name": "The Forum",
    "looks": "...",
    "dominantElements": [...],
    "navigableElements": [...],
    "materials_primary": "...",
    "colors_dominant": "...",
    "dna": {...},
    // + any other fields
  }
}

// Frontend stores:
node.dna = {
  ...location,  // ALL fields preserved
  slug: "the-forum"  // Only addition
}
```

---

## Complete Example: Loading a Saved Location

Here's a complete example showing how to use all utilities together:

```typescript
import { findTreeContainingNode, collectAllNodeIds } from '@/utils/treeUtils';
import { createEntitySessionsForNodes } from '@/utils/entitySessionLoader';
import { useStore } from '@/store';
import { useLocationsStore } from '@/store/slices/locationsSlice';

function loadLocation(nodeId: string) {
  // 1. Get store callbacks
  const createEntity = useStore.getState().createEntity;
  const updateEntityImage = useStore.getState().updateEntityImage;
  const updateEntityProfile = useStore.getState().updateEntityProfile;
  const setActiveEntity = useStore.getState().setActiveEntity;
  
  // 2. Get location data
  const worldTrees = useLocationsStore.getState().worldTrees;
  const getCascadedDNA = useLocationsStore.getState().getCascadedDNA;
  
  // 3. Find the tree containing this node
  const tree = findTreeContainingNode(worldTrees, nodeId);
  
  if (!tree) {
    console.error('Tree not found for node:', nodeId);
    return;
  }
  
  // 4. Collect all node IDs in the tree
  const allNodeIds = collectAllNodeIds(tree);
  
  // 5. Create entity sessions for ALL nodes
  const count = createEntitySessionsForNodes(
    allNodeIds,
    { createEntity, updateEntityImage, updateEntityProfile },
    { logProgress: true, logPrefix: '[LoadLocation]' }
  );
  
  // 6. Set the clicked node as active
  setActiveEntity(nodeId);
  
  console.log(`Loaded ${count} nodes from tree`);
}
```

---

## Best Practices

### ✅ DO

- Use `findTreeContainingNode()` instead of writing custom tree search logic
- Use `collectAllNodeIds()` instead of inline recursive functions
- Use `createEntitySessionsForNodes()` for consistency across all load paths
- Import utilities at the top of your file
- Enable `logProgress` during development for debugging

### ❌ DON'T

- Write inline recursive tree traversal functions
- Duplicate entity session creation logic
- Search trees with manual loops
- Use hardcoded node type checks without consulting tree structure
- Create entity sessions without updating images and profiles

---

## Migration Guide

If you have existing code with inline tree traversal:

### Before:
```typescript
const findNode = (treeNode: any, targetId: string): boolean => {
  if (treeNode.id === targetId) return true;
  return treeNode.children?.some(child => findNode(child, targetId));
};

const worldTree = worldTrees.find(tree => findNode(tree, nodeId));

const allNodeIds: string[] = [];
const collectIds = (treeNode: any) => {
  allNodeIds.push(treeNode.id);
  treeNode.children?.forEach(collectIds);
};
collectIds(worldTree);
```

### After:
```typescript
import { findTreeContainingNode, collectAllNodeIds } from '@/utils/treeUtils';

const worldTree = findTreeContainingNode(worldTrees, nodeId);
const allNodeIds = collectAllNodeIds(worldTree);
```

---

## Testing

All utilities are pure functions and easily testable:

```typescript
import { findNodeInTree, collectAllNodeIds } from '@/utils/treeUtils';

const mockTree = {
  id: 'host-1',
  type: 'host',
  children: [
    {
      id: 'region-1',
      type: 'region',
      children: [
        { id: 'location-1', type: 'location', children: [] }
      ]
    }
  ]
};

const node = findNodeInTree(mockTree, 'location-1');
expect(node).toBeDefined();
expect(node?.id).toBe('location-1');

const ids = collectAllNodeIds(mockTree);
expect(ids).toEqual(['host-1', 'region-1', 'location-1']);
```

---

## Known Issues & Workarounds

### React Batching Delay

**Issue:** When creating many entity sessions at once, React may not batch all updates properly, causing ChatTabs to render before all sessions are created.

**Workaround:** Use a 50ms `setTimeout` before closing modals or triggering re-renders:

```typescript
createEntitySessionsForNodes(nodeIds, callbacks);

// Give React time to flush all updates
setTimeout(() => {
  onClose();
}, 50);
```

**Future:** Consider using React 18's `flushSync()` or proper dependency tracking in useEffect.

---

## Questions?

If you're unsure which utility to use:
- **Tree operations** → Use `treeUtils.ts`
- **Entity sessions** → Use `entitySessionLoader.ts`
- **Backend parsing** → Use `hierarchyParser.ts`

For more examples, see:
- `useSavedLocationsLogic.ts` - Manual load from modal
- `App.tsx` - Auto-load pinned locations
- `useSpawnEvents.ts` - New location generation
