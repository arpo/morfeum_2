# Active Context - Current Work Focus

## Latest Session Summary (November 5, 2025 - 5:18 PM)

### Current Task: Navigation Niche Pipeline — IN PROGRESS
- Objective: implement `createNicheNodePipeline` triggered by `handleGoInside` within `packages/backend/src/engine/navigation/navigationRouter.ts`.
- Required pipeline flow:
  1. Collect the active location node DNA plus parent/region context (including time-of-day) before invoking the LLM.
  2. Prompt the LLM to imagine the moment immediately after stepping inside the location, using genre-neutral language and highlighting navigation affordances (doors, stairs, portals).
  3. Receive a FLUX-compatible image prompt from the LLM.
  4. Use the MZOO API to generate the FLUX image asset.
  5. Return image prompt + URL so the frontend `location-panel` can display the result.
- Additional considerations:
  - Pull regional/environmental cues (weather, lighting, time) from parent nodes to avoid mismatched scenes.
  - Ensure the prompt gracefully handles missing context and still encourages creative but coherent imagery.
  - Decide how the generated niche node should be persisted or previewed once the asset is created.
- Next actions:
  - Scaffold `createNicheNodePipeline` under `packages/backend/src/engine/navigation/pipelines/`.
  - Author a prompt builder in `packages/backend/src/engine/generation/prompts/navigation/` tailored for interior niche imagery.
  - Update `handleGoInside` to launch the pipeline and propagate returned image metadata back to the client.

## Latest Session Summary (November 5, 2025 - 3:50 PM)

### Current Task: DNA System Architecture - COMPLETED ✅

**DNA Extraction and Inheritance System (COMPLETED):**
- ✅ Created comprehensive DNA extraction and inheritance system
- ✅ Built extractCleanDNA for clean storage (strips nested arrays)
- ✅ Built getMergedDNA for LLM usage (inheritance with null-skipping)
- ✅ Fixed getCascadedDNA to extract inner dna field from nested backend structure
- ✅ Updated hierarchyParser to use extractCleanDNA for all node types
- ✅ Updated locationNavigation to use getMergedDNA before sending to backend
- ✅ Created comprehensive documentation (docs/dna-system-architecture.md)
- ✅ Updated memory bank with DNA system patterns

**Problem Solved:**
Region nodes with null DNA values weren't inheriting host DNA when sent to LLM for image generation. This caused inconsistent world-building aesthetics.

**Root Causes:**
1. **Nested Arrays in Storage**: hierarchyParser was storing entire backend structure including nested child arrays (`host.regions`, `region.locations`, etc.)
2. **Wrong DNA Structure**: node.dna had nested structure `{ type, name, dna: { ...actual DNA... } }` instead of flat DNA
3. **No Inheritance**: LLM received null values instead of inherited parent values

**Solution:**
Built complete two-function system with proper data extraction:

**1. extractCleanDNA - For Storage**
```typescript
// Strips nested child arrays when storing nodes
const cleanDNA = extractCleanDNA(backendHostData, 'host');
// Result: Clean node without regions[] array
```

**Exclusion Rules:**
- host: removes 'regions' array
- region: removes 'locations' array
- location: removes 'niches' array
- niche: no children to remove

**2. getMergedDNA - For LLM Usage**
```typescript
// Merges cascaded DNA with null-skipping inheritance
const cascaded = getCascadedDNA(nodeId);
const merged = getMergedDNA(cascaded);
// Result: Child nulls inherit from parent values
```

**Inheritance Rules:**
1. Start with host/world DNA as base
2. Override with region DNA (skip null values)
3. Override with location DNA (skip null values)
4. Override with niche DNA (skip null values)

**3. getCascadedDNA - Extract Inner DNA**
```typescript
// Extracts inner dna field from nested structure
const nodeDNA = (pathNode.dna as any)?.dna || pathNode.dna;
// Handles: { type, name, dna: { ...actual DNA... } }
// Returns: { architectural_tone, mood_baseline, ... }
```

**Architecture Flow:**
```
Backend (nested) → hierarchyParser + extractCleanDNA → Store (clean, flat)
                                                         ↓
                                        Store → getCascadedDNA → getMergedDNA → Backend LLM (merged)
```

**Key Design Decisions:**

1. **Separate Storage and Usage**: Storage optimized for queries, usage optimized for LLM context
2. **Null-Skipping Inheritance**: `null` means "inherit from parent", explicit values override
3. **Inner DNA Extraction**: Automatically handles nested backend structure

