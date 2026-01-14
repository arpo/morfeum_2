# Progress

## 2026-01-12 - NEW_WORLD_LOCATION_INTERIOR Command ✅

Created `/NEW_WORLD_LOCATION_INTERIOR` - creates 4-node hierarchy from single concept.

**Creates:** `Host → Region → Exterior Location → Interior Location` + interior image

**Usage:**
```
/NEW_WORLD_LOCATION_INTERIOR the kitchen of a pub in Camden in London
```

**Pattern:** Same as `/NEW_WORLD_LOCATION` but 4 nodes instead of 3. Single LLM call generates all nodes.

**Files:**
- NEW: `prompts/worldLocationInterior.ts`, `handlers/newWorldLocationInteriorHandler.ts` (backend)
- NEW: `commands/handlers/newWorldLocationInteriorHandler.ts` (frontend)
- UPDATED: routes, indexes, pipelineConfig, navigation.ts

---

## 2026-01-12 - MZOO Vision API Updated ✅

Simplified vision API to use new mzoo endpoint with internal caching.

**Changes:**
- Response: `analysis` instead of `text`
- Caching: Now internal to mzoo (no client-side cache management)
- Code: `cachedVisionAnalysis.ts` simplified from ~120 to ~55 lines

**Files:**
- `packages/backend/src/services/mzoo/types.ts` - Updated `VisionAnalysisResponse`
- `packages/backend/src/services/mzoo/services/cachedVisionAnalysis.ts` - Simplified

---

## 2026-01-12 - NEW_WORLD_LOCATION Single LLM Call ✅

Refactored `/NEW_WORLD_LOCATION` from 4 LLM calls to 1 for performance.

**Before:** Categorization → Host → Region → Location (4 calls)
**After:** worldLocationFull (1 call) → all 3 nodes at once

**Modular Architecture:**
- `shared/dnaSchema.ts` - Shared prompt sections (DNA_SCHEMA, HOST_RULES, etc.)
- `worldLocationFull.ts` - Combined prompt using shared sections

---

## 2026-01-12 - Weather & Time Commands ✅

Added `/SET_TIME` and `/SET_WEATHER` slash commands.

**Commands:**
- `/SET_TIME <time>` - pre_dawn, dawn, morning, midday, afternoon, golden_hour, sunset, dusk, night, midnight
- `/SET_WEATHER <description>` - Free text

**Architecture:** Stored on host node, cascaded to children during `/DISPLAY` image generation.

---

## 2026-01-12 - V2 Code Cleanup ✅

- `promptBuilder.ts`: ~265 → ~70 lines (removed dead code)
- `v2Commands.ts` (Frontend): 1 file → 8 files
- `routes.ts` (Backend): 1 file → 7 files

---

## 2026-01-13 - DNA Cascading Fix ✅

Fixed DNA inheritance to follow CSS-style (per fundamentals.md): empty array = inherit, non-empty = REPLACE.

**Files Modified:**
- `promptBuilder.ts` - Fixed `mergeDNAArrays`
- `goInside.ts` - Improved delta DNA enforcement
- `goInsideHandler.ts` - Updated DNA handling

**Note:** `promptBuilder.ts` has duplicate functions (`cascadeDNA` + `getMergedDNA`) - can consolidate later.

---

## World V2 System

### Commands: ✅ COMPLETE

| Command | Description | Status |
|---------|-------------|--------|
| `/NEW_HOST` | Create world with DNA | ✅ |
| `/NEW_REGION2` | Create region (delta DNA) | ✅ |
| `/NEW_LOCATION2` | Create location (delta DNA) | ✅ |
| `/NEW_WORLD_LOCATION` | Create Host+Region+Location (3 nodes) | ✅ |
| `/NEW_WORLD_LOCATION_INTERIOR` | Create Host+Region+Exterior+Interior (4 nodes) | ✅ NEW |
| `/DISPLAY` | Generate image via LLM layers | ✅ |
| `/SET_TIME` | Set time of day for world | ✅ |
| `/SET_WEATHER` | Set weather conditions for world | ✅ |

### Phase 5-6: Navigation 🚧 IN PROGRESS

- [x] GO_INSIDE2 - Enter structures/buildings ← COMPLETE (v1.8)
  - Three prompt builders: indoor, outdoor, semi-enclosed
  - spaceType detection (indoor/outdoor/semi-enclosed/underground/elevated)
  - Time/weather enforcement (MANDATORY section in prompts)
  - 13 test scenarios passed
- [ ] GOTO - Move between locations
- [ ] Remove old system

---

## V2 Files Structure

**Backend Handlers:**
```
handlers/
├── newHostHandler.ts
├── newRegionHandler.ts
├── newLocationHandler.ts
├── newWorldLocationHandler.ts
├── newWorldLocationInteriorHandler.ts  ← NEW
├── setTimeHandler.ts
├── setWeatherHandler.ts
└── eventsHandler.ts
```

**Backend Prompts:**
```
prompts/
├── shared/dnaSchema.ts
├── worldLocationFull.ts        (3-node: Host+Region+Location)
├── worldLocationInterior.ts    (4-node: +Interior) ← NEW
├── hostDNA.ts, regionDNA.ts, locationDNA.ts
└── index.ts
```

---

## What Works ✅

- V2 World System (all commands above)
- MZOO Vision API with internal caching
- Core features (commands, entities, world tree, navigation, image editing)

---

## What's Left 🚧

- [x] GO_INSIDE2 navigation ← COMPLETE (v1.8)
- [ ] GOTO navigation (move between locations)
- [ ] Remove old system
- [ ] Character spawn caching test
- [ ] Bundle size optimization
- [ ] Future: Season support for Host node

---

## Known Issues 🐛

- Bundle size warning (865KB)
- FLUX 1 may ignore constraints
- DNA generation too dynamic for caching
