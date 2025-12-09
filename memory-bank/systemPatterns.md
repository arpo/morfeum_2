# System Patterns

## Architecture Overview
Morfeum follows strict component-based architecture with clear separation of concerns for both frontend and backend.

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

### Design System Integration

#### Token Usage
- Never hardcode colors, spacing, or sizes
- Always use CSS custom properties: `var(--token-name)`
- Theme-aware tokens for dark/light mode

#### Dark Mode Pattern
```css
:root {
  --color-bg: #ffffff;
  --color-text: #1f2937;
}

[data-theme="dark"] {
  --color-bg: #111827;
  --color-text: #f9fafb;
}
```

### State Management Patterns

#### Zustand Slice Pattern
- 50-150 lines per slice
- Use `get()` for immediate access
- Use `getState()` for current state
- Side-effects in hooks, not slices
- Cross-slice communication via get()/getState()
- **No persist middleware** - persistence handled by backend storage service

#### UI State Persistence Pattern
For UI-specific state (panel positions, visibility), use localStorage directly:
```typescript
// Custom hook for panel state persistence
export function usePanelState() {
  const [position, setPosition] = useState<Position>(() => {
    const stored = localStorage.getItem('panelPosition');
    return stored ? JSON.parse(stored) : DEFAULT_POSITION;
  });

  useEffect(() => {
    localStorage.setItem('panelPosition', JSON.stringify(position));
  }, [position]);

  return { position, setPosition };
}
```

#### DraggablePanel Callback Pattern
DraggablePanels support position/size change callbacks for parent tracking:
```typescript
<DraggablePanel
  initialPosition={position}
  initialSize={size}
  onPositionChange={setPosition}  // Called after drag completes
  onSizeChange={setSize}           // Called after resize completes
>
  {children}
</DraggablePanel>
```

### Image Drag and Drop Pattern
Unified full-screen drop zone with local feedback:

#### Store-Based State Sharing
Zustand slice stores shared input text state:
```typescript
// spawnSlice.ts
export interface SpawnSlice {
  // State
  spawnInputText: string;
  
  // Actions
  setSpawnInputText: (text: string) => void;
  appendSpawnInputText: (text: string) => void;
}

export const createSpawnSlice = (set) => ({
  spawnInputText: '',
  setSpawnInputText: (text: string) => set({ spawnInputText: text }),
  appendSpawnInputText: (text: string) => set((state) => ({
    spawnInputText: state.spawnInputText 
      ? `${state.spawnInputText}\n\n${text}` 
      : text
  })),
});
```

#### Component-Specific Hooks
The hook responsible for image analysis is component-agnostic:
```typescript
// useImageDropLogic.ts (shared by multiple components)
export function useImageDropLogic({ onDescriptionReceived }) {
  // Drop/paste handling logic
  // Analysis state management
  // Callback when description is ready
  
  return {
    state: { isDragging, isAnalyzing, error },
    handlers: { handleDragEnter, handleDragLeave, handleDragOver, handleDrop, handlePaste }
  };
}
```

#### Multi-Level Drop Zones
- **App Level**: Full-screen drop zone captures drops anywhere
- **Input Level**: Local drop zone in textareas handles direct pastes
- **Visual Feedback**: Both levels share same style patterns for consistency

#### Event Flow
1. User drags image file over application
2. App-level handlers show full-screen overlay
3. Image dropped → App handlers process file
4. Vision API analyzes image
5. Result appended to spawn input via store
6. SpawnInputBar reads from store state

#### CSS Overlay Pattern
- Fixed positioning with high z-index (9999)
- Semi-transparent backdrop with blur
- Centered content with visual cues
- Status indicators (loading spinner, error messages)
- Consistent styling between global and local overlays

### Deletion Pattern
Cascading deletes maintain data integrity:

**Location Store (`treesSlice.ts`):**
```typescript
deleteNodeWithChildren: (nodeId) => {
  // 1. Find subtree in tree structure
  // 2. Collect all descendant IDs recursively
  // 3. Delete all nodes from nodes map
  // 4. Remove subtree from tree structure
  // 5. Clean up pins for deleted nodes
  // 6. Auto-save to backend
}
```

**Entity Manager (EntityTabs):**
```typescript
handleCloseTab: () => {
  // 1. Collect all descendant entity IDs
  // 2. Delete from location store (cascading)
  // 3. Close all entity sessions (tabs)
  // Result: No orphaned data or UI elements
}
```

