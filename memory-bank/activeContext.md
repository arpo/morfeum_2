# Active Context

## 2025-12-29

### GO_INSIDE Hierarchy Fix - Pass-Through Locations - COMPLETED (Latest)

Fixed critical hierarchy bug where pass-through locations were created but interior niches were added as siblings instead of children.

#### Problem
When using `/GO_INSIDE` on a structure (e.g., "little house" inside a basement), the system should create:
```
The Basement Hall (niche)
  └── little house (location, isPassThrough=true)
        └── little house interior (niche) ← Should be CHILD
```

But was creating:
```
The Basement Hall (niche)
  ├── little house (location, isPassThrough=true)
  └── little house interior (niche) ← WRONG: SIBLING!
```

#### Root Cause Analysis
1. **Pass-through location created correctly** by backend nicheHandler
2. **Frontend captured `parentNodeId` BEFORE pass-through existed** (from `data.decision.parentNodeId`)
3. **Pipeline runs ~11 seconds**, then sends SSE completion event
4. **Frontend uses STALE `parentNodeId`** (original parent, not pass-through location)
5. **Frontend saves → overwrites backend's correct hierarchy**

#### Solution
Send the correct parent ID (`nicheParentId`) in the SSE completion event:

**Backend (createNodePipeline.ts):**
```typescript
if (options?.passThroughLocation) {
  completionData.passThroughLocation = options.passThroughLocation;
  // CRITICAL: Niche's parent is the pass-through location
  completionData.nicheParentId = options.passThroughLocation.node.id;
}
```

**Frontend (creationCommands.ts):**
```typescript
// Priority: nicheParentId > parentNodeId > currentNode.id
const correctParentId = nicheParentId || parentNodeId || currentNode.id;
```

**Frontend (navigationCommands.ts):**
```typescript
nicheParentId: completedData.nicheParentId  // Pass from completion event
```

#### Files Modified
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts` - Added `nicheParentId` to completion event
- `packages/backend/src/routes/mzoo/handlers/nicheHandler.ts` - Pass pass-through location to pipeline
- `packages/frontend/src/features/spawn-input/SpawnInputBar/creationCommands.ts` - Use `nicheParentId` from completion event
- `packages/frontend/src/features/spawn-input/SpawnInputBar/navigationCommands.ts` - Pass `nicheParentId` to handler

#### Build Verification
✅ Frontend: `tsc --noEmit` passes
✅ Backend: `tsc --noEmit` passes

## 2025-12-26

### Component Refactoring - COMPLETED

Refactored oversized frontend files to comply with architectural size limits.

#### **Phase 1: ParticleSystem.ts ✅ (42% reduction)**

| File | Before | After |
|------|--------|-------|
| `ParticleSystem.ts` | 421 lines | 245 lines |
| `particleBehaviors.ts` | - | 131 lines (NEW) |
| `particleHelpers.ts` | - | 130 lines (NEW) |

#### **Phase 2: entityManagerSlice.ts ✅ (40% reduction)**

| File | Before | After |
|------|--------|-------|
| `entityManagerSlice.ts` | 284 lines | 169 lines |
| `entityChatService.ts` | - | 55 lines (NEW) |
| `entityManagerHelpers.ts` | - | 58 lines (NEW) |

### Dead Code Cleanup - COMPLETED

Comprehensive dead code analysis and cleanup across frontend and backend.

## Current Focus

- ✅ **COMPLETED**: GO_INSIDE hierarchy fix for pass-through locations
- ✅ **COMPLETED**: Component refactoring (ParticleSystem, entityManagerSlice)
- ✅ **COMPLETED**: Dead code cleanup
- ✅ **COMPLETED**: Build verification passed
- All files now comply with architectural size limits

## Files Modified (Dec 29)

**Backend:**
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts` - Added `nicheParentId` to completion event
- `packages/backend/src/routes/mzoo/handlers/nicheHandler.ts` - Pass pass-through location to pipeline

**Frontend:**
- `packages/frontend/src/features/spawn-input/SpawnInputBar/creationCommands.ts` - Use `nicheParentId` from completion event
- `packages/frontend/src/features/spawn-input/SpawnInputBar/navigationCommands.ts` - Pass `nicheParentId` to handler

## Previous Context (Dec 26)

See progress.md for details on:
- Component refactoring (ParticleSystem, entityManagerSlice)
- Dead code cleanup
- File size limit refactoring
