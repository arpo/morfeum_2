# Morfeum Fundamental Principles

This document captures the core principles that govern how Morfeum works. These principles should always be followed when working on this project.

---

## 1. World Hierarchy

The world is structured in **4 layers**. Not all layers are required - a world can be just a Host, or Host + Region, etc.:

| Layer | Description | Example |
|-------|-------------|---------|
| **Host** | World/Setting - governs tone, culture, social logic | Göteborg, Metropolis |
| **Region** | District/Biome - defines sub-culture, local climate (can be pass-through) | Ringön, Financial District |
| **Location** | Building/Site - specific place of activity | The Anchor Pub, Botanical Dome |
| **Niche** | Room/Space - micro-environment (interior OR exterior) | VIP room, Rooftop terrace |

**Rules**:
- Nodes always have a parent (except Host)
- A world can be just one Host - layers are added as needed
- Children inherit from parents via the DNA system
- Regions can be "pass-through" (see below)
- Locations can be nested within niches (for structures inside spaces)

### Pass-Through Regions

Pass-through regions are for **GENERIC/UNDEFINED** places where no specific known location is referenced.

| Aspect | Behavior |
|--------|----------|
| **Name** | Just "Region" (no specific name) |
| **DNA** | Empty - inherits ALL from host |
| **isPassThrough** | `true` flag on node |
| **Purpose** | Satisfies hierarchy requirements |
| **Commands** | `/VIEW` blocked, `/NEW_LOCATION` allowed |

**When to use pass-through (generic/undefined settings):**
- "A steampunk factory" → pass-through (generic, no known place)
- "A medieval castle" → pass-through (generic, undefined location)
- "A Victorian pub" → pass-through (generic era, no specific city)
- "A cozy cottage" → pass-through (undefined location)
- "An alien building on an alien planet" → pass-through (abstract sci-fi)

**When to use REAL region (KNOWN places - real or established fictional):**
- "A pub in London" → LLM creates "Soho" or "Whitechapel" (known city)
- "A restaurant in Tokyo" → LLM creates "Shibuya" (known city)
- "A hobbit hole in Middle-earth" → LLM creates "The Shire" (known universe)
- "A building in Gotham City" → LLM creates "The Narrows" (known fictional city)
- "A pub in Camden" → real region "Camden" (explicitly named)

**Key question: Is this a KNOWN place (real or established fictional)?**
- YES (London, Tokyo, Middle-earth, Gotham City) → LLM creates region
- NO (generic "a castle", "a factory", "an alien planet") → pass-through

**Benefits of pass-through:**
- Faster creation (no LLM call for region DNA)
- Can add real sibling regions later
- DNA flows directly from host to location

### Nested Structures (Pass-Through Locations)

When using `GO_INSIDE` to enter a distinct structure from within a niche (e.g., a little house inside a basement), the system automatically creates a **pass-through location** for that structure:

```
Basement Hall (niche)
  └── little house (location, isPassThrough=true) ← AUTO-CREATED
        └── little house interior (niche) ← Where user lands
```

| Aspect | Behavior |
|--------|----------|
| **Trigger** | `GO_INSIDE` from a niche targeting a structure |
| **Creates** | Pass-through location + interior niche |
| **DNA** | Empty on location - inherits from ancestors |
| **GOTO behavior** | Creates siblings under the location ✓ |
| **No LLM call** | Location is created instantly |

**Why this matters:**
- `GOTO` from inside the structure creates sibling rooms correctly
- DNA inheritance works through the location
- Each structure can have its own distinct interior spaces

**Example flow:**
```
/GO_INSIDE the little house    → Creates location + interior niche
/GOTO the room on the right    → Creates sibling niche under "little house" location
/GOTO the kitchen              → Creates another sibling niche
```

All rooms are siblings under the "little house" location, not under the basement.

---

## 2. DNA Inheritance (for Initial Image Generation)

Properties flow down from parent to child unless explicitly overridden:

- **`null` = "inherit from parent"** - Child gets parent's value
- **Explicit value = override** - Child's value takes precedence
- **`genre` is Host-only** - Never set on Region, Location, or Niche

```
Host (genre: "steampunk", mood: "mysterious")
  └── Region (mood: null)           ← inherits "mysterious"
        └── Location (mood: "eerie") ← overrides to "eerie"
```

**Why**: Creates visual consistency across the entire world without repetition.

**Important**: DNA cascading is for **initial image generation** only. For **image editing** (navigation), use **promptLayers** instead (see Section 11).

---

## 3. Core Functions to Use

### Image Generation
**Always use the shared function - never create new image generation code:**

