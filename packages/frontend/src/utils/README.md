# Utility Modules

Unified, reusable utilities for spawn management, tree navigation, and entity sessions.

## Structure

```
utils/
├── spawn/
│   ├── sseConnection.ts       # SSE event handling
│   ├── completionHandlers.ts  # Entity completion logic
│   └── README.md
├── tree/
│   ├── navigation.ts          # Tree traversal
│   ├── expansion.ts           # Tree expansion
│   └── README.md
├── entity/
│   ├── sessionManager.ts      # Entity session management
│   └── README.md
└── README.md
```

## Spawn Utilities

### SSE Connection (`spawn/sseConnection.ts`)

Unified SSE setup for all entity types.

```typescript
import { setupSSEConnection, calculateProgress } from '@/utils/spawn/sseConnection';

setupSSEConnection(eventsUrl, spawnId, {
  onProgress: (id, data) => {
    const progress = calculateProgress(data.stage);
    updateProgress(id, progress);
  },
  onCompleted: (id, data) => handleCompletion(id, data),
  onError: (id, data) => handleError(id, data),
  onCancelled: (id) => handleCancel(id)
});
```

### Completion Handlers (`spawn/completionHandlers.ts`)

Unified completion logic that handles pinning, tree expansion, and session creation.

```typescript
import { handleSpawnCompletion } from '@/utils/spawn/completionHandlers';

// Automatically handles both characters and locations
handleSpawnCompletion(spawnId, completionData, store);
```

## Tree Utilities

### Navigation (`tree/navigation.ts`)

Find nodes, get ancestors, traverse trees.

```typescript
import { 
  findDeepestNodeId, 
  getAncestors, 
  findNodeInTree 
} from '@/utils/tree/navigation';

const deepId = findDeepestNodeId(worldTree);
const ancestors = getAncestors(worldTree, targetId);
const node = findNodeInTree(worldTree, nodeId);
```

### Expansion (`tree/expansion.ts`)

Manage tree expansion state.

```typescript
import { expandTreeToNode, collapseTree } from '@/utils/tree/expansion';

// Expand tree to show specific node
expandTreeToNode(worldTree, nodeId, 'entity-explorer-locations');

// Collapse all
collapseTree('entity-explorer-locations');
```

## Entity Utilities

### Session Manager (`entity/sessionManager.ts`)

Create, activate, and manage entity sessions.

```typescript
import { createEntitySession } from '@/utils/entity/sessionManager';

createEntitySession(store, {
  id: 'char-123',
  name: 'Character Name',
  type: 'character',
  personality: 'Friendly',
  imagePath: 'https://...',
  imagePrompt: '...'
});
```

## Backend Utilities

### Pipeline Helpers (`backend/.../pipelineHelpers.ts`)

Unified SSE events, timing, and logging for backend pipelines.

```typescript
import { PipelineHelper } from './shared/pipelineHelpers';

const helper = new PipelineHelper(spawnId, 'CharacterPipeline');

helper.started('Starting character generation...');
helper.startStage('seed_generation', 'Generating seed...');
helper.completeStage('seed_generation', 'Seed complete', { seed });
helper.completed('Character created', { character });
```

### Entity Persistence (`backend/.../entityPersistence.ts`)

Unified save and pin logic.

```typescript
import { 
  saveAndPinEntity, 
  buildCharacterEntity 
} from './shared/entityPersistence';

const character = buildCharacterEntity(
  spawnId, seed, visualAnalysis, 
  deepProfile, imageUrl, imagePrompt
);

await saveAndPinEntity('character', character);
```

## Benefits

✅ **No Duplication** - Write once, use everywhere
✅ **Consistent Behavior** - Same logic for all entity types
✅ **Easy to Test** - Each utility is independently testable
✅ **Easy to Extend** - Add new entity types by configuration
✅ **Type Safe** - Full TypeScript support

## Migration Guide

### Before (Duplicated)
```typescript
// Repeated in every completion handler
store.createEntity(id, seed, type);
store.updateEntityImage(id, image);
store.updateEntityImagePrompt(id, prompt);
store.setActiveEntity(id);
localStorage.setItem('lastActiveEntityId', id);
```

### After (Unified)
```typescript
import { createEntitySession } from '@/utils/entity/sessionManager';

createEntitySession(store, {
  id, name, type,
  imagePath: image,
  imagePrompt: prompt
});
