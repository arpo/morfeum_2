# Prompt Index

A comprehensive reference of all prompts used in Morfeum, their locations, and how they flow through pipelines.

---

## Quick Reference

| Category | Count | Primary Location |
|----------|-------|------------------|
| **V2 World System** | 10 | `worldV2/prompts/`, `worldV2/display/` |
| Vision/Analysis | 2 | `shared/`, `characters/` |
| Character Generation | 5 | `characters/` |
| Navigation/Intent | 3 | `navigation/` |
| Location/DNA (V1) | 8 | `locations/`, `nodeCreation/prompts/dna/` |
| Image Generation | 4 | `locations/worldTree/`, `shared/` |
| Chat/Impersonation | 3 | `chat/` |
| Enhancer | 3 | `enhancer/` |

---

## Prompt Catalog

### V2 World System (Simplified DNA + LLM Image Prompts)

**DNA Generation Prompts** (in `worldV2/prompts/`):

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------
| `buildHostDNAPrompt` | [hostDNA.ts](../../../worldV2/prompts/hostDNA.ts) | Generate Host DNA (5-aspect: semantic, spatial, render, profile, meta) | `/NEW_HOST` |
| `parseHostResponse` | [hostDNA.ts](../../../worldV2/prompts/hostDNA.ts) | Parse LLM response to Host node | `/NEW_HOST` |
| `buildRegionDNAPrompt` | [regionDNA.ts](../../../worldV2/prompts/regionDNA.ts) | Generate Region DNA (delta-only, inherits from host) | `/NEW_REGION2` |
| `parseRegionResponse` | [regionDNA.ts](../../../worldV2/prompts/regionDNA.ts) | Parse LLM response to Region node | `/NEW_REGION2` |
| `buildLocationDNAPrompt` | [locationDNA.ts](../../../worldV2/prompts/locationDNA.ts) | Generate Location DNA (delta-only, inherits from region+host) | `/NEW_LOCATION2` |
| `parseLocationResponse` | [locationDNA.ts](../../../worldV2/prompts/locationDNA.ts) | Parse LLM response to Location node | `/NEW_LOCATION2` |

**Image Prompt Generation** (in `worldV2/display/`):

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------
| `generateImagePromptLayers` | [imagePromptGenerator.ts](../../../worldV2/display/imagePromptGenerator.ts) | LLM generates structured layers (background, midground, foreground, lighting, atmosphere) with camera perspective guidance | `/DISPLAY` |
| `buildPromptFromLayers` | [promptBuilder.ts](../../../worldV2/display/promptBuilder.ts) | Assemble layers + camera config + DNA into final FLUX prompt | `/DISPLAY` |
| `cascadeDNA` | [promptBuilder.ts](../../../worldV2/display/promptBuilder.ts) | Merge host→region→location DNA for image generation | `/DISPLAY` |
| `getV2CameraConfig` | [cameraSettings.ts](../../../worldV2/display/cameraSettings.ts) | Camera angle/perspective configs by node type (host=aerial, region=elevated, location=street-level) | `/DISPLAY` |

**Navigation Image Edit Prompts** (in `worldV2/prompts/`):

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `buildGoInsidePrompt` | [goInside.ts](../../../worldV2/prompts/goInside.ts) | LLM generates container + space nodes with promptLayers | `/GO_INSIDE`, `/GOTO` |
| `parseGoInsideResponse` | [goInside.ts](../../../worldV2/prompts/goInside.ts) | Parse LLM response to Container + Space nodes | `/GO_INSIDE`, `/GOTO` |
| `buildEnterImageEditPrompt` | [imageEditPrompt.ts](../../../worldV2/prompts/imageEditPrompt.ts) | Build FLUX edit prompt for indoor spaces | `/GO_INSIDE`, `/GOTO` |
| `buildEnterOutdoorEditPrompt` | [imageEditPrompt.ts](../../../worldV2/prompts/imageEditPrompt.ts) | Build FLUX edit prompt for outdoor spaces | `/GO_INSIDE`, `/GOTO` |
| `buildEnterSemiEnclosedEditPrompt` | [imageEditPrompt.ts](../../../worldV2/prompts/imageEditPrompt.ts) | Build FLUX edit prompt for semi-enclosed spaces (pavilions, gazebos) | `/GO_INSIDE`, `/GOTO` |
| `buildLookPrompt` | [look.ts](../../../worldV2/prompts/look.ts) | LLM generates camera movement instructions for LOOK command | `/LOOK` |
| `parseLookResponse` | [look.ts](../../../worldV2/prompts/look.ts) | Parse LLM response to LookResponse with camera/lens config | `/LOOK` |
| `buildLookImageEditPrompt` | [imageEditPrompt.ts](../../../worldV2/prompts/imageEditPrompt.ts) | Build FLUX edit prompt for camera reframing (first-person POV) | `/LOOK` |
| `buildNavigationAssistantPrompt` | [navigationAssistant.ts](../../../worldV2/prompts/navigationAssistant.ts) | Chat assistant prompt for navigation help | Navigation Assistant Panel |

