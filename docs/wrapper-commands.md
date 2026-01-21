# Wrapper Commands Guide

How to create wrapper commands that build specific prompts and delegate to backbone commands.

## What is a Wrapper Command?

A **wrapper command** is a slash command that:
1. Takes simple input (often just nodeId or a short text)
2. Builds a specific prompt based on context (host conditions, node data, etc.)
3. Delegates to a **backbone command** for the actual work

**Backbone commands** do the heavy lifting:
- `/EDIT_IMAGE` - Edit any node's image with a text prompt
- `/LOOK` - Create a view node with camera movement

**Wrapper commands** provide convenience:
- `/REDRAW` - Wrapper around EDIT_IMAGE using host timeOfDay/weather
- Future: `/SEASON spring`, `/DAMAGE`, `/ZOOM target`

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND                                │
├─────────────────────────────────────────────────────────────────┤
│  redrawHandler.ts (thin)                                        │
│  ├─ Validate: node selected?                                    │
│  ├─ POST /api/v2/redraw { nodeId, trailingCommand }            │
│  └─ Handle SSE → Create session for new view                    │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                         BACKEND                                 │
├─────────────────────────────────────────────────────────────────┤
│  redrawHandler.ts (heavy)                                       │
│  ├─ Find host → get timeOfDay + weather                         │
│  ├─ Build prompt: "Transform scene to {time} with {weather}"    │
│  ├─ Build view name: "Stormy night view"                        │
│  ├─ Call editImage() API (same as EDIT_IMAGE)                   │
│  └─ Create view node + media entry                              │
└─────────────────────────────────────────────────────────────────┘
```

**Key Principle:** Frontend handlers are thin (just pass nodeId + input). Backend handlers do all the work (build prompts, gather context, delegate).

## Step-by-Step: Creating a Wrapper Command

### 1. Backend Handler

Create `packages/backend/src/worldV2/handlers/myWrapperHandler.ts`:

```typescript
import { Request, Response } from 'express';
import { asyncHandler } from '../../middleware/errorHandler';
import { HTTP_STATUS, getModelClass } from '../../config';
import { editImage } from '../../services/mzoo';
import { storageService } from '../../services/storage/storageService';
import mediaService from '../../services/media/mediaService';
import { PipelineHelper } from '../../engine/pipelines/shared/pipelineHelpers';
import {
  generateOperationId,
  setupPipeline,
  cleanupPipeline,
  createViewNode
} from '../utils/routeUtils';

// Helper function to build the edit prompt
function buildMyPrompt(context: any, trailingCommand?: string): string {
  const parts: string[] = [];
  
  // Build prompt based on context
  parts.push(`Transform this scene to...`);
  
  if (trailingCommand?.trim()) {
    parts.push(`. ${trailingCommand.trim()}`);
  }
  
  return parts.join(' ');
}

// Helper function to build descriptive view name
function buildViewName(context: any): string {
  return `${context.type} view`;
}

export const myWrapperHandler = asyncHandler(async (req: Request, res: Response) => {
  const { nodeId, trailingCommand } = req.body;

  // Validation
  if (!nodeId) {
    res.status(HTTP_STATUS.BAD_REQUEST).json({ error: 'Missing nodeId' });
    return;
  }

  const apiKey = (req as any).mzooApiKey;
  if (!apiKey) {
    res.status(HTTP_STATUS.UNAUTHORIZED).json({ error: 'Missing API key' });
    return;
  }

  // Setup pipeline (reuse v2Edit for EDIT_IMAGE-based wrappers)
  const operationId = generateOperationId('mywrapper');
  const eventsUrl = setupPipeline(operationId, 'v2Edit');

  // Return immediately
  res.status(HTTP_STATUS.OK).json({
    data: { operationId, eventsUrl, command: 'MY_WRAPPER' }
  });

  // Async pipeline
  (async () => {
    const pipeline = new PipelineHelper(operationId, 'MY_WRAPPER', 'v2Edit');
    
    try {
      pipeline.started('Starting...');

      // Stage 1: Load data and build context
      pipeline.startStage('loading', 'Loading data...');
      const worldsData = await storageService.loadWorlds();
      const node = worldsData.nodes[nodeId];
      
      // Gather context (host, parent, etc.)
      const context = { /* your context */ };
      
      // Build prompt and view name
      const prompt = buildMyPrompt(context, trailingCommand);
      const viewName = buildViewName(context);
      
      const currentMedia = mediaService.getMediaById(node.primaryMedia);
      pipeline.completeStage('loading', 'Data loaded');

      // Stage 2: Call backbone API
      pipeline.startStage('editing', 'Editing image...');
      const result = await editImage(apiKey, prompt, currentMedia.url, ...);
      const imageUrl = result.data.images[0].url;
      pipeline.completeStage('editing', 'Image edited');

      // Stage 3: Save
      pipeline.startStage('saving', 'Saving...');
      const mediaEntry = mediaService.createMedia({ ... });
      const viewNode = createViewNode(worldsData, nodeId, viewName, ...);
      await storageService.saveWorlds(worldsData);
      pipeline.completeStage('saving', 'Saved');

      pipeline.completed('Success', { view: viewNode, imageUrl, ... });

    } catch (error) {
      pipeline.error(error);
    } finally {
      cleanupPipeline(operationId);
    }
  })();
});
```

### 2. Frontend Handler

Create `packages/frontend/src/worldV2/commands/handlers/myWrapperHandler.ts`:

```typescript
import { clearEntityMediaCache } from '@/services/mediaService';
import type { ParsedCommand } from '@/features/spawn-input/SpawnInputBar/commandParser';
import type { V2CommandCallbacks, V2CommandResult } from '../types';
import {
  validationError,
  handleCommandError,
  registerSpawn,
  reloadAndCreateSession,
  createErrorHandler
} from '../utils/commandUtils';

