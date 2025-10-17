# Engine - Refactored World Generation System

This directory contains the refactored world generation and navigation system for Morfeum.

## Status: Phase 0 & 1 Complete ✅

### Completed

**Phase 0: Foundation**
- ✅ Folder structure created
- ✅ Reassembly plan documented
- ✅ Old code marked as deprecated
- ✅ UI disconnected from backend (logs only)

**Phase 1: Utilities & Prompts**
- ✅ JSON parser (`utils/parseJSON.ts`)
- ✅ Type definitions (`types/index.ts`)
- ✅ Tagged template system (`prompts/templateBuilder.ts`)

### Next Steps

**Phase 2: Seed Generation** (Ready to start)
- Convert location seed prompt to tagged template
- Create seed generator
- Test with 10+ prompts
- Measure token count and timing
- Compare with old system

See `REASSEMBLY_PLAN.md` for full roadmap.

## Directory Structure

```
engine/
├── README.md                    # This file
├── REASSEMBLY_PLAN.md          # Complete refactoring plan
├── generation/                  # Pipeline stages (Phase 2+)
├── navigation/                  # NavigatorAI (Phase 7)
├── templates/                   # Template system
│   └── templateBuilder.ts      # Template builder ✅
├── types/                       # Type definitions
│   └── index.ts                # Core types ✅
└── utils/                       # Utilities
    └── parseJSON.ts            # JSON parser ✅
```

## Design Decisions

1. **Tagged Templates** - Type-safe prompts with variable interpolation
2. **No Unit Tests** - Manual testing as we go
3. **Keep locationsSlice** - Don't rebuild working storage
4. **Keep SSE** - Don't break event system
5. **Focus on Optimization** - Main goal is trimming prompts

## How to Use

Currently, the UI is disconnected. You'll see console logs when:
- Clicking "Generate" in spawn input: `[UI DISCONNECTED] Would call startSpawn...`
- Using navigation: `[UI DISCONNECTED] Would call NavigatorAI...`

As phases complete, functionality will be reconnected incrementally.

## Testing Strategy

Each phase:
1. Build the feature
2. Test manually with console logs
3. Measure tokens and timing
4. Compare with old system
5. Iterate on prompt optimization

No automated tests during development - focus on rapid iteration and optimization.
