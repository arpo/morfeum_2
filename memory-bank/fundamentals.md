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

---

## 2. DNA Inheritance (Cascading System)

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

## 7. Image Generation: Deepest Node Only

When creating multiple nodes in a hierarchy:
- Generate image ONLY on the deepest node
- Parent nodes get DNA but no image

```
User: "a pub in Camden in London"
Creates: London (no image) → Camden (no image) → Pub (IMAGE)
```

**Why**: Reduces wait time and API costs while showing the most relevant view.

---

## 8. Two-Step Navigation Architecture

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
