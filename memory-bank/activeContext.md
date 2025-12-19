# Active Context

## 2025-12-19

### File Size Limit Refactoring (Dec 19, Latest)

**Major code organization refactoring** completed to bring all backend files under the 50-300 line limit:

#### **1. Navigation Route Handler Extraction** (`navigation.ts`: 997 → 54 lines)
- **Handler Separation**: Extracted all route handlers to dedicated files in `handlers/` directory:
  - `analyzeHandler.ts` (117 lines) - POST /analyze endpoint
  - `commandHandler.ts` (358 lines) - POST /command endpoint with sub-handlers for GOTO/GO_INSIDE/CREATE_CHARACTER
  - `eventsHandler.ts` (27 lines) - GET /events/:navigationId SSE endpoint
  - `createNodeHandler.ts` (215 lines) - POST /create-node for NEW_WORLD/NEW_REGION/NEW_LOCATION
  - `createImageHandler.ts` (162 lines) - POST /create-image for VIEW command
  - `enhancePromptHandler.ts` (95 lines) - POST /enhance-prompt for AI enhancement suggestions

- **Shared Exports**: `navigation.ts` now exports:
  - `pipelineConfigs` Map for SSE initialization
  - `detectPerspectiveFromNode()` helper function
  
- **Result**: Clean router file with minimal routing logic, ~94% reduction in file size

#### **2. Pipeline Step Extraction** (`createNodePipeline.ts`: 430 → 182 lines)
- **Step Modularization**: Extracted pipeline steps to dedicated helper files:
  - `destinationAnalysisStep.ts` (91 lines) - STEP 0.5: Destination analysis for GOTO/rich GO_INSIDE
  - `spaceAnalysisStep.ts` (166 lines) - STEP 1: Parallel structure + DNA analysis
  - `nodeBuildingStep.ts` (199 lines) - STEP 2-4: Image prompt generation, image generation, node building
  - Previously extracted: `dimensionalHints.ts`, `imagePromptComposer.ts`

- **Pipeline Orchestration**: Main pipeline file now focuses on:
  - Parameter extraction and validation
  - Step coordination and sequencing
  - Error handling and SSE event management
  
- **Result**: Clean orchestration logic, ~58% reduction in file size

#### **3. Architecture Benefits**
- **Maintainability**: Each handler/step has single responsibility
- **Testability**: Isolated functions easier to test
- **Reusability**: Steps can be reused across different pipelines
- **Readability**: Clear separation of concerns

#### **4. Files Modified**
1. `packages/backend/src/routes/mzoo/navigation.ts` - Route registration only (54 lines)
2. Created `packages/backend/src/routes/mzoo/handlers/` directory with 6 handler files
3. `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts` - Pipeline orchestration (182 lines)
4. Created 3 new step helper files in `pipelines/helpers/` directory
5. TypeScript compilation verified clean

### GOTO/GO_INSIDE Command Alignment & Pipeline Updates (Dec 19)

**Major refactoring completed** to align GOTO and GO_INSIDE commands with improved shared logic and conditional destination analysis:

#### **1. New Unified Architecture**
- **CommandContext Interface** (`types.ts`): Replaces scattered boolean flags with unified interface
  - Contains: `command`, `sourceNodeType`, `targetNodeType`, `userPrompt`, `resolvedParentDNA`, `parsedEnhancements`, `parentNodeId`
  - Used by both commands for consistent parameter passing

- **resolveNavigationParentDNA() Helper** (`navigationHelpers.ts`): Single source of truth for DNA resolution
  - Handles all cases: GOTO from location, GOTO from niche, GO_INSIDE
  - Properly handles pass-through regions (uses host DNA)
  - Returns `DNAResolutionResult` with `parentNodeId`, `resolvedParentDNA`, `targetNodeType`
  - **Reduces duplication**: ~40% code reduction in route handlers

#### **2. Conditional Destination Analysis for GO_INSIDE**
- **shouldRunDestinationAnalysis() Helper** (`navigationHelpers.ts`): Determines when to run destination analysis
  - **GOTO**: Always runs (synthesizes user prompt with parent context)
  - **GO_INSIDE**: Only for rich descriptions (>20 characters)
  - Examples:
    - `/GO_INSIDE tower` → Fast path, no destination analysis
    - `/GO_INSIDE the cozy reading nook with bay windows` → Runs destination analysis

#### **3. Dynamic Pipeline Configuration System**
- **New Pipeline Type** (`pipelineConfig.ts`): `navigationWithDestination` (5 steps)
- **Dynamic Config Updates**: GO_INSIDE calls `helper.updatePipelineConfig()` when rich description detected
- **SSE Flow**:
  - **Simple GO_INSIDE**: 4 steps → `started → space_analysis → image_prompt → image_generation → node_building → completed`
  - **Rich GO_INSIDE**: 5 steps → `started → config_update → destination_analysis → space_analysis → ... → completed`
  - **GOTO**: 5 steps → `started → destination_analysis → space_analysis → ... → completed`

#### **4. Simplified Route Handlers**
- **GOTO handler** (`navigation.ts`): Reduced from ~80 lines to ~40 lines
- **GO_INSIDE handler**: Now uses same unified pattern as GOTO
- Both use `resolveNavigationParentDNA()` for consistent DNA resolution
- Both build and pass `CommandContext` to pipeline

#### **5. Enhanced Pipeline SSE Events**
- **GOTO**: Now sends SSE events for destination_analysis step
- **GO_INSIDE**: Conditionally sends destination_analysis events for rich descriptions
- **Accurate Progress Bars**: Each command shows correct step count based on complexity

