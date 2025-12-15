# Active Context

## Recent Changes (2025-12-15)

### Pipeline Optimization & Prompt Enhancer (Dec 15)

#### Removed NavigableElements/Furnishing from Pipeline LLM
- **Goal**: Make pipelines faster and cheaper by removing LLM-generated navigableElements and furnishing
- **Change**: These are now user-controlled via the Prompt Enhancer
- **Implementation**:
  - Removed `navigableElements` and `furnishing` generation from `structureAnalysis.ts`
  - Removed `includeFurnishing` parameter from `structureAnalyzer.ts`
  - Updated `createNodePipeline.ts` to accept parsed enhancements from command
  - Deleted `furnishingInstructions.ts` (content moved to enhancer template)

#### New Prompt Enhancer Feature
- **Purpose**: User clicks Enhance button to get AI-suggested navigable elements and furnishing
- **Frontend**:
  - Added `handleEnhance()` and `canEnhance()` to `useNavigationLogic.ts`
  - Added Enhance button (sparkles icon) in `SpawnInputBar.tsx`
  - Added `IconSparkles` to icons index
- **Backend**:
  - Created `promptEnhancer.ts` service
  - Created `enhancerPromptTemplate.ts` with saved prompt text
  - Added `POST /api/mzoo/navigation/enhance-prompt` endpoint
  - Created `enhancementParser.ts` to parse "navigable elements:", "furnish:", "facade:" from commands

#### Usage Example
```
/GO_INSIDE spa
→ Click Enhance button
→ Command becomes: /GO_INSIDE spa, navigable elements: door left wall, window front wall, furnish: circular jacuzzi, spa loungers, potted palms
→ Click Go
```

### Interior Surface Transformation (Dec 15)

#### Problem
- Exterior materials (e.g., "red painted wood planks") were being copied directly to interior spaces
- This looked wrong for residential buildings (red wood walls inside a kitchen)

#### Solution
- Updated `nodeDNAGeneration.ts` with interior surface transformation rules
- **Priority order**:
  1. USER-SPECIFIED → If user mentions wallpaper/wall treatment, USE IT (highest priority)
  2. INTERIOR TRANSFORMATION → For exterior→interior, transform facade to interior finishes
  3. KEEP AS-IS → Some materials appropriate for both (stone temples, log cabins)

#### Transformation Rules
| Facade Material | Building Type | Interior Transformation |
|-----------------|---------------|------------------------|
| Painted wood (red, etc.) | Residential | Whitewashed panels, plaster, wallpaper |
| Painted wood | Commercial | Painted panels, plaster with wood trim |
| Natural logs | Cabin/Lodge | KEEP natural wood |
| Stone/Brick | Temple/Church/Castle | KEEP stone |
| Stone/Brick | Residential | Plaster, tapestries, wood paneling |
| Brick | Industrial | KEEP exposed brick |
| Concrete/Metal/Glass | Modern | KEEP |

### Previous Changes (Dec 15)
- SpawnInputBar Refactoring & Dead Code Cleanup
- Pipeline Progress Bar Fix & VIEW Command Alignment

## Current Focus

- Command-based input with Enhance button for optional AI suggestions
- Interior surfaces now properly transform from facade materials
- User can override any surface with explicit command text

## Next Steps

- Test Prompt Enhancer with various building types
- Test interior surface transformation with different facade materials
- Implement `/SCENE_IMAGE` command for generating new images of existing characters
