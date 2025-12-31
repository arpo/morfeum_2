# Morfeum Implementation: Gemini 2.5 Flash-Lite Caching

Task specification for implementing Explicit Caching in Morfeum backend.

# Gemini Caching Guide for Morfeum Team

## Overview

MZOO now supports Gemini's Explicit Caching feature, which reduces token costs by **90%** for cached content. This is ideal for Morfeum's large static prompts (world-building rules, DNA schemas, character templates).

---

## TypeScript Client Usage

### Types

```typescript
interface CreateCacheRequest {
  displayName: string;
  model?: string;  // Default: 'gemini-2.5-flash-lite'
  systemInstruction?: string;
  staticContent: string;  // Must be ≥2,048 tokens
  ttl?: string;  // Default: '3600s' (1 hour)
}

interface CachedGenerationRequest {
  cacheId: string;
  prompt: string;
  model?: string;
  thinkingConfig?: {
    includeThoughts?: boolean;
    thinkingBudget?: number;  // 512-24,576
  };
}

interface CacheInfo {
  cacheId: string;
  displayName: string;
  tokenCount: number;
  expiresAt: string;
  model: string;
}
```

### API Client Class

```typescript
const MZOO_API_KEY = process.env.MZOO_API_KEY;
const BASE_URL = 'https://www.mzoo.app';

class MZOOGeminiCache {
  private headers = {
    'Authorization': `Bearer ${MZOO_API_KEY}`,
    'Content-Type': 'application/json'
  };

  // Create cache for static prompts
  async createCache(params: CreateCacheRequest): Promise<{
    cacheId: string;
    tokenCount: number;
    expiresAt: string;
  }> {
    const res = await fetch(`${BASE_URL}/api/v1/ai/gemini/cache`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // Generate with cached context + optional thinking
  async generate(params: CachedGenerationRequest): Promise<{
    text: string;
    thoughts?: string;
    usage: { promptTokens: number; cachedTokens: number; completionTokens: number; thinkingTokens?: number };
    cacheHit: boolean;
  }> {
    const res = await fetch(`${BASE_URL}/api/v1/ai/gemini/cached-text`, {
      method: 'POST',
      headers: this.headers,
      body: JSON.stringify(params)
    });
    if (!res.ok) throw new Error(await res.text());
    return res.json();
  }

  // List all caches
  async listCaches(): Promise<{ caches: CacheInfo[] }> {
    const res = await fetch(`${BASE_URL}/api/v1/ai/gemini/caches`, {
      headers: this.headers
    });
    return res.json();
  }

  // Delete cache
  async deleteCache(cacheId: string): Promise<void> {
    await fetch(`${BASE_URL}/api/v1/ai/gemini/cache/${encodeURIComponent(cacheId)}`, {
      method: 'DELETE',
      headers: this.headers
    });
  }

  // Refresh TTL
  async refreshCache(cacheId: string, ttl: string): Promise<CacheInfo> {
    const res = await fetch(`${BASE_URL}/api/v1/ai/gemini/cache/${encodeURIComponent(cacheId)}`, {
      method: 'PATCH',
      headers: this.headers,
      body: JSON.stringify({ ttl })
    });
    return res.json();
  }
}
```

---

## Morfeum Cache Groups (Recommended)

```typescript
const morfeum = new MZOOGeminiCache();

// 1. World Creation Cache (~4,500 tokens)
const worldCache = await morfeum.createCache({
  displayName: 'morfeum-world-creation',
  systemInstruction: 'You are a world-building AI architect for Morfeum.',
  staticContent: `
    [HIERARCHY RULES]
    Spatial hierarchy analyzer. Organize input into: Host → Region → Location → Niche.
    
    [DNA SCHEMA]
    looks: 2-4 sentences describing forms, layout, scale, features
    colorsAndLighting: 1-3 sentences about colors, light sources, shadows
    atmosphere: 2-4 sentences about air, temperature, motion, weather
    materials: 1-3 sentences about materials, textures, condition
    mood: 1-2 sentences about emotional tone
    
    [ELEMENT RULES]
    ...
  `,
  ttl: '86400s'  // 24 hours for production
});

// 2. Character Cache (~3,800 tokens)
const characterCache = await morfeum.createCache({
  displayName: 'morfeum-character',
  staticContent: CHARACTER_TEMPLATE_CONTENT,
  ttl: '86400s'
});

// 3. Navigation Cache (~2,800 tokens)
const navigationCache = await morfeum.createCache({
  displayName: 'morfeum-navigation',
  staticContent: NAVIGATION_RULES_CONTENT,
  ttl: '86400s'
});
```

