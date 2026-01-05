# Adding Transition Special Cases

When you find a transition that doesn't produce correct images (e.g., exterior→interior, genre-specific), here's how to add special case rules.

## Two Systems to Consider

### 1. DNA Generation Rules (What the space IS)
**File:** `packages/backend/src/engine/generation/prompts/locations/nodeDNAGeneration.ts`

This controls what DNA descriptions are generated. Add rules at the end of the prompt string (before the closing backtick).

**Example - Gothic/Horror Rule:**
```
GOTHIC/HORROR GENRES - STILL NEED PHYSICAL DESCRIPTIONS:
Even for haunting, eerie, or atmospheric spaces - describe REAL architectural elements:
✅ CORRECT: "Grand entrance hall with crumbling plaster walls, rotting wood paneling..."
❌ WRONG: "Phantom outline", "oppressive emptiness", "spectral imprint"
```

**When to add DNA rules:**
- A genre produces abstract/poetic descriptions instead of concrete physical ones
- A specific architectural style needs special handling
- Certain space types need specific element requirements

### 2. Material Transition Rules (Interior materials)
**File:** `packages/backend/src/engine/generation/prompts/shared/interiorTransitionRules.ts`

Controls what materials an interior should have based on exterior style.

**Categories:**
- `SAME_MATERIAL` - Interior uses identical materials (futuristic, organic, crystalline)
- `FINISHED_INTERIOR` - Interior gets typical finishes (traditional houses, Victorian)
- `EXPOSED_MATERIAL` - Interior shows raw structure (industrial, brutalist)
- `NATURAL_INTEGRATION` - Built into nature (treehouses, cave dwellings)
- `FANTASY_SPECIFIC` - Cultural/magical interiors (elven, dwarven, magical)

**To add a new architectural style:**
```typescript
// In INTERIOR_TRANSITION_RULES
SAME_MATERIAL: [
  'futuristic',
  'organic',
  'crystalline',
  'your-new-style-here',  // Add to appropriate category
],
```

### 3. Image Layer Guidance (Image composition)
**Files:** `packages/backend/src/engine/generation/shared/spaceTypeRegistry/*/`

Controls how the background/midground/foreground are composed.

**Available priorities:**
- `interior-dominant` - Interior walls fill background, windows are glimpses
- `exterior-dominant` - Sky/surroundings dominate, structure frames
- `balanced` - Both visible equally (e.g., car cabin with windshield)

**To add a new space type:**
1. Create file in appropriate folder (building/, vehicle/, natural/, tentLike/)
2. Define `SpaceTypeDefinition` with `imageLayerGuidance`
3. Export from `spaceTypeRegistry/index.ts`

## Adding a New Special Case

### Example: Sci-Fi Laboratory Interior

If you notice sci-fi lab interiors aren't working correctly:

**Step 1: Add DNA rule** (nodeDNAGeneration.ts)
```
SCI-FI LABORATORY INTERIORS:
Describe high-tech equipment, sterile surfaces, control panels:
✅ "Gleaming white lab with holographic displays, stainless steel workbenches, specimen containers"
❌ "The essence of science", "infinite potential of discovery"
```

**Step 2: Check material category** (interiorTransitionRules.ts)
Sci-fi labs should likely be in `SAME_MATERIAL` to keep metallic/high-tech surfaces.

**Step 3: Verify space type** (spaceTypeRegistry)
Should use `building-interior` with `interior-dominant` priority.

## Quick Reference: Current Special Cases

| Issue | Location | Solution |
|-------|----------|----------|
| Abstract descriptions | nodeDNAGeneration.ts | Add ✅/❌ examples |
| Wrong interior materials | interiorTransitionRules.ts | Add style to correct category |
| Wrong image composition | spaceTypeRegistry/*.ts | Set correct `backgroundPriority` |
| Gothic ghost poetry | nodeDNAGeneration.ts | Gothic/Horror specific rules |

## Testing Changes

1. Make changes to the appropriate file
2. Run `cd packages/backend && npm run build`
3. Delete the existing niche/interior node
4. Try `GO_INSIDE` again
5. Check the generated DNA and image prompt
