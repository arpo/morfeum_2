# Active Context

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

## Current Focus
- Stabilize image prompt output to avoid inappropriate vegetation in non-flora worlds (add flora_base guard in image prompt generation).
- Run integration tests for GOTO/GO_INSIDE flows to confirm cascaded inheritance end-to-end.
- Update progress.md with completed changes and remaining tasks.