#### Storage Integration Pattern
Stores now use backend API instead of localStorage:
```typescript
// In store slice
const saveToBackend = async () => {
  const response = await fetch('/api/worlds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.ok;
};

const loadFromBackend = async () => {
  const response = await fetch('/api/worlds');
  const data = await response.json();
  set({ data });
};
```

### Icon Management
- Centralized in `@/icons/index.ts`
- Never import directly from @tabler/icons-react
- Only export icons actually used

### Import Patterns
```typescript
// Correct
import { Button } from '@/components/ui';
import { IconLoader2 } from '@/icons';
```

### UI Layout Patterns

#### Draggable Panel System
- **Base z-index**: DraggablePanel starts at 1000, increments on click (bringToFront)
- **Modal z-index**: Modal overlay at 9999 to ensure modals appear above all panels
- **Panel persistence**: Position/size saved to localStorage via callbacks
- **Toggle pattern**: Fixed-position button to show/hide panel
- **Layout flexibility**: Panels can be positioned anywhere, no fixed sidebar needed

### WorldView Effects System

#### Architecture Overview
- **Layered Design**: Post-processors, particles, and scene presets in separate modules
- **Configuration-Driven**: All effects configurable via `WORLD_VIEW_3D_CONFIG`
- **Composable Effects**: Color effects can layer on top of displacement effects

#### Post-Processor System
- **Base System**: Applies displacement effects using custom shaders
- **Color Effects**: Built on top of displacement system
- **PostProcessorSystem Class**: Manages all effects and rendering
- **Shader Pipeline**:
  1. Scene renders to WebGLRenderTarget
  2. Shader applies displacement (distorts UVs)
  3. Shader applies color effects on result
  4. Result rendered to screen

#### Particle System
- **Flexible Behaviors**: float, fall, rise, flicker behaviors
- **Wind System**: Base wind + temporary gusts with smooth ease-in-out
- **Shader-Based**: Custom vertex/fragment shaders for soft particles
- **ParticleSystem Class**: Manages creation, animation, and cleanup

#### Scene Presets
- **Combined Effects**: Each scene combines particles + displacement + color effects
- **Auto Effects**: Scenes can trigger effects (lightning, wind) at random intervals
- **Themed Design**: Each preset creates a consistent atmosphere
- **ScenePreset Interface**: Documents configuration structure

#### Code Organization
```
effects/
├── README.md                    # Documentation
├── particles/                   # Particle system
│   ├── index.ts                
│   ├── types.ts                
│   ├── presets.ts              
│   └── ParticleSystem.ts       
├── postprocessors/              # Displacement + color effects
│   ├── index.ts                
│   ├── types.ts                
│   ├── presets.ts              
│   └── PostProcessorSystem.ts  
└── scenes/                      # Combined effects presets
    ├── index.ts                
    ├── types.ts                
    └── presets.ts              
```

#### Grid Layout Pattern
```typescript
// App.tsx - Flexible grid without fixed sidebar
.container {
  display: grid;
  grid-template-columns: minmax(400px, 600px) 350px; // Main + Side
  grid-template-rows: 1fr;
  height: 100vh;
}

// Responsive breakpoints
@media (max-width: 1600px) {
  grid-template-columns: minmax(350px, 500px) 320px;
}
```

#### Fixed UI Elements
- **Toggle buttons**: Fixed position, high z-index (1000)
- **Spawn input bar**: Fixed bottom-center, z-index 900
- **Theme toggle**: Fixed bottom-right, z-index 1000
- **Modals**: Fixed overlay, z-index 9999

## Backend Architecture

### Module Organization
```
packages/backend/src/
├── server.ts                 # Entry point (50-150 lines)
├── config/                   # Application configuration
├── middleware/               # Request processing
├── routes/                   # API endpoints
│   ├── storage.ts           # Storage API endpoints
│   └── ...
├── services/                 # Business logic
│   ├── storage/             # File storage service
│   └── ...
├── types/                    # Type definitions
└── utils/                    # Utilities
```

### Storage Service Pattern
Centralized file-based storage for development:
- Location: `packages/backend/src/services/storage/storageService.ts`
- Storage directory: `packages/backend/temp-db/`
- Files: `worlds.json`, `characters.json`, `media.json`
- Purpose: Temporary storage before database migration
- API: GET/POST/DELETE endpoints at `/api/worlds`, `/api/characters`, and `/api/media`
- **Path Resolution**: Uses `__dirname` for reliable path resolution

