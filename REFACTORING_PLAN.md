# Spawn Pipeline Refactoring Plan

## Current Status: Quick Fix Applied ✅

### What Was Fixed
**File Modified:** `packages/frontend/src/hooks/useSpawnEvents.ts`

**Issue:** The `splitWorldAndLocation()` function was being called for all entity types (characters and locations), but it should only run for locations since characters don't have the world DNA / location instance concept.

**Solution:** Added conditional check to only split location profiles:
```typescript
// Listen for profile complete event
eventSource.addEventListener('spawn:profile-complete', (e) => {
  const { spawnId, deepProfile, enhancedSystemPrompt, entityType } = JSON.parse(e.data);
  
  // Split deep profile into world and location parts (locations only)
  if (entityType === 'location') {
    const { world, location } = splitWorldAndLocation(deepProfile);
    console.log('🌍 World DNA:', world);
    console.log('📍 Location Instance:', location);
  }
  
  console.log('💬 Enhanced System Prompt Updated');
  // ... rest of the handler
});
```

**Benefits:**
- ✅ Semantic correctness: Characters no longer incorrectly split
- ✅ Cleaner console logs: No misleading world DNA output for characters
- ✅ Foundation for travel/sub-location features

---

## Future Refactoring: Scalable Pipeline Architecture

### The Challenge
You plan to add many more entity types:
- ✅ Character (exists)
- ✅ Location (exists)
- 🔮 Sub-location (planned)
- 🔮 Props
- 🔮 Houses
- 🔮 Dresses
- 🔮 Vehicles
- 🔮 NPCs
- 🔮 And more...

### Current Architecture Issues
The current unified pipeline in `SpawnManager.ts` uses conditionals:
```typescript
if (entityType === 'character') {
  // character-specific logic
} else if (entityType === 'location') {
  // location-specific logic
}
```

**This doesn't scale** - with 10+ entity types, the file becomes unmaintainable.

---

## Recommended Architecture: Separate Pipeline Managers

### Proposed Structure
```
packages/backend/src/services/spawn/
├── SpawnManager.ts                    # Factory/Router (orchestrates)
├── managers/
│   ├── BasePipelineManager.ts        # Shared base class
│   ├── CharacterSpawnManager.ts      # Character pipeline
│   ├── LocationSpawnManager.ts       # Location pipeline
│   ├── SubLocationSpawnManager.ts    # Future: Sub-locations
│   ├── PropSpawnManager.ts           # Future: Props
│   ├── HouseSpawnManager.ts          # Future: Houses
│   └── DressSpawnManager.ts          # Future: Dresses
├── shared/
│   ├── pipelineCommon.ts             # Shared utilities
│   └── types.ts                      # Common types
└── pipelineStages.ts                 # Legacy (to be refactored)
```

### Benefits
1. **Isolation:** Each entity type has its own manager
2. **Scalability:** Add new entity types without touching existing code
3. **Customization:** Each pipeline can have different stages
4. **Maintainability:** Bugs in one entity type don't affect others
5. **Testability:** Test each manager independently

### Example: Base Pipeline Manager
```typescript
// managers/BasePipelineManager.ts
export abstract class BasePipelineManager {
  constructor(protected mzooApiKey: string) {}
  
  // Abstract methods that each entity type must implement
  abstract generateSeed(prompt: string, signal: AbortSignal): Promise<any>;
  abstract generateImage(seed: any, signal: AbortSignal): Promise<ImageResult>;
  abstract analyzeImage(imageUrl: string, seed: any, signal: AbortSignal): Promise<any>;
  abstract enrichProfile(seed: any, analysis: any, signal: AbortSignal): Promise<any>;
  
  // Shared utilities
  protected async fetchImage(url: string): Promise<Buffer> {
    const response = await fetch(url);
    return Buffer.from(await response.arrayBuffer());
  }
  
  protected parseJSON(text: string): any {
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON found in response');
    return JSON.parse(jsonMatch[0]);
  }
}
```

### Example: Location-Specific Manager
```typescript
// managers/LocationSpawnManager.ts
export class LocationSpawnManager extends BasePipelineManager {
  async enrichProfile(seed: any, analysis: any, signal: AbortSignal) {
    const profile = await super.enrichProfile(seed, analysis, signal);
    
    // Location-specific: Split world DNA from location instance
    const { world, location } = splitWorldAndLocation(profile);
    
    // Store world DNA for future travel/sub-location generation
    await this.storeWorldDNA(seed.id, world);
    
    return { ...profile, worldDNA: world, locationInstance: location };
  }
  
  private async storeWorldDNA(locationId: string, worldDNA: any) {
    // Store in database for later use in travel system
  }
}
```