### Vision & Image Analysis

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `visionDescriptionPrompt` | [shared/visionDescription.ts](./shared/visionDescription.ts) | Analyze dropped/pasted images to create text descriptions | `/api/mzoo/vision`, spawn-input-bar image drops |
| `characterVisualAnalysisPrompt` | [characters/characterVisualAnalysis.ts](./characters/characterVisualAnalysis.ts) | Analyze generated character images for visual traits | Character Pipeline |

### Character Generation

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `characterSeedPrompt` | [characters/characterSeed.ts](./characters/characterSeed.ts) | Generate initial character traits from user description | Character Pipeline (Step 1) |
| `characterImagePrompt` | [characters/characterImage.ts](./characters/characterImage.ts) | Build FLUX image prompt for character | Character Pipeline (Step 2) |
| `characterDeepProfilePrompt` | [characters/characterDeepProfile.ts](./characters/characterDeepProfile.ts) | Generate full character profile with backstory | Character Pipeline (Step 4) |
| `composeCharacterScenePrompt` | [characters/composeCharacterScenePrompt.ts](./characters/composeCharacterScenePrompt.ts) | Compose character in environment scene | CREATE_CHARACTER commands |
| `characterPromptEngineer` | [characters/characterPromptEngineering.ts](./characters/characterPromptEngineering.ts) | Engineer character prompts (real vs unreal) | Navigation character pipeline |

### Navigation & Intent Classification

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `intentClassifierPrompt` | [navigation/intentClassifier.ts](./navigation/intentClassifier.ts) | Classify user commands (GOTO, GO_INSIDE, VIEW, etc.) | Navigation Router |
| `destinationAnalysisPrompt` | [navigation/destinationAnalysis.ts](./navigation/destinationAnalysis.ts) | Analyze destination from user input | GOTO, GO_INSIDE commands |
| `structureAnalysisPrompt` | [navigation/structureAnalysis.ts](./navigation/structureAnalysis.ts) | Analyze space structure (dimensions, openings, elevation) | Navigation Pipeline |

### Location & DNA Generation

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `hierarchyCategorization` | [locations/hierarchyCategorization.ts](./locations/hierarchyCategorization.ts) | Parse user prompt into 4-layer hierarchy | World Tree Pipeline |
| `nodeDNAGeneration` | [locations/nodeDNAGeneration.ts](./locations/nodeDNAGeneration.ts) | Generate DNA for a specific node | Node creation |
| `deepestNodeDNAGeneration` | [locations/deepestNodeDNA.ts](./locations/deepestNodeDNA.ts) | Generate DNA for deepest node in hierarchy | World Tree Pipeline |
| `parentChainDNAGeneration` | [locations/parentChainDNA.ts](./locations/parentChainDNA.ts) | Generate DNA for parent chain (host, region, location) | World Tree Pipeline |
| `dnaPromptBuilder` | [locations/dnaPromptBuilder.ts](./locations/dnaPromptBuilder.ts) | Build DNA generation prompts | Various pipelines |
| `locationVisualAnalysisPrompt` | [locations/locationVisualAnalysis.ts](./locations/locationVisualAnalysis.ts) | Analyze location images | Location creation |

**Node Creation DNA Prompts** (in `../../nodeCreation/prompts/dna/`):

| Prompt | File | Purpose |
|--------|------|---------|
| `hostDNA` | [hostDNA.ts](../../nodeCreation/prompts/dna/hostDNA.ts) | DNA prompt for Host nodes |
| `regionDNA` | [regionDNA.ts](../../nodeCreation/prompts/dna/regionDNA.ts) | DNA prompt for Region nodes |
| `locationDNA` | [locationDNA.ts](../../nodeCreation/prompts/dna/locationDNA.ts) | DNA prompt for Location nodes |
| `nicheDNA` | [nicheDNA.ts](../../nodeCreation/prompts/dna/nicheDNA.ts) | DNA prompt for Niche nodes |