### Media System Pattern
Centralized media asset management:
- Location: `packages/backend/src/services/media/mediaService.ts`
- Storage: `packages/backend/temp-db/media.json`
- Purpose: Manage images/videos with metadata and entity references

**Metadata Structure**:
```typescript
interface MediaMetadata {
  prompt: string;           // Full generated prompt
  originalPrompt?: string;  // User's original input
  model: string;           // AI model used (e.g., "FLUX")
  width?: number;
  height?: number;
}
```

**Key Features**:
- Single source of truth for media URLs
- Entity reference tracking (multiple entities can reference same media)
- Metadata includes original user prompts for context
- Clean separation: Character/location data in entities, media metadata here

**Storage Flow:**
```
Frontend Store → POST /api/worlds → storageService.ts → temp-db/worlds.json
temp-db/worlds.json → storageService.ts → GET /api/worlds → Frontend Store
```

**Auto-Save Pattern:**
All store mutations automatically trigger backend save:
```typescript
set((state) => ({
  // State updates
}));
(get() as any).saveToBackend?.(); // Automatic save
```

### Service Layer Pattern
Services handle business logic separate from routes:
- External API calls
- Complex data transformations
- Reusable functionality
- 100-250 lines per service

### Middleware Pattern
Middleware for cross-cutting concerns:
- Authentication/authorization
- Request validation
- Error handling
- 20-50 lines per middleware

### Route Organization
Routes are thin layers that:
- Handle HTTP-specific logic
- Call services for business logic
- Format responses
- 100-200 lines per route file

## Structure Analysis Patterns

### Scale Consistency System
Location: `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts`

**Purpose**: Ensure interior spaces have correct scale relative to their parent exterior.

**Scale Inference Function**:
```typescript
function inferScaleFromDescription(dna: any, description?: string): 'small' | 'medium' | 'large' | null {
  // Small indicators: modest, compact, pod, booth, cabin, cozy, tiny, cramped, narrow
  // Large indicators: vast, immense, enormous, massive, grand, huge, cathedral, warehouse
  // Medium indicators: standard, regular, moderate, typical, average, room, shop, café
}
```

**Dimension Ranges**:
- small: 2-4m (pods, booths, closets, cabins)
- medium: 4-10m (standard rooms, shops, cafés)
- large: 10-30m+ (halls, warehouses, cathedrals)

**Scale Constraint Rules**:
- Interior scale CANNOT exceed parent exterior scale
- large exterior → interior can be small, medium, or large
- medium exterior → interior can be small or medium (NOT large)
- small exterior → interior MUST be small

### Opening Shape Inheritance
Location: `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts`

**Purpose**: Ensure interior windows/openings match the shapes of exterior windows.

**Shape Extraction Function**:
```typescript
function extractOpeningShapesFromParent(parentStructure: any, parentDna: any): string[] {
  // Scans dominantElements, uniqueIdentifiers, looks, accent_features
  // Detects: rectangular window, circular porthole, arched window
  // Returns: ['rectangular', 'circular', 'arched'] (deduplicated)
}
```

**Structure Interface Addition**:
```typescript
interface Structure {
  // ... existing fields
  openingShape?: 'rectangular' | 'circular' | 'arched' | 'mixed' | 'irregular';
}
```

**Image Prompt Integration**:
```typescript
// In createNodePipeline.ts - composeImagePrompt()
if (structure.openingShape) {
  const shapeDescriptions = {
    rectangular: 'Windows and openings are rectangular/square-shaped.',
    circular: 'Windows and openings are circular/round (portholes).',
    arched: 'Windows and openings have arched tops.',
    mixed: 'Windows include both rectangular and circular shapes.',
    irregular: 'Windows and openings have organic, non-standard shapes.'
  };
  parts.push(shapeDescriptions[structure.openingShape]);
}
```

## DNA System Architecture

### Shared DNA Schema Module
Location: `packages/backend/src/engine/generation/prompts/shared/dnaSchema.ts`

**Purpose**: Single source of truth for DNA structure schema, field descriptions, and prompt builders used across all DNA generation prompts.

