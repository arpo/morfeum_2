# Progress

## 2025-12-30

- [x] **Prompt Index Documentation - COMPLETED (Latest)**: Created comprehensive prompt reference at `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md`
  - Catalogs 30+ prompts organized by category (Vision, Character, Navigation, Location/DNA, Image, Chat, Enhancer)
  - Documents file locations with relative links
  - Shows pipeline flow diagrams for all major flows (World Tree, Navigation, Character, Image Drop)
  - Non-invasive documentation - no code changes to working systems

- [x] **Structured Image Prompt System - COMPLETED**: Implemented layer-based structured prompts across both pipelines
  - **Problem**: Image prompts were unstructured strings, making it difficult to place characters in layers, modify parts, or reuse scenes
  - **Solution**: Structured JSON format with `background`, `midground`, `foreground`, `lighting`, `atmosphere` fields
  - **New files created**:
    - `imagePromptTypes.ts` - `ImagePromptStructure` and `AssemblePromptOptions` interfaces
    - `imagePromptAssembler.ts` - `assembleImagePrompt()` to convert structure to FLUX string
  - **Navigation flow updated** (`/GOTO`, `/GO_INSIDE`):
    - `imagePromptGeneration.ts` - LLM outputs structured JSON, new `generateStructuredImagePrompt()`
    - `nodeBuildingStep.ts` - Returns `{ prompt, structure }`, stores in media
    - `createNodePipeline.ts` - Uses structured output, passes to media
  - **Spawn flow updated** (`/NEW_WORLD`):
    - `contextPromptBuilder.ts` - Requests structured JSON output
    - `nodeCreationPipeline.ts` - Parses JSON, uses `assembleImagePrompt()`, stores structure
    - `helpers.ts` - `assignMediaToTree()` accepts `promptStructure` parameter
  - **Storage**: `promptStructure` saved in media.json metadata for reuse
  - **Architecture note**: `/NEW_WORLD` uses `mzoo.generateImage()` directly (not `imageGeneration.ts`)
  - Build verification passed

- [x] **Image Prompt DNA & Shape Improvements - COMPLETED**: Fixed multiple issues with DNA and shape information in image generation
  - [x] **Interior dominantElements fix**: GO_INSIDE no longer copies parent structure as a dominant element
  - [x] **Non-rectangular shape constraints**: FLUX now receives direct shape instructions via `[CRITICAL SHAPE: ...]`
  - [x] **Exterior view constraints for windows**: Windows now instructed to show world DNA via `[CRITICAL EXTERIOR VIEWS: ...]`

## 2025-12-29

- [x] **GO_INSIDE Hierarchy Fix - Pass-Through Locations - COMPLETED**: Fixed critical bug where interior niches were added as siblings instead of children of pass-through locations

## 2025-12-26

- [x] **Component Refactoring - COMPLETED**: Refactored oversized frontend files (ParticleSystem, entityManagerSlice)
- [x] **Dead Code Cleanup - COMPLETED**: Comprehensive analysis and removal of unused code

## What Works ✅

### Core Application Features
- Contextual slash commands for navigation and node creation
- **Structured image prompts** with layer-based composition (background → midground → foreground)
- Entity system for character and location creation
- World tree system with hierarchical location structures
- 3D World View with depth rendering and stereo support
- Visual effects system with scene presets, particles, and post-processing
- Navigation system with AI-powered spatial navigation and intent classification

### Technical Architecture
- Strict component separation (JSX, logic, styles)
- All files under 300-line limit
- Zustand state management with clean slices
- **Structured image prompts** stored in media.json for reuse
- **Direct FLUX constraints** for shapes and exterior views (bypasses LLM)
- **surroundingsDNA** for window/exterior context in interiors

### Image Generation Architecture
| Command | Pipeline | Image Generation Path |
|---------|----------|----------------------|
| `/NEW_WORLD` | `nodeCreationPipeline.ts` | → `mzoo.generateImage()` directly |
| `/GOTO`, `/GO_INSIDE` | `createNodePipeline.ts` | → `nodeBuildingStep.ts` → `imageGeneration.ts` |

Both pipelines now use structured prompts and store `promptStructure` in media.json.

### Recent Improvements (Dec 2025)
- **Structured Image Prompt System (Dec 30, Latest):**
  - Layer-based composition (background, midground, foreground, lighting, atmosphere)
  - `ImagePromptStructure` interface for type safety
  - `assembleImagePrompt()` utility for consistent assembly
  - Both spawn and navigation pipelines aligned
  - `promptStructure` stored in media.json for character placement, regeneration
- **Image Prompt DNA & Shape Improvements (Dec 30):**
  - Interior dominantElements no longer copy parent structure
  - Non-rectangular shapes get direct FLUX constraints
  - Windows/openings get exterior view constraints
- **GO_INSIDE Hierarchy Fix (Dec 29):**
  - Pass-through location children now correctly parented

## What's Left to Build 🚧

### Feature Development
- Character placement in structured prompts (use foreground/midground layers)
- Enhanced chat features
- Advanced navigation
- Media management
- User preferences
- Collaboration

### Technical Improvements
- Performance optimization
- Testing
- Documentation
- Accessibility
- Error handling

### Known FLUX 1 Limitations
- Non-rectangular shapes may still render as rectangular
- Windows may show generic nature instead of world DNA
- These are model limitations, prompts are correct

## Current Status 📊

- All files under size limits
- 100% TypeScript coverage, no any types
- All builds passing
- **Structured image prompts** working for both pipelines
- **promptStructure** stored in media.json
- Strict separation patterns enforced

## Known Issues 🐛

- Legacy components may not follow latest patterns
- Bundle size warning (865KB) - needs code splitting
- **FLUX 1 limitations**: May ignore shape/exterior view constraints (model issue, not prompt issue)

## Development Standards 📋

- File size: 50-300 lines
- Separation: markup (.tsx), logic (.ts), styles (.module.css)
- Zustand slices with clear boundaries
- Centralized icons and design tokens
- TypeScript compilation success
- **Structured prompts** for all image generation
- **Direct FLUX constraints** for critical visual requirements
