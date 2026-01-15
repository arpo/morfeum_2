# Active Context

## 2026-01-15 - LOOK Command Implementation ✅

Implemented `/LOOK` command for camera control within same space. Creates **view nodes** (camera angles without location change).

### What Was Built

**Backend:**
- `worldV2/prompts/look.ts` - LLM prompt for camera instruction generation
- `worldV2/prompts/imageEditPrompt.ts` - Added `buildLookImageEditPrompt()`
- `worldV2/handlers/lookHandler.ts` - Backend handler
- Pipeline: `v2Look` in pipelineConfig.ts
- Route: `/api/v2/look`

**Frontend:**
- `worldV2/commands/handlers/lookHandler.ts` - Frontend handler
- View node styling: italic text, eye icon
- Command registered in v2Commands

**Documentation:**
- `docs/look-command-best-practices.md` - User guide

### Operation Types

| Operation | Triggers | Lens | Result |
|-----------|----------|------|--------|
| `angle_change` | look up/down, turn, face | 35mm medium | Camera rotation/tilt |
| `traversal` | walk toward, approach | 35mm medium | Camera moves through space |
| `zoom_in` | inspect, closer, out the window | 85mm close | Tight framing on target |
| `zoom_out` | step back, wider view | 24mm wide | Shows more context |

### Key Prompt Tuning

1. **"Out the window"** - Uses 85mm close, explicit "look OUTWARD through it"
2. **"See the view from"** - Panorama focus, minimize foreground (80%+ vista)
3. **Dramatic movements** - "Target should FILL THE FRAME (60-80%)"
4. **No inventions** - Explicit prohibition on adding new elements

### Best Phrasing Patterns

| Intent | ✅ Recommended | ❌ Avoid |
|--------|----------------|----------|
| Look through window | `out the window` | `at the window` |
| Specific window | `out the right window` | `out through the window to the right` |
| Panorama | `see the view from the balcony` | `look at the railing` |

### Files Created/Modified

- NEW: `look.ts`, `lookHandler.ts` (backend/frontend)
- NEW: `docs/look-command-best-practices.md`
- MODIFIED: `imageEditPrompt.ts` (added buildLookImageEditPrompt)
- MODIFIED: `navigation.ts` (added LOOK command, `view` node type)
- MODIFIED: `pipelineConfig.ts` (added v2Look pipeline)

---

## 2026-01-14 - GO_INSIDE2 Prompt Fixes ("Tower Inside Tower" Bug) ✅

Fixed critical edit-model failure modes in GO_INSIDE2 prompts.

### Problems Fixed

1. **"Tower inside tower" bug** - When entering a structure, the structure was visible as an object inside itself
2. **Unexplained openings/windows** - Edit model created windows to explain exterior lighting descriptions
3. **Atrium/void spaces** - LLM generated "atrium" spaces which imply central voids

### Root Causes Identified

1. **Raw midground in Preserve** - Passing `sourcePromptLayers.midground` directly included text like "The imposing Chronos Pillar itself" which told the model to preserve the object
2. **Exterior lighting in Preserve** - Passing `sourcePromptLayers.lighting` with "harsh midday sunlight" caused model to create openings
3. **Space naming** - LLM creating "atrium", "void", "shaft" space types implies central structures

### Solutions Implemented

**1. Restructured `buildEnterImageEditPrompt()` (imageEditPrompt.ts)**
- Removed `sourcePromptLayers.midground` from Preserve section
- Removed `sourcePromptLayers.lighting` from Preserve section
- Only pass atmosphere tone and environmental context (as indirect influence)
- Added "SURFACE TREATMENT ONLY" qualifier

**2. Universal indoor enclosure rules (no regex)**
```
Physical constraints:
The space is carved into the structure's mass — not a void containing the structure.
The structure itself is NOT visible as an object from inside.
```
These rules are universally TRUE for any indoor space.

**3. Space naming guidance (goInside.ts)**
Added LLM instructions:
- DO NOT use: atrium, void, shaft, gallery (vertical)
- INSTEAD use: chamber, hall, room, corridor, vestibule, salon, anteroom

**4. Explicit prohibitions**
- "Do not create a central pillar, spire, column, or tower form"
- "Do not show the structure as an object visible from inside"
- "Do not show windows or openings to the exterior"

### Files Modified
- `imageEditPrompt.ts` - Restructured Preserve section, added prohibitions
- `goInside.ts` - Added space naming guidance for LLM

### Test Results
"Entrance Vestibule" in The Chronos Pillar:
- ✅ No tower visible inside tower
- ✅ No unexplained openings/windows
- ✅ Proper enclosed interior
- ✅ Visual signature preserved as surface treatment

