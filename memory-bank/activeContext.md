# Active Context

## Recent Changes (2025-12-15)

### Pipeline Progress Bar Fix & VIEW Command Alignment (Dec 15)
- **Problem 1**: GO_INSIDE progress bar not reaching 100%
- **Root Cause**: SpawnInputBar.tsx filtered out completed spawns before animation could show 100%
- **Fix**: Changed filter to include `status === 'completed'` spawns, added `onComplete` callback to remove spawn after animation

- **Problem 2**: VIEW command had hardcoded pipeline steps in route, not in `pipelineConfig.ts`
- **Fix**: Added `view` pipeline to `pipelineConfig.ts` as single source of truth

- **Problem 3**: VIEW had unnecessary "save" step (other pipelines save silently)
- **Fix**: Simplified VIEW pipeline to single step, matching other pipelines

- **Enhancement**: Added timing logs to VIEW command terminal output

#### Key Files Modified
- `packages/frontend/src/features/spawn-input/SpawnInputBar/SpawnInputBar.tsx` - Filter fix + onComplete
- `packages/backend/src/engine/pipelines/shared/pipelineConfig.ts` - Added `view` pipeline
- `packages/backend/src/routes/mzoo/navigation.ts` - Updated `/create-image` to use config + timing logs
- `packages/backend/src/engine/pipelines/shared/pipelineHelpers.ts` - Fixed `started()` to send steps

#### Pipeline Steps Now (Single Source of Truth)
```typescript
// VIEW command - generate image for existing node (save happens silently)
view: [
  { id: 'generate', name: 'Generating Image', duration: 8000 }
]
```

#### VIEW Terminal Output
```
[VIEW] img-xxx completed in 8.25s
  Stage Timings:
    - Image Generation: 8.15s
  Total: 8.25s
```

## Previous Changes (2025-12-12)

### Character Creation System (Dec 12)
- **Feature**: Implemented `/CREATE_CHARACTER_REAL` and `/CREATE_CHARACTER_UNREAL` slash commands
- **7-Step Flow**: Prompt Engineering → Seed → Scene Composition → Image → Visual Analysis → Profile → Save
- **Camera Mode System**: 9 shot types (`half_portrait`, `full_body`, `close_up`, etc.)
- **Character Context/Backstory Storage**: Original user prompt stored as `context` field
- **Rich Chat System Prompts**: Full appearance, personality, voice, environment context

### Open-Sky Rooftop/Terrace Fix (Dec 11)
- Append OPEN-SKY constraint DIRECTLY to final FLUX prompt

### DNA Bleeding Fix for /goto (Dec 11)
- `findParentLocationNode()` returns `null` for `parentLocationDNA` when no valid location parent

### Interior Spawn Pipeline System (Dec 11)
- Two-phase approach for interior/niche creation with dynamic pipeline config

## Current Focus

- Pipeline configuration now centralized in `pipelineConfig.ts`
- All pipelines have consistent timing logs
- Progress bars correctly animate to 100% before removal
- VIEW command properly integrated with pipeline system

## Next Steps

- Implement `/SCENE_IMAGE` command for generating new images of existing characters
- Test character chat with full context
- Consider database migration for character storage