```typescript
import { generateImage } from '../pipelines/shared/imageGeneration';

// Location: packages/backend/src/engine/pipelines/shared/imageGeneration.ts
const { imageUrl } = await generateImage(apiKey, prompt, numImages, aspectRatio, safety);
```

### DNA Functions

**Frontend - Getting cascaded DNA:**
```typescript
// 1. Get hierarchical DNA from store
const cascadedDNA = getCascadedDNA(nodeId);
// Returns: { world, region, location, niche }

// 2. Merge into flat object with inheritance
import { getMergedDNA } from '@/utils/nodeDNAExtractor';
const mergedDNA = getMergedDNA(cascadedDNA);
// Returns: flat DNA with all nulls resolved from ancestors
```

**Backend - Resolving ancestry DNA:**
```typescript
import { getResolvedNodeDNA } from './hierarchyAnalysis/dnaMerge';

// Location: packages/backend/src/engine/hierarchyAnalysis/dnaMerge.ts
const resolvedDNA = getResolvedNodeDNA(nodeId, nodesMap, worldTrees);
```

**Storage - Cleaning DNA:**
```typescript
import { extractCleanDNA } from '@/utils/nodeDNAExtractor';

// Strip nested arrays for storage
const cleanDNA = extractCleanDNA(backendData, 'host');
```

---

## 4. Always Use Cascaded DNA

When fetching DNA from parent nodes, **ALWAYS use the cascaded DNA functions**:

| ✅ Correct | ❌ Wrong |
|-----------|----------|
| `getCascadedDNA(nodeId)` then `getMergedDNA()` | Manually walking tree to collect DNA |
| `getResolvedNodeDNA()` on backend | Building DNA object by hand |

**Why**: The cascaded functions handle null inheritance, ancestry chain traversal, and proper merging. Manual approaches miss edge cases.

---

## 5. Storage vs LLM Usage

Different data structures for different purposes:

| Purpose | Structure | Function |
|---------|-----------|----------|
| **Storage** | Clean, flat nodes (no nested arrays) | `extractCleanDNA()` |
| **LLM Usage** | Merged DNA with full inheritance | `getMergedDNA()` |

**Rule**: Store clean data, merge only when sending to LLM for generation.

---

## 6. DNA vs Structure Separation

Two distinct property systems:

| System | Content | Behavior |
|--------|---------|----------|
| **DNA** | Visual/atmospheric (colors, mood, materials, sounds) | Cascades down hierarchy |
| **Structure** | Physical/spatial (form, scale, openings, layout) | Node-specific, no inheritance |

**Why**: DNA creates consistent aesthetics; Structure defines unique physical spaces.

---

## 7. Solid Exteriors = No Windows

**CRITICAL RULE**: If the parent exterior is a solid form, the interior MUST have `openings: "none"`.

| Solid Forms (use `openings: "none"`) |
|--------------------------------------|
| dome, mushroom, saucer, capsule, pod, sphere, organic blob |

**Rules**:
- Check parent's `looks` and `dominantElements` for any mention of windows/glass/portholes
- If NO windows mentioned → `openings: "none"`
- `"minimal"` is ONLY for exteriors that show SOME small openings (narrow slits, small portholes)
- When in doubt, DEFAULT to `"none"` - you can always add internal light sources

**Interior Constraint** (added to FLUX prompt when `openings: "none"`):
```
[CONSTRAINT:] fully enclosed interior; no openings, holes, skylights, or gaps in the roof or ceiling unless explicitly specified; maintain intact, continuous ceiling structure
```

**Lighting for windowless interiors comes from**:
- Internal lights (lamps, panels)
- Bioluminescence (organic structures)
- Glowing surfaces/materials
- Ambient electronic glow

---

## 8. Image Generation: Deepest Node Only

When creating multiple nodes in a hierarchy:
- Generate image ONLY on the deepest node
- Parent nodes get DNA but no image

```
User: "a pub in Camden in London"
Creates: London (no image) → Camden (no image) → Pub (IMAGE)
```

**Why**: Reduces wait time and API costs while showing the most relevant view.

---

## 9. Elevation Detection

The `elevation` field in Structure determines spatial positioning:

| Value | Description | Example |
|-------|-------------|---------|
| `ground-level` | Standard ground floor | Street-level shop |
| `rooftop` | On top of a building | Rooftop bar |
| `elevated` | Above ground but not rooftop | Tower room, penthouse |
| `underground` | Below ground level | Basement, cave |
| `floating` | Suspended in air | Floating island |
| `suspended` | Hanging from structure | Hanging garden |

**Detection**: LLM analyzes destination text during structure analysis (no extra API call).

**Image prompt**: Each elevation type receives appropriate context (e.g., rooftop gets cityscape views).