---

## Using Caches with Thinking Mode

```typescript
// Generate with thinking mode for complex reasoning
const result = await morfeum.generate({
  cacheId: worldCache.cacheId,
  prompt: 'Create a hierarchy for: A steampunk factory in Victorian London',
  thinkingConfig: {
    includeThoughts: true,
    thinkingBudget: 2048
  }
});

console.log('Reasoning:', result.thoughts);
console.log('Answer:', result.text);
console.log('Cached tokens used:', result.usage.cachedTokens);
console.log('Cost savings:', result.cacheHit ? '90%' : '0%');
```

---

## Required API Key Scopes

Your MZOO API key needs these scopes:
- `ai:gemini:cache:write` - Create, delete, refresh caches
- `ai:gemini:cache:read` - List caches
- `ai:gemini:cache:use` - Generate with cached content

---

## Error Handling

```typescript
try {
  const result = await morfeum.generate({ cacheId, prompt });
} catch (error) {
  if (error.message.includes('CACHE_NOT_FOUND')) {
    // Cache expired or deleted - recreate it
    const newCache = await morfeum.createCache(originalParams);
    // Retry with new cache
  } else if (error.message.includes('CACHE_TOO_SMALL')) {
    // Content < 2,048 tokens - add more static content
  }
}
```

---

## Recommended TTLs

| Environment | TTL | Reason |
|-------------|-----|--------|
| Production | `86400s` (24h) | Stable prompts |
| Development | `3600s` (1h) | Frequent iteration |
| High-traffic | `14400s` (4h) | Balance cost/freshness |

---

## Cost Impact

For Morfeum with ~4,500 cached tokens per request:
- **Without caching**: 4,500 tokens × $X/million
- **With caching**: 4,500 tokens × $X/million × 0.1 = **90% savings**



---

## Prerequisites

Before implementing this, MZOO must have the following endpoints available (see `docs/caching-mzoo-api-spec.md`):
- `POST /api/v1/ai/gemini/cache` - Create cache
- `POST /api/v1/ai/gemini/cached-text` - Generate with cache
- `GET /api/v1/ai/gemini/caches` - List caches
- `DELETE /api/v1/ai/gemini/cache/{cacheId}` - Delete cache

---

## Implementation Tasks

### Phase 1: Create Static Content Exports

Restructure each prompt file to export static content separately from dynamic functions.

#### 1.1 hierarchyCategorization.ts

**Current:**
```typescript
export function hierarchyCategorization(userPrompt: string): string {
  return `Spatial hierarchy analyzer... [RULES]... ## INPUT\n${userPrompt}`;
}
```

**New:**
```typescript
// Static content for caching (~1,800 tokens)
export const HIERARCHY_CATEGORIZATION_STATIC = `Spatial hierarchy analyzer. Organize input into: Host → Region → Location → Niche.

## RULES

1. MINIMAL: Create ONLY explicitly mentioned layers.
   - Simple phrase → Host only
   - "Camden in London" → Host + Region
   - "Pub in Camden in London" → Host + Region + Location

2. PATTERN: "[thing] [prep] [WORD] in [WORD]" → Middle=Region, Last=Host
   - Preps: in|on|at|by|near|within|beside|around
   - Region name MUST differ from Host name

3. STRUCTURE KEYWORDS = LOCATION (not Host):
   Buildings: greenhouse|tower|shop|bar|pub|club|restaurant|cafe|temple|church|cathedral|observatory|lighthouse|warehouse|factory|station|library|museum|theater|arena
   Fantasy: castle|fortress|dungeon|crypt|vault|sanctum|inn|tavern|citadel|monastery
   Sci-Fi: spaceship|starship|vessel|cruiser|shuttle|pod|module|outpost|colony|habitat
   Transport: ship|boat|yacht|submarine|train|airship
   Natural: cave|cavern|grotto|waterfall|grove|clearing|canyon|valley|peak

4. AUTO-NICHE for interior descriptions:
   - "[structure] with [things]" → things are INSIDE → create niche
   - "cave with stairs and machine" → Location: cave exterior, Niche: interior with elements
   - "lighthouse" (no contents) → Location only, NO niche
   
   SPATIAL GROUPING:
   - Same space (connected by "and", directional words) → ONE niche
   - Separate spaces ("next to it", "adjacent", "another room") → MULTIPLE niches

## LAYER FIELDS
[... rest of static content ...]

## EXAMPLES
[... examples ...]`;

