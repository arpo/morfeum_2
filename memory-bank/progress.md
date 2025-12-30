# Progress

## 2025-12-30

- [x] **Immediate Surroundings for Nested Interiors - COMPLETED (Latest)**: Added system to correctly show immediate surroundings through windows for nested interior spaces
  - **Problem**: Car inside museum showed street scene through windows, not museum interior
  - **Root Cause**: `surroundingsDNA` was for world exterior, not immediate parent interior
  - **Solution**: Added `immediateSurroundings` concept that detects nested interiors and passes parent interior DNA
  - **Key Logic**: Only apply when `parentNode.type === 'niche'` (interior), not location (exterior)
  - **Files modified**:
    - `imagePromptHelpers.ts` - Added `buildImmediateSurroundingsConstraint()`, fixed `buildExteriorViewConstraint()`
    - `imagePromptGeneration.ts` - Added `immediateSurroundings` to input interface, updated buildSystemPrompt/buildConstraints
    - `nodeBuildingStep.ts` - Added `immediateSurroundings` to ImagePromptInput interface
    - `createNodePipeline.ts` - Added STEP 1.5 to resolve immediate surroundings for nested interiors

- [x] **Space Type Registry - COMPLETED**: Centralized registry for handling different container types (buildings, vehicles, boats, tents)
  - **Problem**: Going inside a car generated building-like interiors instead of car cabins. Same issue for boats, tents.
  - **Solution**: LLM detects `containerType` during structure analysis, registry provides specialized rules/prompts
  - **Container types**: building, vehicle-car, vehicle-boat, natural, tent-like
  - **One file per type**: Each SpaceTypeDefinition in its own file for easy maintenance
  - **Files created**:
    - `spaceTypeRegistry/types.ts` - Type definitions
    - `spaceTypeRegistry/index.ts` - Registry + helper functions
    - `spaceTypeRegistry/building/` - interior, exterior, openAir
    - `spaceTypeRegistry/vehicle/` - carCabin, boatCabin, boatDeck
    - `spaceTypeRegistry/natural/` - clearing
    - `spaceTypeRegistry/tentLike/` - interior
  - **Files modified**:
    - `navigation/types.ts` - Added containerType to StructureAnalysis
    - `structureAnalysis.ts` - LLM outputs containerType
    - `nicheDNA.ts` - Uses registry DNA guidance
    - `imagePromptGeneration.ts` - Uses registry image constraints
    - `PROMPT_INDEX.md` - Updated documentation

- [x] **Prompt Index Documentation - COMPLETED**: Created comprehensive prompt reference at `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md`

- [x] **Structured Image Prompt System - COMPLETED**: Implemented layer-based structured prompts across both pipelines

- [x] **Image Prompt DNA & Shape Improvements - COMPLETED**: Fixed multiple issues with DNA and shape information in image generation

## 2025-12-29

- [x] **GO_INSIDE Hierarchy Fix - Pass-Through Locations - COMPLETED**

## 2025-12-26

- [x] **Component Refactoring - COMPLETED**
- [x] **Dead Code Cleanup - COMPLETED**

## What Works ✅

### Core Application Features
- Contextual slash commands for navigation and node creation
- **Structured image prompts** with layer-based composition (background → midground → foreground)
- Entity system for character and location creation
- World tree system with hierarchical location structures
- 3D World View with depth rendering and stereo support
- Navigation system with AI-powered spatial navigation and intent classification
- **Immediate surroundings** for nested interiors (car in museum shows museum through windows)

### Technical Architecture
- Strict component separation (JSX, logic, styles)
- All files under 300-line limit
- Zustand state management with clean slices
- **Structured image prompts** stored in media.json for reuse
- **Direct FLUX constraints** for shapes and exterior views (bypasses LLM)
- **surroundingsDNA** for window/exterior context in interiors at world boundary
- **immediateSurroundings** for window context in nested interiors

### Image Generation Architecture
| Command | Pipeline | Image Generation Path |
|---------|----------|----------------------|
| `/NEW_WORLD` | `nodeCreationPipeline.ts` | → `mzoo.generateImage()` directly |
| `/GOTO`, `/GO_INSIDE` | `createNodePipeline.ts` | → `nodeBuildingStep.ts` → `imageGeneration.ts` |

### Window View Logic (Latest)
| Scenario | Parent Type | Windows Show |
|----------|-------------|--------------|
| Car in museum | niche (interior) | Museum interior |
| House in basement | niche (interior) | Basement |
| Spaceship in cave | niche (interior) | Cave walls |
| Museum from building | location (exterior) | World exterior |
| Room at world edge | location (exterior) | World exterior |

### Recent Improvements (Dec 2025)
- **Immediate Surroundings for Nested Interiors (Dec 30, Latest):**
  - `immediateSurroundings` concept for nested interior window views
  - Detects parent niche (interior) vs location (exterior)
  - `buildImmediateSurroundingsConstraint()` generates FLUX instructions
- **Space Type Registry (Dec 30):**
  - Container type detection (vehicle-car, vehicle-boat, tent-like, etc.)
  - Specialized prompts and constraints per container type
- **Structured Image Prompt System (Dec 30):**
  - Layer-based composition (background, midground, foreground, lighting, atmosphere)
  - Both spawn and navigation pipelines aligned
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
- Windows may show generic scenes despite constraints
- These are model limitations, prompts are correct

## Current Status 📊

- All files under size limits
- 100% TypeScript coverage, no any types
- All builds passing
- **Structured image prompts** working for both pipelines
- **Immediate surroundings** working for nested interiors
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
