# Progress

## What Works ✅

### Core Application Features
- Contextual slash commands for navigation and node creation (NEW_HOST, NEW_REGION, NEW_LOCATION, NEW_NICHE, VIEW, GO_INSIDE, GOTO) with optional `--furnish` flag
- Entity system for character and location creation, storage, and management
- World tree system with hierarchical location structures
- 3D World View with depth rendering and stereo support
- Visual effects system with scene presets, particles, and post-processing
- Navigation system with AI-powered spatial navigation and intent classification
- Centralized media system with image storage and depth map generation
- Training data export for LoRA model training
- Real-time external view sync
- Chat system with entity sessions
- UI state management (panel toggles, focus mode, explorers)
- Full-screen image drag and drop for AI description

### Technical Architecture
- Strict component separation (JSX, logic, styles)
- All files under 300-line limit
- Zustand state management with clean slices
- Centralized design tokens and icon management
- TypeScript compilation and Vite builds working
- Feature-based folder structure

### Recent Improvements (Nov-Dec 2025)
- **SpawnInputBar Refactoring & Dead Code Cleanup (Dec 15):**
  - Moved image drag/drop/paste from App.tsx to SpawnInputBar (was connected to wrong state)
  - Image descriptions now **append** to existing input text (not replace)
  - Moved "Saved Entities" button from SpawnInputBar to TopButtonRow
  - Added `onPaste` prop to SlashCommandInput component
  - **Dead code removed:**
    - Deleted `useSpawnInputLogic.ts` (unused hook from old tab system)
    - Deleted `types.ts` (types only used by deleted hook)
    - Removed 9 unused CSS styles from App.module.css
    - Removed `spawnInputText`, `setSpawnInputText`, `appendSpawnInputText` from spawnSlice.ts
  - Key files: `SpawnInputBar.tsx`, `SlashCommandInput.tsx`, `TopButtonRow.tsx`, `App.tsx`, `spawnSlice.ts`
- **Pipeline Progress Bar Fix & VIEW Command (Dec 15):**
  - Fixed GO_INSIDE progress bar not reaching 100% (filter was excluding completed spawns)
  - Added `view` pipeline to `pipelineConfig.ts` (was hardcoded in route)
  - Simplified VIEW pipeline to single step (matching other pipelines that save silently)
  - Added timing logs to VIEW command terminal output
  - Key files: `SpawnInputBar.tsx`, `pipelineConfig.ts`, `navigation.ts`, `pipelineHelpers.ts`
- **Character Creation System (Dec 12):** Full character creation from location nodes:
  - `/CREATE_CHARACTER_REAL` and `/CREATE_CHARACTER_UNREAL` slash commands
  - 7-step pipeline: prompt engineering → seed → scene composition → image → analysis → profile → save
  - Camera mode system with 9 shot types (`half_portrait`, `full_body`, `close_up`, etc.)
  - LLM scene composer for character-in-environment images
  - Character context/backstory storage (original user prompt preserved)
  - Rich chat system prompts with full character DNA and environment context
  - Key files: `createCharacterPipeline.ts`, `composeCharacterScenePrompt.ts`, `buildCharacterSystemPrompt.ts`
- **Open-Sky Rooftop/Terrace Fix (Dec 11):** Rooftop terraces now correctly show open sky:
  - Uses `roofType` field from structure analysis (not string matching)
  - When `roofType === 'open-sky'`, appends constraint DIRECTLY to final FLUX prompt
  - Constraint: `[CRITICAL: NO ROOF/CEILING - This is an OPEN-SKY outdoor space...]`
  - Bypasses LLM which was ignoring guidance due to parent DNA "cave" references
  - Key file: `imagePromptGeneration.ts`
- **DNA Bleeding Fix for /goto (Dec 11):** Current niche DNA no longer bleeds into new locations:
  - `findParentLocationNode()` now returns `null` for parentDNA when no valid location parent
  - NEVER returns niche DNA as parent DNA
  - Added `includeCurrentNodeDNA: false` option to image prompt generation
  - Key files: `navigationHelpers.ts`, `createNodePipeline.ts`, `imagePromptGeneration.ts`
- **Interior Spawn Pipeline System (Dec 11):** Complete rework of interior/niche creation:
  - **Two-phase approach**: Creates exterior hierarchy first, then runs GO_INSIDE for niche
  - **Dynamic pipeline config**: Route responds immediately, pipeline updates config via SSE when interior detected
  - **Sub-pipeline pattern**: `isSubPipeline: true` flag prevents nested pipelines from sending SSE events
  - **Single progress bar**: No more double progress bars or mid-stream switching
  - **Documentation**: Added comprehensive README at `packages/backend/src/engine/pipelines/README.md`
  - Key files: `nodeCreationPipeline.ts`, `createNodePipeline.ts`, `pipelineHelpers.ts`, `spawn.ts`
