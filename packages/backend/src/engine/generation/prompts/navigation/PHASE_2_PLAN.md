# Navigation System Phase 2 - Node Enrichment Plan

## Overview
Phase 1 (COMPLETE): Intent classification and deterministic routing to create stub node specifications
Phase 2 (NEXT): LLM enrichment of stub nodes into fully detailed nodes ready for world creation

## Current State

### What We Have (Phase 1)
```typescript
// Navigation decision returns stub NodeSpecs
{
  action: 'create_niche',
  parentNodeId: 'parent-123',
  newNodeType: 'niche',
  newNodeName: 'kitchen',
  metadata: { relation: 'child' }
}
```

### What We Need (Phase 2)
```typescript
// Enriched node ready for creation
{
  id: 'node-456',
  type: 'niche',
  name: 'kitchen',
  parentId: 'parent-123',
  dna: {
    meta: { classification, scale, period },
    semantic: { dominantElements, spatialLayout, uniqueIdentifiers },
    profile: { looks, atmosphere, mood, soundscape }
  },
  navigableElements: [...],
  imagePath: 'generated-image.jpg'
}
```

## Phase 2 Architecture

```
Navigation Decision (stub NodeSpec)
    ↓
Node Enrichment Prompt (LLM)
    ↓
Detailed Node Specification
    ↓
Node Creation + Image Generation
    ↓
World Update
```

## Required Prompts

### 1. Node Enrichment Prompt (CRITICAL)
**File:** `nodeEnrichment.ts`

**Purpose:** Take stub NodeSpec + parent context → Generate complete node details

**Input:**
- Stub NodeSpec (name, type, relation, metadata)
- Parent node DNA (for consistency)
- Sibling nodes (if creating sibling)
- Intent context (what user said)

**Output (JSON):**
```typescript
{
  dominantElements: string[];
  spatialLayout: string;
  uniqueIdentifiers: string[];
  navigableElements: Array<{
    type: string;
    position: string;
    description: string;
  }>;
  looks: string;
  atmosphere: string;
  mood: string;
  soundscape: string;
  materials: string[];
  colors: string[];
  lighting: string;
}
```

**Key Requirements:**
- Genre-agnostic (works for fantasy, sci-fi, modern, etc.)
- Respects parent DNA for consistency
- Appropriate detail level for node type (host/region/location/niche/detail/view)
- Visual richness for image generation
- Spatial coherence with siblings

### 2. Spatial Relationship Prompt (OPTIONAL)
**File:** `spatialRelationship.ts`

**Purpose:** Generate how new node relates spatially to existing nodes

**Use Cases:**
- EXPLORE_FEATURE: "Further along the river, you find..."
- GO_TO_ROOM: "Through the doorway, the kitchen..."
- RELOCATE: "In the financial district, the bar..."

**Output:**
- Transition description
- Spatial connectors
- Direction/distance indicators

### 3. View Description Prompt (OPTIONAL)
**File:** `viewDescription.ts`

**Purpose:** Generate detailed view descriptions for LOOK_AT, LOOK_THROUGH, CHANGE_VIEW

**Output:**
- What you see
- Details visible from this perspective
- Atmospheric changes
- New elements in view

## Implementation Strategy

### Step 1: Core Node Enrichment
Create `nodeEnrichment.ts` that handles all node types:
- Takes NodeSpec + parent context
- Returns complete DNA structure
- Works across all genres
- Appropriate to node type

### Step 2: Integration Points
Update `navigationHelpers.ts` builders:
```typescript
// Current (stubs)
export function createNicheSpec(parentId: string, name: string): NodeSpec {
  return { parentId, name, type: 'niche' };
}

// Phase 2 (with enrichment)
export async function createEnrichedNiche(
  parentId: string,
  name: string,
  parentDna: DNA,
  intentContext: IntentResult
): Promise<EnrichedNode> {
  // Call LLM enrichment prompt
  const enrichment = await enrichNode(name, 'niche', parentDna, intentContext);
  
  // Combine with basic spec
  return {
    id: generateId(),
    type: 'niche',
    name,
    parentId,
    dna: buildDNA(enrichment),
    navigableElements: enrichment.navigableElements,
    // ... etc
  };
}
```

### Step 3: Route Integration
Update navigation route to call enrichment:
```typescript
// After routing decision
if (decision.action === 'create_niche') {
  // Phase 1: Had stub NodeSpec
  // Phase 2: Enrich before creation
  const enrichedNode = await enrichNode(
    decision,
    context.currentNode.dna,
    intent
  );
  
  // Create node in world system
  // Generate image
  // Update frontend
}
```

## Prompt Design Considerations

### Genre-Agnostic Approach
**DON'T:**
```
Generate a medieval castle room with tapestries...
```

**DO:**
```
You are generating details for a {nodeType} named "{name}" 
in a {parentClassification} setting.

Parent atmosphere: {parentAtmosphere}
Parent dominant elements: {parentElements}

Generate appropriate elements, spatial layout, and atmosphere 
that fit this setting and maintain consistency with the parent.
```