### Image Prompt Generation

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `worldTreeImagePromptContext` | [locations/worldTree/contextPromptBuilder.ts](./locations/worldTree/contextPromptBuilder.ts) | Build context for FLUX image prompt (structured JSON) | World Tree Pipeline |
| `directPromptBuilder` | [locations/worldTree/directPromptBuilder.ts](./locations/worldTree/directPromptBuilder.ts) | Build direct FLUX prompts | Legacy/fallback |
| `compositionInstructions` | [locations/worldTree/compositionInstructions.ts](./locations/worldTree/compositionInstructions.ts) | Scene composition rules | Image generation |
| `locationImageGeneration` | [locations/locationImageGeneration.ts](./locations/locationImageGeneration.ts) | Location image prompts | Location creation |

### Shared/Utility Prompts

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `qualityPrompt` | [shared/constants.ts](./shared/constants.ts) | FLUX quality suffix for all images | All image generation |
| `fluxRenderInstructions` | [shared/fluxRenderInstructions.ts](./shared/fluxRenderInstructions.ts) | FLUX rendering guidance | Image prompts |
| `generalPromptFix` | [shared/generalPromptFix.ts](./shared/generalPromptFix.ts) | Fix common prompt issues | Image prompts |
| `dnaSchema` | [shared/dnaSchema.ts](./shared/dnaSchema.ts) | DNA field definitions | DNA generation |
| `elementRules` | [shared/elementRules.ts](./shared/elementRules.ts) | Rules for dominant elements | Structure analysis |

### Chat & Impersonation

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `chatSystemMessage` | [chat/chatSystemMessage.ts](./chat/chatSystemMessage.ts) | System message for chat | Chat feature |
| `chatCharacterImpersonation` | [chat/chatCharacterImpersonation.ts](./chat/chatCharacterImpersonation.ts) | Make AI speak as character | Character chat |
| `entityDataFormatting` | [chat/entityDataFormatting.ts](./chat/entityDataFormatting.ts) | Format entity data for chat | Chat context |
| `profileGenerationUserMessages` | [chat/profileGenerationUserMessages.ts](./chat/profileGenerationUserMessages.ts) | User messages for profile generation | Profile creation |

### Enhancer

| Prompt | File | Purpose | Used By |
|--------|------|---------|---------|
| `enhancerPromptBuilder` | [enhancer/enhancerPromptBuilder.ts](./enhancer/enhancerPromptBuilder.ts) | Build enhancement prompts | Furnish enhancer |
| `enhancerPromptTemplate` | [enhancer/enhancerPromptTemplate.ts](./enhancer/enhancerPromptTemplate.ts) | Enhancement templates | Furnish enhancer |
| `instructionTemplates` | [enhancer/instructionTemplates.ts](./enhancer/instructionTemplates.ts) | Enhancement instructions | Furnish enhancer |

---

## Pipeline Flows

### V2 World System Pipeline (NEW_HOST, NEW_REGION2, NEW_LOCATION2, DISPLAY)

**Node Creation (NEW_HOST, NEW_REGION2, NEW_LOCATION2):**
```
User command: "/NEW_HOST A steampunk metropolis"
    ↓
┌─────────────────────────────────────────┐
│ Step 1: buildHostDNAPrompt              │
│ Generate 5-aspect DNA from concept      │
│ (semantic, spatial, render, profile, meta)
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: parseHostResponse               │
│ Parse LLM JSON to Host node             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Save to worlds.json             │
│ Add to nodes + worldTrees               │
└─────────────────────────────────────────┘
```

**Image Generation (/DISPLAY):**
```
User command: "/DISPLAY" (on any V2 node)
    ↓
┌─────────────────────────────────────────┐
│ Step 1: cascadeDNA                      │
│ Merge host→region→location DNA          │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: getV2CameraConfig               │
│ Get camera perspective for node type    │
│ (host=aerial, region=elevated, etc.)    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: generateImagePromptLayers       │
│ LLM generates structured layers with    │
│ camera perspective guidance             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: buildPromptFromLayers           │
│ Assemble layers + DNA into FLUX prompt  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: applyMorfeumStyle               │
│ Add quality modifiers + creature mode   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 6: generateImage (FLUX)            │
│ Generate image via Mzoo API             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 7: Save to media.json              │
│ Store image with promptLayers metadata  │
└─────────────────────────────────────────┘
```

**Files involved:**
- `worldV2/routes.ts` - API endpoints
- `worldV2/display/displayHandler.ts` - Orchestrator
- `worldV2/display/imagePromptGenerator.ts` - LLM layer generation
- `worldV2/display/promptBuilder.ts` - DNA cascade + prompt assembly
- `worldV2/display/cameraSettings.ts` - Camera configs

---

