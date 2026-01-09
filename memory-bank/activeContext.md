# Active Context

## 2026-01-09 - World V2 System Implementation

### Current Status: Phases 1-3 COMPLETE

Built a new simplified world creation system (V2) that runs in parallel with the existing system. The goal is to replace the complex DNA system with a simpler, more maintainable approach.

---

## Completed Phases

### Phase 1: /NEW_HOST Command ✅

Creates a new world with simplified DNA structure.

**Usage:** `/NEW_HOST A steampunk metropolis`

**Output:**
```json
{
  "type": "host",
  "name": "London",
  "genre": "Urban Metropole",
  "dna": {
    "essence": ["Victorian Gothic grandeur", "Industrial Revolution grit"],
    "formsAndMaterials": ["Stone and brick monoliths", "Ironwork and glass"],
    "colorAndLight": ["Muted greys and browns", "Gaslight glow"],
    "atmosphere": ["Melancholic and mysterious", "Busy and labyrinthine"],
    "banned": ["Excessive cyberpunk neon", "Fantasy magic props"]
  }
}
```

### Phase 2: /NEW_REGION2 Command ✅

Creates a region under a host with delta-only DNA (inherits from host).

**Usage:** `/NEW_REGION2 The industrial docks` (while on a host node)

**Features:**
- Only available when focused on a host node
- Delta-only DNA (empty arrays inherit from host)
- Proper nouns preserved (e.g., "Camden")

### Phase 3: /NEW_LOCATION2 Command ✅

Creates a location under a region with delta-only DNA. NO promptStructure generated - that's deferred to /DISPLAY.

**Usage:** `/NEW_LOCATION2 A gritty punk pub` (while on a region node)

**Output:**
```json
{
  "type": "location",
  "name": "The Rusty Mug",
  "spaceType": "exterior",
  "description": "A gritty, independent pub with a distinctive punk-rock aesthetic.",
  "dna": { ... }
}
```

**Note:** promptStructure is NOT generated during location creation - it will be generated at /DISPLAY time.

---

## V2 Files Structure

**Backend:**
```
packages/backend/src/worldV2/
├── types.ts              # V2HostDNA, V2RegionDNA, V2LocationDNA interfaces
├── routes.ts             # NEW_HOST, NEW_REGION, NEW_LOCATION routes
├── prompts/
│   ├── hostDNA.ts        # Host DNA generation prompt
│   ├── regionDNA.ts      # Region DNA generation prompt (delta-only)
│   ├── locationDNA.ts    # Location DNA generation prompt (delta-only, no promptStructure)
│   └── index.ts          # Exports
└── index.ts              # Module exports
```

**Frontend:**
```
packages/frontend/src/worldV2/
├── commands/
│   └── v2Commands.ts     # NEW_HOST, NEW_REGION2, NEW_LOCATION2 handlers
└── index.ts              # Module exports
```

---

## V2 DNA Inheritance Model

```
Host (full DNA)
  └── Region (delta-only, inherits from host)
        └── Location (delta-only, inherits from region+host)
```

**Delta Rule:** Each child node only stores what's NEW or DIFFERENT from its parent. Empty arrays mean "inherit from parent."

---

## Next Phases

- [ ] **Phase 4: /DISPLAY Command** - Generate promptStructure + image for any node
- [ ] **Phase 5: Navigation Commands** - GO_INSIDE, GOTO for V2 nodes
- [ ] **Phase 6: Remove Old System** - Clean up legacy code

---

## Key Design Decisions

1. **DNA-only creation:** Nodes are created with DNA only. Image prompts generated on-demand via /DISPLAY.
2. **Delta inheritance:** Child nodes only store differences, reducing redundancy.
3. **Parallel system:** V2 runs alongside V1 for safe migration.
4. **Single LLM call per node:** Each creation is one prompt, one response.
