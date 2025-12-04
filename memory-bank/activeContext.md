# Active Context

## Current Focus
- **DNA System Refactor:** All DNA prompt files (host, region, location, niche, node, parentChain, complete, deepest) now use a centralized builder in `engine/generation/prompts/shared/dnaSchema.ts`.
- **Schema Centralization:** Single source of truth for DNA field descriptions, JSON templates, and prompt guidelines.
- **Backend Modularization:** Spawn pipeline and API routes for host, region, location, niche creation are modular and under 120 lines each.
- **Process Tracking:** Centralized in `engine/pipelines/shared/processTracker.ts`.

## Recent Changes
- Refactored: All DNA prompt files now import builder functions from `dnaSchema.ts` (removes duplication, ensures consistency).
- Deleted: Legacy DNA prompt code and unused backend files.
- Verified: TypeScript build passes, all routes and DNA generation functional.

## Next Steps
- Monitor for regressions or missing features after DNA refactor.
- Continue modularization for other backend features if needed.
