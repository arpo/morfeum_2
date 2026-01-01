# Progress

## 2026-01-01

- [x] **Gemini 2.5 Flash-Lite Caching - COMPLETED + OPTIMIZED (Latest)**: 90% cost + 70% performance improvement
  - **Problem**: Static prompt content sent with every API call + slow hierarchy classification
  - **Solution**: Gemini Explicit Caching + bug fixes + performance optimization
  - **Final Results**:
    - 99.9% tokens cached (5366/5372)
    - 70% faster hierarchy (23.31s → 7.00s)  
    - 42% faster total pipeline (34.33s → 19.89s)
    - 90% cost reduction on cached content
  - **Critical Discovery**: `/NEW_WORLD` uses `parsePromptToHierarchy.ts` (not `hierarchyAnalyzer.ts`)
  - **Bugs Fixed**:
    - MZOO list caches: async iterable iteration (was returning empty)
    - httpClient fallback: `data.data ?? data` pattern
    - Thinking mode: disabled for performance (was adding 1700+ tokens overhead)
  - **Cache Groups**:
    - `morfeum-world-creation` (~6,500 tokens) - includes PARSE_HIERARCHY_STATIC
    - `morfeum-character-creation` (~3,800 tokens)
    - `morfeum-navigation` (~2,800 tokens)
    - `morfeum-chat` (~1,100 tokens)
  - **New Files**:
    - `prompts/cacheContent/index.ts` - Cache bundles
    - `services/mzoo/services/cacheService.ts` - Cache management
    - `services/mzoo/services/cachedTextGeneration.ts` - Cached generation
  - **Modified Files**: 
    - `nodeCreation/detection/parsePromptToHierarchy.ts` (ACTUAL cached file)
    - `prompts/cacheContent/index.ts` (added PARSE_HIERARCHY_STATIC)
    - `httpClient.ts` (fallback fix)
    - MZOO `gemini.ts` (list caches fix)
    - 9 prompt files (static exports)
  - **Configuration**: `MZOO_CACHE_TTL` env variable, thinking mode disabled

## 2025-12-31

- [x] **Gemini 2.5 Flash-Lite Caching - INITIAL**: Initial implementation (had bugs, later fixed)

## 2025-12-30

- [x] **Creature Mode System - COMPLETED**: `--populate` and `--people` flags for image generation
  - **Problem**: Locations always generated with `NoCreatures` filter
  - **Solution**: CreatureMode enum (`none|allow|populate`) with frontend passthrough
  - **Usage**: `/GOTO market --populate` for busy scenes

- [x] **UI: Help Tooltip for Spawn Input - COMPLETED**: (?) button with clickable flags

- [x] **Prompt Token Optimization - COMPLETED**: Optimized 11 prompt files for ~50% token reduction
  - **Results**: 
    - NEW_WORLD: 5,500 → 2,500 tokens (55% reduction)
    - GOTO: 2,000 → 1,000 tokens (50% reduction)  
    - GO_INSIDE: 2,500 → 1,200 tokens (52% reduction)

- [x] **Immediate Surroundings for Nested Interiors - COMPLETED**: Nested interior window views

- [x] **Space Type Registry - COMPLETED**: Centralized registry for container types

- [x] **Prompt Index Documentation - COMPLETED**: `PROMPT_INDEX.md`

- [x] **Structured Image Prompt System - COMPLETED**: Layer-based structured prompts

## 2025-12-29

- [x] **GO_INSIDE Hierarchy Fix - Pass-Through Locations - COMPLETED**

## 2025-12-26

- [x] **Component Refactoring - COMPLETED**
- [x] **Dead Code Cleanup - COMPLETED**

## What Works ✅

### Core Application Features
- Contextual slash commands for navigation and node creation
- **Gemini Explicit Caching** for 90% cost + 70% performance improvement
- **Structured image prompts** with layer-based composition
- **Optimized prompts** (~50% token reduction for location/navigation)
- Entity system for character and location creation
- World tree system with hierarchical location structures
- 3D World View with depth rendering and stereo support
- Navigation system with AI-powered spatial navigation
- **Immediate surroundings** for nested interiors