**Files Created:**
- `packages/frontend/src/utils/nodeDNAExtractor.ts` (170 lines)
  - extractCleanDNA() - strips nested arrays
  - getMergedDNA() - merges with inheritance
  - Comprehensive inline documentation

**Files Modified:**
- `packages/frontend/src/utils/hierarchyParser.ts` - Uses extractCleanDNA for all node types
- `packages/frontend/src/features/entity-panel/components/LocationPanel/locationNavigation.ts` - Uses getMergedDNA before backend API calls
- `packages/frontend/src/store/slices/locations/dnaSlice.ts` - Extracts inner dna field in getCascadedDNA
- `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts` - Updated call site

**Documentation Created:**
- `docs/dna-system-architecture.md` - Complete guide with examples, diagrams, best practices
- `memory-bank/systemPatterns.md` - Added DNA System Architecture section
- `memory-bank/progress.md` - Added DNA System entry

**Example Result:**
```typescript
// Storage (clean, flat)
region.dna = {
  architectural_tone: null,  // stored as null
  cultural_tone: null,
  mood_baseline: null
}

// LLM Usage (merged with inheritance)
mergedDNA = {
  architectural_tone: "gothic decay",      // ← inherited from host
  cultural_tone: "forgotten civilization", // ← inherited from host
  mood_baseline: "melancholy"              // ← inherited from host
}
```

**Benefits:**
- **Clean Storage**: No nested arrays, ready for vector search
- **Complete Context**: LLM receives full inherited DNA
- **Consistent Images**: Region inherits world aesthetics automatically
- **Maintainability**: Single source of truth for DNA operations
- **Reusability**: Functions work across entire codebase
- **Well Documented**: Comprehensive guides for future developers

**Result:**
Production-ready DNA system that ensures region nodes properly inherit host DNA when generating images, maintaining consistent world-building aesthetics across hierarchies! 🎉

---

## Previous Session Summary (November 4, 2025 - 5:00 PM)

### Current Task: Niche Node Pipeline Implementation - COMPLETED ✅

**Niche Node Pipeline for GO_INSIDE Navigation (COMPLETED):**
- ✅ Created `createNicheNodePipeline.ts` for GO_INSIDE intent handling
- ✅ Created `nicheImagePrompt.ts` to generate FLUX image prompts for interior views
- ✅ Wired navigation router to run pipeline when GO_INSIDE detected
- ✅ Fixed frontend data flow to pass complete node DNA and parent context
- ✅ Simplified prompt to dump all data as JSON for manual prompt crafting
- ✅ Added navigation decision data to prompt (action, reasoning, metadata)
- ✅ Images display in LocationPanel preview panel immediately

**Problem Solved:**
Navigation system had intent classification working (GO_INSIDE detected correctly), but no pipeline to actually generate the interior view image. User command "go inside" would classify correctly but do nothing.

**Solution:**
Built complete pipeline for interior image generation:

1. **Pipeline Creation**: `createNicheNodePipeline.ts`
   - Takes navigation decision + context + intent
   - Calls LLM to generate FLUX image prompt
   - Generates image via mzoo API
   - Returns imageUrl and imagePrompt

2. **Prompt Engineering**: `nicheImagePrompt.ts`
   - Initially tried to extract specific fields (colors, lighting, etc.)
   - Data structure didn't match expectations (missing fields)
   - **Final Solution**: Dump ALL data as JSON for manual prompt crafting
   - Includes: intent, decision, currentNode (full DNA), parentNode (full DNA)

3. **Data Flow Fix**: Frontend context building
   - **Problem**: Only sending minimal data (name, description)
   - **Solution**: Pass complete node with full DNA and navigableElements
   - Find parent node from spatial tree structure
   - Extract all data from currentNode.dna directly

4. **Integration**: Navigation router
   - Added pipeline call in `handleGoInside` handler
   - Returns imageUrl/imagePrompt in navigation result
   - Frontend displays image in preview panel

**Architecture:**
```
User: "go inside" 
  ↓
Intent Classifier (LLM) → GO_INSIDE
  ↓
Navigation Router → handleGoInside()
  ↓
createNicheNodePipeline(decision, context, intent)
  ↓
nicheImagePrompt() → Dumps all data as JSON
  ↓
LLM generates FLUX prompt
  ↓
mzoo API generates image
  ↓
Image displays in LocationPanel
```

**Key Technical Decisions:**

