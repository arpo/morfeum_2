# Active Context

## 2026-01-01

### Gemini 2.5 Flash-Lite Caching Implementation - COMPLETED + OPTIMIZED (Latest)

Full implementation and optimization of Gemini Explicit Caching for 90% token cost reduction + 70% performance improvement.

#### Final Results
- **99.9% tokens cached** (5366/5372 tokens)
- **70% faster hierarchy** (23.31s → 7.00s)
- **42% faster total pipeline** (34.33s → 19.89s)
- **90% cost reduction** on cached content

#### Critical Discovery
The actual file used by `/NEW_WORLD` was `parsePromptToHierarchy.ts` (not `hierarchyAnalyzer.ts`). This contained a massive ~10,000 character inline prompt that needed caching.

#### Issues Found & Fixed
1. **MZOO LIST Bug**: Google SDK returns async iterable, not array. Fixed in `gemini.ts`:
   ```typescript
   // Before: response.cachedContents || [] (always empty)
   // After: for await (const cache of response) iteration
   ```

2. **HttpClient Bug**: Missing fallback pattern in `mzooPost()`:
   ```typescript
   // Before: data: data.data (undefined if no wrapper)
   // After: data: data.data ?? data (fallback to full response)
   ```

3. **Thinking Mode Overhead**: Disabled thinking mode for 70% performance improvement:
   ```typescript
   // Before: generateCachedTextWithThinking(apiKey, 'morfeum-world-creation', prompt, 2048)
   // After: generateCachedText(apiKey, 'morfeum-world-creation', prompt)
   ```

#### Performance Comparison

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Hierarchy Classification | 23.31s | **7.00s** | **70% faster** |
| Total Pipeline | 34.33s | **19.89s** | **42% faster** |
| Token Usage | 5372 prompt | **5366 cached** | **99.9% cached** |
| Thinking Tokens | 1736 | **0** | **100% eliminated** |

## 2025-12-31

### Gemini 2.5 Flash-Lite Caching Implementation - INITIAL (Completed but had bugs)

Implemented Gemini Explicit Caching for 90% token cost reduction on static prompt content.

#### Problem
Static prompt content (rules, schemas, templates) was being sent with every API call, consuming tokens unnecessarily.

#### Solution
1. **Static/Dynamic Prompt Separation**: Refactored 9 prompt files to export static content separately from dynamic functions
2. **Cache Content Bundles**: Created 4 cache groups bundling related static content:
   - `morfeum-world-creation` (~4,500 tokens) - hierarchy, DNA, elements
   - `morfeum-character-creation` (~3,800 tokens) - profiles, seeds, vision
   - `morfeum-navigation` (~2,800 tokens) - structure, intent, destination
   - `morfeum-chat` (~1,100 tokens) - character impersonation
3. **Cache Service**: Manages cache lifecycle with automatic creation, expiry tracking, fallback
4. **Cached Text Generation**: New API with thinking mode support and automatic fallback

#### Files Created
- `packages/backend/src/engine/generation/prompts/cacheContent/index.ts` - Cache bundles
- `packages/backend/src/services/mzoo/services/cacheService.ts` - Cache management
- `packages/backend/src/services/mzoo/services/cachedTextGeneration.ts` - Cached generation

#### Files Modified
- `packages/backend/src/services/mzoo/client/httpClient.ts` - Fixed fallback pattern (`data.data ?? data`)
- `packages/backend/src/services/mzoo/index.ts` - Added cache service exports
- `packages/backend/src/engine/nodeCreation/detection/parsePromptToHierarchy.ts` - **ACTUAL file used by /NEW_WORLD** - Uses cached generation without thinking mode
- `packages/backend/src/engine/generation/prompts/cacheContent/index.ts` - Added `PARSE_HIERARCHY_STATIC` to world-creation cache
- MZOO `gemini.ts` - Fixed list caches to iterate async iterable
- Prompt files (9 total) - Added static exports:
  - `locations/hierarchyCategorization.ts`
  - `characters/characterDeepProfile.ts`
  - `characters/characterSeed.ts`
  - `navigation/structureAnalysis.ts`
  - `navigation/intentClassifier.ts`
  - `navigation/destinationAnalysis.ts`
  - `locations/deepestNodeDNA.ts`
  - `chat/chatCharacterImpersonation.ts`
  - `shared/visionDescription.ts`

#### Usage
```typescript
import { generateCachedText, generateCachedTextWithThinking } from '../services/mzoo';

// Basic cached generation
const result = await generateCachedText(apiKey, 'morfeum-world-creation', dynamicPrompt);

// With thinking mode
const result = await generateCachedTextWithThinking(apiKey, 'morfeum-character-creation', dynamicPrompt, 2048);
```

#### Configuration
- TTL configurable via `MZOO_CACHE_TTL` env variable (default: 14400s = 4 hours)
- Automatic fallback to non-cached generation on errors
- In-memory cache store for performance (persists within server session)
- Thinking mode disabled for optimal performance

#### Cache Groups Updated
- `morfeum-world-creation` expanded to ~6,500 tokens (includes `PARSE_HIERARCHY_STATIC`)
- Other cache groups remain as designed

## 2025-12-30

### Creature Mode System - COMPLETED

Implemented `--populate` and `--people` flags for image generation to control whether locations show people/creatures.

### Prompt Token Optimization - COMPLETED

Optimized 11 prompt files for ~50% token reduction on location/navigation pipelines.

### Previous Work
- Immediate surroundings for nested interiors
- Space Type Registry
- Structured image prompt system

## Current Focus

- ✅ **COMPLETED**: Gemini Explicit Caching (90% token cost reduction)
- ✅ **COMPLETED**: Prompt token optimization (50% reduction)
- ✅ **COMPLETED**: Immediate surroundings for nested interiors
- ✅ **COMPLETED**: Space Type Registry for vehicle/boat/tent interiors

## Files Modified (Jan 1 - Caching + Optimization)

**New Files:**
- `prompts/cacheContent/index.ts`
- `services/mzoo/services/cacheService.ts`
- `services/mzoo/services/cachedTextGeneration.ts`

**Modified Files:**
- `services/mzoo/client/httpClient.ts` (fallback fix)
- `services/mzoo/index.ts`
- `nodeCreation/detection/parsePromptToHierarchy.ts` (ACTUAL cached file)
- `prompts/cacheContent/index.ts` (added PARSE_HIERARCHY_STATIC)
- MZOO `gemini.ts` (list caches async iterable fix)
- 9 prompt files (static exports added)

**Performance Impact:**
- NEW_WORLD: 34.33s → 19.89s (42% faster)
- Hierarchy: 23.31s → 7.00s (70% faster)  
- Token savings: 99.9% cached (5366/5372)
