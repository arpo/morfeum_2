# DNA System Architecture

## Philosophy

### The Core Problem

In Morfeum, we have a hierarchical world structure:
- **Host** (World) → **Region** → **Location** → **Niche**

Each level inherits characteristics from its parent. For example:
- A Gothic world has "dark, decaying" architectural tone
- All regions in that world should inherit this tone unless they override it
- A specific location might override with "Victorian decay"

### Storage vs Usage

We need **different data structures** for different purposes:

**Storage (Database/Store)**:
- Nodes stored **separately** with clean DNA
- No nested child arrays (no `host.regions[]`)
- Each node has only its own data
- Enables: vector search, efficient queries, modular updates

**LLM Usage (Image Generation, Navigation)**:
- Nodes need **merged DNA with inheritance**
- Child nodes inherit parent values (null-skipping)
- Complete context for creative generation
- Enables: consistent world-building, inherited aesthetics

## Architecture

### Two Core Functions

#### 1. extractCleanDNA - For Storage

**Purpose**: Strip nested child arrays when storing nodes from backend

**Usage**:
```typescript
import { extractCleanDNA } from '@/utils/nodeDNAExtractor';

const cleanDNA = extractCleanDNA(backendHostData, 'host');
// Result: { name, architectural_tone, ... } (NO regions array)
```

**Implementation**:
```typescript
const EXCLUSIONS = {
  host: ['regions'],      // Strip child regions array
  region: ['locations'],  // Strip child locations array
  location: ['niches'],   // Strip child niches array
  niche: []              // No children
};
```

**Where Used**:
- `hierarchyParser.ts` - When receiving data from backend
- Ensures clean storage in Zustand store

#### 2. getMergedDNA - For LLM Usage

**Purpose**: Merge cascaded DNA with inheritance (null-skipping)

**Usage**:
```typescript
import { getMergedDNA } from '@/utils/nodeDNAExtractor';

const cascaded = getCascadedDNA(nodeId);  // { world: {...}, region: {...} }
const merged = getMergedDNA(cascaded);    // Flat merged DNA
// Result: All parent values inherited where child has null
```

**Inheritance Rules**:
1. Start with host/world DNA as base
2. Override with region DNA (skip null values)
3. Override with location DNA (skip null values)
4. Override with niche DNA (skip null values)

**Where Used**:
- `locationNavigation.ts` - Before sending context to backend for navigation/image generation
- Any place where LLM needs complete inherited context

### Data Flow

```
┌─────────────────────────────────────────────────────────┐
│ BACKEND → FRONTEND (Storage)                            │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Backend JSON (nested)                                   │
│  {                                                       │
│    host: {                                               │
│      name: "Gothic Realm",                               │
│      dna: { architectural_tone: "gothic", ... },         │
│      regions: [...]  ← nested children                   │
│    }                                                     │
│  }                                                       │
│                                                          │
│           ↓ hierarchyParser.ts                           │
│           ↓ extractCleanDNA(host, 'host')                │
│                                                          │
│  Store (clean, flat)                                     │
│  nodes: {                                                │
│    "host-id": {                                          │
│      dna: {                                              │
│        name: "Gothic Realm",                             │
│        dna: { architectural_tone: "gothic", ... }        │
│        // NO regions array ✅                            │
│      }                                                   │
│    },                                                    │
│    "region-id": {                                        │
│      dna: {                                              │
│        name: "Dark Forest",                              │
│        dna: { architectural_tone: null, ... }            │
│        // NO locations array ✅                          │
│      }                                                   │
│    }                                                     │
│  }                                                       │
│                                                          │
│  worldTrees: [{                                          │
│    id: "host-id",                                        │
│    children: [{ id: "region-id", children: [] }]        │
│  }]                                                      │
│                                                          │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│ FRONTEND → BACKEND (LLM Usage)                          │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Store (read)                                            │
│           ↓ getCascadedDNA(regionId)                     │
│                                                          │
│  Cascaded (hierarchical)                                 │
│  {                                                       │
│    world: { architectural_tone: "gothic", ... },         │
│    region: { architectural_tone: null, ... }             │
│  }                                                       │
│                                                          │
│           ↓ getMergedDNA(cascaded)                       │
│                                                          │
│  Merged (flat with inheritance)                          │
│  {                                                       │
│    architectural_tone: "gothic",  ← inherited from world │
│    cultural_tone: "...",          ← inherited from world │
│    ...all other inherited fields                         │
│  }                                                       │
│                                                          │
│           ↓ Send to backend API                          │
│                                                          │
│  Backend LLM (image generation, navigation)              │
│  - Receives complete merged DNA                          │
│  - Region inherits world aesthetics                      │
│  - Generates consistent images                           │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

## Examples

### Example 1: Storage (extractCleanDNA)

**Backend sends:**
```json
{
  "host": {
    "name": "Eldoria",
    "dna": {
      "architectural_tone": "gothic decay",
      "mood_baseline": "melancholy"
    },
    "regions": [
      {
        "name": "Dark Forest",
        "dna": { "architectural_tone": null },
        "locations": [...]
      }
    ]
  }
}
```

**After hierarchyParser (extractCleanDNA):**
```typescript
nodes: {
  "host-id": {
    dna: {
      name: "Eldoria",
      dna: { architectural_tone: "gothic decay", mood_baseline: "melancholy" }
      // NO regions array ✅
    }
  },
  "region-id": {
    dna: {
      name: "Dark Forest",
      dna: { architectural_tone: null, mood_baseline: null }
      // NO locations array ✅
    }
  }
}
```

### Example 2: LLM Usage (getMergedDNA)

**Stored data:**
```typescript
// Host node
dna: {
  architectural_tone: "gothic decay",
  cultural_tone: "forgotten civilization",
  mood_baseline: "melancholy"
}

