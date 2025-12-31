# Active Context

## 2025-12-31

### Gemini 2.5 Flash-Lite Caching Implementation - COMPLETED (Latest)

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
- `packages/backend/src/services/mzoo/client/httpClient.ts` - Added GET, DELETE, PATCH methods
- `packages/backend/src/services/mzoo/index.ts` - Added cache service exports
- `packages/backend/src/engine/hierarchyAnalysis/hierarchyAnalyzer.ts` - Uses cached generation
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

## Files Modified (Dec 31 - Caching)

**New Files:**
- `prompts/cacheContent/index.ts`
- `services/mzoo/services/cacheService.ts`
- `services/mzoo/services/cachedTextGeneration.ts`

**Modified Files:**
- `services/mzoo/client/httpClient.ts`
- `services/mzoo/index.ts`
- `hierarchyAnalysis/hierarchyAnalyzer.ts`
- 9 prompt files (static exports added)