### Technical Architecture
- Strict component separation (JSX, logic, styles)
- All files under 300-line limit
- Zustand state management with clean slices
- **Gemini caching** via MZOO API with performance optimization
- **Optimized prompts** using pipe-separated values, condensed instructions
- **Direct FLUX constraints** for shapes and exterior views

### Token Cost & Performance Optimization
| Technique | Description | Savings |
|-----------|-------------|---------|
| **Gemini Caching** | Cache static content | **90%** cost + **70%** speed on hierarchy |
| **Thinking Mode Disabled** | Remove reasoning overhead | **70%** faster hierarchy |
| Pipe-separated values | `a\|b\|c` instead of bullets | ~30% tokens |
| Reduced examples | 2 instead of 4 | ~25% tokens |
| Condensed prose | Shorthand instead of verbose | ~20% tokens |
| Shared constants | Extracted common sections | ~15% tokens |

### Cache Group Architecture
| Cache Group | Content | Est. Tokens |
|-------------|---------|-------------|
| `morfeum-world-creation` | Hierarchy, DNA, elements, PARSE_HIERARCHY | ~6,500 |
| `morfeum-character-creation` | Profiles, seeds, vision | ~3,800 |
| `morfeum-navigation` | Structure, intent, destination | ~2,800 |
| `morfeum-chat` | Character impersonation | ~1,100 |

### Performance Metrics (Jan 1, 2026)
| Pipeline | Before | After | Improvement |
|----------|--------|-------|-------------|
| NEW_WORLD Total | 34.33s | **19.89s** | **42% faster** |
| Hierarchy Classification | 23.31s | **7.00s** | **70% faster** |
| Token Usage | 5372 prompt | **5366 cached** | **99.9% cached** |
| Thinking Overhead | 1736 tokens | **0 tokens** | **100% eliminated** |

### Image Generation Architecture
| Command | Pipeline | Image Generation Path |
|---------|----------|----------------------|
| `/NEW_WORLD` | `nodeCreationPipeline.ts` | → `mzoo.generateImage()` |
| `/GOTO`, `/GO_INSIDE` | `createNodePipeline.ts` | → `nodeBuildingStep.ts` |

## What's Left to Build 🚧

### Feature Development
- Character prompt optimization (planned rework)
- Character placement in structured prompts
- Enhanced chat features
- Advanced navigation
- Media management
- User preferences

### Technical Improvements
- Extend caching to more pipelines
- Performance optimization
- Testing
- Documentation
- Accessibility
- Error handling

### Known FLUX 1 Limitations
- Non-rectangular shapes may render as rectangular
- Windows may show generic scenes despite constraints
- Model limitations, not prompt issues

## Current Status 📊

- All files under size limits
- 100% TypeScript coverage, no any types
- All builds passing
- **Gemini caching** for 90% cost + 70% performance improvement
- **Optimized prompts** for location/navigation pipelines
- **Structured image prompts** for both pipelines
- **Immediate surroundings** for nested interiors
- **Performance optimized** (thinking mode disabled for speed)

### Live Performance Metrics
- NEW_WORLD pipeline: **19.89s** (was 34.33s)
- Hierarchy classification: **7.00s** (was 23.31s) 
- Token caching: **99.9%** cached (5366/5372)
- Cost reduction: **90%** on cached content

## Known Issues 🐛

- Legacy components may not follow latest patterns
- Bundle size warning (865KB) - needs code splitting
- **FLUX 1 limitations**: May ignore shape/exterior view constraints

## Development Standards 📋

- File size: 50-300 lines
- Separation: markup (.tsx), logic (.ts), styles (.module.css)
- Zustand slices with clear boundaries
- Centralized icons and design tokens
- TypeScript compilation success
- **Gemini caching** for expensive prompts
- **Optimized prompts** using compact formats
- **Structured prompts** for all image generation
