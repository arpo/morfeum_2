# World Trees Panel - Implementation Plan

## Problem Statement

The current SSE event system for location spawns is fragile and fails when running multiple concurrent spawns. The frontend performs heavy processing (parsing hierarchies, creating nodes, updating stores) in SSE event listeners, which blocks subsequent events from being processed.

Additionally, locations and characters are mixed in the Saved Entities panel, creating unnecessary complexity.

## Current State

### Issues
1. **SSE Event Blocking**: Heavy frontend processing blocks subsequent location spawn events
2. **Mixed Entity Types**: Saved Entities panel shows both characters and locations
3. **Complex Event Handling**: Frontend does heavy hierarchy parsing, node creation, and store updates
4. **Unreliable Concurrent Spawns**: Second location spawn gets stuck at "Generating seed..."

### Current Architecture
```
User → Backend (Generate) → SSE Events → Frontend (Heavy Processing) → Display
                                           ↓
                                     Parse hierarchy
                                     Create nodes
                                     Update stores
                                     Update DNA
```

## Proposed Architecture

### New Design Principles
1. **Backend Does Heavy Lifting**: All hierarchy creation, node building happens in backend
2. **Lightweight SSE Events**: Only send status updates and image URLs
3. **Separation of Concerns**: Characters and World Trees in separate panels
4. **Pinned Worlds Only**: World Trees panel shows only pinned worlds
5. **History Panel Integration**: World Trees panel lives in history/chat area

### New Architecture
```
User → Backend (Generate + Build Complete Tree) → Lightweight SSE → Frontend (Display Only)
                     ↓
               Store in Database
                     ↓
          Return Ready-to-Display Data
```

## Implementation Plan

### Phase 1: Frontend Cleanup

#### 1.1 Update Saved Entities Panel (Characters Only)
**File**: `packages/frontend/src/features/saved-locations/` (rename to `saved-characters/`)

**Changes**:
- Remove all location/world tree filtering
- Update to only show and manage character entities
- Keep pinning functionality for characters
- Update UI labels: "Saved Characters" instead of "Saved Entities"

#### 1.2 Create World Trees Panel Component
**New Files**:
- `packages/frontend/src/features/world-trees-panel/WorldTreesPanel.tsx`
- `packages/frontend/src/features/world-trees-panel/WorldTreesPanel.module.css`
- `packages/frontend/src/features/world-trees-panel/useWorldTreesLogic.ts`
- `packages/frontend/src/features/world-trees-panel/types.ts`

**Features**:
- Display hierarchical tree of pinned worlds
- Expand/collapse nodes
- Click to select/preview node
- Navigate to node in chat
- Match existing panel styles (locations-panel)
- Show world tree hierarchy: Host → Region → Location → Niche

#### 1.3 Integrate into History Panel
**File**: `packages/frontend/src/features/chat/` or history panel component

**Changes**:
- Add World Trees Panel to history/chat area
- Position appropriately (left side or collapsible)
- Connect to navigation system

### Phase 2: Backend World Tree Building

#### 2.1 Update Location Generation Endpoint
**File**: `packages/backend/src/routes/spawn.ts`

**Changes**:
- Build complete world tree structure in backend
- Create all nodes (host, regions, locations, niches)
- Populate all DNA fields
- Store imageUrl in appropriate nodes
- Return complete, ready-to-display structure

#### 2.2 Simplify SSE Events
**Current Events**:
```typescript
hierarchy:classification-complete { hierarchy, spawnId }
hierarchy:image-prompt-generated { imagePrompt, spawnId }
hierarchy:image-complete { imageUrl, spawnId }
hierarchy:complete { hierarchy, metadata, imageUrl, spawnId }
```

**New Events**:
```typescript
world:status { spawnId, status: "classifying" | "generating_image" | "analyzing" | "building" }
world:image-ready { spawnId, imageUrl, prompt }
world:complete { spawnId, worldTree: CompleteTree }
```

#### 2.3 Create World Tree Builder Service
**New File**: `packages/backend/src/services/worldTree/builder.ts`

**Responsibilities**:
- Build complete world tree structure
- Create nodes with proper hierarchy
- Populate DNA fields
- Assign images to nodes
- Generate node IDs
- Prepare ready-to-display structure

### Phase 3: Database Integration

#### 3.1 Update World Storage Schema
**File**: `packages/backend/temp-db/worlds.json`

**Schema**:
```typescript
interface StoredWorldTree {
  id: string;
  name: string;
  createdAt: string;
  pinned: boolean;
  imageUrl: string;
  tree: {
    id: string;
    type: 'host';
    name: string;
    dna: NodeDNA;
    imagePath: string;
    children: TreeNode[];
  };
}
```