// Dynamic function for user input
export function hierarchyCategorizationDynamic(userPrompt: string): string {
  return `## INPUT\n\n${userPrompt}`;
}

// Legacy function (combines both for non-cached usage)
export function hierarchyCategorization(userPrompt: string): string {
  return `${HIERARCHY_CATEGORIZATION_STATIC}\n\n${hierarchyCategorizationDynamic(userPrompt)}`;
}
```

#### 1.2 characterDeepProfile.ts

**New:**
```typescript
// Static content for caching (~2,500 tokens)
export const CHARACTER_DEEP_PROFILE_STATIC = `You are generating a complete, nuanced character profile for Morfeum — a world where realism and imagination coexist.

IMPORTANT: Return ONLY a valid JSON object with these exact fields:
{
  "name": "...",
  "looks": "...",
  "wearing": "...",
  "face": "...",
  "body": "...",
  "hair": "...",
  "specificDetails": "...",
  "style": "...",
  "personality": "...",
  "voice": "...",
  "speechStyle": "...",
  "gender": "...",
  "nationality": "...",
  "fictional": "true or false",
  "copyright": "true or false",
  "tags": "..."
}

[... all field definitions ...]
[... guidelines and rules ...]`;

// Dynamic function
export function characterDeepProfileDynamic(
  seedJson: string, 
  visionJson: string, 
  originalPrompt: string
): string {
  return `Original user request:
${originalPrompt}

Combine the following data:
Seed data:
${seedJson}
Visual analysis:
${visionJson}`;
}
```

#### 1.3 Files to Restructure

| File | Static Export Name | Estimated Tokens |
|------|-------------------|------------------|
| `locations/hierarchyCategorization.ts` | `HIERARCHY_CATEGORIZATION_STATIC` | ~1,800 |
| `characters/characterDeepProfile.ts` | `CHARACTER_DEEP_PROFILE_STATIC` | ~2,500 |
| `characters/characterSeed.ts` | `CHARACTER_SEED_STATIC` | ~800 |
| `navigation/structureAnalysis.ts` | `STRUCTURE_ANALYSIS_STATIC` | ~1,200 |
| `navigation/intentClassifier.ts` | `INTENT_CLASSIFIER_STATIC` | ~400 |
| `navigation/destinationAnalysis.ts` | `DESTINATION_ANALYSIS_STATIC` | ~600 |
| `locations/deepestNodeDNA.ts` | `DEEPEST_NODE_DNA_STATIC` | ~700 |
| `chat/chatCharacterImpersonation.ts` | `CHAT_IMPERSONATION_STATIC` | ~1,100 |
| `shared/visionDescription.ts` | `VISION_DESCRIPTION_STATIC` | ~400 |
| `shared/dnaSchema.ts` | Already static exports | ~600 |
| `shared/elementRules.ts` | Already static exports | ~800 |
| `locations/worldTree/compositionInstructions.ts` | Already static exports | ~1,300 |

---

### Phase 2: Create Cache Content Bundles

Create a new file that bundles static content into cache groups.

**File:** `packages/backend/src/engine/generation/prompts/cacheContent/index.ts`

```typescript
/**
 * Cache Content Bundles
 * Bundles static prompt content for Gemini Explicit Caching
 * Each bundle must be ≥2,048 tokens
 */

import { HIERARCHY_CATEGORIZATION_STATIC } from '../locations/hierarchyCategorization';
import { DNA_SCENE_FIELDS, DNA_CASCADING_FIELDS, DNA_GUIDELINES } from '../shared/dnaSchema';
import { DOMINANT_ELEMENTS_RULES, NAVIGABLE_ELEMENTS_RULES } from '../shared/elementRules';
import { 
  HOST_COMPOSITION_INSTRUCTIONS, 
  REGION_COMPOSITION_INSTRUCTIONS, 
  EXTERIOR_COMPOSITION_INSTRUCTIONS 
} from '../locations/worldTree/compositionInstructions';

