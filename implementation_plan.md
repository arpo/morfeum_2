# Implementation Plan: Generic Node System with Visual Context Navigation

## [Overview]

Transform Morfeum's location system from a rigid 4-level hierarchy (world/region/location/sublocation) to a flexible generic node system with unlimited depth, while adding visual context awareness to NavigatorAI for accurate spatial reasoning.

This refactoring addresses three core problems: (1) NavigatorAI can't distinguish between "the stair here" vs "stair elsewhere" due to lack of visual context, (2) rigid type constraints force AI to make structural decisions it shouldn't, and (3) slow generation times from overly complex DNA prompts. The solution removes type constraints, simplifies DNA to balance speed and detail, enhances NavigatorAI with visual context from the current location's visualAnchors, and prepares infrastructure for future multi-view support (north/south text descriptions with lazy image generation).

The implementation maintains the existing tree storage structure but removes type-specific logic, consolidates DNA interfaces into a single flexible structure, and adds visual awareness to navigation. This enables natural commands like "go up the stair" to correctly identify which stair based on what's visible in the current location.

## [Types]

Define new unified type system replacing rigid hierarchy with flexible generic nodes.

### Core Node Structure

```typescript
// packages/frontend/src/store/slices/locationsSlice.ts
// packages/backend/src/services/spawn/types.ts

// Single generic node type (replaces World/Region/Location/SublocationNode)
export interface Node {
  id: string;
  name: string;
  parent_id: string | null;
  root_id: string;  // Points to tree root
  depth: number;    // Auto-calculated from tree position
  
  // Optional scale hint for image generation context
  scale?: 'macro' | 'area' | 'site' | 'interior' | 'detail';
  
  // Unified DNA structure (flattened from nested hierarchy)
  dna: NodeDNA;
  
  // Current view state
  currentView: CurrentView;
  
  // Multi-view descriptions (prepared for future implementation)
  viewDescriptions?: ViewDescriptions;
  
  // Generated images cache
  viewImages?: Record<string, CachedImage>;
  
  // Navigation metadata
  imagePath: string;
  focus?: FocusState;
}

// Simplified DNA structure (middle way: essential detail, no redundancy)
export interface NodeDNA {
  // Visual essentials (from visual analysis)
  looks: string;                    // 4-6 sentences
  colorsAndLighting: string;        // 2-4 sentences
  atmosphere: string;               // 3-5 sentences
  materials: string;                // 1-3 sentences
  mood: string;                     // 2-3 sentences
  sounds: string;                   // 5-7 words
  
  // Visual anchors (critical for consistency and navigation)
  visualAnchors: VisualAnchors;
  
  // Navigation context
  searchDesc: string;               // 75-100 chars for semantic matching
  viewContext: ViewContext;
  
  // Metadata
  fictional: boolean;
  copyright: boolean;
}

// Visual anchors remain detailed (essential for re-rendering and spatial awareness)
export interface VisualAnchors {
  dominantElements: string[];       // 3-5 key features with size/position
  spatialLayout: string;            // 2-4 sentences: structure, dimensions
  surfaceMaterialMap: {
    primary_surfaces: string;
    secondary_surfaces: string;
    accent_features: string;
  };
  colorMapping: {
    dominant: string;
    secondary: string;
    accent: string;
    ambient: string;
  };
  uniqueIdentifiers: string[];      // 2-4 distinctive features
}

// View context from image analysis
export interface ViewContext {
  perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
  focusTarget: string;              // Main subject being viewed
  distance: 'close' | 'medium' | 'far';
  composition: string;              // Viewer position description
}

// Current view tracking (which angle user is viewing from)
export interface CurrentView {
  viewKey: string;                  // 'default', 'north', 'south', etc.
  imagePath: string;                // Active image for this view
  focusTarget: string;              // What's prominent in this view
}

// Multi-view text descriptions (prepared, not fully implemented yet)
export interface ViewDescriptions {
  [viewKey: string]: ViewDescription;
}

export interface ViewDescription {
  viewKey: string;
  looks: string;                    // 3-5 sentences: what you see from this angle
  focusTarget: string;              // Main subject in this direction
  renderInstructions: string;       // Camera geometry for image generation
  hasImage: boolean;                // Has this view been rendered?
}

// Cached generated images
export interface CachedImage {
  imagePath: string;
  generatedAt: string;
}

// Focus state (existing, keep as-is)
export interface FocusState {
  node_id: string;
  perspective: 'exterior' | 'interior' | 'aerial' | 'ground-level' | 'elevated' | 'distant';
  viewpoint: string;
  distance: 'close' | 'medium' | 'far';
}

// Tree structure (existing, keep as-is but remove type field)
export interface TreeNode {
  id: string;
  children: TreeNode[];
}
```