### **Files Modified**
1. `packages/backend/src/engine/navigation/types.ts` - Added `CommandContext` interface
2. `packages/backend/src/engine/navigation/navigationHelpers.ts` - Added `resolveNavigationParentDNA()` and `shouldRunDestinationAnalysis()` helpers
3. `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts` - Added conditional destination analysis and CommandContext support
4. `packages/backend/src/routes/mzoo/navigation.ts` - Simplified both route handlers using new helpers
5. `packages/backend/src/engine/pipelines/shared/pipelineConfig.ts` - Added `navigationWithDestination` pipeline type

## 2025-12-18

- Recent work: Fixes and prompt improvements to navigation & DNA/image pipelines.
- GOTO DNA resolution:
  - Fixed `/GOTO` creating generic locations by pre-resolving cascaded DNA (Host → Region → Location) in the route handler.
  - `packages/backend/src/routes/mzoo/navigation.ts` now uses `getResolvedNodeDNA()` and passes `resolvedParentDNA` into the create-node pipeline so the LLM receives full ancestry context.
  - Ensures genre/host looks (e.g., "The Moon") are available for new nodes.

- DNA generation prompt changes:
  - `packages/backend/src/engine/generation/prompts/locations/nodeDNAGeneration.ts` now passes the full parent DNA context for GOTO and GO_INSIDE (not a stripped style-only subset).
  - Parent context includes genre, looks, materials, colors, mood, surfaces, flora/fauna bases, and cascading rules.
  - This reduces mismatches where new nodes lost world-level context.

- Image prompt generation investigation:
  - Found that image prompts are produced by `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts` which receives structureAnalysis + dna + parentDNA and delegates to an LLM.
  - The LLM can add generic open-air elements (e.g., "planters") when prompted. These elements often originate from enhancer templates or from LLM embellishment of `uniqueIdentifiers` / furnishing suggestions.
  - Actionable next step (not applied yet): add an explicit flora constraint in the image prompt pipeline that prevents vegetation unless `flora_base` is present in cascaded DNA.

- Prompt enhancer & templates:
  - Enhancement templates (open-air, exterior) contain example vegetation/planters; enhancer output can be appended to user commands and subsequently influence image prompts.
  - Prompt enhancer remains user-controlled (Enhance button) to avoid automatic furnishing on all spawns.

- Misc:
  - Navigation helpers consolidated: `findHostForRegion()` and `addChildToWorldTree()` extracted into `navigationHelpers.ts`.
  - `createNodePipeline` accepts `resolvedParentDNA` (pre-resolved by route handler) and uses it when available.

### LLM-Based Elevation Detection (Dec 19, Latest)

**Replaced string matching with intelligent LLM-based elevation detection** for rooftop and elevated spaces:

#### **1. New `elevation` Field in Structure**
- **Type Addition** (`types.ts`): Added `elevation?: 'ground-level' | 'rooftop' | 'elevated' | 'underground' | 'floating' | 'suspended'` to `Structure` interface
- **LLM-Determined**: Structure analysis LLM now analyzes user input to determine vertical positioning
- **Structured Data**: Replaces brittle string matching with clean, reusable field

#### **2. Enhanced Structure Analysis Prompt**
- **File**: `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts`
- **Added Elevation Rules**: Comprehensive rules for LLM to determine elevation from user input
- **Detection Examples**:
  - "rooftop balcony" → `elevation: "rooftop"`
  - "tower room with view" → `elevation: "elevated"`
  - "penthouse suite" → `elevation: "elevated"`
  - "observation deck" → `elevation: "elevated"`
  - "basement bar" → `elevation: "underground"`
  - Default → `elevation: "ground-level"`

#### **3. Image Prompt Generation Updates**
- **File**: `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`
- **Removed**: String matching logic (`nameLC.includes('rooftop')`)
- **Added**: Structured elevation checking (`s.elevation === 'rooftop'`)
- **Elevation-Specific Context**:
  - **Rooftop/Elevated**: "Space located ON TOP of tall building, elevated viewpoint looking DOWN, base FAR BELOW"
  - **Underground**: "Space BELOW ground level, no natural sky, artificial lighting"
  - **Floating/Suspended**: "Space floating/suspended in air, no ground foundation, surface far below"

#### **4. Benefits**
- **No Additional LLM Calls**: Uses existing structure analysis
- **Contextual Understanding**: LLM interprets meaning, not just keywords
- **Robust**: Handles variations like "tower room", "penthouse", "observation deck"
- **Extensible**: Easy to add new elevation types
- **Reusable**: Other system parts can use elevation data

#### **5. Problem Solved**
- **Before**: "roof top balcony" described as ground-level ("cracked regolith at the base of the structure")
- **After**: LLM determines `elevation: "rooftop"`, image prompt adds elevated context automatically

### **Files Modified**
1. `packages/backend/src/engine/navigation/types.ts` - Added `elevation` field to Structure interface
2. `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts` - Added elevation rules to LLM prompt
3. `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts` - Replaced string matching with elevation field checking

## Current Focus
- ✅ **COMPLETED**: LLM-based elevation detection replacing string matching
- ✅ **COMPLETED**: GOTO/GO_INSIDE alignment and conditional destination analysis
- ✅ **COMPLETED**: Unified CommandContext interface and helper functions
- ✅ **COMPLETED**: Dynamic pipeline configuration with accurate progress bars
- Stabilize image prompt output to avoid inappropriate vegetation in non-flora worlds (add flora_base guard in image prompt generation)
- Run integration tests for GOTO/GO_INSIDE flows to confirm cascaded inheritance end-to-end