### Example: Factory Pattern
```typescript
// SpawnManager.ts (refactored)
export class SpawnManager {
  private managers: Map<string, BasePipelineManager>;
  
  constructor(mzooApiKey: string) {
    this.managers = new Map([
      ['character', new CharacterSpawnManager(mzooApiKey)],
      ['location', new LocationSpawnManager(mzooApiKey)],
      // Future managers automatically added here
    ]);
  }
  
  startSpawn(prompt: string, entityType: string): string {
    const manager = this.managers.get(entityType);
    if (!manager) {
      throw new Error(`Unknown entity type: ${entityType}`);
    }
    
    return manager.startSpawn(prompt);
  }
}
```

---

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Create `managers/BasePipelineManager.ts`
- [ ] Create `shared/pipelineCommon.ts`
- [ ] Extract shared utilities
- [ ] Update type definitions

### Phase 2: Extract Character Pipeline (Week 2-3)
- [ ] Create `managers/CharacterSpawnManager.ts`
- [ ] Move character-specific logic
- [ ] Test character generation
- [ ] Verify chat functionality

### Phase 3: Extract Location Pipeline (Week 3-4)
- [ ] Create `managers/LocationSpawnManager.ts`
- [ ] Move location-specific logic
- [ ] Implement world DNA storage
- [ ] Test location generation

### Phase 4: Refactor Main Manager (Week 4)
- [ ] Convert `SpawnManager.ts` to factory
- [ ] Implement manager registry
- [ ] Update route handlers
- [ ] Comprehensive testing

### Phase 5: Travel System Foundation (Week 5)
- [ ] Add world DNA retrieval methods
- [ ] Create travel route handler
- [ ] Test generating new locations from existing world DNA

### Phase 6: Sub-Location Pipeline (Week 6+)
- [ ] Create `managers/SubLocationSpawnManager.ts`
- [ ] Implement parent location inheritance
- [ ] Test sub-location generation
- [ ] UI updates for sub-locations

---

## Quick Wins Before Full Refactor

While planning the full refactor, you can make these incremental improvements:

1. **Add Comments:** Document why each conditional exists
2. **Extract Methods:** Pull entity-specific code into private methods
3. **Type Safety:** Strengthen TypeScript types for each entity
4. **Tests:** Write tests for current pipeline before refactoring
5. **Documentation:** Document world DNA concept and usage

---

## Next Steps

### Immediate (This Sprint)
✅ Fix `splitWorldAndLocation` to only run for locations (COMPLETED)
- [ ] Test character generation (ensure no world DNA logs)
- [ ] Test location generation (verify world DNA splitting works)
- [ ] Continue work on Travel UI

### Near Term (Next Sprint)
- [ ] Design world DNA storage schema
- [ ] Plan Travel UI architecture
- [ ] Document Travel feature requirements

### Long Term (Future Sprints)
- [ ] Execute pipeline refactoring (Phases 1-4)
- [ ] Implement Travel system
- [ ] Add Sub-location pipeline
- [ ] Add additional entity types (props, houses, etc.)

---

## Questions to Consider

1. **World DNA Storage:** Where should world DNA be stored?
   - In-memory cache?
   - Database (Supabase)?
   - LocalStorage (frontend)?

2. **Travel UI:** How should travel between locations work?
   - Generate new location with same world DNA?
   - Select from previously generated locations?
   - Both?

3. **Sub-Locations:** What defines a sub-location?
   - Room within a building?
   - Area within a larger location?
   - Different zoom level of same place?

4. **Entity Relationships:** How do entities relate?
   - Can a character own a house?
   - Can a dress belong to a character?
   - Can props exist in locations?

---

## Conclusion

The quick fix is complete and working. When you're ready to scale to many entity types, the separated pipeline manager architecture will make development much easier. The refactoring can be done incrementally without breaking existing functionality.

**Current Status:** ✅ `splitWorldAndLocation` now only runs for locations  
**Next Focus:** Travel UI development  
**Future:** Full pipeline refactoring when adding more entity types