---

## 2026-01-14 - PromptLayers-Based Visual Style Preservation ✅

Replaced DNA-cascading for image edits (GO_INSIDE2) with **promptLayers-based visual preservation**.

### Solution: PromptLayers Instead of DNA Cascade

**Core Principle**: Use `promptLayers` stored in media metadata for visual preservation instead of cascading DNA.

**Data Flow:**
```
Source Image (has promptLayers in media)
    ↓
GO_INSIDE2 command
    ↓
Read source promptLayers from media
    ↓
LLM generates interior promptLayers (inheriting visual signature)
    ↓
Build edit prompt (source atmosphere + target layers)
    ↓
Generate edited image
    ↓
Store new promptLayers in media (for future navigation)
```

---

## V2 Files Structure (Updated)

**Backend:**
```
packages/backend/src/worldV2/
├── routes.ts
├── handlers/
│   ├── goInsideHandler.ts  ← promptLayers flow
│   └── ...
├── prompts/
│   ├── goInside.ts         ← space naming guidance
│   ├── imageEditPrompt.ts  ← restructured Preserve section
│   └── ...
└── utils/
    └── styleLockCompiler.ts
```

---

## 2026-01-14 - GO_INSIDE2 Complete (v1.8) ✅

Completed comprehensive GO_INSIDE2 system with three parallel prompt builders and time/weather enforcement.

### Prompt Builders Added

| Version | Change |
|---------|--------|
| v1.4 | `buildEnterOutdoorEditPrompt()` - for outdoor→outdoor |
| v1.6 | `buildEnterSemiEnclosedEditPrompt()` - for semi-enclosed (pavilions, gazebos) |
| v1.7 | Time/weather enforcement in outdoor + semi-enclosed |
| v1.8 | Time/weather enforcement in indoor prompt |

### SpaceType Detection

LLM in `goInside.ts` chooses spaceType based on physical characteristics:
- `indoor` - Solid walls AND ceiling, NO sky visible
- `outdoor` - No roof, full sky visible  
- `semi-enclosed` - Partial roof, sky through gaps/lattice
- `underground` - Below ground
- `elevated` - Raised platform, no roof

Handler routes to correct prompt builder based on spaceType.

### Test Results

13 diverse scenarios tested:
- ✅ Megastructures (sci-fi tower, pyramid)
- ✅ Small buildings (cottage, spaceship)
- ✅ Natural formations (cave, hollow tree)
- ✅ Outdoor areas (parks, festivals)
- ✅ Semi-enclosed (art installations, temples)
- ✅ Time/weather enforcement (night vs day)

Full test log: `docs/go-inside-test-scenarios.md`

---

## 2026-01-14 - GOTO2 Command Implemented ✅

Implemented `/GOTO2` - creates sibling spaces within the same container.

### Problem Solved

**Before:** User had to go back to parent location to run `/GO_INSIDE2` multiple times for each room.

**After:** User stays on any space node and runs `/GOTO2 <target>` to create a sibling.

### How It Works

```
User is on: "Main Kitchen" (space) inside "The Pub" (container)
Runs: /GOTO2 VIP Lounge
System:
1. Finds parent container ("The Pub")
2. Finds parent location (container's parent)
3. Uses parent location's image for edit (NOT current space)
4. Reuses GO_INSIDE2 LLM prompt + image edit logic
5. Creates sibling space under existing container
```

### Key Design Decisions

1. **Source Image:** Uses parent location's image, not current sibling - all rooms share same visual source
2. **Command Visibility:** `requiresNodeType: ['space']` - only appears when on space node
3. **Reuses GO_INSIDE2:** Same LLM prompt (buildGoInsidePrompt), same image edit prompts (indoor/outdoor/semi-enclosed)

### Files Created

**Backend:**
- `worldV2/handlers/gotoHandler.ts` - Handler with validation + pipeline
- Added `v2Goto` pipeline in `pipelineConfig.ts`

**Frontend:**
- `worldV2/commands/handlers/gotoHandler.ts` - Frontend handler

**Modified:**
- `config/navigation.ts` - Added GOTO2 command config
- `routes.ts` - Added `/api/v2/goto` route
- Handler indexes and command registrations

---

## Next Steps

- [x] Fix "tower inside tower" bug
- [x] Fix openings/windows bug
- [x] Test on different structure types
- [x] Three parallel prompt builders (indoor, outdoor, semi-enclosed)
- [x] Time/weather enforcement (v1.8)
- [x] GOTO2 navigation (sibling spaces)
- [ ] Future: Add season support to Host node
- [ ] Future: GOTO (legacy system move between locations)