import { CHARACTER_DEEP_PROFILE_STATIC } from '../characters/characterDeepProfile';
import { CHARACTER_SEED_STATIC } from '../characters/characterSeed';
import { VISION_DESCRIPTION_STATIC } from '../shared/visionDescription';

import { STRUCTURE_ANALYSIS_STATIC } from '../navigation/structureAnalysis';
import { INTENT_CLASSIFIER_STATIC } from '../navigation/intentClassifier';
import { DESTINATION_ANALYSIS_STATIC } from '../navigation/destinationAnalysis';
import { getContainerTypeDescriptions } from '../../shared/spaceTypeRegistry';

/**
 * Cache Group 1: World Creation (~4,500 tokens)
 */
export const CACHE_WORLD_CREATION = `
=== MORFEUM WORLD CREATION SYSTEM ===

${HIERARCHY_CATEGORIZATION_STATIC}

=== DNA SCHEMA ===

Scene Fields:
${Object.entries(DNA_SCENE_FIELDS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Cascading Fields:
${Object.entries(DNA_CASCADING_FIELDS).map(([k, v]) => `- ${k}: ${v}`).join('\n')}

Guidelines:
${Object.values(DNA_GUIDELINES).join('\n')}

=== ELEMENT RULES ===

${DOMINANT_ELEMENTS_RULES}

${NAVIGABLE_ELEMENTS_RULES}

=== COMPOSITION INSTRUCTIONS ===

HOST (World Level):
${HOST_COMPOSITION_INSTRUCTIONS}

REGION (District Level):
${REGION_COMPOSITION_INSTRUCTIONS}

LOCATION/NICHE (Building Level):
${EXTERIOR_COMPOSITION_INSTRUCTIONS}
`;

/**
 * Cache Group 2: Character Creation (~3,800 tokens)
 */
export const CACHE_CHARACTER_CREATION = `
=== MORFEUM CHARACTER SYSTEM ===

${CHARACTER_DEEP_PROFILE_STATIC}

=== CHARACTER SEED GENERATION ===

${CHARACTER_SEED_STATIC}

=== IMAGE ANALYSIS ===

${VISION_DESCRIPTION_STATIC}
`;

/**
 * Cache Group 3: Navigation (~2,800 tokens)
 */
export const CACHE_NAVIGATION = `
=== MORFEUM NAVIGATION SYSTEM ===

${STRUCTURE_ANALYSIS_STATIC}

=== INTENT CLASSIFICATION ===

${INTENT_CLASSIFIER_STATIC}

=== DESTINATION ANALYSIS ===

${DESTINATION_ANALYSIS_STATIC}

=== CONTAINER TYPES ===

${getContainerTypeDescriptions()}
`;

/**
 * Cache group identifiers
 */
export type CacheGroupId = 
  | 'morfeum-world-creation'
  | 'morfeum-character-creation'
  | 'morfeum-navigation';

export const CACHE_GROUPS: Record<CacheGroupId, string> = {
  'morfeum-world-creation': CACHE_WORLD_CREATION,
  'morfeum-character-creation': CACHE_CHARACTER_CREATION,
  'morfeum-navigation': CACHE_NAVIGATION
};
```

---

### Phase 3: Create Cache Service

**File:** `packages/backend/src/services/mzoo/services/cacheService.ts`

```typescript
/**
 * MZOO Cache Service
 * Manages Gemini Explicit Caching
 */

import { mzooPost, mzooGet, mzooDelete, mzooPatch } from '../client/httpClient';
import { CACHE_GROUPS, type CacheGroupId } from '../../../engine/generation/prompts/cacheContent';

const CACHE_ENDPOINT = 'https://www.mzoo.app/api/v1/ai/gemini';

// In-memory cache ID storage (consider Redis for production)
const cacheIdStore: Map<CacheGroupId, { cacheId: string; expiresAt: Date }> = new Map();

interface CacheInfo {
  cacheId: string;
  displayName: string;
  tokenCount: number;
  expiresAt: string;
}

/**
 * Ensure a cache exists for the given group, creating if needed
 */
