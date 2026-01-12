# Active Context

## 2026-01-12 - NEW_WORLD_LOCATION Command ✅

Added `/NEW_WORLD_LOCATION` command that creates a complete world hierarchy (Host + Region + Location) from a single concept.

### Usage Examples
```bash
/NEW_WORLD_LOCATION a pub in Camden in London
/NEW_WORLD_LOCATION A multi-tiered white structure over sandy desert with pink moon
```

### Visual Consistency Feature
Complex descriptions (like full image descriptions) now maintain visual consistency across all nodes:
1. **Categorization step** extracts `visualElements` from full description:
   - colors, lighting, atmosphere, timeOfDay, weather
2. **Host DNA prompt** receives these as constraints (MUST use)
3. **Location DNA** inherits from host naturally

**Files Created/Modified:**
- `packages/backend/src/worldV2/prompts/worldLocationCategorization.ts` - Added `VisualElements` interface and extraction
- `packages/backend/src/worldV2/prompts/hostDNA.ts` - Added `visualConstraints` parameter
- `packages/backend/src/worldV2/handlers/newWorldLocationHandler.ts` - New handler
- `packages/frontend/src/worldV2/commands/handlers/newWorldLocationHandler.ts` - Frontend handler
- `packages/frontend/src/features/spawn-input/SpawnInputBar/useNavigationLogic.ts` - Added to exception list

### Pipeline Flow
```
1. Categorize: Concept → Host/Region/Location + VisualElements
2. Host DNA: Generated with visual constraints locked
3. Region DNA: Pass-through or real region
4. Location DNA: Inherits cascaded DNA from host
5. Save all nodes + build world tree
6. Generate image for location
```

---

## 2026-01-12 - Weather & Time of Day Commands ✅

Added dynamic weather and time control for V2 world system.

### New Props on Host Nodes
- `weather` - String describing weather conditions (e.g., "Overcast with light drizzle")
- `timeOfDay` - Enum: pre_dawn, dawn, morning, midday, afternoon, golden_hour, sunset, dusk, night, midnight

These are NOT part of DNA. They're read-time properties that cascade to all child nodes during image generation.

### New Slash Commands
- `/SET_TIME <time>` - Set time of day (e.g., `/SET_TIME night`)
- `/SET_WEATHER <description>` - Set weather (e.g., `/SET_WEATHER heavy rain`)

**Available from:** Any node (host, region, location) - automatically finds and updates parent host

### Files Created
**Backend:**
- `packages/backend/src/worldV2/handlers/setTimeHandler.ts`
- `packages/backend/src/worldV2/handlers/setWeatherHandler.ts`
- Routes: `POST /api/v2/set-time`, `POST /api/v2/set-weather`

**Frontend:**
- `packages/frontend/src/worldV2/commands/handlers/setTimeHandler.ts`
- `packages/frontend/src/worldV2/commands/handlers/setWeatherHandler.ts`

**Config:**
- Added to `SLASH_COMMANDS` in `packages/backend/src/config/navigation.ts`

### Dynamic Architecture
Weather/time are stored on host → read fresh each time `/DISPLAY` generates an image → cascaded to all child nodes. Changing time to "night" then running `/DISPLAY` on any node shows night lighting.

---

## 2026-01-12 - V2 Code Cleanup & Modularization

### Code Cleanup Complete ✅

Major refactoring to split large files and remove dead code.

**1. promptBuilder.ts - Dead Code Removed**
- Before: ~265 lines
- After: ~70 lines
- Removed unused: `PromptLayers`, `PromptResult`, `BuildPromptOptions`, `buildHostImagePrompt()`, `buildRegionImagePrompt()`, `buildLocationImagePrompt()`, `formatDNAPrompt()`, `formatBannedPrompt()`
- Kept: `cascadeDNA()`, `CascadedDNAChain` (used by displayHandler)

**2. v2Commands.ts (Frontend) - Split into Modules**
- Before: 1 file, 431 lines
- After: 8 files, ~50-85 lines each

**3. routes.ts (Backend) - Split into Modules**
- Before: 1 file, 471 lines  
- After: 7 files, ~35-130 lines each

---

## V2 Files Structure (Updated)

**Backend:**
```
packages/backend/src/worldV2/
├── types.ts              # DNA, Host, Region, WorldNode interfaces
├── routes.ts             # Router (~32 lines) - imports handlers
├── handlers/
│   ├── index.ts
│   ├── newHostHandler.ts
│   ├── newRegionHandler.ts
│   ├── newLocationHandler.ts
│   └── eventsHandler.ts
├── utils/
│   └── routeUtils.ts     # Shared utilities (generateId, SSE helpers, etc.)
├── prompts/
│   ├── hostDNA.ts
│   ├── regionDNA.ts
│   ├── locationDNA.ts
│   └── index.ts
├── display/
│   ├── displayHandler.ts
│   ├── imagePromptGenerator.ts
│   ├── promptBuilder.ts      # Only cascadeDNA now
│   ├── cameraSettings.ts
│   └── index.ts
└── index.ts
```

**Frontend:**
```
packages/frontend/src/worldV2/
├── commands/
│   ├── index.ts              # Main exports (isV2Command, handleV2Command)
│   ├── types.ts              # V2CommandCallbacks, V2CommandResult
│   ├── handlers/
│   │   ├── index.ts
│   │   ├── newHostHandler.ts
│   │   ├── newRegionHandler.ts
│   │   ├── newLocationHandler.ts
│   │   └── displayHandler.ts
│   └── utils/
│       └── commandUtils.ts   # Shared utilities (showError, registerSpawn, etc.)
└── index.ts
```

---

## Next Phases

- [ ] **Phase 5: Navigation Commands** - GO_INSIDE, GOTO for V2 nodes
- [ ] **Phase 6: Remove Old System** - Clean up legacy code

---

## Key Design Decisions

1. **LLM-generated prompt layers:** More specific than template-based prompts
2. **Camera perspective in LLM prompt:** Ensures foreground matches view height
3. **DNA cascading:** Child nodes inherit from parents, override only deltas
4. **Modular file structure:** Each file <150 lines, single responsibility
5. **Shared utilities:** DRY pattern for common operations (SSE, error handling)
