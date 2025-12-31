# Progress

## 2025-12-31

- [x] **Gemini 2.5 Flash-Lite Caching - COMPLETED (Latest)**: 90% token cost reduction
  - **Problem**: Static prompt content sent with every API call
  - **Solution**: Gemini Explicit Caching with static/dynamic separation
  - **Cache Groups**:
    - `morfeum-world-creation` (~4,500 tokens)
    - `morfeum-character-creation` (~3,800 tokens)
    - `morfeum-navigation` (~2,800 tokens)
    - `morfeum-chat` (~1,100 tokens)
  - **New Files**:
    - `prompts/cacheContent/index.ts` - Cache bundles
    - `services/mzoo/services/cacheService.ts` - Cache management
    - `services/mzoo/services/cachedTextGeneration.ts` - Cached generation
  - **Modified Files**: 
    - 9 prompt files (static exports)
    - `httpClient.ts` (GET, DELETE, PATCH)
    - `mzoo/index.ts` (exports)
    - `hierarchyAnalyzer.ts` (uses caching)
  - **Configuration**: `MZOO_CACHE_TTL` env variable (default: 14400s)

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
- **Gemini Explicit Caching** for 90% token cost reduction
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
- **Gemini caching** via MZOO API
- **Optimized prompts** using pipe-separated values, condensed instructions
- **Direct FLUX constraints** for shapes and exterior views

### Token Cost Reduction Techniques
| Technique | Description | Savings |
|-----------|-------------|---------|
| **Gemini Caching** | Cache static content | **90%** on cached tokens |
| Pipe-separated values | `a\|b\|c` instead of bullets | ~30% |
| Reduced examples | 2 instead of 4 | ~25% |
| Condensed prose | Shorthand instead of verbose | ~20% |
| Shared constants | Extracted common sections | ~15% |

### Cache Group Architecture
| Cache Group | Content | Est. Tokens |
|-------------|---------|-------------|
| `morfeum-world-creation` | Hierarchy, DNA, elements | ~4,500 |
| `morfeum-character-creation` | Profiles, seeds, vision | ~3,800 |
| `morfeum-navigation` | Structure, intent, destination | ~2,800 |
| `morfeum-chat` | Character impersonation | ~1,100 |

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
- **Gemini caching** for 90% token savings
- **Optimized prompts** for location/navigation pipelines
- **Structured image prompts** for both pipelines
- **Immediate surroundings** for nested interiors

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
