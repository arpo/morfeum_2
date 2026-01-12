# Active Context

## 2026-01-12 - NEW_WORLD_LOCATION_INTERIOR Command ✅

Created new `/NEW_WORLD_LOCATION_INTERIOR` command that creates a 4-node hierarchy from a single concept.

### What It Does
Creates: `Host → Region → Location (exterior) → Location (interior)` + image for interior

### Usage
```
/NEW_WORLD_LOCATION_INTERIOR the kitchen of a pub in Camden in London
```

Creates:
```
London (host)
└── Camden (region)
    └── The Crown & Anchor (exterior location)
        └── The Kitchen (interior location) ← IMAGE GENERATED HERE
```

### Implementation Pattern
Same as `/NEW_WORLD_LOCATION` but with 4 nodes instead of 3:
- Single LLM call generates all 4 nodes
- User provides interior concept, LLM infers exterior building and world
- Image generated for interior (deepest node with `spaceType: "interior"`)

### Files Created/Modified
**Backend:**
- NEW: `prompts/worldLocationInterior.ts` - 4-node prompt
- NEW: `handlers/newWorldLocationInteriorHandler.ts` - Route handler
- UPDATED: `routes.ts`, `handlers/index.ts`, `prompts/index.ts`
- UPDATED: `pipelineConfig.ts` - Added `v2CreateWorldLocationInterior` pipeline
- UPDATED: `navigation.ts` - Added `NEW_WORLD_LOCATION_INTERIOR` to SLASH_COMMANDS

**Frontend:**
- NEW: `commands/handlers/newWorldLocationInteriorHandler.ts`
- UPDATED: `commands/handlers/index.ts`, `commands/index.ts`

### Pipeline Steps
```typescript
v2CreateWorldLocationInterior: [
  { id: 'interior_creation', name: 'Creating World', duration: 5000 },
  { id: 'saving', name: 'Saving World', duration: 500 },
  { id: 'prompt_generation', name: 'Creating Image Prompt', duration: 4000 },
  { id: 'image_generation', name: 'Generating Image', duration: 2500 }
]
```

---

## 2026-01-12 - MZOO Vision API Updated ✅

Updated vision API integration to use new mzoo endpoint with internal caching.

### Key Changes
- **Endpoint:** `/api/v1/ai/vision` (unchanged)
- **Response format:** `analysis` instead of `text`
- **Caching:** Now handled internally by mzoo (no client-side cache management)

### Files Modified
- `packages/backend/src/services/mzoo/types.ts`
  - Changed `VisionAnalysisResponse.text` → `VisionAnalysisResponse.analysis`
  - Added `candidates` and `metadata` fields

- `packages/backend/src/services/mzoo/services/cachedVisionAnalysis.ts`
  - Simplified from ~120 lines to ~55 lines
  - Removed complex caching logic (mzoo handles internally)
  - Maps `analysis` → `text` for backward compatibility

### Before/After
```
Before: Client manages cacheIds, calls cached-vision with cacheId, handles fallbacks
After:  Client just calls vision API, mzoo handles caching internally
```

---

## Previous Entries (2026-01-12)

### NEW_WORLD_LOCATION Single LLM Call Refactor ✅
- Refactored from 4 LLM calls to 1
- Created modular prompt architecture with `shared/dnaSchema.ts`

### Weather & Time of Day Commands ✅
- `/SET_TIME <time>` and `/SET_WEATHER <description>`
- Stored on host, cascaded to children during image generation

### V2 Code Cleanup & Modularization ✅
- Split large files into modules
- Removed dead code from promptBuilder.ts

---

## V2 Files Structure (Updated)

**Backend:**
```
packages/backend/src/worldV2/
├── routes.ts
├── handlers/
│   ├── newHostHandler.ts
│   ├── newRegionHandler.ts
│   ├── newLocationHandler.ts
│   ├── newWorldLocationHandler.ts
│   ├── newWorldLocationInteriorHandler.ts  ← NEW
│   ├── setTimeHandler.ts
│   ├── setWeatherHandler.ts
│   └── eventsHandler.ts
├── prompts/
│   ├── shared/dnaSchema.ts
│   ├── worldLocationFull.ts
│   ├── worldLocationInterior.ts  ← NEW
│   ├── hostDNA.ts, regionDNA.ts, locationDNA.ts
│   └── index.ts
└── display/
```

**Frontend:**
```
packages/frontend/src/worldV2/
├── commands/
│   ├── handlers/
│   │   ├── newWorldLocationHandler.ts
│   │   ├── newWorldLocationInteriorHandler.ts  ← NEW
│   │   ├── setTimeHandler.ts, setWeatherHandler.ts
│   │   └── ...
│   └── ...
└── ...
```

---

## Next Phases

- [ ] **Phase 5: Navigation Commands** - GO_INSIDE, GOTO for V2 nodes
- [ ] **Phase 6: Remove Old System** - Clean up legacy code
