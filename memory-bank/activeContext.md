# Active Context

## 2025-12-30

### Space Type Registry - COMPLETED (Latest)

Implemented a central registry system for handling different container types (buildings, vehicles, boats, tents, etc.) with proper rules and prompts for each.

#### What Was Done

**Problem:** When going inside a car, the LLM generated an interior that looked like a building/room hybrid instead of a car cabin. Same issue would occur with boats, tents, and other non-building spaces.

**Solution:** Created a Space Type Registry that:
1. Defines specialized rules/prompts/constraints for each container type
2. Uses LLM to detect `containerType` during structure analysis
3. Provides type-specific guidance for DNA generation and image constraints

#### New File Structure
```
packages/backend/src/engine/generation/shared/spaceTypeRegistry/
├── types.ts                    # Type definitions (ContainerType, SpaceTypeDefinition)
├── index.ts                    # Registry + helper functions
├── building/
│   ├── interior.ts             # BUILDING_INTERIOR
│   ├── exterior.ts             # BUILDING_EXTERIOR
│   └── openAir.ts              # BUILDING_OPEN_AIR
├── vehicle/
│   ├── carCabin.ts             # VEHICLE_CAR_CABIN
│   ├── boatCabin.ts            # VEHICLE_BOAT_CABIN
│   └── boatDeck.ts             # VEHICLE_BOAT_DECK
├── natural/
│   └── clearing.ts             # NATURAL_CLEARING
└── tentLike/
    └── interior.ts             # TENT_INTERIOR
```

#### Container Types Supported
| Type | Description | Perspectives |
|------|-------------|--------------|
| `building` | Standard architectural structures | interior, exterior, open-air |
| `vehicle-car` | Automotive vehicles (cars, trucks) | interior (cabin) |
| `vehicle-boat` | Watercraft (ships, boats, yachts) | interior (cabin), open-air (deck) |
| `natural` | Natural formations (clearings, groves) | exterior |
| `tent-like` | Temporary fabric structures | interior |

#### How It Works
1. **structureAnalysis.ts** - LLM outputs `containerType` field (e.g., "vehicle-car")
2. **nicheDNA.ts** - Uses registry's DNA guidance based on containerType
3. **imagePromptGeneration.ts** - Adds registry's image constraints (e.g., "[CRITICAL: VEHICLE INTERIOR - This is a CAR/TRUCK cabin, NOT a room]")

#### Key Functions
```typescript
import { 
  getDNAGuidance,       // Get DNA prompt guidance for a container type
  getImageConstraints,  // Get FLUX constraints for a container type
  getStructureGuidance, // Get structure analysis guidance
  SPACE_TYPE_REGISTRY   // Full registry object
} from './spaceTypeRegistry';
```

#### Files Modified
- `navigation/types.ts` - Added `containerType` to StructureAnalysis interface
- `structureAnalysis.ts` - LLM now outputs containerType
- `nicheDNA.ts` - Uses registry DNA guidance
- `imagePromptGeneration.ts` - Uses registry image constraints
- `generation/index.ts` - Exports registry functions

### Previous: Prompt Index Documentation - COMPLETED

Created comprehensive prompt documentation file at `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md`.

### Previous: Structured Image Prompt System - COMPLETED

Implemented layer-based structured image prompts across both spawn and navigation pipelines.

## Current Focus

- ✅ **COMPLETED**: Space Type Registry for vehicle/boat/tent interiors
- ✅ **COMPLETED**: Structured image prompt system (both pipelines)
- ✅ **COMPLETED**: Image prompt DNA & shape improvements
- ✅ **COMPLETED**: GO_INSIDE hierarchy fix for pass-through locations

## Files Modified (Dec 30)

**New Files (Space Type Registry):**
- `packages/backend/src/engine/generation/shared/spaceTypeRegistry/types.ts`
- `packages/backend/src/engine/generation/shared/spaceTypeRegistry/index.ts`
- `packages/backend/src/engine/generation/shared/spaceTypeRegistry/building/*.ts` (3 files)
- `packages/backend/src/engine/generation/shared/spaceTypeRegistry/vehicle/*.ts` (3 files)
- `packages/backend/src/engine/generation/shared/spaceTypeRegistry/natural/clearing.ts`
- `packages/backend/src/engine/generation/shared/spaceTypeRegistry/tentLike/interior.ts`

**Modified Files (Space Type Registry):**
- `packages/backend/src/engine/navigation/types.ts`
- `packages/backend/src/engine/generation/prompts/navigation/structureAnalysis.ts`
- `packages/backend/src/engine/nodeCreation/prompts/dna/nicheDNA.ts`
- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`
- `packages/backend/src/engine/generation/index.ts`
- `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md`
