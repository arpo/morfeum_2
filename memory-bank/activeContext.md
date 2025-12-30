# Active Context

## 2025-12-30

### Prompt Index Documentation - COMPLETED (Latest)

Created comprehensive prompt documentation file at `packages/backend/src/engine/generation/prompts/PROMPT_INDEX.md`.

#### What Was Done

**Problem:** Prompts were scattered across the codebase in different files and formats, making them hard to find and understand.

**Solution:** Created a centralized index document (not code changes) that:
- Catalogs 30+ prompts organized by category
- Documents file locations with relative links
- Maps prompts to their pipelines
- Shows pipeline flow diagrams

#### Categories Documented
- **Vision/Analysis**: `visionDescriptionPrompt` (image drops), `characterVisualAnalysisPrompt`
- **Character Generation**: seed, image, profile, scene composition prompts
- **Navigation/Intent**: intent classifier, destination analysis, structure analysis
- **Location/DNA**: hierarchy categorization, DNA generation (host/region/location/niche)
- **Image Generation**: world tree context builder, composition instructions
- **Chat/Impersonation**: system messages, character voice prompts
- **Enhancer**: furnish enhancement prompts

#### Pipeline Flows Documented
- Image Drop/Paste Flow (spawn-input-bar → vision API)
- World Tree Pipeline (NEW_HOST, NEW_LOCATION)
- Navigation Pipeline (GOTO, GO_INSIDE)
- Character Pipeline (CREATE_CHARACTER)
- Character in Scene Pipeline

### Structured Image Prompt System - COMPLETED

Implemented layer-based structured image prompts across both spawn and navigation pipelines.

#### What Was Done

**Problem:** Image prompts were unstructured strings, making it difficult to:
- Place characters in specific layers (foreground/midground)
- Modify/regenerate specific parts of scenes
- Reuse scene prompts with modifications

**Solution:** Structured JSON format with separate layers:
```json
{
  "background": "Distant elements: sky, horizon, mountains...",
  "midground": "Central focus: main structures, primary subject...",
  "foreground": "Closest elements: objects, furniture, details...",
  "lighting": "Light direction, quality, layer effects...",
  "atmosphere": "Mood, tone, atmospheric effects..."
}
```

#### Files Created
- `imagePromptTypes.ts` - `ImagePromptStructure` and `AssemblePromptOptions` interfaces
- `imagePromptAssembler.ts` - `assembleImagePrompt()` to convert structure to FLUX string

#### Files Modified

**Navigation Flow (`/GOTO`, `/GO_INSIDE`):**
- `imagePromptGeneration.ts` - LLM outputs structured JSON, new `generateStructuredImagePrompt()`
- `nodeBuildingStep.ts` - Returns `{ prompt, structure }`, stores in media
- `createNodePipeline.ts` - Uses structured output, passes to media

**Spawn Flow (`/NEW_WORLD`):**
- `contextPromptBuilder.ts` - Updated to request structured JSON output
- `nodeCreationPipeline.ts` - Parses JSON, uses `assembleImagePrompt()`, stores structure
- `helpers.ts` - `assignMediaToTree()` accepts `promptStructure` parameter

#### Storage in media.json
```json
{
  "metadata": {
    "prompt": "Background: ... Midground: ... Foreground: ...",
    "promptStructure": {
      "background": "...",
      "midground": "...",
      "foreground": "...",
      "lighting": "...",
      "atmosphere": "..."
    },
    "model": "FLUX"
  }
}
```

#### Key Architecture Note
- `/NEW_WORLD` uses `nodeCreationPipeline.ts` → `mzoo.generateImage()` directly
- `/GOTO`, `/GO_INSIDE` use `createNodePipeline.ts` → `nodeBuildingStep.ts` → `imageGeneration.ts`
- Both pipelines now aligned with structured prompts

### Previous: Image Prompt DNA & Shape Improvements - COMPLETED

Fixed multiple issues with how DNA information and structure shapes are passed to image generation.

- Interior dominantElements no longer copy parent structure
- Non-rectangular shapes get direct FLUX constraints (`[CRITICAL SHAPE: ...]`)
- Windows/openings get exterior view constraints (`[CRITICAL EXTERIOR VIEWS: ...]`)

## Current Focus

- ✅ **COMPLETED**: Structured image prompt system (both pipelines)
- ✅ **COMPLETED**: Image prompt DNA & shape improvements
- ✅ **COMPLETED**: GO_INSIDE hierarchy fix for pass-through locations

## Files Modified (Dec 30)

**New Files:**
- `packages/backend/src/engine/generation/shared/imagePromptTypes.ts`
- `packages/backend/src/engine/generation/shared/imagePromptAssembler.ts`

**Modified Files:**
- `packages/backend/src/engine/generation/shared/imagePromptGeneration.ts`
- `packages/backend/src/engine/generation/prompts/locations/worldTree/contextPromptBuilder.ts`
- `packages/backend/src/engine/pipelines/nodeCreationPipeline.ts`
- `packages/backend/src/engine/pipelines/nodeCreation/helpers.ts`
- `packages/backend/src/engine/navigation/pipelines/helpers/nodeBuildingStep.ts`
- `packages/backend/src/engine/navigation/pipelines/createNodePipeline.ts`
- `packages/backend/src/engine/generation/index.ts`
