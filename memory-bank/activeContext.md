# Active Context

## 2026-01-13 - DNA Cascading Fix (CSS-Style Inheritance) ✅

Fixed DNA cascading to properly follow CSS-style inheritance as specified in fundamentals.md.

### Problem
DNA arrays were using **accumulation** (`[...parent, ...child]`) instead of **CSS-style inheritance** where:
- Empty array = inherit from parent
- Non-empty array = REPLACE parent (not add to it)

This caused DNA to bloat as you went deeper in the hierarchy (Host → Region → Location → Space), with all ancestor values concatenating.

### Solution
Fixed `mergeDNAArrays` in `promptBuilder.ts`:

```typescript
// BEFORE (wrong - accumulation):
return [...parent, ...child];

// AFTER (correct - CSS-style):
if (child.length === 0) return parent;  // Empty = inherit
return child;  // Non-empty = REPLACE
```

### Files Modified
- `packages/backend/src/worldV2/display/promptBuilder.ts` - Fixed `mergeDNAArrays`
- `packages/backend/src/worldV2/prompts/goInside.ts` - Improved delta DNA enforcement in prompt
- `packages/backend/src/worldV2/handlers/goInsideHandler.ts` - Updated DNA handling

### Note: Cleanup Needed
`promptBuilder.ts` now has duplicate functions doing the same thing:
- `cascadeDNA` (uses `mergeDNAArrays`) - used by most handlers
- `getMergedDNA` (uses `mergeNonEmpty`) - added during this session

These can be consolidated later - both work correctly with CSS-style inheritance.

### Fundamentals Reference
From `memory-bank/fundamentals.md`:
> - **`null` = "inherit from parent"** - Child gets parent's value
> - **Explicit value = override** - Child's value takes precedence

---

## 2026-01-12 - NEW_WORLD_LOCATION_INTERIOR Command ✅

Created new `/NEW_WORLD_LOCATION_INTERIOR` command that creates a 4-node hierarchy from a single concept.

### What It Does
Creates: `Host → Region → Location (exterior) → Location (interior)` + image for interior

### Usage
```
/NEW_WORLD_LOCATION_INTERIOR the kitchen of a pub in Camden in London
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
│   ├── newWorldLocationInteriorHandler.ts
│   ├── goInsideHandler.ts  ← UPDATED (DNA cascading)
│   ├── setTimeHandler.ts
│   ├── setWeatherHandler.ts
│   └── eventsHandler.ts
├── prompts/
│   ├── shared/dnaSchema.ts
│   ├── worldLocationFull.ts
│   ├── worldLocationInterior.ts
│   ├── goInside.ts  ← UPDATED (delta DNA enforcement)
│   └── ...
└── display/
    ├── promptBuilder.ts  ← UPDATED (CSS-style mergeDNAArrays)
    └── ...
```

---

## Next Steps

- [ ] **Cleanup:** Consolidate duplicate DNA functions in promptBuilder.ts
- [ ] **Phase 6: Remove Old System** - Clean up legacy code
