# System Patterns

## Architecture Overview
Morfeum follows strict component-based architecture with clear separation of concerns for frontend and backend.

## Frontend Architecture

### Component Patterns

#### Strict Separation Rules
- **Markup (.tsx)**: Pure JSX only, no business logic
- **Logic (.ts)**: Business logic only, no JSX
- **Styles (.module.css)**: Pure CSS only
- **Types (types.ts)**: TypeScript interfaces

#### Component Size Limits
- Maximum 300 lines per file
- Minimum 50 lines for substantial components
- Index files 2-15 lines for exports

#### File Organization
```
ComponentName/
├── ComponentName.tsx      # Pure JSX markup
├── useComponentLogic.ts   # Business logic
├── ComponentName.module.css
├── types.ts
└── index.ts
```

### State Management Patterns

#### Zustand Slice Pattern
- 50-150 lines per slice
- Use `get()` for immediate access, `getState()` for current state
- Side-effects in hooks, not slices
- Cross-slice communication via get()/getState()
- **No persist middleware** - persistence handled by backend storage service

#### Storage Integration
Stores use backend API instead of localStorage:
- All mutations trigger `saveToBackend()` automatically
- Load from backend on app init
- Data flows: Store → POST /api/worlds → temp-db/worlds.json

### Design System

#### Token Usage
- Never hardcode colors, spacing, or sizes
- Always use CSS custom properties: `var(--token-name)`
- Theme-aware tokens for dark/light mode via `[data-theme="dark"]`

#### Icon Management
- Centralized in `@/icons/index.ts`
- Never import directly from @tabler/icons-react

### UI Layout Patterns

#### Z-Index Hierarchy
- **DraggablePanel base**: 1000 (increments on click)
- **Fixed buttons**: 1000
- **Spawn input bar**: 900
- **Modal overlay**: 9999

#### Image Drag and Drop
- Store-based state sharing via `spawnSlice.ts`
- Multi-level drop zones (App level + Input level)
- Vision API analysis → result appended to spawn input

### Deletion Pattern
Cascading deletes in `treesSlice.ts`:
1. Find subtree, collect descendant IDs
2. Delete from nodes map
3. Remove from tree structure
4. Clean up pins
5. Auto-save to backend

## Backend Architecture

### Module Organization
```
packages/backend/src/
├── server.ts          # Entry point
├── config/            # Configuration
├── middleware/        # Request processing
├── routes/            # API endpoints
├── services/          # Business logic
├── types/             # Type definitions
└── utils/             # Utilities
```

### Storage Service
- Location: `packages/backend/src/services/storage/`
- Storage: `packages/backend/temp-db/` (worlds.json, characters.json, media.json)
- API: GET/POST/DELETE at `/api/worlds`, `/api/characters`, `/api/media`

### Media System
- Centralized media asset management
- Entity reference tracking (multiple entities can reference same media)
- Metadata includes prompts, model info, dimensions

## DNA System Architecture

### Full Parent Context Pattern
Location: `packages/backend/src/engine/nodeCreation/core/dnaInheritance.ts`

Child nodes receive FULL parent context via `ParentDNAContext`:
- Parent identity (name, description, type)
- All 23+ DNA fields
- Structure data (dominantElements, uniqueIdentifiers)

**Key Rule**: Always pass full parent node when calling `extractParentDNAContext()`.

### Shared DNA Schema
Location: `packages/backend/src/engine/generation/prompts/shared/dnaSchema.ts`

Single source of truth for:
- Structure schema options
- DNA field descriptions
- Builder functions for prompts

### Data Flow
```
Backend (nested) → extractCleanDNA → Store (clean)
Store → getCascadedDNA → getMergedDNA → Backend LLM (merged)
```

## Space Type Registry Pattern

### Container Type Detection
Location: `packages/backend/src/engine/generation/shared/spaceTypeRegistry/`

**Problem**: Going inside a car generated building-like interiors. Same issue for boats, tents, and other non-building spaces.

**Solution**: Centralized registry with specialized rules per container type.

**Architecture**:
```
spaceTypeRegistry/
├── types.ts                    # Type definitions
├── index.ts                    # Registry + helper functions
├── building/                   # interior, exterior, openAir
├── vehicle/                    # carCabin, boatCabin, boatDeck
├── natural/                    # clearing
└── tentLike/                   # interior
```

**Container Types**:
- `building` - Standard architectural structures
- `vehicle-car` - Automotive vehicles (cars, trucks)
- `vehicle-boat` - Watercraft (ships, boats, yachts)
- `natural` - Natural formations (clearings, groves)
- `tent-like` - Temporary fabric structures

**Flow**:
1. `structureAnalysis.ts` - LLM outputs `containerType` field
2. `nicheDNA.ts` - Uses `getDNAGuidance(containerType, perspective)`
3. `imagePromptGeneration.ts` - Uses `getImageConstraints(containerType, perspective)`