**Exports**:
```typescript
// Structure schema options
export const STRUCTURE_OPTIONS = {
  form: ['rectangular', 'round', 'cylindrical', ...],
  roofType: ['domed', 'flat', 'vaulted', ...],
  scale: ['small', 'medium', 'large'],
  orientation: ['vertical', 'horizontal', 'wide', 'cubic'],
  openings: ['large-glass', 'arched-windows', ...],
  functionalType: ['residential', 'commercial', ...]
};

// Builder functions
export function buildStructureSchemaString(): string;
export function buildStructureField(nodeType: string): string;
export function buildDNAFieldsString(options: DNATemplateOptions): string;
export function buildGuidelines(includeStructure?: boolean): string;

// Field descriptions
export const DNA_SCENE_FIELDS = { looks, colorsAndLighting, atmosphere, ... };
export const DNA_CASCADING_FIELDS = { genre, architectural_tone, cultural_tone, ... };
export const DNA_GUIDELINES = { sceneVsCascading, genreRule, outputFormat, structureRule };
```

**Usage Pattern**:
```typescript
// In DNA prompt files (deepestNodeDNA.ts, parentChainDNA.ts, nodeDNAGeneration.ts)
import { buildStructureSchemaString, buildDNAFieldsString } from '../shared/dnaSchema';

const dnaFields = buildDNAFieldsString({
  includeStructure: nodeType === 'location',
  genreHandling: 'conditional',
  descLength: 'short',
  nodeType
});
```

**Benefits**:
- Single source of truth for DNA schema
- Future changes need only 1 update instead of 3
- Consistent field descriptions across all prompts
- Easier to maintain and test

### Core Concept
Separate structures for storage vs LLM usage:

**Storage (Database/Store)**
- Clean nodes without nested arrays
- Each node has only its own data
- Optimized for queries

**LLM Usage (Image Generation)**
- Merged DNA with inheritance
- Complete context for generation
- Child nulls inherit parent values

### Core Functions

#### extractCleanDNA
- Purpose: Strip nested arrays for storage
- Location: `packages/frontend/src/utils/nodeDNAExtractor.ts`
- Usage: When receiving backend data

#### getMergedDNA
- Purpose: Merge with inheritance for LLM
- Location: `packages/frontend/src/utils/nodeDNAExtractor.ts`
- Usage: Before sending to backend APIs

### Data Flow
```
Backend (nested) → extractCleanDNA → Store (clean)
Store → getCascadedDNA → getMergedDNA → Backend LLM (merged)
```

## Image Prompt Generation Patterns

### Niche Image Prompt System
Location: `packages/backend/src/engine/generation/prompts/navigation/nicheImagePrompt.ts`

**Purpose**: Generate FLUX image prompts for interior spaces when entering locations

**Key Features**:
- **Specific Navigation Requirements**: 3-4 concrete features (no vague descriptions)
- **Mandatory Layering**: Foreground (0-3m), Midground (3-10m), Background (10m+)
- **Inline Navigable Markers**: `(navigable: type, position)` format
- **Architectural Form Matching**: Interior matches entrance structure type

**Marker Format**:
```
[description] (navigable: [type], [position])
```

**Example**:
```
A large circular vent, 2 meters in diameter, emits warm orange light from the right wall (navigable: opening, right wall, midground).
```

**Marker Placement**: End of description for natural flow and easy LLM extraction

**Type Options**: passage, corridor, stairs, ladder, ramp, platform, walkway, opening, hatch, door, object

**Position Format**: Natural language like "left wall, midground" | "center, foreground" | "ahead, background"

**Flexibility**: Optional `navigationFeatures` parameter for custom or default guidance

**Extraction Flow**:
```
FLUX Prompt with inline markers → LLM extraction → Structured JSON navigableElements
```

## Command Flag System Pattern

### Architecture Overview
Command flags (e.g., `--furnish`) flow through the system from frontend to backend:

```
Frontend Input → commandParser → navigationCommands → Backend Route → Pipeline → Analyzer
```

### Implementation Files
- **Config**: `packages/backend/src/config/navigation.ts` - `COMMAND_FLAGS` constant
- **Frontend Parser**: `packages/frontend/src/features/spawn-input/SpawnInputBar/commandParser.ts`
- **Frontend Transmitter**: `packages/frontend/src/features/spawn-input/SpawnInputBar/navigationCommands.ts`
- **Backend Handler**: `packages/backend/src/routes/mzoo/navigation.ts`

