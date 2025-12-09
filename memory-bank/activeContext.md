# Active Context

## Recent Changes (2025-12-09)

### Full Parent Context for Slash Commands (NEW - Dec 9 PM)
- **Problem**: Slash commands (`/NEW_REGION`, `/NEW_LOCATION`) were generating inaccurate DNA because they only passed 7 DNA fields to the LLM, missing critical parent identity info
- **Root cause**: `extractParentDNAContext()` only extracted style attributes (genre, architectural_tone, palette_bias), not parent name/description
- **Fix**: Extended `ParentDNAContext` to include ALL parent data:
  - Parent identity: `name`, `description`, `type`
  - Full DNA fields: All 23+ fields (looks, colorsAndLighting, atmosphere, materials, sounds, etc.)
  - Structure data: `dominantElements`, `uniqueIdentifiers`, `searchDesc`
- **Files modified**:
  - `packages/backend/src/engine/nodeCreation/types.ts` - Extended ParentDNAContext interface
  - `packages/backend/src/engine/nodeCreation/core/dnaInheritance.ts` - Updated extraction function
  - `packages/backend/src/routes/mzoo/navigation.ts` - Pass full parent node data
  - `packages/backend/src/engine/nodeCreation/prompts/dna/regionDNA.ts` - Rich parent context in prompt
  - `packages/backend/src/engine/nodeCreation/prompts/dna/locationDNA.ts` - Rich parent context in prompt

### Scale Consistency System
- **Scale inference from descriptions:** Added `inferScaleFromDescription()` function that scans parent DNA text for size keywords:
  - Small indicators: "modest", "compact", "pod", "booth", "cabin", "cozy", "tiny"
  - Large indicators: "vast", "cathedral", "warehouse", "enormous", "massive"
- **Tighter dimension ranges:** Reduced dimension ranges for more accurate image generation:
  - small: 2-4m (was 3-6m)
  - medium: 4-10m (was 6-15m)
  - large: 10-30m (was 15-50m)
- **Critical scale rule:** Interior MUST be smaller than exterior with explicit constraints in prompts

### Opening Shape Inheritance (NEW)
- **Window shape detection:** Added `extractOpeningShapesFromParent()` to scan parent's dominantElements, uniqueIdentifiers, and DNA for window shapes
- **New `openingShape` field:** Added to Structure interface (rectangular, circular, arched, mixed, irregular)
- **Shape inheritance rules:** Interior windows/openings MUST match exterior shapes
- **Image prompt integration:** Explicit window shape descriptions added to image prompts

### Previous Changes
- **`--furnish` flag:** End-to-end implementation for GOTO/GO_INSIDE commands
- **DNA inheritance system:** Child nodes inherit parent materials, palette, mood
- **Navigation pipelines:** GOTO and GO_INSIDE create correct sibling/child nodes

## Current Focus

- Monitor scale consistency and opening shape inheritance behavior
- Test with various parent structure types (spherical with rectangular windows, etc.)
- Plan database migration (Supabase/PostgreSQL)
- Expand testing coverage

## Files Modified Today

- `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts` - Scale inference, opening shape extraction
- `packages/backend/src/engine/navigation/types.ts` - Added openingShape to Structure
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts` - Dimension hints, window shape prompts

## Next Steps

- Continue monitoring image generation quality for scale/shape consistency
- Begin database migration planning
- Expand automated test coverage
