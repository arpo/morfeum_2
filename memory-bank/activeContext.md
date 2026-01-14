# Active Context

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

## Next Steps

- [x] Fix "tower inside tower" bug
- [x] Fix openings/windows bug
- [ ] Test chain navigation (interior → deeper room)
- [ ] Test on different structure types (small house, spaceship, etc.)