**Prompt Data Structure:**
- Initially: Tried to extract specific fields (visualStyle.colors, etc.)
- Problem: Node DNA structure didn't have those exact field names
- Solution: Dump everything as `JSON.stringify()` for transparency
- Benefit: User can see ALL available data and craft prompt accordingly

**Frontend Data Flow:**
- Initially: `findDestination(userCommand, currentFocus, currentLocationDetails, spatialNodes, currentNode)`
- Problem: Too many parameters, some unused (currentFocus never used)
- Final: `findDestination(userCommand, currentNode, spatialNodes)`
- Extract all data from currentNode.dna inside the function
- Find parent from spatialNodes tree structure

**Prompt Content:**
```typescript
NAVIGATION INTENT:
{
  "intent": "GO_INSIDE",
  "target": null,
  "confidence": 1
}

NAVIGATION DECISION:
{
  "action": "create_niche",
  "newNodeType": "niche",
  "newNodeName": "Interior of Blackwood Manor",
  "parentNodeId": "...",
  "metadata": { "relation": "child", "entrance": "Blackwood Manor" },
  "reasoning": "Creating interior niche..."
}

CURRENT NODE: {...complete DNA object...}
PARENT NODE: {...complete parent DNA...}
```

**Files Created:**
- `packages/backend/src/engine/navigation/pipelines/createNicheNodePipeline.ts` - Complete pipeline
- `packages/backend/src/engine/generation/prompts/navigation/nicheImagePrompt.ts` - Prompt generator
- `packages/backend/src/engine/generation/prompts/navigation/index.ts` - Exports

**Files Modified:**
- `packages/backend/src/routes/mzoo/navigation.ts` - Calls pipeline in GO_INSIDE handler
- `packages/frontend/src/features/entity-panel/components/LocationPanel/locationNavigation.ts`:
  - Simplified to 3 parameters: `findDestination(userCommand, currentNode, spatialNodes)`
  - Extract all data from currentNode.dna inside function
  - Find parent using spatialNodes tree structure
- `packages/frontend/src/features/entity-panel/components/LocationPanel/useLocationPanel.ts`:
  - Updated call site to pass 3 parameters
  - Removed unused currentFocus and currentLocationDetails parameters

**Result:**
GO_INSIDE navigation now generates interior images:
- User types "go inside" → Intent classified → Pipeline runs
- LLM receives ALL node data (DNA, parent context, decision metadata)
- FLUX image generated showing interior view
- Image displays immediately in LocationPanel preview
- Prompt dumps complete JSON for manual prompt crafting

**Benefits:**
- **Working Pipeline**: GO_INSIDE intent now has complete implementation
- **Transparency**: All data visible in console.log for prompt engineering
- **Flexibility**: User can handcraft prompt based on actual data structure
- **Clean Code**: Simplified frontend function signatures (3 params vs 5)
- **Data Rich**: LLM has complete context (intent, decision, node DNA, parent DNA)

**Next Steps:**
- User will handcraft the image prompt based on the JSON data dump
- Can use actual field names from the DNA structure
- May add more pipelines for other intent types (GO_OUTSIDE, GO_TO_ROOM, etc.)

---

## Previous Session Summary (November 4, 2025 - 1:50 PM)

### Current Task: Terminology Cleanup - COMPLETED ✅

**Terminology Standardization (COMPLETED):**
- ✅ Cleaned up confusing "world"/"sublocation" terminology inconsistencies
- ✅ Renamed "world" → "host" across codebase for clarity
- ✅ Renamed "sublocation" → "niche" for consistency
- ✅ Updated all type definitions and interfaces
- ✅ Fixed configuration files and constants
- ✅ Updated code logic and event handling
- ✅ Maintained backward compatibility where needed

**Files Updated:**
- `packages/backend/src/services/spawn/types/location.ts` - Core type definitions
- `packages/frontend/src/store/slices/locations/types.ts` - Frontend type definitions  
- `packages/backend/src/services/spawn/shared/scopeDetection.ts` - Scope detection logic
- `packages/backend/src/services/navigator/config/constants.ts` - Configuration constants
- `packages/frontend/src/hooks/useSpawnEvents.ts` - Event handling logic
- `packages/backend/src/services/spawn/types/deprecated.ts` - Legacy type compatibility

**Key Changes:**
- **Type System**: `WorldNode` → `HostNode`, `SublocationNode` → `NicheNode`
- **LocationScope**: `'world' | 'region' | 'location'` → `'host' | 'region' | 'location'`
- **NodeType**: Updated to include 'host' and 'niche' types
- **Configuration**: ID patterns and error messages updated
- **Logic**: All references to old terminology updated