### NavigatorAI Enhanced Types

```typescript
// packages/backend/src/services/navigator.service.ts

// Add visual context to navigation input
export interface CurrentLocationDetails {
  node_id: string;
  name: string;
  searchDesc: string;
  
  // Visual context from current location
  visualAnchors: {
    dominantElements: string[];     // What's physically in this location
    uniqueIdentifiers: string[];
  };
  
  // Optional: what's in each direction (from viewDescriptions)
  viewDescriptions?: {
    [viewKey: string]: {
      looks: string;
      focusTarget: string;
    };
  };
  
  // Current view direction
  currentView: {
    viewKey: string;
    focusTarget: string;
  };
}

// Enhanced navigation result (add scale hint)
export interface NavigationResult {
  action: 'move' | 'generate' | 'look';  // Add 'look' action for perspective shifts
  
  // For 'move' action
  targetNodeId?: string | null;
  
  // For 'generate' action
  name?: string | null;
  parent_id?: string | null;
  scale_hint?: 'macro' | 'area' | 'site' | 'interior' | 'detail';  // NEW
  
  // For 'look' action (NEW - prepare for future multi-view)
  viewUpdate?: {
    viewKey: string;              // 'north', 'south', 'behind', 'up', etc.
    needsImageGeneration: boolean;
  };
  
  relation?: 'child' | 'sibling' | 'parent' | 'distant' | null;
  reason: string;
}
```

### Location Seed Updates

```typescript
// packages/backend/src/services/spawn/types.ts

// Keep existing LocationSeed structure (renderInstructions already handled)
export interface LocationSeed {
  originalPrompt?: string;
  name: string;
  looks: string;
  atmosphere: string;
  mood: string;
  renderInstructions: string;  // Camera geometry (keep this!)
  scale_hint?: 'macro' | 'area' | 'site' | 'interior' | 'detail';  // NEW
}
```

## [Files]

Comprehensive file modifications across backend prompts, services, and frontend state/UI.

### Files to Modify

**Backend Prompts (8 files):**
1. `packages/backend/src/prompts/languages/en/locationSeedGeneration.ts`
   - Add scale_hint to output JSON structure
   - Keep renderInstructions (camera geometry)

2. `packages/backend/src/prompts/languages/en/locationVisualAnalysis.ts`
   - Keep as-is (already captures visualAnchors well)

3. `packages/backend/src/prompts/languages/en/locationDeepProfileEnrichment.ts`
   - **Major simplification**: Remove world/region/location nested structure
   - Output single flat NodeDNA structure
   - Reduce field count from ~200 to ~15 core fields
   - Remove redundant semantic/spatial metadata
   - Keep visualAnchors detailed (critical)

4. `packages/backend/src/prompts/languages/en/locationImageGeneration.ts`
   - Add scale_hint parameter support
   - Adjust framing based on scale (macro=wide, detail=close-up)

5. `packages/backend/src/prompts/languages/en/navigatorSemanticNodeSelector.ts`
   - **Major enhancement**: Add visual context section
   - Accept currentLocationDetails with visualAnchors
   - Add spatial reasoning rules for visible elements
   - Add 'look' action for perspective shifts
   - Enhanced examples for disambiguation

6. **NEW FILE**: `packages/backend/src/prompts/languages/en/generateViewDescriptions.ts`
   - Prompt for generating text descriptions of north/south views
   - Input: seed, visualAnalysis, renderInstructions
   - Output: ViewDescriptions with looks, focusTarget, renderInstructions per direction
   - Fast generation (~1-2 seconds)

**Backend Services (3 files):**
7. `packages/backend/src/services/navigator.service.ts`
   - Update `findDestinationNode()` signature to accept currentLocationDetails
   - Update interface exports

8. `packages/backend/src/routes/mzoo/navigator.ts`
   - Update request body validation to accept currentLocationDetails
   - Pass to service

9. `packages/backend/src/services/spawn/managers/LocationSpawnManager.ts`
   - Update `enrichProfile()` to use simplified prompt
   - Parse simplified NodeDNA instead of hierarchical structure
   - Optionally call generateViewDescriptions (prepare for future)

**Backend Types (2 files):**
10. `packages/backend/src/services/spawn/types.ts`
    - Remove WorldNode, RegionNode, LocationNode interfaces
    - Add unified NodeDNA interface
    - Update LocationDeepProfile to just be NodeDNA
    - Add ViewDescription interfaces