---

## 10. Two-Step Navigation Architecture

Navigation separates understanding from action:

1. **Intent Classification (LLM)**: Analyze natural language to determine intent
2. **Navigation Routing (Deterministic)**: Execute the classified intent

**Why**: LLM handles ambiguity; deterministic code handles execution reliably.

---

## Common Mistakes to Avoid

❌ **Don't** set `genre` on child nodes - only Host has genre  
❌ **Don't** send raw cascaded DNA to LLM - always merge first  
❌ **Don't** generate images for intermediate nodes in hierarchy  
❌ **Don't** make interior scale larger than parent exterior  
❌ **Don't** mix DNA fields with Structure fields  
❌ **Don't** store nested arrays in nodes - keep storage flat  
❌ **Don't** manually walk tree to collect DNA - use cascaded functions  
❌ **Don't** create new image generation functions - use shared `generateImage()`

✅ **Do** use `null` for fields that should inherit from parent  
✅ **Do** pass full parent context when generating children  
✅ **Do** use `getCascadedDNA()` + `getMergedDNA()` for DNA operations  
✅ **Do** use `generateImage()` from `pipelines/shared/imageGeneration.ts`

---

## Available Slash Commands

| Command | Purpose |
|---------|---------|
| `NEW_HOST` | Create a new world/setting |
| `NEW_REGION` | Create a region within current host |
| `NEW_LOCATION` | Create a location within current region |
| `NEW_NICHE` | Create a niche/room within current location |
| `VIEW` | Regenerate view of current node |
| `GOTO` | Navigate to a new sibling location |
| `GO_INSIDE` | Enter a structure to create interior niche |
| `CREATE_CHARACTER_REAL` | Create realistic character at location |
| `CREATE_CHARACTER_UNREAL` | Create stylized character at location |

**Perspective Flags** (for `GO_INSIDE`):
- `--exterior` - Force exterior/outdoor perspective
- `--interior` - Force interior perspective  
- `--open-air` - Force open-sky outdoor space

**Creature Mode Flags** (for `GOTO`, `GO_INSIDE`):
- `--populate` - Add ambient background figures (silhouettes, motion-blurred people)
- `--people` - Same as `--populate`
- (default) - No people (adds `[FILTER: NoLivingSubjects]`)

**Prompt Enhancer**: Use `furnish:` prefix in prompt text for furnishing suggestions (e.g., `GO_INSIDE the cafe furnish: cozy reading nook`).

---

## 11. PromptLayers for Navigation (Image Editing)

When navigating into locations (GO_INSIDE), use **promptLayers** instead of cascaded DNA for visual style preservation.

### Two Different Approaches

| Purpose | Approach | Why |
|---------|----------|-----|
| **Initial image generation** | DNA cascade | Gives regional character to new locations |
| **Image editing (navigation)** | promptLayers | Preserves visual signature from source |

### Why Not DNA for Navigation?

DNA cascading caused visual drift during navigation:
- Region atmosphere (e.g., "barren", "desolate") bleeding into interior scenes
- Visual signature from source image not preserved
- Missing enclosure assertions causing open-roof bugs

### How PromptLayers Works

1. **Initial generation** stores `promptLayers` in media metadata
2. **GO_INSIDE** reads source image's promptLayers
3. LLM generates interior promptLayers (inheriting visual signature)
4. Edit prompt uses BOTH source and target promptLayers
5. New promptLayers stored in media for chain navigation

### promptLayers Structure

```typescript
interface ImagePromptLayers {
  name: string;
  description: string;
  background: string;   // Far layer (walls, ceiling, distant features)
  midground: string;    // Main features (furniture, passages)
  foreground: string;   // Close elements (floor, surfaces)
  lighting: string;     // How light behaves
  atmosphere: string;   // Mood and feeling
}
```

### Chain Navigation

Each space has its own promptLayers, enabling infinite navigation depth:

```
Exterior (promptLayers A)
  → GO_INSIDE → Interior (promptLayers B, inherits from A)
    → GO_INSIDE → Inner Room (promptLayers C, inherits from B)
```

### Scene-Expert Skill Integration

Edit prompts follow structured format:
- **Enclosure assertions**: "Solid ceiling above. Fully enclosed interior."
- **Megastructure protection**: "The structure is NOT visible as an object inside"
- **Threshold trap avoidance**: "Entrance is behind the camera"

### Key Files

| File | Purpose |
|------|---------|
| `goInside.ts` | LLM prompt - receives sourcePromptLayers, outputs new promptLayers |
| `goInsideHandler.ts` | Reads from media, stores to media |
| `imageEditPrompt.ts` | Builds scene-expert formatted edit prompts |