export async function ensureCache(
  apiKey: string,
  groupId: CacheGroupId
): Promise<string> {
  // Check in-memory store first
  const cached = cacheIdStore.get(groupId);
  if (cached && cached.expiresAt > new Date()) {
    return cached.cacheId;
  }

  // Check if cache exists on server
  const existing = await findCacheByDisplayName(apiKey, groupId);
  if (existing) {
    cacheIdStore.set(groupId, {
      cacheId: existing.cacheId,
      expiresAt: new Date(existing.expiresAt)
    });
    return existing.cacheId;
  }

  // Create new cache
  const content = CACHE_GROUPS[groupId];
  const response = await mzooPost<any, any>(
    `${CACHE_ENDPOINT}/cache`,
    apiKey,
    {
      displayName: groupId,
      model: 'gemini-2.5-flash-lite',
      staticContent: content,
      ttl: '14400s'  // 4 hours
    }
  );

  if (response.data?.cacheId) {
    cacheIdStore.set(groupId, {
      cacheId: response.data.cacheId,
      expiresAt: new Date(response.data.expiresAt)
    });
    return response.data.cacheId;
  }

  throw new Error(`Failed to create cache for ${groupId}`);
}

/**
 * Find cache by display name
 */
async function findCacheByDisplayName(
  apiKey: string,
  displayName: string
): Promise<CacheInfo | null> {
  try {
    const response = await mzooGet<{ caches: CacheInfo[] }>(
      `${CACHE_ENDPOINT}/caches`,
      apiKey
    );
    return response.data?.caches.find(c => c.displayName === displayName) || null;
  } catch {
    return null;
  }
}

/**
 * Invalidate cache (call when prompts are updated)
 */
export async function invalidateCache(
  apiKey: string,
  groupId: CacheGroupId
): Promise<void> {
  const cached = cacheIdStore.get(groupId);
  if (cached) {
    await mzooDelete(`${CACHE_ENDPOINT}/cache/${encodeURIComponent(cached.cacheId)}`, apiKey);
    cacheIdStore.delete(groupId);
  }
}

/**
 * Invalidate all caches
 */
export async function invalidateAllCaches(apiKey: string): Promise<void> {
  for (const groupId of Object.keys(CACHE_GROUPS) as CacheGroupId[]) {
    await invalidateCache(apiKey, groupId);
  }
}
```

---

### Phase 4: Create Cached Text Generation Service

**File:** `packages/backend/src/services/mzoo/services/cachedTextGeneration.ts`

```typescript
/**
 * MZOO Cached Text Generation Service
 */

import { mzooPost } from '../client/httpClient';
import { ensureCache, type CacheGroupId } from './cacheService';

const CACHE_ENDPOINT = 'https://www.mzoo.app/api/v1/ai/gemini';

export interface ThinkingConfig {
  includeThoughts?: boolean;
  thinkingBudget?: number;  // 0 = off, 512-24576 = on
}

export interface CachedTextResponse {
  text: string;
  thoughts?: string;
  usage: {
    promptTokens: number;
    cachedTokens: number;
    completionTokens: number;
    thinkingTokens?: number;
  };
  cacheHit: boolean;
}

/**
 * Generate text using cached context
 */
export async function generateCachedText(
  apiKey: string,
  cacheGroup: CacheGroupId,
  dynamicPrompt: string,
  thinkingConfig?: ThinkingConfig
): Promise<CachedTextResponse> {
  // Ensure cache exists
  const cacheId = await ensureCache(apiKey, cacheGroup);

  // Make cached generation request
  const response = await mzooPost<any, CachedTextResponse>(
    `${CACHE_ENDPOINT}/cached-text`,
    apiKey,
    {
      cacheId,
      prompt: dynamicPrompt,
      model: 'gemini-2.5-flash-lite',
      thinkingConfig: thinkingConfig || { includeThoughts: false, thinkingBudget: 0 }
    }
  );

  if (!response.data) {
    throw new Error('Failed to generate cached text');
  }

  return response.data;
}

/**
 * Generate text with thinking enabled
 */