**Key Functions**:
```typescript
import { 
  getDNAGuidance,       // DNA prompt guidance for container type
  getImageConstraints,  // FLUX constraints for container type
  getStructureGuidance, // Structure analysis guidance
  SPACE_TYPE_REGISTRY   // Full registry object
} from './spaceTypeRegistry';
```

**Adding New Container Type**:
1. Add type to `ContainerType` union in `types.ts`
2. Create file in appropriate category folder (e.g., `vehicle/airplane.ts`)
3. Import and add to `SPACE_TYPE_REGISTRY` in index.ts
4. LLM prompt auto-updates via `getContainerTypeDescriptions()`

## Structure Analysis Patterns

### LLM-Based Elevation Detection
Location: `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts`, `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`

**Pattern**: Use LLM to determine vertical positioning during structure analysis, avoiding brittle string matching.

**Architecture**:
1. Structure Analysis LLM analyzes user input and determines `elevation` field
2. Elevation stored as structured data in `Structure` interface
3. Image Prompt Generation uses elevation field to add positioning context

**Elevation Types**:
- `ground-level` - Standard ground floor (default)
- `rooftop` - On top of a building (rooftop terrace, helipad)
- `elevated` - Above ground, not rooftop (tower room, penthouse, observation deck)
- `underground` - Below surface (basement, cellar, crypt)
- `floating` - Suspended in air/space (cloud platform, space station)
- `suspended` - Hanging structure (suspended walkway, cable car)

**Detection Examples**:
- "rooftop balcony" → `elevation: "rooftop"`
- "tower room with view" → `elevation: "elevated"`
- "penthouse suite" → `elevation: "elevated"`
- "basement bar" → `elevation: "underground"`

**Benefits**:
- No additional LLM calls (uses existing structure analysis)
- Contextual understanding (LLM interprets meaning, not keywords)
- Structured, reusable data
- Extensible to new elevation types

### Scale Consistency System
Location: `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts`

- `inferScaleFromDescription()` detects scale from parent descriptions
- Dimension ranges: small (2-4m), medium (4-10m), large (10-30m)
- Rule: Interior scale CANNOT exceed parent exterior scale

### Opening Shape Inheritance
- `extractOpeningShapesFromParent()` scans parent for window shapes
- Shapes: rectangular, circular, arched, mixed, irregular
- Image prompts include explicit window shape descriptions

## PromptLayers Visual Preservation Pattern

### Location
`packages/backend/src/worldV2/prompts/imageEditPrompt.ts`, `packages/backend/src/worldV2/handlers/goInsideHandler.ts`

### Problem
DNA cascading caused visual style drift during navigation:
- Region atmosphere (e.g., "barren", "desolate") bleeding into interior scenes
- Visual signature from source image not preserved
- Missing enclosure assertions causing open-roof bugs

### Solution
Use `promptLayers` stored in media metadata instead of cascaded DNA for image edits.

### Architecture
```
Source Image (has promptLayers in media.metadata)
    ↓
GO_INSIDE2: Read source promptLayers
    ↓
LLM generates interior promptLayers (inherits visual signature)
    ↓
Build edit prompt using BOTH source and target promptLayers
    ↓
Store new promptLayers in media (enables chain navigation)
```

### promptLayers Structure
```typescript
interface ImagePromptLayers {
  name: string;
  description: string;
  background: string;   // Far layer (walls, ceiling, distant features)
  midground: string;    // Main features (furniture, passages)
  foreground: string;   // Close elements (floor, surfaces)
  lighting: string;     // How light behaves
  atmosphere: string;   // Mood and feeling
}
```

### Scene-Expert Skill Integration
Edit prompts follow the `scene-prompt-expert-using-edit-model` skill format:
- **Enclosure assertions**: "Solid ceiling above. Fully enclosed interior."
- **Megastructure protection**: "The structure is NOT visible as an object inside"
- **Threshold trap avoidance**: "Entrance is behind the camera"

### Key Files
- `goInside.ts` - Receives `sourcePromptLayers`, outputs `promptLayers`
- `goInsideHandler.ts` - Reads from media, stores to media
- `imageEditPrompt.ts` - Builds scene-expert formatted prompts

### When to Use
- **Image editing (GO_INSIDE2)**: Use promptLayers (preserves visual signature)
- **Image generation (NEW_WORLD_LOCATION)**: Use DNA cascade (gives regional character)

---

## Navigation System

### Two-Step Architecture
1. **Intent Classification (LLM)**: Analyze natural language
2. **Navigation Routing (Deterministic)**: Execute intent

### 13 Intent Types
GO_INSIDE, GO_OUTSIDE, GO_TO_ROOM, GO_TO_PLACE, LOOK_AT, LOOK_THROUGH, CHANGE_VIEW, GO_UP_DOWN, ENTER_PORTAL, APPROACH, EXPLORE_FEATURE, RELOCATE, UNKNOWN