11. `packages/backend/src/prompts/types.ts`
    - Update prompt function signatures
    - Add generateViewDescriptions export

**Frontend State (2 files):**
12. `packages/frontend/src/store/slices/locationsSlice.ts`
    - Remove NodeType enum and separate node interfaces
    - Add unified Node interface with NodeDNA
    - Remove type-specific methods
    - Update TreeNode (remove type field)
    - Remove legacy compatibility methods (breaking change OK per user)
    - Update all CRUD methods to work with generic nodes

13. `packages/frontend/src/hooks/useSpawnEvents.ts`
    - Update SSE event handlers to work with simplified DNA
    - Remove world/region/location splitting logic
    - Create single node per spawn (no nested node creation)
    - Store viewDescriptions if present

**Frontend Navigation (2 files):**
14. `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts`
    - Update `handleMove()` to build currentLocationDetails
    - Extract visualAnchors from current node
    - Extract viewDescriptions if present
    - Pass to NavigatorAI endpoint

15. `packages/frontend/src/utils/locationFocus.ts`
    - Update to work with unified Node structure
    - No type-specific logic

**Frontend UI (3 files):**
16. `packages/frontend/src/features/saved-locations/SavedLocationsModal/useSavedLocationsLogic.ts`
    - Update to show root nodes (parent_id === null)
    - Remove type-based filtering

17. `packages/frontend/src/features/chat/components/LocationInfoModal/LocationInfoModal.tsx`
    - Update to display simplified NodeDNA
    - Single section instead of split world/location
    - Keep visualAnchors detailed display

18. `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.tsx`
    - Update depth calculation (use node.depth directly)
    - Remove type-based styling

### Files to Delete

**Backend (2 files if they exist):**
- `packages/backend/src/prompts/languages/en/sublocationGeneration.ts` (if exists)
- `packages/backend/src/prompts/languages/en/sublocationImageGeneration.ts` (already exists, check if obsolete)

### Files to Create

**Backend (1 file):**
- `packages/backend/src/prompts/languages/en/generateViewDescriptions.ts` (multi-view text generation)

## [Functions]

Detailed function modifications for navigation, generation, and state management.

### Backend Functions

