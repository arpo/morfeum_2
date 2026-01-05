# Prompt Index

A comprehensive reference of all prompts used in Morfeum, their locations, and how they flow through pipelines.

---

## Quick Reference

| Category | Count | Primary Location |
|----------|-------|------------------|
| Vision/Analysis | 2 | `shared/`, `characters/` |
| Character Generation | 5 | `characters/` |
| Navigation/Intent | 3 | `navigation/` |
| Location/DNA | 8 | `locations/`, `nodeCreation/prompts/dna/` |
| Image Generation | 4 | `locations/worldTree/`, `shared/` |
| Chat/Impersonation | 3 | `chat/` |
| Enhancer | 3 | `enhancer/` |

---

## Prompt Catalog

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
| `parsePromptToHierarchy` | [../../nodeCreation/detection/parsePromptToHierarchy.ts](../../nodeCreation/detection/parsePromptToHierarchy.ts) | Parse user prompt into hierarchy (host/region/location/niche) | Node Creation Pipeline (NEW_WORLD) |
| `hierarchyCategorization` | [locations/hierarchyCategorization.ts](./locations/hierarchyCategorization.ts) | Parse user prompt into 4-layer hierarchy (LEGACY - fallback only) | Legacy World Tree Pipeline |
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
| `interiorTransitionRules` | [shared/interiorTransitionRules.ts](./shared/interiorTransitionRules.ts) | Exterior→Interior material transition rules | DNA generation, Image prompts |

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

### Node Creation Pipeline (NEW_WORLD command)
```
User prompt: "A haunted house" or "A steampunk factory in Victorian London"
    ↓
┌─────────────────────────────────────────┐
│ Step 1: parsePromptToHierarchy          │
│ Parse into: Host → Region → Location    │
│ (Niche ONLY if explicitly requested)    │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 2: DNA Generation                  │
│ Generate DNA for each node in hierarchy │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 3: Image Prompt Generation         │
│ Build image prompt from DNA             │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 4: Image Generation (FLUX)         │
└─────────────────────────────────────────┘
    ↓
┌─────────────────────────────────────────┐
│ Step 5: Tree Building                   │
│ Assemble WorldTree with all nodes       │
└─────────────────────────────────────────┘
```

**Key Rules (parsePromptToHierarchy):**
- Default depth: host/region/location (EXTERIOR)
- Niche (interior) ONLY when user says: "inside", "interior", "within", "enter"
- Atmospheric adjectives (haunted, cozy, warm) → EXTERIOR, not interior

**Files involved:**
- `pipelines/nodeCreationPipeline.ts` - Main orchestrator
- `nodeCreation/detection/parsePromptToHierarchy.ts` - Step 1 (PRIMARY)
- `nodeCreation/prompts/dna/` - Step 2
- `generation/shared/imagePromptGeneration.ts` - Step 3

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