### Handler Architecture
Modular handlers under 300 lines: basicMovement.ts, viewing.ts, special.ts, exploration.ts

## Command Flag System

### Flow
```
Frontend Input → commandParser → Backend Route → Pipeline → Analyzer
```

### Key Files
- Config: `packages/backend/src/config/navigation.ts` - `COMMAND_FLAGS`
- Parser: `packages/frontend/src/features/spawn-input/SpawnInputBar/commandParser.ts`
- Backend: `packages/backend/src/routes/mzoo/navigation.ts`

### Rules
1. Parse flags at TOP of handler before building intent
2. Use clean text (flags removed) for intent
3. Pass flags via options object to pipeline

## SSE Patterns

### Critical Pattern for Long-Running Operations
**Problem**: Events sent before frontend connects are lost.

**Solution**: 
1. Return response IMMEDIATELY with `eventsUrl`
2. Run pipeline ASYNCHRONOUSLY via IIFE: `(async () => { ... })()`
3. Frontend waits for SSE events via Promise
4. Close EventSource after completion/error

**Examples**: `worldTreePipeline.ts` + `spawn.ts`, `createNodePipeline.ts` + `navigation.ts`

### Dynamic Pipeline Configuration
**Problem**: Pipeline type unknown until after first LLM call (e.g., interior detection).

**Solution**:
1. Route sends HTTP response immediately with default config (e.g., `worldTree` 6 steps)
2. Pipeline's first stage detects actual type
3. If different, call `helper.updatePipelineConfig(newType, message)`
4. SSE event sends new `pipelineType` and `steps` array to frontend
5. Frontend updates progress bar step count dynamically

**Example**: `nodeCreationPipeline.ts` - starts as `worldTree`, updates to `worldTreeInterior` if niche detected

### Sub-Pipeline Pattern
**Problem**: Nested pipelines send their own SSE events (double progress bars, premature completion).

**Solution**:
1. Pass `isSubPipeline: true` in options
2. Inner pipeline skips `PipelineHelper` creation entirely
3. No `started()`, `startStage()`, `completeStage()`, `completed()` events from inner pipeline
4. Parent pipeline handles ALL SSE events

**Example**: `runCreateLocationNodePipeline` called from `runInteriorFlow` with `isSubPipeline: true`

## Character Creation System

### Character Creation Pipeline
Location: `packages/backend/src/engine/navigation/pipelines/createCharacterPipeline.ts`

7-step flow:
1. Prompt Engineering - Transform user input + environment DNA into detailed description
2. Seed Generation - Create character seed from engineered prompt
3. Scene Composition - LLM composes character + location into scene prompt
4. Image Generation - Generate character in environment image
5. Visual Analysis - Analyze the generated image
6. Profile Enrichment - Build deep character profile
7. Save - Persist character with location reference

### Camera Mode System
Location: `packages/backend/src/engine/generation/prompts/characters/composeCharacterScenePrompt.ts`

**9 Shot Types:**
- `half_portrait` - Face + upper body (default for character creation)
- `full_body` - Head to toe in environment
- `environmental_portrait` - 30-40% character, 60-70% environment
- `full_scene` - Wide shot, character small
- `close_up` - Face focus
- `action_shot` - Dynamic motion
- `dramatic_low_angle` - Power pose from below
- `aerial_overview` - Bird's eye view
- `over_shoulder` - From behind

**Usage:**
```typescript
composeCharacterScenePrompt(character, locationContext, shotType, apiKey, action?)
```

### Character Chat System Prompts
Location: `packages/frontend/src/utils/entity/buildCharacterSystemPrompt.ts`

**Includes:**
- Identity and backstory (from original user prompt)
- Full appearance (looks, face, body, hair)
- Clothing, personality, voice, speech style
- Current environment context
- Behavior instructions

**Interface:**
```typescript
interface CharacterDetails {
  name, looks, wearing, face?, body?, hair?,
  specificDetails?, style?, personality,
  voice?, speechStyle?, gender?, nationality?,
  tags?, context?  // Original user prompt / backstory
}
```

### Character Data Storage
Characters store reference to source location, NOT environment data:
```typescript
{
  sourceLocationId: string,
  sourceLocationName: string,
  characterType: 'real' | 'unreal',
  context: string  // Original user prompt / backstory
}
```

## Development Guidelines

### File Size Limits
- Components: 50-300 lines
- Services: 100-250 lines
- Routes: 100-200 lines
- Middleware: 20-50 lines
- Slices: 50-150 lines

### Quality Standards
- 100% TypeScript coverage, no `any` types
- Clean module boundaries
- Single responsibility per file
- CSS Modules with design tokens only