export async function handleMyWrapperCommand(
  parsedCommand: ParsedCommand,
  callbacks: V2CommandCallbacks,
  activeEntityId?: string | null,
  activeEntityType?: string | null
): Promise<V2CommandResult> {
  const { text } = parsedCommand;
  const { setIsMoving, setMovementInput } = callbacks;

  // Validate
  if (!activeEntityId) {
    return validationError(callbacks, 'No node selected.');
  }

  setIsMoving(true);

  try {
    const response = await fetch('/api/v2/my-wrapper', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        nodeId: activeEntityId,
        trailingCommand: text?.trim() || undefined
      })
    });

    const result = await response.json();
    if (!response.ok) {
      return handleCommandError(callbacks, result.error, 'Failed');
    }

    const { data } = result;

    if (data.eventsUrl && data.operationId) {
      registerSpawn(
        data.operationId,
        data.eventsUrl,
        `/MY_WRAPPER${text ? ' ' + text.trim() : ''}`,
        async (completedData: any) => {
          if (completedData.imageUrl && completedData.view) {
            clearEntityMediaCache(activeEntityId!);
            await reloadAndCreateSession(
              completedData.view,
              completedData.imageUrl,
              completedData.modelClass
            );
          }
          setIsMoving(false);
        },
        createErrorHandler(callbacks, 'Failed')
      );
    }

    setMovementInput('');
    return { success: true };
  } catch (error) {
    return handleCommandError(callbacks, error, 'Failed');
  }
}
```

### 3. Registration

**Backend `handlers/index.ts`:**
```typescript
export { myWrapperHandler } from './myWrapperHandler';
```

**Backend `routes.ts`:**
```typescript
import { myWrapperHandler } from './handlers';
router.post('/my-wrapper', myWrapperHandler);
```

**Backend `config/navigation.ts`:**
```typescript
MY_WRAPPER: { 
  requiresNodeType: ['host', 'region', 'location', 'space', 'view'], 
  blockedOnPassThrough: true,
  description: 'Description for command dropdown',
  category: 'media'
},
```

**Frontend `handlers/index.ts`:**
```typescript
export { handleMyWrapperCommand } from './myWrapperHandler';
```

**Frontend `commands/index.ts`:**
```typescript
import { handleMyWrapperCommand } from './handlers';

const V2_COMMANDS = [..., 'MY_WRAPPER'] as const;

// In switch:
case 'MY_WRAPPER':
  return handleMyWrapperCommand(parsedCommand, callbacks, activeEntityId, activeEntityType);
```

## Example: `/REDRAW` Command

The `/REDRAW` command transforms a scene to current host conditions.

### Prompt Building
```typescript
function buildRedrawPrompt(timeOfDay?: string, weather?: string): string {
  const parts: string[] = [];
  
  if (timeOfDay) {
    parts.push(`Transform this scene to ${timeOfDay} lighting conditions`);
  }
  
  if (weather) {
    parts.push(`with ${weather} weather`);
  }
  
  return parts.join(' ');
}
// Result: "Transform this scene to night lighting conditions with heavy rain weather"
```

### View Name Generation
```typescript
function buildConditionViewName(timeOfDay?: string, weather?: string): string {
  const parts: string[] = [];
  if (weather) parts.push(capitalize(weather));
  if (timeOfDay) parts.push(timeOfDay);
  return parts.join(' ') + ' view';
}
// Result: "Heavy rain night view"
```

## Future Wrapper Ideas

| Command | Backbone | Description |
|---------|----------|-------------|
| `/SEASON spring` | EDIT_IMAGE | Change vegetation/colors to season |
| `/DAMAGE fire` | EDIT_IMAGE | Add destruction/damage to scene |
| `/POPULATE busy` | EDIT_IMAGE | Add people/activity to scene |
| `/ZOOM target` | LOOK | Focus camera on specific element |
| `/AERIAL` | LOOK | Bird's eye view of location |

## Checklist for New Wrappers

**Backend:**
- [ ] Create handler file: `handlers/myWrapperHandler.ts`
- [ ] Export from `handlers/index.ts`
- [ ] Add route to `routes.ts`
- [ ] Add to `config/navigation.ts` with correct node types

**Frontend:**
- [ ] Create handler file: `commands/handlers/myWrapperHandler.ts`
- [ ] Export from `commands/handlers/index.ts`
- [ ] Import in `commands/index.ts`
- [ ] Add to `V2_COMMANDS` array
- [ ] Add case to switch statement