**Benefits:**
- **Reduced Confusion**: Clear distinction between host (top-level) and niche (interior spaces)
- **Type Safety**: Updated type definitions prevent terminology mixing
- **Developer Experience**: Consistent naming across entire codebase
- **Future-Proofing**: New code uses correct terminology, preventing technical debt

**System Impact:**
- All core navigation and spawn systems now use consistent terminology
- Legacy compatibility maintained for existing functionality
- No breaking changes to public APIs
- All tests and functionality remain intact

### Previous Session Summary (November 3, 2025 - 2:00 PM)

### Current Task: Navigation System Phase 1 - COMPLETED ✅

**Navigation System Rebuild (NEW - Complete):**
- ✅ Brainstormed and rebuilt navigation system in `packages/backend/src/engine/navigation/`
- ✅ Created genre-agnostic intent classifier with 13 intent types
- ✅ Implemented modular handler architecture (all files under 300 lines per .clinerules)
- ✅ Enhanced intent classifier with navigableElements and dominantElements context
- ✅ Fixed EXPLORE_FEATURE to work with top-level locations
- ✅ Comprehensive user testing: 100% success rate on all 13 intent types
- ✅ Refactored 431-line navigationRouter.ts into 5 modular files

**Architecture:**
```
User Command → Intent Classifier (LLM) → Navigation Router (Deterministic) → Navigation Decision
```

**Two-Step Process:**
1. **Intent Classification (LLM)**: Classifies user's spatial intent from command
   - Input: Node type, name, optional navigableElements/dominantElements
   - Output: Intent type + extracted targets + confidence
   - 13 intent types supported (all genre-agnostic)

2. **Navigation Routing (Deterministic)**: Executes the classified intent
   - Input: Intent + full NavigationContext (all node data)
   - Output: Navigation decision with action type and metadata
   - No LLM calls - pure logic based on node relationships

**13 Intent Types (All Working):**
1. GO_INSIDE - Enter enclosed space
2. GO_OUTSIDE - Exit to exterior
3. GO_TO_ROOM - Navigate to space within structure
4. GO_TO_PLACE - Navigate to location/structure
5. LOOK_AT - Examine something specific
6. LOOK_THROUGH - Look through opening
7. CHANGE_VIEW - Change viewing direction
8. GO_UP_DOWN - Change elevation
9. ENTER_PORTAL - Use special passage
10. APPROACH - Move closer to something
11. EXPLORE_FEATURE - Follow/continue along feature (fixed for top-level!)
12. RELOCATE - Travel to different district/region
13. UNKNOWN - Cannot determine intent

**Modular Handler Architecture:**
Split 431-line router into focused modules:
- `navigationRouter.ts` (74 lines) - Main dispatcher
- `handlers/basicMovement.ts` (158 lines) - GO_INSIDE, GO_OUTSIDE, GO_TO_ROOM, GO_TO_PLACE
- `handlers/viewing.ts` (70 lines) - LOOK_AT, LOOK_THROUGH, CHANGE_VIEW
- `handlers/special.ts` (75 lines) - GO_UP_DOWN, ENTER_PORTAL, APPROACH
- `handlers/exploration.ts` (89 lines) - EXPLORE_FEATURE, RELOCATE
- `handlers/index.ts` (28 lines) - Exports

**Enhanced Intent Classification:**
Added optional context for better accuracy:
- **navigableElements**: Lists available spaces (helps GO_TO_ROOM vs GO_TO_PLACE)
- **dominantElements**: Lists visible objects (helps LOOK_AT vs GO_TO_PLACE)
- **Dynamic Context Building**: Only includes data when available
- **Token Efficient**: Limits to top 8 spaces and 5 elements

Example enhancement:
```
Before: "go to toilet" → Might guess GO_TO_PLACE
After: Sees "toilet" in navigableElements → Correctly identifies GO_TO_ROOM
```

**EXPLORE_FEATURE Fix:**
Problem: Failed from top-level locations (no parent node)
Solution: Two-strategy approach
- **Has parent**: Create sibling at same level
- **No parent**: Create child location (connected progression)
- Now works everywhere!