- **Windowless/Solid Exterior System (Dec 10):** Prevents incorrect window generation in solid structures:
  - Solid forms (dome, mushroom, saucer, pod, capsule, sphere) now MUST use `openings: "none"`
  - Added enclosed interior constraint for FLUX: no gaps, holes, or skylights unless specified
  - Removed duplicate `applyMorfeumStyle()` call that was causing prompt bloat
  - Made material inheritance rules generic (LLM-native, no hardcoded examples)
- **Pass-Through Region System (Dec 10):** Complete protection for structural regions:
  - Generic prompts create pass-through regions (empty DNA, name: "Region")
  - Pass-through nodes: non-selectable, no delete, no slash commands
  - Visual indicators: arrow icon, muted styling, default cursor
  - Backend validation blocks commands on pass-through nodes
  - Three-layer protection: TreeView → SpawnInput → Backend API
- **Fixed `--furnish` Flag (Dec 10):** Complete fix for furnishing functionality:
  - Bug: `furnishingDetails` was generated but never saved to node data
  - Fix: Added `FurnishingDetails` interface and property to nodeBuilder.ts
  - Enhancement: Strong prompt emphasis for FLUX ("FULLY FURNISHED", "40-60% floor space")
  - Now persists `furnishingDetails` to node with `userSpecified`, `suggested`, `placementNotes`
- **Full Parent Context for Slash Commands (Dec 9):** Fixed inaccurate DNA generation in `/NEW_REGION`, `/NEW_LOCATION`:
  - Extended `ParentDNAContext` to include ALL parent data (name, description, 23+ DNA fields, structure)
  - Slash commands now generate geographically accurate results (e.g., "Ringön in Göteborg")
  - DNA prompts now include rich parent context matching spawn flow behavior
- **Scale Consistency System (Dec 9):** Improved interior/exterior size matching:
  - `inferScaleFromDescription()` detects scale from parent descriptions ("modest" → small)
  - Tighter dimension ranges: small (2-4m), medium (4-10m), large (10-30m)
  - Critical scale rule: interior MUST be smaller than exterior
- **Opening Shape Inheritance (Dec 9):** Windows/openings now match exterior:
  - `extractOpeningShapesFromParent()` scans parent dominantElements for window shapes
  - New `openingShape` field in Structure interface
  - Image prompts include explicit window shape descriptions
- **`--furnish` command flag (Dec 9):** Optional flag for GOTO/GO_INSIDE that triggers furnishing analysis
- DNA inheritance system fixed: child nodes inherit parent materials, palette, and mood
- Navigation pipelines refactored: GOTO and GO_INSIDE create correct sibling/child nodes
- Two-step image generation: LLM prompt system for DNA-accurate images

## What's Left to Build 🚧

### Feature Development
- Enhanced chat features (rich text, file sharing, history)
- Advanced navigation (pathfinding, map view, bookmarks)
- Media management (bulk ops, filtering, metadata editing)
- User preferences (themes, layout)
- Collaboration (multi-user, shared worlds)

### Technical Improvements
- Performance optimization (code splitting, lazy loading)
- Testing (unit, integration, E2E)
- Documentation (components, API)
- Accessibility (ARIA, keyboard nav)
- Error handling (boundaries, feedback)

### Architecture Enhancements
- Plugin system for extensibility
- API versioning
- Advanced caching
- Real-time collaboration (WebSocket)

## Current Status 📊

- All files under size limits
- 100% TypeScript coverage, no any types
- All builds passing
- Strict separation patterns enforced
- Scale consistency system implemented for interior/exterior matching
- Opening shape inheritance for window consistency
- Open-sky rooftop/terrace system implemented
- DNA bleeding fix for /goto complete
- Pending: database migration, testing, CI/CD, advanced features

## Known Issues 🐛

- Legacy components may not follow latest patterns
- Bundle size warning (865KB) - needs code splitting
- Some Three.js ops could be optimized
- FAL API returns PNG despite JPEG request
- Route ordering for backend wildcards

## Development Standards 📋

- File size: 50-300 lines
- Separation: markup (.tsx), logic (.ts), styles (.module.css)
- Zustand slices with clear boundaries
- Centralized icons and design tokens
- TypeScript compilation success
- No console errors in dev
