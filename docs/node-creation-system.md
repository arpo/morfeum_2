# Node Creation System

## Overview

The Node Creation System is a unified, modular architecture for creating world tree nodes (Host, Region, Location, Niche). It replaces the monolithic pipeline approach with composable functions that can be used by:

- **Slash commands** - Direct user interaction (`/new-host`, `/new-region`, etc.)
- **LLM tools** - Programmatic calls from Aluna AI (`createHost()`, `createRegion()`, etc.)
- **Combined pipelines** - Orchestrated multi-node creation

## Goals

1. **Reduce wait time** - Users see images faster
2. **Lower token costs** - Smaller, focused prompts per node type
3. **Scene consistency** - DNA inheritance ensures visual coherence
4. **Extensibility** - Foundation for future navigation features
5. **Reusability** - Same functions power slash commands and LLM tools

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INTERFACES                                    │
├─────────────────────────────────────────────────────────────────┤
│  Slash Commands (User)     │  Tools (Aluna/LLM)                 │
│  /new-host                 │  createHost()                       │
│  /new-region               │  createRegion()                     │
│  /new-location             │  createLocation()                   │
│  /new-niche                │  createNiche()                      │
│  /create-image             │  createImage()                      │
│  /explore [element]        │  exploreElement() ← FUTURE          │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    CORE FUNCTIONS                                │
│  createSingleNode()   │  generateDNA()   │  generateImage()     │
│  buildHierarchy()     │  detectScene()   │  inheritDNA()        │
└─────────────────────────────────────────────────────────────────┘
```

## Node Hierarchy

```
Host (World/Setting)
  └── Region (District/Biome)
        └── Location (Building/Site)
              └── Niche (Room/Space - interior OR exterior)
```

**Important**: Use `niche` terminology, NOT `subLocation` (deprecated).

## Directory Structure

```
packages/backend/src/engine/nodeCreation/
├── index.ts                     # Main exports
├── types.ts                     # Shared types and interfaces
├── core/
│   ├── createNode.ts            # Single node creation
│   ├── createHierarchy.ts       # Multi-node orchestration  
│   └── dnaInheritance.ts        # Parent → child DNA cascade
├── detection/
│   ├── sceneDetector.ts         # Interior/exterior detection
│   └── depthDetector.ts         # Determine hierarchy depth
├── prompts/
│   ├── dna/
│   │   ├── hostDNA.ts           # Host-specific DNA prompt
│   │   ├── regionDNA.ts         # Region-specific DNA prompt
│   │   ├── locationDNA.ts       # Location-specific DNA prompt
│   │   └── nicheDNA.ts          # Niche-specific DNA prompt
│   └── image/
│       ├── hostImage.ts         # Wide establishing shot
│       ├── regionImage.ts       # District overview
│       ├── locationImage.ts     # Building/site exterior
│       └── nicheImage.ts        # Interior OR exterior detail
└── progress/
    └── dynamicProgress.ts       # Variable step progress
```

## Node Types and Image Styles

| Node Type | Camera Style | Composition | Example |
|-----------|-------------|-------------|---------|
| **Host** | High/aerial establishing | Wide, epic scale | "Vast brass metropolis, aerial view, cinematic..." |
| **Region** | Medium establishing | District overview | "Camden streets, Victorian architecture..." |
| **Location** | Ground level exterior | Building/site focus | "The Anchor Pub facade, warm light from windows..." |
| **Niche (interior)** | Interior shot | Room composition | "Inside the pub, wooden bar, amber lighting..." |
| **Niche (exterior)** | Close exterior | Detail focus | "Rooftop terrace, city skyline backdrop..." |

## Usage Examples

### Scenario A: Simple Host Creation
```
User: "I want to go to London"

Aluna analyzes: Single location = Host is deepest
Tool call: createHost("London", { createImage: true })
Result: Host "London" with establishing image
```

### Scenario B: Full Hierarchy
```
User: "I want to go to a pub in Camden in London"

