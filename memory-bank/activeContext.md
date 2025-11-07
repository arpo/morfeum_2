# Active Context - Current Work Focus

## Current Task: Navigation Niche Pipeline (IN PROGRESS - November 5, 2025)

### Objective
Implement `createNicheNodePipeline` triggered by `handleGoInside` within `navigationRouter.ts`.

### Required Pipeline Flow
1. Collect active location node DNA plus parent/region context (including time-of-day)
2. Prompt LLM to imagine stepping inside the location using genre-neutral language
3. Generate FLUX-compatible image prompt highlighting navigation affordances
4. Use MZOO API to generate the FLUX image asset
5. Return image prompt + URL for frontend `location-panel` display

### Key Considerations
- Pull regional/environmental cues from parent nodes to avoid mismatched scenes
- Ensure prompt handles missing context gracefully
- Decide how generated niche node should be persisted or previewed

### Next Actions
- [ ] Scaffold `createNicheNodePipeline` under `packages/backend/src/engine/navigation/pipelines/`
- [ ] Author prompt builder in `packages/backend/src/engine/generation/prompts/navigation/`
- [ ] Update `handleGoInside` to launch pipeline and propagate image metadata to client

---

## Previous Task: DNA System Architecture (COMPLETED - November 5, 2025)

### Problem Solved
Region nodes with null DNA values weren't inheriting host DNA when sent to LLM for image generation.

### Solution Implemented
Built two-function system with proper data extraction:

1. **extractCleanDNA** - Strips nested arrays for clean storage
2. **getMergedDNA** - Merges cascaded DNA with null-skipping inheritance

### Key Files
- `packages/frontend/src/utils/nodeDNAExtractor.ts` - Core utilities
- `packages/frontend/src/utils/hierarchyParser.ts` - Uses extractCleanDNA
- `packages/frontend/src/features/entity-panel/components/LocationPanel/locationNavigation.ts` - Uses getMergedDNA
- `docs/dna-system-architecture.md` - Complete documentation

### Result
Region nodes now properly inherit host DNA when generating images, ensuring consistent world-building aesthetics.

---

## System State Summary

**Navigation System:** Phase 1 complete, 13 intent types working, ready for Phase 2 implementation

**Location System:** Fully operational with all 4 hierarchy levels functioning

**DNA System:** Production-ready with proper inheritance and clean storage

**Memory Bank:** Currently being consolidated for better efficiency