#### 3.2 Create World Trees API
**New Routes**:
```
POST   /api/worlds/generate    - Generate new world (returns when complete)
GET    /api/worlds             - List all worlds
GET    /api/worlds/pinned      - Get pinned worlds only
GET    /api/worlds/:worldId    - Get specific world tree
PATCH  /api/worlds/:worldId    - Update world (e.g., toggle pinned)
DELETE /api/worlds/:worldId    - Delete world
```

### Phase 4: Event System Cleanup

#### 4.1 Update useSpawnEvents Hook
**File**: `packages/frontend/src/hooks/useSpawnEvents.ts`

**Changes**:
- Remove `hierarchy:complete` event listener with heavy processing
- Remove `parseNestedHierarchy` call
- Remove `createNode` calls
- Remove complex DNA cascading logic
- Add simple `world:complete` listener that just stores the pre-built tree

#### 4.2 Update Frontend Store
**Files**: `packages/frontend/src/store/slices/locations.ts`

**Changes**:
- Add method to store complete world tree (no processing)
- Simplify node creation (backend sends ready-to-use nodes)
- Remove hierarchy parsing logic
- Keep pinning functionality

## File Structure Changes

### New Files
```
packages/frontend/src/features/world-trees-panel/
  ├── WorldTreesPanel.tsx
  ├── WorldTreesPanel.module.css
  ├── useWorldTreesLogic.ts
  └── types.ts

packages/backend/src/services/worldTree/
  ├── builder.ts
  └── types.ts

packages/backend/src/routes/worlds.ts
```

### Modified Files
```
packages/frontend/src/features/saved-locations/
  → Rename to saved-characters/
  → Remove location logic

packages/frontend/src/hooks/useSpawnEvents.ts
  → Simplify event handling
  → Remove heavy processing

packages/backend/src/routes/spawn.ts
  → Update location spawn endpoint
  → Build complete tree in backend

packages/backend/src/engine/hierarchyAnalysis/hierarchyAnalyzer.ts
  → Already updated with spawnId parameter

packages/frontend/src/store/slices/locations.ts
  → Simplify to accept pre-built trees
```

## API Changes

### New Events
```typescript
// Status update (lightweight)
world:status {
  spawnId: string;
  status: "classifying" | "generating_image" | "analyzing" | "building";
}

// Image ready (show immediately)
world:image-ready {
  spawnId: string;
  imageUrl: string;
  prompt: string;
}

// Complete tree (ready to display)
world:complete {
  spawnId: string;
  worldTree: WorldTree;
}
```

### WorldTree Structure
```typescript
interface WorldTree {
  id: string;
  name: string;
  type: 'world';
  createdAt: string;
  imageUrl: string;
  rootNode: TreeNode;
}

interface TreeNode {
  id: string;
  type: 'host' | 'region' | 'location' | 'niche';
  name: string;
  description: string;
  dna: NodeDNA;
  imagePath: string;
  spaceType: 'exterior' | 'interior';
  children: TreeNode[];
}
```

## Testing Plan

### 1. Concurrent World Generation
- Generate 3 world trees simultaneously
- Verify all complete successfully
- Check EventStream for all events
- Confirm no blocking or stuck spawns

### 2. World Trees Panel
- Pin multiple worlds
- Verify only pinned worlds appear in panel
- Test expand/collapse functionality
- Test node selection and preview
- Verify navigation integration

### 3. Characters Panel
- Verify only characters appear
- Test character pinning
- Ensure no location data leaks into panel

### 4. Cancellation
- Start world generation
- Cancel mid-process
- Verify clean cancellation
- Confirm no orphaned data

## Benefits

1. ✅ **Reliable Concurrent Spawns**: No frontend blocking
2. ✅ **Simpler Frontend**: Display-only, no heavy processing
3. ✅ **Better UX**: Image shows immediately
4. ✅ **Separation of Concerns**: Characters vs World Trees
5. ✅ **Cleaner Architecture**: Backend does backend work, frontend displays
6. ✅ **Easier to Debug**: Clear separation of responsibilities
7. ✅ **Scalable**: Can handle many concurrent generations

## Implementation Order

1. **Phase 1**: Create World Trees Panel (frontend structure)
2. **Phase 2**: Build backend world tree builder
3. **Phase 3**: Update SSE events to be lightweight
4. **Phase 4**: Connect panel to new events
5. **Phase 5**: Remove locations from Saved Entities panel
6. **Phase 6**: Clean up old event handling code
7. **Phase 7**: Test concurrent spawns
8. **Phase 8**: Add pinning functionality

## Rollback Plan

If issues arise:
1. Keep old code in git history
2. Feature flag the new panel
3. Gradually migrate users
4. Monitor for issues
5. Can revert to old SSE system if critical bugs found

## Success Criteria

- ✅ Multiple concurrent world generations work reliably
- ✅ World Trees panel displays pinned worlds
- ✅ Image shows immediately when ready
- ✅ Saved Entities panel is characters-only
- ✅ No heavy processing in frontend event listeners
- ✅ Cancellation works correctly
- ✅ Navigation between worlds works smoothly