**Test Results: 100% Success Rate**
Tested all 13 intent types:
- ✅ "go inside" → GO_INSIDE (creates niche)
- ✅ "go outside" → GO_OUTSIDE (correctly returns error from exterior)
- ✅ "go to the kitchen" → GO_TO_ROOM (creates child niche)
- ✅ "go to the bridge" → GO_TO_PLACE (creates sibling location)
- ✅ "look at the painting" → LOOK_AT (creates detail)
- ✅ "look out the window" → LOOK_THROUGH (creates detail)
- ✅ "turn around" → CHANGE_VIEW (creates view)
- ✅ "go up the stairs" → GO_UP_DOWN (creates niche with elevation)
- ✅ "approach the machine" → APPROACH (creates detail)
- ✅ "follow the river" → EXPLORE_FEATURE (NOW WORKS!)
- ✅ "go further" → EXPLORE_FEATURE (NOW WORKS!)
- ✅ "bar in financial district" → RELOCATE macro (creates hierarchy)
- ✅ "shop next door" → GO_TO_PLACE (works as intended)

**Files Created:**
- `packages/backend/src/engine/navigation/` - Complete navigation system
  - `types.ts` - Type definitions for navigation
  - `intentClassifier.ts` - LLM-based intent classification service
  - `navigationRouter.ts` - Main routing dispatcher
  - `navigationHelpers.ts` - NodeSpec builders (stubs for Phase 2)
  - `index.ts` - Public exports
  - `handlers/basicMovement.ts` - Basic spatial movement
  - `handlers/viewing.ts` - Observation and perspective
  - `handlers/special.ts` - Elevation, portals, approach
  - `handlers/exploration.ts` - Feature exploration, relocation
  - `handlers/index.ts` - Handler exports

- `packages/backend/src/engine/generation/prompts/navigation/` - Intent classification
  - `intentClassifier.ts` - Genre-agnostic intent classification prompt
  - `index.ts` - Exports
  - `test-scenarios.md` - Comprehensive test case documentation

**Files Modified:**
- `packages/backend/src/routes/mzoo/navigation.ts` - Passes navigableElements/dominantElements
- `packages/frontend/src/features/entity-panel/components/LocationPanel/locationNavigation.ts` - Logs navigation decisions

**Genre-Agnostic Design:**
All intent types work across any setting:
- Fantasy: "enter the castle", "follow the mountain path"
- Sci-Fi: "enter the spacecraft", "follow the corridor"  
- Modern: "enter the building", "follow the river"
- Underwater: "enter the submarine", "follow the current"

**Key Technical Decisions:**

**Separation of Concerns:**
- **Step 1 (Intent Classifier)**: Minimal context, just classify intent type
- **Step 2 (Navigation Router)**: Full context, make intelligent routing decisions
- All rich data (DNA, spatial, visual) available in Step 2 where it's needed

**Code Quality:**
- All files follow .clinerules: 50-300 lines per file
- Single responsibility per file
- No duplication between handlers
- TypeScript compilation successful

**What's Next (Phase 2):**
- Implement actual node creation from decisions
- Add LLM enrichment to generated nodes
- Wire up frontend to execute navigation actions

### Previous Task: Hierarchy Image Assignment Bug Fix - COMPLETED ✅

**Two-Part Bug Fix (Complete):**
- ✅ Fixed host node incorrectly receiving deepest node's image in multi-level hierarchies
- ✅ Fixed preview panel not showing image immediately after generation
- ✅ Modified `hierarchyParser.ts` to remove imageUrl fallback from host node
- ✅ Restored `updateEntityImage()` in `hierarchy:image-complete` event handler
- ✅ Preview entity (spawnId) shows image instantly, then gets replaced by proper nodes

**Root Cause Analysis:**
- **Issue 1**: Host node was using `imageUrl || host.imageUrl || ''` which assigned deepest node's image to host
- **Issue 2**: Removed `updateEntityImage()` call broke instant preview display
- **Solution**: Two-part fix addressing both image assignment and preview display

**Technical Implementation:**
- **hierarchyParser.ts (line 30)**: Changed to `imagePath: host.imageUrl || ''` (removed imageUrl fallback)
- **useSpawnEvents.ts**: Restored `updateEntityImage(spawnId, imageUrl)` in `hierarchy:image-complete` handler
- **Preview Flow**: Temporary entity shows image immediately, proper nodes created later with correct assignments

**How It Works Now:**
- **Multi-level hierarchy (host/region/location)**:
  - Image generates → shows immediately in preview panel ✅
  - Backend sets `imageUrl` on location node, NOT on host
  - Host has no image (unless backend provides `host.imageUrl`)
  - Location has the generated image
