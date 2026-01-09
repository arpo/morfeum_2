# Active Context

## 2026-01-09 - World V2 System Implementation

### Current Status: Phases 1-4 COMPLETE

Built a new simplified world creation system (V2) that runs in parallel with the existing system.

---

## Completed Phases

### Phase 1: /NEW_HOST Command ✅
Creates a new world with simplified DNA structure.
**Usage:** `/NEW_HOST A steampunk metropolis`

### Phase 2: /NEW_REGION2 Command ✅
Creates a region under a host with delta-only DNA.
**Usage:** `/NEW_REGION2 The industrial docks` (on host node)

### Phase 3: /NEW_LOCATION2 Command ✅
Creates a location under a region with delta-only DNA.
**Usage:** `/NEW_LOCATION2 A gritty punk pub` (on region node)

### Phase 4: /DISPLAY Command ✅
Generates image prompt layers via LLM, then generates image.
**Usage:** `/DISPLAY` or `/DISPLAY --populate` (on any V2 node)

**Architecture:**
1. Load node and cascade DNA from host→region→location
2. Call LLM (gemini-2.5-flash-lite) to generate structured prompt layers
3. Build final prompt from layers + camera config + DNA
4. Apply Morfeum style modifiers
5. Generate image via Flux
6. Store in media.json with promptLayers metadata

---

## V2 Files Structure

**Backend:**
```
packages/backend/src/worldV2/
├── types.ts              # DNA, Host, Region, WorldNode interfaces
├── routes.ts             # All V2 routes (new-host, new-region, new-location, display)
├── prompts/
│   ├── hostDNA.ts        # Host DNA generation
│   ├── regionDNA.ts      # Region DNA generation (delta-only)
│   ├── locationDNA.ts    # Location DNA generation (delta-only)
│   └── index.ts
├── display/
│   ├── displayHandler.ts     # /DISPLAY route handler
│   ├── imagePromptGenerator.ts # LLM prompt layer generation
│   ├── promptBuilder.ts      # DNA cascading logic
│   ├── cameraSettings.ts     # Camera configs per node type
│   └── index.ts
└── index.ts
```

**Frontend:**
```
packages/frontend/src/worldV2/
├── commands/
│   └── v2Commands.ts     # All V2 command handlers
└── index.ts
```

---

## /DISPLAY Image Prompt Flow

```
1. Node selected → /DISPLAY command
2. Backend loads node + parent chain
3. DNA cascades: host → region → location
4. LLM generates layers (with camera perspective guidance):
   - background, midground, foreground, lighting, atmosphere
5. buildPromptFromLayers() combines layers + camera
6. applyMorfeumStyle() adds quality modifiers
7. Flux generates image
8. Saved to media.json with promptLayers for regeneration
```

**Camera Perspective by Node Type:**
- Host: Aerial (satellite/airplane, 30-60° down)
- Region: Elevated (rooftop/drone, 35-50° down)
- Location exterior: Street-level (25-30° tilt up)
- Location interior: Eye-level inside space

---

## Next Phases

- [ ] **Phase 5: Navigation Commands** - GO_INSIDE, GOTO for V2 nodes
- [ ] **Phase 6: Remove Old System** - Clean up legacy code

---

## Key Design Decisions

1. **LLM-generated prompt layers:** More specific than template-based prompts
2. **Camera perspective in LLM prompt:** Ensures foreground matches view height
3. **DNA cascading:** Child nodes inherit from parents, override only deltas
4. **Single NEG block:** Avoids duplicate negative prompts
5. **PipelineHelper for timing:** Unified SSE events and elapsed time tracking