### Flag Definition Pattern
```typescript
// packages/backend/src/config/navigation.ts
export const COMMAND_FLAGS = {
  CREATE_IMAGE: '--view',
  BACKGROUND_TASK: '--bgtask',
  FURNISH: '--furnish'
} as const;
```

### Frontend Parsing Pattern
```typescript
// commandParser.ts - Extract flags from user input
export interface ParsedCommand {
  command: string;
  text: string | undefined;
  flags: {
    createImage: boolean;
    backgroundTask: boolean;
    furnish: boolean;  // Add new flags here
  };
}

// Parse loop handles each flag
if (part === COMMAND_FLAGS.FURNISH) {
  flags.furnish = true;
} else if (!part.startsWith('--')) {
  textParts.push(part);
}
```

### Frontend Transmission Pattern
```typescript
// navigationCommands.ts - Reconstruct text with flags for API
let textWithFlags = text || '';
if (flags.furnish) {
  textWithFlags = textWithFlags ? `${textWithFlags} --furnish` : '--furnish';
}

// Send to backend
body: JSON.stringify({ command, text: textWithFlags || undefined, context })
```

### Backend Parsing Pattern (Critical)
```typescript
// navigation.ts - Parse flags FIRST, before building intent
const { cleanText, includeFurnishing } = parseCommandFlags(text);

// Build intent with CLEAN text (flags removed)
const intent = buildIntentFromCommand(command, cleanText || null, nodeType);

// Pass flags to pipeline
await runCreateNodePipeline(decision, context, intent, apiKey, { 
  userPrompt: cleanText,
  includeFurnishing  // Flag passed through
});
```

### Key Rules
1. **Parse flags at TOP of handler** - Before building intent or routing
2. **Use clean text for intent** - Flags should not leak into userPrompt/target
3. **Pass flags via options object** - Explicitly pass to pipeline/analyzers
4. **Frontend reconstructs text** - Append flags back before API call

### Adding New Flags
1. Add to `COMMAND_FLAGS` in backend config
2. Add to `ParsedCommand.flags` interface in frontend
3. Add parsing logic in commandParser
4. Add reconstruction in navigationCommands
5. Handle in backend route and pass to pipeline

## Navigation System Patterns

### Two-Step Architecture
1. **Intent Classification (LLM)**: Analyze natural language
2. **Navigation Routing (Deterministic)**: Execute intent

### 13 Intent Types
1. GO_INSIDE - Enter enclosed space
2. GO_OUTSIDE - Exit to exterior
3. GO_TO_ROOM - Navigate within structure
4. GO_TO_PLACE - Navigate to location
5. LOOK_AT - Examine something
6. LOOK_THROUGH - Look through opening
7. CHANGE_VIEW - Change perspective
8. GO_UP_DOWN - Change elevation
9. ENTER_PORTAL - Special passage
10. APPROACH - Move closer
11. EXPLORE_FEATURE - Follow feature
12. RELOCATE - Travel to area
13. UNKNOWN - Cannot determine

### Handler Architecture
Modular handlers under 300 lines each:
- basicMovement.ts - GO_INSIDE, GO_OUTSIDE, etc.
- viewing.ts - LOOK_AT, LOOK_THROUGH, etc.
- special.ts - GO_UP_DOWN, ENTER_PORTAL, etc.
- exploration.ts - EXPLORE_FEATURE, RELOCATE

## Server-Sent Events (SSE) Patterns

### Critical Race Condition Pattern

**Problem**: SSE events sent before frontend establishes connection are lost forever.

**Symptoms**:
- Backend logs show events being sent
- Frontend establishes SSE connection
- No events appear in browser console
- Pipeline completes but no progress updates shown

**Root Cause**: Synchronous pipeline execution blocks response, events sent before EventSource connects.

### Correct Implementation Pattern

#### Backend Route (Asynchronous Execution)
```typescript
router.post('/api/endpoint', async (req, res) => {
  // 1. Generate unique ID for this operation
  const operationId = `prefix-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const eventsUrl = `/api/events/${operationId}`;
  
  // 2. Return response IMMEDIATELY with eventsUrl
  res.status(200).json({
    data: { operationId, eventsUrl }
  });
  
  // 3. Run pipeline ASYNCHRONOUSLY (don't await in route)
  (async () => {
    try {
      await runPipeline(operationId, ...params);
    } catch (error) {
      console.error('Pipeline error:', error);
    }
  })();
  
  return; // Exit route handler
});

