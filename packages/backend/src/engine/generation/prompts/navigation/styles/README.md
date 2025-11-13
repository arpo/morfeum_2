# Navigation Styles System: 2-Layer Architecture

This directory implements the 2-layer architecture for niche generation: **Foundation + Adaptation**.

## Architecture Overview

```
styles/
├── registry.ts          # Central registry mapping intents to adaptations/styles
└── go-inside/          # Adaptations for GO_INSIDE intent
    └── interior.ts     # Interior adaptation (wraps foundation)
```

## The 2-Layer System

**Layer 1: Foundation** (`nicheImagePrompt.ts`)
- Generic, reusable prompt structure
- Parent context analysis
- DNA descriptors (PRIMARY style driver)
- Materials, colors, spatial layout
- Composition layering
- Navigation features, camera specs
- NO headers (adaptations provide those)

**Layer 2: Adaptation** (`interior.ts`, etc.)
- Wraps the foundation
- Adds structural/perspective rules
- Interior: "YOU ARE INSIDE" header, interior space rules, perspective framing
- Future: Exterior adaptation for open-air niches
- DNA still drives visual style

## How It Works

```
User: "go inside cathedral"
→ Intent Classifier: { intent: "GO_INSIDE", style: "interior" }
→ Registry: Gets style="interior" → interiorAdaptation
→ Interior Adaptation:
   1. Adds structural headers and rules
   2. Calls nicheImagePrompt (foundation)
   3. Returns combined prompt
→ LLM generates interior scene (DNA-driven style)
```

## Current Adaptations

### GO_INSIDE
- **interior** (default): Enclosed interior spaces with structural rules

## Adding New Adaptations

### Example: Exterior Adaptation

1. **Create adaptation file** (`go-inside/exterior.ts`):

```typescript
import { nicheImagePrompt } from '../../nicheImagePrompt';
import { extractEntranceElement } from '../../../shared/promptSections';

export function exteriorAdaptation(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  const entranceElement = extractEntranceElement(decision.reasoning);
  
  // Exterior-specific sections
  const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OPEN AIR SPACE: ${entranceElement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  const exteriorRules = `EXTERIOR SPACE: Open-air niche within parent location. Sky visible above. Natural/ambient lighting. Match scale and form of "${entranceElement}"`;
  
  // Call foundation
  const foundation = nicheImagePrompt(context, intent, decision, navigationFeatures);
  
  return `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

${header}

${exteriorRules}

${foundation}`;
}
```

2. **Register in `registry.ts`**:

```typescript
import { exteriorAdaptation } from './go-inside/exterior';

GO_INSIDE: {
  default: { name: 'interior', prompt: interiorAdaptation },
  exterior: { 
    name: 'exterior', 
    description: 'Open-air outdoor niches within location',
    prompt: exteriorAdaptation 
  }
}
```

3. **Intent classifier automatically includes it** - LLM selects based on location context

## Adding DNA-Driven Style Variations

DNA-driven styles can layer on top of any adaptation:

```typescript
export function enhancedStyleAdapter(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  // Get base adaptation (interior or exterior)
  const baseAdaptation = interiorAdaptation(context, intent, decision, navigationFeatures);
  
  // Read DNA fields
  const mood = context.currentNode.dna?.mood_baseline;
  const tone = context.currentNode.dna?.architectural_tone;
  const cultural = context.currentNode.dna?.cultural_tone;
  
  // Build DNA-driven enhancements
  const styleHints = buildAtmosphereEnhancement(mood, tone, cultural);
  
  return `${baseAdaptation}

${styleHints}`;
}
```

**Key principle**: Read DNA fields, don't hardcode style rules.

## Adaptation vs Style

**Adaptation** = Structural/perspective (interior vs exterior)
- Interior: enclosed, ceiling overhead, walls around
- Exterior: open-air, sky visible, natural space

**Style** = Aesthetic/atmosphere (DNA-driven)
- Driven by DNA fields: architectural_tone, mood_baseline, cultural_tone
- Can apply to any adaptation
- No hardcoded visual rules

## Benefits

- **DNA-driven**: Visual style comes from DNA fields
- **Extensible**: Easy to add adaptations and style variations
- **Clean separation**: Structure (adaptation) vs Style (DNA)
- **Maintainable**: Clear, layered architecture
- **Language-agnostic**: Semantic descriptions for LLM
- **Token-efficient**: Condensed versions only

## File Organization

```
prompts/navigation/
├── nicheImagePrompt.ts       # Foundation (generic)
├── styles/
│   ├── registry.ts          # Maps intents → adaptations
│   ├── go-inside/
│   │   └── interior.ts      # Interior adaptation
│   └── README.md            # This file
└── shared/
    └── promptSections.ts    # Reusable sections (condensed)
```

## Testing

```bash
# Test interior generation
User: "go inside cathedral"
→ Should use interior adaptation
→ Should show "YOU ARE INSIDE" in logs
→ Should create enclosed space with ceiling

# Test with custom style (future)
User: "go into the mystical temple"
→ Should use interior adaptation
→ DNA should drive mystical atmosphere
```

## Best Practices

1. **Adaptations handle structure** - Interior/exterior rules
2. **DNA handles style** - Read DNA fields, don't hardcode
3. **Reuse foundation** - Call nicheImagePrompt for core content
4. **Keep condensed** - Token efficiency matters
5. **Document clearly** - Registry descriptions guide LLM selection