### V2 Navigation Pipeline (GO_INSIDE, GOTO)

**GO_INSIDE** - Enter a structure/building from a location:
```
User command: "/GO_INSIDE the restaurant" (from location node)
    ↓
┌─────────────────────────────────────────┐
│ Step 1: Get source image + promptLayers │
│ From current location's media           │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: buildGoInsidePrompt             │
│ LLM generates container + space nodes   │
│ with spaceType detection + promptLayers │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Select image edit prompt        │
│ Based on spaceType:                     │
│ - indoor → buildEnterImageEditPrompt    │
│ - outdoor → buildEnterOutdoorEditPrompt │
│ - semi-enclosed → buildEnterSemiEncl... │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: Image Edit (FLUX edit model)    │
│ Edit source image to show interior      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: Save container + space nodes    │
│ Store promptLayers in media metadata    │
└─────────────────────────────────────────┘
```

**GOTO** - Create sibling space from within a container:
```
User command: "/GOTO the VIP lounge" (from space node)
    ↓
┌─────────────────────────────────────────┐
│ Step 1: Find parent container + location│
│ Validate user is on a space node        │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: Get source image from PARENT    │
│ Uses parent location's image (not space)│
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Steps 3-5: Same as GO_INSIDE           │
│ Reuses same prompts + image edit logic  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 6: Add space as sibling            │
│ Container already exists, add child     │
└─────────────────────────────────────────┘
```

**Files involved:**
- `worldV2/handlers/goInsideHandler.ts` - GO_INSIDE handler
- `worldV2/handlers/gotoHandler.ts` - GOTO handler
- `worldV2/prompts/goInside.ts` - LLM prompt for container + space
- `worldV2/prompts/imageEditPrompt.ts` - Image edit prompts (3 variants)

**SpaceType Detection:**
| Type | Description | Prompt Builder |
|------|-------------|----------------|
| `indoor` | Solid walls + ceiling, no sky | `buildEnterImageEditPrompt` |
| `outdoor` | No roof, full sky visible | `buildEnterOutdoorEditPrompt` |
| `semi-enclosed` | Partial roof, sky through gaps | `buildEnterSemiEnclosedEditPrompt` |
| `underground` | Below ground level | `buildEnterImageEditPrompt` |
| `elevated` | Raised platform, no roof | `buildEnterImageEditPrompt` |

---

### Image Drop/Paste Flow (Spawn Input)
```
User drops/pastes image
    ↓
Frontend sends to /api/mzoo/vision
    ↓
visionDescriptionPrompt → Gemini Vision API
    ↓
Text description returned to spawn-input-bar
```

**Files involved:**
- `routes/mzoo/ai.ts` - Vision endpoint
- `shared/visionDescription.ts` - The prompt

---

### World Tree Pipeline (NEW_HOST, NEW_LOCATION)
```
User prompt: "A steampunk factory in Victorian London"
    ↓
┌─────────────────────────────────────────┐
│ Step 1: hierarchyCategorization         │
│ Parse into: Host → Region → Location    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: deepestNodeDNAGeneration        │
│ Generate DNA for deepest node (factory) │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: worldTreeImagePromptContext     │
│ Build structured JSON image description │
└─────────────────────────────────────────┘
    ↓ (parallel)
┌─────────────────────────────────────────┐
│ Step 4: Image Generation (FLUX)         │
│ + parentChainDNAGeneration (parallel)   │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: Tree Building                   │
│ Assemble WorldTree with all nodes       │
└─────────────────────────────────────────┘
```

**Files involved:**
- `pipelines/nodeCreationPipeline.ts` - Main orchestrator
- `locations/hierarchyCategorization.ts` - Step 1
- `locations/deepestNodeDNA.ts` - Step 2
- `locations/worldTree/contextPromptBuilder.ts` - Step 3
- `locations/parentChainDNA.ts` - Step 4b

---

### Navigation Pipeline (GOTO, GO_INSIDE)
```
User command: "/GOTO the cozy kitchen"
    ↓
┌─────────────────────────────────────────┐
│ Step 1: intentClassifierPrompt          │
│ Classify as GOTO command                │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: destinationAnalysisPrompt       │
│ Analyze "cozy kitchen" destination      │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: structureAnalysisPrompt         │
│ Determine structure (dimensions, etc.)  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: Image Prompt Generation         │
│ Build FLUX prompt with DNA & structure  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: Node Building                   │
│ Create niche node with media            │
└─────────────────────────────────────────┘
```

