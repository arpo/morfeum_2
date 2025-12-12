# Active Context

## Recent Changes (2025-12-12)

### Character Creation System (Dec 12)
- **Feature**: Implemented `/CREATE_CHARACTER_REAL` and `/CREATE_CHARACTER_UNREAL` slash commands for creating characters from location/niche nodes

#### Character Creation Pipeline
- **Location**: `packages/backend/src/engine/navigation/pipelines/createCharacterPipeline.ts`
- **7-Step Flow**:
  1. Prompt Engineering - Transform user input + environment DNA into detailed description
  2. Seed Generation - Create character seed from engineered prompt
  3. Scene Composition - LLM composes character + location into scene prompt
  4. Image Generation - Generate character in environment image
  5. Visual Analysis - Analyze the generated image
  6. Profile Enrichment - Build deep character profile
  7. Save - Persist character with location reference and context

#### Camera Mode System
- **Location**: `packages/backend/src/engine/generation/prompts/characters/composeCharacterScenePrompt.ts`
- **9 Shot Types**:
  - `half_portrait` - Face + upper body (default for character creation)
  - `full_body` - Head to toe in environment
  - `environmental_portrait` - 30-40% character, 60-70% environment
  - `full_scene` - Wide shot, character small in landscape
  - `close_up` - Face focus, intimate
  - `action_shot` - Dynamic motion
  - `dramatic_low_angle` - Power pose from below
  - `aerial_overview` - Bird's eye view
  - `over_shoulder` - From behind, showing what they see
- **Action Parameter**: Optional action/pose for the character (e.g., "walking", "sitting")
- **Helper Functions**: `getDefaultShotTypeForCharacterCreation()`, `parseShotTypeFromText()`, `getAvailableShotTypes()`

#### Character Context/Backstory Storage
- **Problem**: Original user prompt (e.g., "on vacation staying in this house") was lost after character creation
- **Solution**: Store `userPrompt` as `context` field on character entity
- Characters now know their backstory in chat

#### Rich Chat System Prompts
- **Location**: `packages/frontend/src/utils/entity/buildCharacterSystemPrompt.ts`
- **Includes**:
  - Character identity and backstory
  - Full appearance (looks, face, body, hair)
  - Clothing description
  - Personality traits
  - Voice and speech style
  - Style/aesthetic
  - Current environment context
  - Behavior instructions
- **Interface**: `CharacterDetails` with `context` field for backstory

#### LLM Scene Composer
- **Always uses LLM** - No fallback concatenation
- **Smart Input Selection**: Uses node's primaryMedia image prompt if available, otherwise environment DNA
- **Console logging**: Shows which input source is being used

#### Key Files Modified
- `packages/backend/src/engine/navigation/pipelines/createCharacterPipeline.ts` - Main pipeline
- `packages/backend/src/engine/generation/prompts/characters/composeCharacterScenePrompt.ts` - Camera modes
- `packages/frontend/src/utils/entity/buildCharacterSystemPrompt.ts` - Rich system prompts
- `packages/frontend/src/store/slices/entityManagerSlice.ts` - createEntity with rich prompts
- `packages/backend/src/routes/mzoo/navigation.ts` - Route handling for create_character action

### Character Types
- **real**: Realistic human characters that fit naturally into the environment
- **unreal**: Humanoid figures made of environment materials (70% human silhouette, 30% environment)

### Stored Character Data
```typescript
{
  id: string,
  name: string,
  details: { /* full character DNA */ },
  primaryMedia: string,
  imageUrl: string,
  sourceLocationId: string,  // Reference to source node
  sourceLocationName: string,
  characterType: 'real' | 'unreal',
  context: string  // Original user prompt / backstory
}
```

## Previous Changes (2025-12-11)

### Open-Sky Rooftop/Terrace Fix (Dec 11 - Later)
- **Problem**: Rooftop terraces inside "cave dwellings" were generating cave roofs even when `roofType: "open-sky"` was correctly set
- **Fix**: Append OPEN-SKY constraint DIRECTLY to final FLUX prompt (not just as LLM guidance)
- **Key file**: `imagePromptGeneration.ts`

### DNA Bleeding Fix for /goto (Dec 11 - Earlier)
- **Problem**: When running `/goto` from a niche, the current niche's DNA was bleeding into the new location's image
- **Fix**: `findParentLocationNode()` now returns `null` for `parentLocationDNA` when no valid location parent found
- **Key files**: `navigationHelpers.ts`, `createNodePipeline.ts`, `imagePromptGeneration.ts`

### Interior Spawn Pipeline System (Dec 11 - Earlier)
- **Feature**: Two-phase approach for interior/niche creation with dynamic pipeline config
- **Documentation**: `packages/backend/src/engine/pipelines/README.md`

## Current Focus

- Character creation system complete and working
- Camera mode system implemented with 9 shot types
- Rich chat prompts with environment context
- Character backstory storage implemented

## Next Steps

- Implement `/SCENE_IMAGE` command for generating new images of existing characters
- Test character chat with full context
- Consider database migration for character storage