- **Single-level hierarchy (host only)**:
  - Image generates → shows immediately in preview panel ✅
  - Backend sets `imageUrl` on host (since it IS the deepest node)
  - Host correctly receives the generated image

## Session Results

**Navigation System Phase 1:**
1. ✅ Intent classification: 13 types all working correctly
2. ✅ Navigation routing: Deterministic logic handles all scenarios
3. ✅ Enhanced context: navigableElements + dominantElements improve accuracy
4. ✅ Code quality: All files under 300 lines, modular architecture
5. ✅ Genre-agnostic: Works across any setting/genre
6. ✅ EXPLORE_FEATURE fix: Now works from top-level locations
7. ✅ Test coverage: 100% success rate on comprehensive tests
8. ✅ Ready for Phase 2: Node creation and LLM enrichment

**Benefits Delivered:**
- **User Experience**: Natural language navigation commands understood correctly
- **Maintainability**: Modular handlers easy to update
- **Flexibility**: Works across any genre without modification
- **Accuracy**: Enhanced context improves classification
- **Quality**: All code follows project standards
- **Testability**: Clear test cases with expected outcomes

## Files Modified in Latest Session

**Modified (Navigation System Implementation - NEW):**
- Created entire `packages/backend/src/engine/navigation/` directory structure
- Created entire `packages/backend/src/engine/generation/prompts/navigation/` directory
- Modified `packages/backend/src/routes/mzoo/navigation.ts` to pass enhanced context
- Modified `packages/frontend/src/features/entity-panel/components/LocationPanel/locationNavigation.ts` for logging

**Line Count Summary:**
- navigationRouter.ts: 431 → 74 lines (82% reduction)
- basicMovement.ts: 158 lines
- viewing.ts: 70 lines  
- special.ts: 75 lines
- exploration.ts: 89 lines
- handlers/index.ts: 28 lines
- **Total: 494 lines across 6 files (vs 431 in single file)**

## Code Examples

**Intent Classification Pattern (NEW):**
```typescript
// Enhanced context for better accuracy
const intent = await classifyIntent(
  apiKey,
  userCommand,
  context.currentNode.type,
  context.currentNode.name,
  context.currentNode.data.navigableElements,  // NEW: Available spaces
  context.currentNode.data.dominantElements    // NEW: Visible objects
);
```

**Modular Handler Pattern (NEW):**
```typescript
// Clean dispatcher with single responsibility
export function routeNavigation(intent: IntentResult, context: NavigationContext): NavigationDecision {
  switch (intent.intent) {
    case 'GO_INSIDE':
      return handleGoInside(intent, context);
    case 'EXPLORE_FEATURE':
      return handleExploreFeature(intent, context);
    // ... etc
  }
}
```

**EXPLORE_FEATURE Fix (NEW):**
```typescript
// Two-strategy approach
if (currentNode.parentId) {
  // Has parent: create sibling
  return {
    action: 'create_niche',
    parentNodeId: currentNode.parentId,
    newNodeType: currentNode.type,
    relation: 'sibling'
  };
}

// No parent: create child location
return {
  action: 'create_niche',
  parentNodeId: currentNode.id,
  newNodeType: 'location',
  relation: 'child'
};
```

## Next Priority Items

### Immediate (Phase 2)
1. **Node Creation**: Implement actual node creation from navigation decisions
2. **LLM Enrichment**: Add LLM calls to enrich generated nodes with details
3. **Frontend Integration**: Wire up actions to actually execute (not just log)
4. **Image Generation**: Generate images for created nodes

### Medium Priority
1. **Performance**: Monitor LLM call overhead in intent classification
2. **Caching**: Consider caching common intent patterns
3. **Enhanced Testing**: Add integration tests for full flow
4. **Error Handling**: Improve error messages and recovery

## Current System State

**Navigation System:** ✅ Phase 1 Complete
- Intent classification working (all 13 types)
- Navigation routing working (deterministic logic)
- Enhanced context improving accuracy
- Genre-agnostic design proven
- Modular architecture following .clinerules
- Comprehensive test coverage
- Ready for Phase 2 implementation

**Location System:** ✅ Fully Operational
- Hierarchies generate correctly with all 4 levels
- Parser converts nested JSON to flat storage + tree
- ChatTabs displays full hierarchy
- Image assignment working correctly
- Preview display working correctly

**Memory Bank:** ✅ Updated
- Active context reflects latest navigation work
- Progress documentation current
- All architectural decisions documented