### Node Type Scaling
Different detail levels for different node types:

**Host/Region (Macro):**
- Broad atmospheric descriptions
- Major landmarks
- General character
- Less specific detail

**Location (Mid):**
- Specific structures
- Clear spatial layout
- Distinctive features
- Medium detail

**Niche (Interior/Micro):**
- High detail
- Specific objects
- Rich sensory information
- Intimate scale

**Detail/View:**
- Very focused
- Single object or perspective
- Maximum detail on one thing

### Consistency with Parent
Enrichment should:
1. Read parent DNA
2. Extract key characteristics (genre, tone, period, materials)
3. Generate child that feels part of same world
4. Don't contradict parent (e.g., modern tech in medieval castle)

### Visual Richness
For image generation, include:
- Dominant visual elements (3-5 key things)
- Color palette
- Lighting quality
- Atmospheric mood
- Materials and textures
- Spatial arrangement

## Testing Strategy

### Test Cases for Node Enrichment

**1. Fantasy Context:**
```
Parent: "Ancient Elvish Palace"
Intent: GO_TO_ROOM, target: "throne room"
Expected: Ethereal, elegant, natural materials, luminous
```

**2. Sci-Fi Context:**
```
Parent: "Orbital Station"
Intent: GO_TO_ROOM, target: "engineering"
Expected: Technical, utilitarian, metallic, glowing panels
```

**3. Modern Context:**
```
Parent: "Downtown Coffee Shop"
Intent: GO_TO_ROOM, target: "storage room"
Expected: Mundane, practical, boxes, shelves
```

**4. Consistency Test:**
```
Parent: "Underwater Research Station" (materials: steel, glass, titanium)
Child should maintain underwater context, not suddenly be on land
```

## File Structure

```
packages/backend/src/engine/generation/prompts/navigation/
├── intentClassifier.ts       ✅ Phase 1 (DONE)
├── nodeEnrichment.ts         ⏳ Phase 2 (NEEDED)
├── spatialRelationship.ts    🔷 Phase 2 (OPTIONAL)
├── viewDescription.ts        🔷 Phase 2 (OPTIONAL)
├── index.ts                  ✅ Exports
└── test-scenarios.md         ✅ Documentation
```

## Next Steps

1. **Create `nodeEnrichment.ts`**
   - Core Phase 2 functionality
   - Genre-agnostic node detail generation
   - Takes stub → Returns full DNA
   - Test with multiple genres

2. **Update `navigationHelpers.ts`**
   - Change from stub builders to enrichment callers
   - Add async functions that call LLM
   - Return enriched nodes ready for creation

3. **Update Navigation Route**
   - Call enrichment after routing decision
   - Handle async enrichment process
   - Trigger node creation with enriched data
   - Start image generation pipeline

4. **Test End-to-End**
   - "Go to kitchen" → Creates enriched kitchen niche
   - "Follow the river" → Creates enriched progression location
   - "Look at the painting" → Creates enriched detail view
   - Verify consistency across genres

## Success Criteria

Phase 2 is complete when:
- ✅ User command creates fully detailed nodes (not stubs)
- ✅ Generated nodes have complete DNA structure
- ✅ Nodes are consistent with parent context
- ✅ Works across all 13 intent types
- ✅ Genre-agnostic (works for any setting)
- ✅ Nodes include rich visual detail for image generation
- ✅ Frontend displays new nodes with images
- ✅ Navigation feels natural and coherent

## Reference: Current Phase 1 Flow

```typescript
// What happens now (Phase 1)
User: "go to kitchen"
  → Intent Classifier: GO_TO_ROOM, target: "kitchen"
  → Navigation Router: create_niche action
  → Frontend: Logs decision to console ✅
  → No actual node creation yet ❌

// What should happen (Phase 2)
User: "go to kitchen"
  → Intent Classifier: GO_TO_ROOM, target: "kitchen"
  → Navigation Router: create_niche action
  → Node Enrichment: Generate full kitchen details
  → Node Creation: Add to world system
  → Image Generation: Create kitchen image
  → Frontend: Display new kitchen node with image ✅
```

## Questions to Consider

1. **Enrichment Speed vs Quality**
   - Single LLM call for all details?
   - Multiple focused calls for different aspects?
   - Cache common patterns?

2. **Parent Context Depth**
   - Just immediate parent?
   - Full ancestry chain?
   - How much context to pass?

3. **Sibling Awareness**
   - Should new kitchen know about existing bedrooms?
   - How to avoid duplicate elements?
   - Spatial uniqueness per sibling?

4. **Error Handling**
   - What if LLM returns invalid JSON?
   - What if enrichment contradicts parent?
   - Fallback strategies?

5. **Performance**
   - LLM call per navigation command?
   - Acceptable latency?
   - Progressive enhancement (show stub then enrich)?
