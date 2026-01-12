# Active Context

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
