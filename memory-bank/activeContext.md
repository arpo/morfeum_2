# Active Context

## 2026-01-14 - PromptLayers-Based Visual Style Preservation ✅

Replaced DNA-cascading for image edits (GO_INSIDE2) with **promptLayers-based visual preservation**.

### Problem
When navigating into locations (GO_INSIDE2), the cascaded DNA included inappropriate inherited elements:
- Region atmosphere ("barren", "desolate") bleeding into interior scenes
- Visual signature from source image (palette, materials, lighting) not preserved
- Missing enclosure assertions causing open-roof bugs

### Solution: PromptLayers Instead of DNA Cascade

**Core Principle**: Use `promptLayers` stored in media metadata for visual preservation instead of cascading DNA.

**How it works:**
1. Initial image generation stores `promptLayers` in media metadata
2. When navigating (GO_INSIDE2), read source's promptLayers
3. LLM generates interior `promptLayers` that inherits visual signature
4. Edit prompt uses BOTH source and target promptLayers
5. New promptLayers stored for future chain navigation

### New Data Flow
```
Source Image (has promptLayers in media)
    ↓
GO_INSIDE2 command
    ↓
Read source promptLayers from media
    ↓
LLM generates interior promptLayers (inheriting visual signature)
    ↓
Build edit prompt using BOTH source and target promptLayers
    ↓
Generate edited image
    ↓
Store new promptLayers in media (for future navigation)
```

### Files Modified
- `goInside.ts` - Changed from `styleLockDNA` to `promptLayers`, receives `sourcePromptLayers`
- `goInsideHandler.ts` - Reads source promptLayers from media, stores new promptLayers
- `imageEditPrompt.ts` - Rewritten to follow scene-expert skill format
- `styleLockCompiler.ts` - Removed unused `buildStyleLockForSpace()`

### Scene-Expert Skill Patterns Applied
The new prompt format follows `scene-prompt-expert-using-edit-model` skill:
- Action, Target location, Camera, Orientation, Reveal, Preserve, Style lock sections
- **Enclosure assertions**: "Solid ceiling above. Fully enclosed interior."
- **Megastructure protection**: "The structure is NOT visible as an object inside"
- **Threshold trap avoidance**: "Entrance is behind the camera"

### Test Results
Interior "Living Platform" correctly preserves exterior "Mesa Dwelling" visual signature:
- ✅ Teal accents preserved
- ✅ Art Nouveau metalwork carried through
- ✅ Lighting adapted (harsh sun → soft diffused)
- ✅ Enclosure assertions working
- ✅ Chain navigation ready (interior has its own promptLayers)

---

## 2026-01-13 - DNA Cascading Fix (CSS-Style Inheritance) ✅

Fixed DNA cascading to properly follow CSS-style inheritance:
- Empty array = inherit from parent
- Non-empty array = REPLACE parent (not add to it)

### Files Modified
- `packages/backend/src/worldV2/display/promptBuilder.ts` - Fixed `mergeDNAArrays`
- `packages/backend/src/worldV2/prompts/goInside.ts` - Improved delta DNA enforcement
- `packages/backend/src/worldV2/handlers/goInsideHandler.ts` - Updated DNA handling

---

## V2 Files Structure (Updated)

**Backend:**
```
packages/backend/src/worldV2/
├── routes.ts
├── handlers/
│   ├── goInsideHandler.ts  ← UPDATED (promptLayers)
│   └── ...
├── prompts/
│   ├── goInside.ts         ← UPDATED (promptLayers)
│   ├── imageEditPrompt.ts  ← REWRITTEN (scene-expert format)
│   └── ...
└── utils/
    └── styleLockCompiler.ts ← CLEANED (removed buildStyleLockForSpace)
```

---

## Next Steps

- [ ] Test chain navigation (interior → deeper room)
- [ ] Consider adding promptLayers to other navigation commands (REFRAME, INSPECT)
