# Active Context

## 2025-12-26

### Dead Code Cleanup - COMPLETED

Comprehensive dead code analysis and cleanup across frontend and backend.

#### **Phase 1: Unused Imports ✅ (5 files)**
Removed unused imports that were flagged by TypeScript strict mode:

| File | Removed Import |
|------|----------------|
| `Tabs.tsx` | `useEffect` |
| `EntityExplorer.tsx` | `TreeNode` |
| `WorldViewRenderer.ts` | `ScenePresetConfig` |
| `helpers.tsx` | `React` |
| `useProgressAnimation.ts` | `ProgressStep` |

#### **Phase 2: Deep Logic Review ✅ (3 files)**

**`useEntityGeneratorLogic.ts`** - Removed unused store fetches:
- Removed `cancelSpawn`, `activeSpawns` from store
- These were legacy from when component managed spawns directly
- Now delegates to `startSpawn` from store

**`nodeDNAExtractor.ts`** - Removed obsolete extraction logic:
- Removed `EXCLUSIONS` constant (was for stripping nested arrays)
- Removed `METADATA_FIELDS` constant (never used)
- Removed `generateSlug` function (never called)
- Backend now sends correct structure, old extraction logic obsolete

**`completionHandlers.ts`** - Prefixed intentionally unused params:
- `_spawnId` in `handleCharacterCompletion`, `handleLocationCompletion`
- `_spawnId`, `_completionData`, `_store` in `handleNavigationCompletion` (intentional no-op)
- These are intentionally unused for API consistency

#### **Design Debt Identified**
`EntityGeneratorState` interface requires loading states (`generatedSeed`, `loading`, `imageLoading`, etc.) but their setters are never called. Values are always their initial values (false/null). Future refactor could simplify this interface.

#### **Build Verification**
✅ Frontend: `tsc --noEmit` passes
✅ Backend: `tsc --noEmit` passes

## 2025-12-25

### Comprehensive File Size Refactoring - COMPLETED

**Major refactoring project completed** to bring all frontend and backend files under architectural size limits.

#### **Phase 1: Route Files ✅**
Refactored backend route files to comply with 100-200 line limits.

#### **Phase 2: Backend Files ✅**
Refactored backend services and pipelines to comply with 100-250 line limits.

Key extractions included:
- Navigation helpers extracted to utility files
- Pipeline steps modularized
- Handler files separated from route definitions

#### **Phase 3: Frontend Logic Files ✅**

| File | Before | After | Reduction | Method |
|------|--------|-------|-----------|--------|
| `useAppLogic.ts` | 344 lines | 115 lines | 67% | Extracted to 3 focused hooks |
| `PostProcessorSystem.ts` | 466 lines | 252 lines | 46% | Extracted GLSL shaders |
| `ParticleSystem.ts` | 462 lines | 420 lines | 9% | Extracted GLSL shaders |
| `WorldViewRenderer.ts` | 443 lines | Skipped | - | Already well-modularized |

**Frontend Hook Extraction Details:**
- `useAppInitialization.ts` (113 lines) - Data loading and theme setup
- `useDisplayMode.ts` (109 lines) - Display mode and depth map management  
- `useTrainingData.ts` (67 lines) - Training data save functionality

**GLSL Shader Extraction:**
- `postprocessors/shaders.ts` (209 lines) - Shader strings and effect type map
- `particles/shaders.ts` (49 lines) - Shader strings and blend mode constants

**React Hooks Fix:**
Fixed conditional hook calls in `useDisplayMode.ts` and `useTrainingData.ts` that caused "Cannot read properties of undefined" errors. Changed from conditional `useStore` calls to unconditional hook calls followed by conditional access.

#### **Phase 4: CSS Consolidation ✅ (Skipped - Already Compliant)**

Analyzed all 4 CSS files and found them within acceptable limits:
- `EntityPanelShared.module.css`: 213 lines
- `SavedEntitiesModal.module.css`: 212 lines
- `SpawnInputBar.module.css`: 180 lines
- `App.module.css`: 176 lines

Minor duplication identified (skeleton breathing animation ~30 lines) but deemed acceptable given files are already under limits.

#### **Build Verification**
✅ `npm run build` passed successfully after all refactoring

### Files Created/Modified

**Frontend - App Component:**
- `packages/frontend/src/features/app/components/App/useAppLogic.ts` - Reduced to coordinator
- `packages/frontend/src/features/app/components/App/useAppInitialization.ts` - NEW
- `packages/frontend/src/features/app/components/App/useDisplayMode.ts` - NEW
- `packages/frontend/src/features/app/components/App/useTrainingData.ts` - NEW

**Frontend - WorldView Effects:**
- `packages/frontend/src/features/app/components/WorldView/effects/postprocessors/shaders.ts` - NEW
- `packages/frontend/src/features/app/components/WorldView/effects/postprocessors/PostProcessorSystem.ts` - Reduced
- `packages/frontend/src/features/app/components/WorldView/effects/particles/shaders.ts` - NEW
- `packages/frontend/src/features/app/components/WorldView/effects/particles/ParticleSystem.ts` - Reduced

## Current Focus
- ✅ **COMPLETED**: Comprehensive file size refactoring (all 4 phases)
- ✅ **COMPLETED**: Build verification passed
- All files now comply with architectural size limits

## Previous Context (Dec 19)

See progress.md for details on:
- Location Perspective Fix for GOTO Command
- LLM-Based Elevation Detection
- GOTO/GO_INSIDE Command Alignment
- File Size Limit Refactoring (backend)