**1. navigatorSemanticNodeSelector() - MAJOR ENHANCEMENT**
- File: `packages/backend/src/prompts/languages/en/navigatorSemanticNodeSelector.ts`
- Current signature: `(userCommand, currentFocus, allNodes)`
- New signature: `(userCommand, currentFocus, currentLocationDetails, allNodes)`
- Changes:
  - Accept `currentLocationDetails` parameter with visualAnchors
  - Add visual context section to prompt showing dominantElements
  - Add viewDescriptions section if present (what's north/south/etc)
  - Add spatial reasoning rules:
    - Prioritize visible elements in current location
    - Use directional cues (left/right from viewDescriptions)
    - Distance inference (no qualifier = HERE)
  - Add 'look' action handling for perspective shifts
  - Enhanced examples for disambiguation
  - Return scale_hint in generate action

**2. findDestinationNode() - SIGNATURE UPDATE**
- File: `packages/backend/src/services/navigator.service.ts`
- Current signature: `(apiKey, userCommand, currentFocus, allNodes)`
- New signature: `(apiKey, userCommand, currentFocus, currentLocationDetails, allNodes)`
- Changes:
  - Accept currentLocationDetails parameter
  - Pass to prompt generation
  - No other logic changes

**3. locationDeepProfileEnrichment() - MAJOR SIMPLIFICATION**
- File: `packages/backend/src/prompts/languages/en/locationDeepProfileEnrichment.ts`
- Current: Returns nested world/region/location structure (~500 lines)
- New: Returns flat NodeDNA structure (~150 lines)
- Changes:
  - Remove world/region/location/sublocation branching
  - Single JSON output with 15 core fields
  - Keep visualAnchors detailed
  - Remove redundant semantic/spatial metadata
  - Faster generation (~5-10 seconds vs 15-20)

**4. generateViewDescriptions() - NEW FUNCTION**
- File: `packages/backend/src/prompts/languages/en/generateViewDescriptions.ts` (NEW)
- Signature: `(seedJson, visualAnalysisJson, renderInstructions)`
- Purpose: Generate text descriptions of north/south views (prepare for multi-view)
- Output:
  ```json
  {
    "default": {
      "viewKey": "default",
      "looks": "...",
      "focusTarget": "...",
      "renderInstructions": "...",
      "hasImage": true
    },
    "north": {
      "viewKey": "north",
      "looks": "...",
      "focusTarget": "...",
      "renderInstructions": "...",
      "hasImage": false
    },
    "south": { ... }
  }
  ```
- Implementation: Call optionally in LocationSpawnManager after visual analysis
- Timing: ~1-2 seconds (text only, no images)

**5. enrichProfile() - LocationSpawnManager**
- File: `packages/backend/src/services/spawn/managers/LocationSpawnManager.ts`
- Changes:
  - Use simplified locationDeepProfileEnrichment prompt
  - Parse flat NodeDNA instead of nested structure
  - Optionally call generateViewDescriptions (if enabled)
  - Return simplified DeepProfile

### Frontend Functions

**6. handleMove() - useLocationPanel**
- File: `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts`
- Changes:
  - Build `currentLocationDetails` object
  - Extract visualAnchors from current node's DNA
  - Extract viewDescriptions if present
  - Extract currentView state
  - Pass to NavigatorAI API endpoint
  - Handle 'look' action (prepare for future)
  - Use scale_hint from NavigationResult in spawn calls

**7. SSE Event Handlers - useSpawnEvents**
- File: `packages/frontend/src/hooks/useSpawnEvents.ts`
- Event: `spawn:profile-complete`
- Changes:
  - Remove world/region/location tree building logic
  - Create single node with simplified DNA
  - Store viewDescriptions if present in DNA
  - Set root_id = parent_id || self (for root nodes)
  - Calculate depth from tree position

**8. Store Methods - locationsSlice**
- File: `packages/frontend/src/store/slices/locationsSlice.ts`
- Methods to update:
  - `createNode()` - accept unified Node interface
  - `getNode()` - no changes
  - `updateNode()` - no changes
  - `getCascadedDNA()` - REMOVE (no longer needed)
  - `getSpatialNodes()` - update depth calculation
  - Remove legacy methods: `createLocation()`, `getLocation()`, `getLocationsByWorld()`

## [Classes]

No classes to modify - system uses functional patterns with Zustand stores.

## [Dependencies]

No new dependencies required. All changes use existing packages.

**Existing dependencies used:**
- zustand (state management)
- uuid (ID generation)
- Express types (backend)
- React types (frontend)

## [Testing]

Test strategy focusing on critical navigation and DNA simplification paths.

### Unit Tests (Not yet implemented, but recommended)

**Backend:**
1. `navigatorSemanticNodeSelector.test.ts`
   - Test visual context disambiguation
   - Test "go up the stair" with stair in visualAnchors vs elsewhere
   - Test 'look' vs 'generate' vs 'move' action selection
   - Test scale_hint inference

2. `locationDeepProfileEnrichment.test.ts`
   - Verify output is flat NodeDNA
   - Verify ~15 fields instead of 200+
   - Verify visualAnchors remain detailed

3. `generateViewDescriptions.test.ts`
   - Verify north/south text generation
   - Verify renderInstructions format
   - Verify timing (~1-2 seconds)

**Frontend:**
4. `locationsSlice.test.ts`
   - Test unified Node CRUD
   - Test tree operations without type constraints
   - Test root node identification (parent_id === null)

5. `useLocationPanel.test.ts`
   - Test currentLocationDetails building
   - Test visualAnchors extraction
   - Test NavigatorAI API call structure

### Integration Tests

**Navigation Disambiguation:**
- Scenario: User at room with stair to left, another room has stair elsewhere
- Command: "Go up the stair"
- Expected: Generates child of current room (uses visible stair)
- Verify: NavigatorAI receives visualAnchors, matches "stair" in dominantElements

**Simplified DNA Generation:**
- Scenario: Generate new location "A lighthouse"
- Expected: Single node created with flat NodeDNA (~15 fields)
- Verify: Generation time < 10 seconds (vs 15-20 previously)
- Verify: visualAnchors still detailed

**Generic Node Tree:**
- Scenario: Create root → child → grandchild (unlimited depth)
- Expected: No type constraints enforced
- Verify: ChatTabs shows proper indentation for any depth
- Verify: SavedLocations shows only root nodes

### Manual Testing Checklist

- [ ] Generate new location, verify single node created (not world/region/location split)
- [ ] Navigate with "go inside", verify NavigatorAI uses visual context
- [ ] Test disambiguation: room with stair + distant stair, verify correct choice
- [ ] Verify generation speed improved (~5-10s vs 15-20s)
- [ ] Create deep tree (5+ levels), verify no type errors
- [ ] Test SavedLocations shows only roots
- [ ] Test ChatTabs shows full tree with indentation
- [ ] Verify LocationInfoModal displays simplified DNA correctly

## [Implementation Order]

Logical sequence minimizing conflicts and ensuring successful integration.

### Phase 1: Type System Foundation (2-3 hours)
1. Update `packages/backend/src/services/spawn/types.ts`
   - Remove WorldNode, RegionNode, LocationNode, SublocationNode
   - Add unified NodeDNA interface
   - Add ViewDescription interfaces
   - Add scale hints

2. Update `packages/frontend/src/store/slices/locationsSlice.ts`
   - Remove NodeType enum
   - Add unified Node interface
   - Update TreeNode (remove type field)
   - Update method signatures (no implementation changes yet)

3. Update `packages/backend/src/prompts/types.ts`
   - Update prompt function signatures
   - Add generateViewDescriptions export

### Phase 2: Backend DNA Simplification (3-4 hours)
4. Simplify `packages/backend/src/prompts/languages/en/locationDeepProfileEnrichment.ts`
   - Replace nested structure with flat NodeDNA output
   - Reduce fields from ~200 to ~15
   - Keep visualAnchors detailed
   - Test with manual prompt execution

5. Update `packages/backend/src/services/spawn/managers/LocationSpawnManager.ts`
   - Update enrichProfile() to parse simplified DNA
   - Update type assertions

6. Update `packages/backend/src/prompts/languages/en/locationSeedGeneration.ts`
   - Add scale_hint to output JSON

7. Update `packages/backend/src/prompts/languages/en/locationImageGeneration.ts`
   - Add scale_hint parameter support
   - Adjust framing based on scale

### Phase 3: NavigatorAI Visual Context (2-3 hours)
8. Enhance `packages/backend/src/prompts/languages/en/navigatorSemanticNodeSelector.ts`
   - Add currentLocationDetails parameter
   - Add visual context section
   - Add spatial reasoning rules
   - Add 'look' action
   - Add enhanced examples

9. Update `packages/backend/src/services/navigator.service.ts`
   - Update findDestinationNode() signature
   - Accept currentLocationDetails
   - Update interface exports

10. Update `packages/backend/src/routes/mzoo/navigator.ts`
    - Update request body validation
    - Accept currentLocationDetails

### Phase 4: Frontend State Integration (2-3 hours)
11. Update `packages/frontend/src/hooks/useSpawnEvents.ts`
    - Remove tree-building logic
    - Create single node per spawn
    - Store simplified DNA
    - Handle viewDescriptions if present

12. Implement locationsSlice methods:
    - Update createNode() for unified Node
    - Remove getCascadedDNA()
    - Remove legacy methods
    - Update tree operations

13. Update `packages/frontend/src/utils/locationFocus.ts`
    - Remove type-specific logic
    - Work with unified Node

### Phase 5: Frontend Navigation Integration (2 hours)
14. Update `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts`
    - Build currentLocationDetails
    - Extract visualAnchors
    - Extract viewDescriptions
    - Pass to NavigatorAI
    - Handle scale_hint in spawn

15. Update navigation API calls
    - Test NavigatorAI endpoint with new structure
    - Verify visual context flows through

### Phase 6: UI Updates (1-2 hours)
16. Update `packages/frontend/src/features/chat/components/LocationInfoModal/LocationInfoModal.tsx`
    - Display simplified NodeDNA
    - Single section instead of split
    - Keep visualAnchors detailed

17. Update `packages/frontend/src/features/saved-locations/SavedLocationsModal/useSavedLocationsLogic.ts`
    - Filter to root nodes (parent_id === null)
    - Remove type-based logic

18. Update `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.tsx`
    - Use node.depth directly
    - Remove type-based styling

### Phase 7: Multi-View Preparation (1-2 hours - OPTIONAL)
19. Create `packages/backend/src/prompts/languages/en/generateViewDescriptions.ts`
    - Implement prompt for north/south text generation
    - Export function

20. Optionally integrate into LocationSpawnManager
    - Call after visual analysis
    - Store in NodeDNA as viewDescriptions
    - Don't generate images yet (prepare for future)

### Phase 8: Testing & Cleanup (2-3 hours)
21. Manual testing of navigation disambiguation
22. Performance testing (verify speed improvement)
23. Delete obsolete files (sublocation prompts, locationProfile.ts)
24. Update memory bank documentation
25. Verify no type errors across codebase

**Total Estimated Time: 15-20 hours**

**Critical Path:**
Phase 1 → Phase 2 → Phase 4 → Phase 5 (core functionality)
Phases 3, 6, 7 can be done in parallel with Phase 5

**Risk Mitigation:**
- Phase 2 (DNA simplification) is highest risk - test manually first
- Phase 4 (SSE events) is critical - verify with spawns immediately
- Keep Phase 7 (multi-view) optional until core is stable