// Region node (child of host)
dna: {
  architectural_tone: null,  // ← wants to inherit
  cultural_tone: null,       // ← wants to inherit
  mood_baseline: "ominous"   // ← overrides parent
}
```

**Call getMergedDNA:**
```typescript
const cascaded = getCascadedDNA('region-id');
// Returns:
// {
//   world: { architectural_tone: "gothic decay", cultural_tone: "...", mood_baseline: "melancholy" },
//   region: { architectural_tone: null, cultural_tone: null, mood_baseline: "ominous" }
// }

const merged = getMergedDNA(cascaded);
// Returns:
// {
//   architectural_tone: "gothic decay",      ← inherited from world
//   cultural_tone: "forgotten civilization", ← inherited from world
//   mood_baseline: "ominous"                 ← overridden by region
// }
```

**Send to LLM:**
```typescript
const context = {
  currentNode: {
    name: "Dark Forest",
    dna: merged  // ✅ Complete DNA with inheritance
  }
};

fetch('/api/mzoo/navigation/analyze', {
  body: JSON.stringify({ userCommand, context })
});
```

## Implementation Files

### Core Utility
- `packages/frontend/src/utils/nodeDNAExtractor.ts`
  - `extractCleanDNA()` - strips nested arrays
  - `getMergedDNA()` - merges with inheritance

### Usage Points

**Storage (extractCleanDNA):**
- `packages/frontend/src/utils/hierarchyParser.ts`
  - `extractHostDNA()` → `extractCleanDNA(host, 'host')`
  - `extractRegionDNA()` → `extractCleanDNA(region, 'region')`
  - `extractLocationDNA()` → `extractCleanDNA(location, 'location')`
  - `extractNicheDNA()` → `extractCleanDNA(niche, 'niche')`

**LLM Usage (getMergedDNA):**
- `packages/frontend/src/features/entity-panel/components/LocationPanel/locationNavigation.ts`
  - `findDestination()` - merges before sending to navigation API
  - Used for both currentNode and parentNode DNA

**DNA Access:**
- `packages/frontend/src/store/slices/locations/dnaSlice.ts`
  - `getCascadedDNA()` - extracts inner DNA field, returns hierarchical structure
  - Handles nested backend structure automatically

## Key Design Decisions

### 1. Separate Storage and Usage Structures

**Why?**
- Storage: Enables vector search, efficient queries, no duplication
- Usage: Provides complete context for LLM creativity

**Trade-off**: Small runtime cost to merge, but gains flexibility

### 2. Null-Skipping Inheritance

**Why?**
- `null` means "inherit from parent"
- Explicit values always override parent
- Allows fine-grained control

**Example**:
```typescript
// Region wants to keep world's architecture but change mood
{
  architectural_tone: null,    // ← inherit from world
  mood_baseline: "cheerful"    // ← override world's "melancholy"
}
```

### 3. Inner DNA Field Extraction

**Why?**
- Backend sends: `{ type, name, dna: { ...actual DNA... } }`
- We need the inner `dna` field for merging
- `getCascadedDNA` extracts it automatically

**Implementation**:
```typescript
const nodeDNA = (pathNode.dna as any)?.dna || pathNode.dna;
```

## Best Practices

### When to Use extractCleanDNA
✅ When receiving data from backend (hierarchyParser)  
✅ When storing nodes in the store  
❌ Not needed for data already in store

### When to Use getMergedDNA
✅ Before sending context to backend LLM APIs  
✅ When you need complete inherited DNA  
✅ For image generation, navigation prompts  
❌ Not needed for detail page display (store data is fine)

### Don't Mix Concerns
❌ Don't try to merge DNA at storage time  
❌ Don't send raw cascaded DNA to LLM  
✅ Clean storage, merge at usage

## Future Enhancements

### Vector Search Ready
Once real database is added:
- Each node stored separately with clean DNA
- Vector embeddings per node
- Search across entire world efficiently

### Dynamic Inheritance
Could add:
- Inheritance rules per field type
- Multiple inheritance sources
- Weighted blending of parent values

### Caching
For performance:
- Cache merged DNA results
- Invalidate on node updates
- Pre-compute for common paths
