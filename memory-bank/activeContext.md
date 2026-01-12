# Active Context

## 2026-01-12 - NEW_WORLD_LOCATION Single LLM Call Refactor ✅

Refactored `/NEW_WORLD_LOCATION` from 4 LLM calls to 1 for better performance.

### Before (4 LLM calls)
```
1. Categorization → Parse into host/region/location
2. Host DNA → Generate host
3. Region DNA → Generate region  
4. Location DNA → Generate location
```

### After (1 LLM call)
```
1. worldLocationFull → Generate all 3 nodes in single call
```

### Modular Prompt Architecture
Created shared prompt sections to avoid duplication:

```
packages/backend/src/worldV2/prompts/
├── shared/
│   └── dnaSchema.ts          # DNA_SCHEMA, DNA_FIELD_RULES, HOST_RULES, etc.
├── worldLocationFull.ts       # Combined prompt (imports from shared)
├── hostDNA.ts                 # Individual (can import shared later)
├── regionDNA.ts
├── locationDNA.ts
└── index.ts
```

**Shared sections in `dnaSchema.ts`:**
- `DNA_SCHEMA` - JSON structure for DNA
- `DNA_FIELD_RULES` - Explanations for each field
- `DNA_DELTA_RULES` - Child inheritance rules
- `HOST_RULES`, `REGION_RULES`, `LOCATION_RULES`
- `ATMOSPHERE_EXTRACTION` - Style/mood term extraction
- `VISUAL_CONSTRAINTS_RULES` - Consistency enforcement

### Visual Consistency (Enhanced)
Mood/style terms like "whimsical", "ethereal", "surreal" are now:
1. Explicitly listed in prompt guidance
2. Extracted to `atmosphere` array
3. Enforced in host `dna.essence` AND `dna.atmosphere`
4. Inherited by all child nodes

### Files Modified
- `worldLocationFull.ts` - NEW: Combined prompt
- `shared/dnaSchema.ts` - NEW: Shared prompt sections
- `newWorldLocationHandler.ts` - Uses single LLM call
- `pipelineConfig.ts` - Updated steps (7→4)
- `prompts/index.ts` - New exports

### Pipeline Steps (Updated)
```typescript
v2CreateWorldLocation: [
  { id: 'world_creation', name: 'Creating World', duration: 4000 },
  { id: 'saving', name: 'Saving World', duration: 500 },
  { id: 'prompt_generation', name: 'Creating Image Prompt', duration: 4000 },
  { id: 'image_generation', name: 'Generating Image', duration: 2500 }
]
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