Aluna analyzes: Full hierarchy needed
Tool calls (sequential):
  1. createHost("London", { createImage: false })
  2. createRegion("Camden", { parentId: londonId, createImage: false })
  3. createLocation("The Anchor Pub", { parentId: camdenId, createImage: false })
  4. createNiche("Inside the pub", { parentId: pubId, createImage: true })
     ↑ IMAGE ONLY ON DEEPEST NODE
```

### Scenario C: Complex Input
```
User: "Schuiten-inspired vertical metropolis of brass and dark stone, 
       external funicular cages leading to a grand arched gate"

System detects: Complex scene description
Creates: Host with detailed DNA, image on host (it's deepest)
```

## DNA Inheritance

Each child node inherits DNA from its parent, with ability to override:

```
Host DNA (genre, architectural_tone, mood_baseline, etc.)
  │
  └─→ Region DNA (inherits, can override climate/biome aspects)
        │
        └─→ Location DNA (inherits, can override site-specific aspects)
              │
              └─→ Niche DNA (inherits, describes specific space)
```

### Cascading Fields
- `genre` - ONLY set on Host, never on children
- `architectural_tone` - Style that propagates down
- `cultural_tone` - Social/functional identity
- `mood_baseline` - Emotional baseline
- `palette_bias` - Color families
- Children can set to `null` to inherit parent value

## NavigableElements (Future Expansion)

Nodes contain `navigableElements` that can be explored later:

```json
{
  "navigableElements": [
    { "type": "balcony", "position": "right side", "description": "Ornate balcony with bay views" },
    { "type": "stairs", "position": "center", "description": "Sweeping stone stairs" },
    { "type": "door", "position": "central", "description": "Entrance to lower level" }
  ]
}
```

**Future**: `/explore balcony` or `exploreElement(nodeId, "balcony")` will:
1. Find the balcony in navigableElements
2. Create a niche from balcony description
3. Generate balcony image with inherited context
4. Attach to world tree

## Function Signatures

### Core Functions

```typescript
// Create a single node
async function createNode(
  nodeType: 'host' | 'region' | 'location' | 'niche',
  description: string,
  options?: CreateNodeOptions
): Promise<Node>

// Create full hierarchy from description
async function createHierarchy(
  spec: HierarchySpec,
  options?: CreateHierarchyOptions
): Promise<WorldTree>

// Generate image for existing node
async function createNodeImage(
  nodeId: string,
  options?: CreateImageOptions
): Promise<{ imageUrl: string; imagePrompt: string }>
```

### Options

```typescript
interface CreateNodeOptions {
  parentId?: string;           // Required for region, location, niche
  createImage?: boolean;       // Generate image (default: false)
  backgroundTask?: boolean;    // Run without visible progress
  style?: string;              // Visual style override
  perspective?: 'interior' | 'exterior';  // Scene type
}

interface HierarchySpec {
  host?: string;
  region?: string;
  location?: string;
  niche?: string;
  createImage?: boolean;       // Always on deepest node
}
```

## Dynamic Progress

Progress panel adapts to number of steps:

**1 node (Host only):**
```
[████████] Creating London...
[████████] Generating image...
```

**4 nodes (Full hierarchy):**
```
[██------] Creating London (host)...
[████----] Creating Camden (region)...
[██████--] Creating The Anchor Pub (location)...
[████████] Creating Inside the Pub (niche)...
[████████] Generating image...
```

## Migration Strategy

1. **Build alongside existing system** - New `nodeCreation/` folder
2. **Test both systems** - Compare outputs and performance
3. **Gradual migration** - Move features one by one
4. **Deprecate old system** - When new system is stable

## Terminology

| ✅ Use | ❌ Don't Use |
|--------|--------------|
| `niche` | `subLocation` |
| `createHierarchy` | `worldTreePipeline` (old) |
| `nodeCreation` | `v2` |

## Related Files

- Current world tree pipeline: `packages/backend/src/engine/pipelines/worldTreePipeline.ts`
- Current navigation pipeline: `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts`
- DNA types: `packages/backend/src/engine/hierarchyAnalysis/types.ts`
- Existing DNA generator: `packages/backend/src/engine/hierarchyAnalysis/nodeDNAGenerator.ts`