**Files involved:**
- `navigation/intentClassifier.ts` - Step 1
- `navigation/analyzers/destinationAnalyzer.ts` - Step 2
- `navigation/analyzers/structureAnalyzer.ts` - Step 3
- `navigation/pipelines/helpers/nodeBuildingStep.ts` - Steps 4-5
- `navigation/pipelines/createNodePipeline.ts` - Orchestrator

---

### Character Pipeline (CREATE_CHARACTER)
```
User prompt: "A wise old wizard with a long beard"
    ↓
┌─────────────────────────────────────────┐
│ Step 1: characterSeedPrompt             │
│ Generate initial traits (name, age...)  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: characterImagePrompt            │
│ Build FLUX prompt for character         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Image Generation (FLUX)         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: characterVisualAnalysisPrompt   │
│ Analyze generated image for details     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: characterDeepProfilePrompt      │
│ Generate full profile with backstory    │
└─────────────────────────────────────────┘
```

**Files involved:**
- `pipelines/characterPipeline.ts` - Main orchestrator
- `characters/characterSeed.ts` - Step 1
- `characters/characterImage.ts` - Step 2
- `characters/characterVisualAnalysis.ts` - Step 4
- `characters/characterDeepProfile.ts` - Step 5

---

### Character in Scene (Navigation Character)
```
User: "/CREATE_CHARACTER a bartender"
    ↓
┌─────────────────────────────────────────┐
│ Step 1: characterPromptEngineer         │
│ Build character prompt for environment  │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: composeCharacterScenePrompt     │
│ Compose character in location scene     │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Image Generation (FLUX)         │
└─────────────────────────────────────────┘
```

**Files involved:**
- `navigation/pipelines/createCharacterPipeline.ts` - Orchestrator
- `characters/characterPromptEngineering.ts` - Step 1
- `characters/composeCharacterScenePrompt.ts` - Step 2

---

## Structured Image Prompts

As of Dec 2025, image prompts use a **structured JSON format** with layers:

```json
{
  "background": "Distant elements: sky, horizon, mountains...",
  "midground": "Central focus: main structures, primary subject...",
  "foreground": "Closest elements: objects, furniture, details...",
  "lighting": "Light direction, quality, layer effects...",
  "atmosphere": "Mood, tone, atmospheric effects..."
}
```

**Assembler:** `generation/shared/imagePromptAssembler.ts`
**Types:** `generation/shared/imagePromptTypes.ts`

---

## Sample Prompts

For testing and examples, see:
- `samples/sampleCharacterPrompts.ts` - Character prompt examples
- `samples/sampleLocationPrompts.ts` - Location prompt examples

---

## Space Type Registry

As of Dec 2025, the system uses a **Space Type Registry** to handle different container types (buildings, vehicles, boats, tents, etc.).

### File Location
`generation/shared/spaceTypeRegistry.ts`

### Container Types

| Type | Description | Perspectives |
|------|-------------|--------------|
| `building` | Standard architectural structures | interior, exterior, open-air |
| `vehicle-car` | Automotive vehicles (cars, trucks) | interior (cabin) |
| `vehicle-boat` | Watercraft (ships, boats, yachts) | interior (cabin), open-air (deck) |
| `natural` | Natural formations (clearings, groves) | exterior |
| `tent-like` | Temporary fabric structures | interior |

### How It Works

1. **LLM determines** `containerType` during structure analysis (structureAnalysis.ts)
2. **Registry provides** specialized guidance for DNA generation and image constraints
3. **Pipelines use** registry functions to get type-specific prompts

### Key Functions

```typescript
import { 
  getDNAGuidance,       // Get DNA prompt guidance for a container type
  getImageConstraints,  // Get FLUX constraints for a container type
  getStructureGuidance, // Get structure analysis guidance
  SPACE_TYPE_REGISTRY   // Full registry object
} from '../shared/spaceTypeRegistry';
```

### Adding New Container Types

1. Add type to `ContainerType` union in `spaceTypeRegistry.ts`
2. Add entry to `SPACE_TYPE_REGISTRY` with all fields
3. The LLM prompt in `structureAnalysis.ts` auto-updates via `getContainerTypeDescriptions()`

---

## Adding New Prompts

1. **Create prompt file** in appropriate category folder
2. **Export from index** - Add to category's `index.ts`
3. **Update this index** - Add entry to relevant table
4. **Document pipeline usage** - Note which pipeline uses it

### Prompt Best Practices

- Keep prompts as **template functions** that accept parameters
- Use **TypeScript string templates** for variable interpolation
- Document **input parameters** and **expected output format**
- Include **examples** in the prompt when helpful for LLM
- Export from category `index.ts` for clean imports