// SSE connection endpoint
router.get('/api/events/:operationId', (req, res) => {
  const { operationId } = req.params;
  sseService.addConnection(operationId, res);
});
```

#### Pipeline (SSE Event Emission)
```typescript
export async function runPipeline(operationId: string, ...params) {
  try {
    // Send start event
    sseService.sendEvent(operationId, 'progress', { 
      stage: 'started', 
      message: 'Starting operation...' 
    });
    
    // Step 1
    sseService.sendEvent(operationId, 'progress', { 
      stage: 'step1', 
      message: 'Processing step 1...' 
    });
    await doStep1();
    
    // Step 2
    sseService.sendEvent(operationId, 'progress', { 
      stage: 'step2', 
      message: 'Processing step 2...' 
    });
    await doStep2();
    
    // Completion
    sseService.sendEvent(operationId, 'completed', { 
      message: 'Operation complete',
      result: data,
      timings: {...}
    });
    
    setTimeout(() => sseService.closeConnection(operationId), 1000);
  } catch (error) {
    sseService.sendEvent(operationId, 'error', { 
      message: 'Operation failed', 
      error: error.message 
    });
    sseService.closeConnection(operationId);
  }
}
```

#### Frontend (Promise-based SSE Handling)
```typescript
async function callAPI() {
  const response = await fetch('/api/endpoint', {
    method: 'POST',
    body: JSON.stringify(data)
  });
  
  const result = await response.json();
  
  // If SSE URL provided, wait for pipeline completion
  if (result.data.eventsUrl) {
    return new Promise((resolve, reject) => {
      const eventSource = new EventSource(result.data.eventsUrl);
      let capturedData = {};
      
      eventSource.addEventListener('progress', (event) => {
        const data = JSON.parse(event.data);
        console.log(`[Operation ${result.data.operationId}] ${data.stage}:`, data.message);
        // Capture intermediate data
        if (data.data) Object.assign(capturedData, data.data);
      });
      
      eventSource.addEventListener('completed', (event) => {
        const data = JSON.parse(event.data);
        console.log(`[Operation ${result.data.operationId}] COMPLETED`);
        eventSource.close();
        resolve({ ...capturedData, ...data });
      });
      
      eventSource.addEventListener('error', (event) => {
        const data = JSON.parse(event.data);
        console.error(`[Operation ${result.data.operationId}] ERROR:`, data.message);
        eventSource.close();
        reject(new Error(data.message));
      });
      
      eventSource.onerror = (err) => {
        if (eventSource.readyState === EventSource.CLOSED) return;
        eventSource.close();
        reject(new Error('SSE connection failed'));
      };
    });
  }
  
  return result.data; // Non-SSE operations
}
```

### Key Rules

1. **Always return response BEFORE starting async work**
2. **Use IIFE pattern** for async operations: `(async () => { ... })()`
3. **Frontend must wait** for SSE events via Promise
4. **Capture intermediate data** during progress events
5. **Close EventSource** after completion/error
6. **Add unique operation ID** for tracking

### Examples in Codebase

- ✅ **Working**: `worldTreePipeline.ts` + `spawn.ts` (Generate button)
- ✅ **Working**: `createNodePipeline.ts` + `navigation.ts` (Travel button)

### Anti-Pattern (Causes Race Condition)
```typescript
// ❌ WRONG - Events sent before connection exists
router.post('/api/endpoint', async (req, res) => {
  const result = await runPipeline(...); // Blocks here
  res.json({ result }); // Response comes AFTER events sent
});
```

## Development Guidelines

### File Size Limits
- Components: 50-300 lines
- Services: 100-250 lines
- Routes: 100-200 lines
- Middleware: 20-50 lines
- Slices: 50-150 lines

### Quality Standards
- 100% TypeScript coverage
- No `any` types
- Clean module boundaries
- Single responsibility per file
- Comprehensive error handling

### CSS Architecture
- CSS Modules only
- Design tokens for all values
- Theme support via CSS variables
- No global CSS classes

### Build Optimization
- Tree shaking via selective exports
- Code splitting for large features
- CSS Modules prevent conflicts
- Icon optimization through centralization