export async function generateCachedTextWithThinking(
  apiKey: string,
  cacheGroup: CacheGroupId,
  dynamicPrompt: string,
  thinkingBudget: number = 2048
): Promise<CachedTextResponse> {
  return generateCachedText(apiKey, cacheGroup, dynamicPrompt, {
    includeThoughts: true,
    thinkingBudget
  });
}
```

---

### Phase 5: Update Pipeline Functions

Update pipelines to use cached generation.

**Example: hierarchyAnalyzer.ts**

```typescript
import { generateCachedText } from '../../services/mzoo/services/cachedTextGeneration';
import { hierarchyCategorizationDynamic } from '../generation/prompts/locations/hierarchyCategorization';

export async function analyzeHierarchy(
  apiKey: string,
  userPrompt: string
): Promise<HierarchyResult> {
  // Build dynamic portion only
  const dynamicPrompt = hierarchyCategorizationDynamic(userPrompt);

  // Use cached generation
  const response = await generateCachedText(
    apiKey,
    'morfeum-world-creation',
    dynamicPrompt
  );

  return JSON.parse(response.text);
}
```

---

### Phase 6: Add Exports to Service Index

**File:** `packages/backend/src/services/mzoo/index.ts`

```typescript
// Add new exports
export { generateCachedText, generateCachedTextWithThinking } from './services/cachedTextGeneration';
export { ensureCache, invalidateCache, invalidateAllCaches } from './services/cacheService';
export type { CacheGroupId } from '../../../engine/generation/prompts/cacheContent';
```

---

## Testing Checklist

- [ ] Create cache for `morfeum-world-creation` group
- [ ] Verify cache ID is returned
- [ ] Generate text using cached context
- [ ] Verify `cacheHit: true` in response
- [ ] Test cache expiry handling
- [ ] Test cache invalidation
- [ ] Verify thinking mode works with cached content
- [ ] Compare token usage (cached vs non-cached)

---

## Thinking Mode Configuration

### When to Enable Thinking

| Pipeline | Enable Thinking? | Budget | Reason |
|----------|-----------------|--------|--------|
| Hierarchy Categorization | ✅ Yes | 2048 | Complex parsing |
| Character Deep Profile | ✅ Yes | 4096 | Rich generation |
| Character Seed | ❌ No | 0 | Simple extraction |
| Structure Analysis | ✅ Yes | 2048 | Spatial reasoning |
| Intent Classification | ❌ No | 0 | Quick classification |
| Destination Analysis | ❌ No | 0 | Simple synthesis |
| DNA Generation | ✅ Yes | 2048 | Creative generation |

### Thinking Budget Guidelines

| Budget | Use Case |
|--------|----------|
| 0 | Simple/fast tasks |
| 512-1024 | Basic reasoning |
| 2048 | Standard complex tasks |
| 4096 | Deep creative tasks |
| 8192+ | Very complex multi-step |

---

## File Changes Summary

### New Files
- `packages/backend/src/engine/generation/prompts/cacheContent/index.ts`
- `packages/backend/src/services/mzoo/services/cacheService.ts`
- `packages/backend/src/services/mzoo/services/cachedTextGeneration.ts`

### Modified Files
- `packages/backend/src/engine/generation/prompts/locations/hierarchyCategorization.ts`
- `packages/backend/src/engine/generation/prompts/characters/characterDeepProfile.ts`
- `packages/backend/src/engine/generation/prompts/characters/characterSeed.ts`
- `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts`
- `packages/backend/src/engine/generation/prompts/navigation/intentClassifier.ts`
- `packages/backend/src/engine/generation/prompts/navigation/destinationAnalysis.ts`
- `packages/backend/src/engine/generation/prompts/locations/deepestNodeDNA.ts`
- `packages/backend/src/engine/generation/prompts/chat/chatCharacterImpersonation.ts`
- `packages/backend/src/services/mzoo/index.ts`

### Pipeline Updates
- `packages/backend/src/engine/hierarchyAnalysis/hierarchyAnalyzer.ts`
- `packages/backend/src/engine/pipelines/characterPipeline.ts`
- `packages/backend/src/engine/navigation/pipelines/*`

---

## Notes

1. **Backward Compatibility**: Keep legacy functions that combine static+dynamic for non-cached fallback
2. **Cache Versioning**: Consider adding version to displayName (e.g., `morfeum-world-creation-v1`) when prompts change
3. **Monitoring**: Log cache hit/miss ratio to measure effectiveness
4. **Error Handling**: Fall back to non-cached generation if cache fails
