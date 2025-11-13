# Tutorial: Adding Adaptations and Styles

This tutorial shows you how to extend the niche generation system with new adaptations and DNA-driven styles.

## Understanding the System

The system uses a **2-layer architecture**:

- **Layer 1: Foundation** (`nicheImagePrompt.ts`) - Generic, DNA-driven prompt base
- **Layer 2: Adaptation/Style** - Structural rules or aesthetic enhancements

### Key Concepts

**Adaptation** = Structure/perspective (e.g., interior vs exterior)
- Handles spatial rules (enclosed vs open-air)
- Adds structural context
- Wraps the foundation

**Style** = Aesthetic/atmosphere (DNA-driven)
- Reads DNA fields
- Enhances atmosphere
- No hardcoded visuals

---

## Part 1: Adding a New Adaptation

**Example: Exterior Adaptation** (open-air niches)

### Step 1: Create the Adaptation File

Create: `packages/backend/src/engine/generation/prompts/navigation/styles/go-inside/exterior.ts`

```typescript
/**
 * Exterior Adaptation
 * Wraps generic nicheImagePrompt for open-air niches
 * DNA descriptors still drive the visual style
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../../../../../navigation/types';
import { nicheImagePrompt } from '../../nicheImagePrompt';
import {
  extractEntranceElement,
  buildParentStructureAnalysisExterior,
  buildTransformationRulesCondensedExterior,
  buildCompositionLayeringCondensedExterior
} from '../../../shared/promptSections';

/**
 * Exterior adaptation - adds structural rules for open-air spaces
 * Uses exterior-specific prompt sections from promptSections.ts
 */
export function exteriorAdaptation(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  // Extract entrance element from decision reasoning
  const entranceElement = extractEntranceElement(decision.reasoning);
  
  // Build exterior-specific structural sections
  const header = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 OPEN AIR SPACE: ${entranceElement}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;
  
  // Use exterior-specific prompt sections (open-air, sky visible, natural lighting)
  const parentAnalysis = buildParentStructureAnalysisExterior(context, entranceElement);
  const transformRules = buildTransformationRulesCondensedExterior();
  const compositionRules = buildCompositionLayeringCondensedExterior();
  
  // Call generic foundation (DNA-driven, space-type neutral)
  const foundation = nicheImagePrompt(context, intent, decision, navigationFeatures);
  
  // Combine: Exterior structure + foundation
  return `You are an expert at creating image prompts for FLUX image generation.

${decision.reasoning ? `CONTEXT: ${decision.reasoning}` : ''}

${header}

${parentAnalysis}

${transformRules}

${compositionRules}

${foundation}`;
}
```

### Step 2: Register the Adaptation

Edit: `packages/backend/src/engine/generation/prompts/navigation/styles/registry.ts`

```typescript
// Add import at the top
import { exteriorAdaptation } from './go-inside/exterior';

// Update STYLE_REGISTRY
export const STYLE_REGISTRY: Record<string, Record<string, StyleDefinition>> = {
  GO_INSIDE: {
    default: {
      name: 'interior',
      description: 'Enclosed interior spaces - DNA-driven style within structural interior rules',
      prompt: interiorAdaptation
    },
    exterior: {  // ADD THIS NEW ENTRY
      name: 'exterior',
      description: 'Open-air outdoor niches within location - sky visible, natural lighting',
      prompt: exteriorAdaptation
    }
  }
};
```

### Step 3: Test TypeScript Compilation

```bash
cd packages/backend && npx tsc --noEmit
```

### Step 4: Test in Application

1. Start your server (if not running)
2. Navigate to a location with outdoor features
3. Try: "go inside the courtyard" or "enter the garden"
4. Check logs - intent classifier should select exterior style
5. Verify the generated space has sky visible, no ceiling

**Done!** The intent classifier automatically includes your new adaptation.

---

## Part 2: Adding a DNA-Driven Style

**Example: Mystical Style** (reads DNA to enhance atmosphere)

### Step 1: Create the Style File

Create: `packages/backend/src/engine/generation/prompts/navigation/styles/go-inside/mystical.ts`

```typescript
/**
 * Mystical Style Enhancement
 * DNA-driven style that reads DNA fields and adds mystical atmosphere
 * Can layer on top of interior OR exterior adaptations
 */

import type { IntentResult, NavigationContext, NavigationDecision } from '../../../../../navigation/types';
import { interiorAdaptation } from './interior';

export function mysticalStylePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  // Get base adaptation (interior in this case, could be exterior)
  const basePrompt = interiorAdaptation(context, intent, decision, navigationFeatures);
  
  // Read DNA fields - THIS IS KEY
  const mood = context.currentNode.dna?.mood_baseline || '';
  const tone = context.currentNode.dna?.architectural_tone || '';
  const cultural = context.currentNode.dna?.cultural_tone || '';
  
  // Build DNA-driven mystical hints (no hardcoded rules!)
  const mysticalHints = `
MYSTICAL ATMOSPHERE ENHANCEMENT (DNA-driven):
Based on DNA fields:
- Mood: "${mood}" → Add ethereal, otherworldly qualities
- Architectural tone: "${tone}" → Integrate mysterious, ancient, sacred elements
- Cultural tone: "${cultural}" → Incorporate spiritual, ritualistic atmosphere

Subtle mystical enhancements:
- Soft, diffused glowing light sources (no obvious origin)
- Faint wisps of luminous mist or energy particles
- Subtle magical runes or symbols naturally integrated into architecture
- Atmosphere of reverence and mystery
- Enhanced color palette: Deep purples, blues, silver accents, golden glows
- Ethereal lighting: Soft glow emanating from within materials themselves`;

  return `${basePrompt}

${mysticalHints}`;
}
```

### Step 2: Register the Style

Edit: `packages/backend/src/engine/generation/prompts/navigation/styles/registry.ts`

```typescript
// Add import
import { mysticalStylePrompt } from './go-inside/mystical';

// Update registry
GO_INSIDE: {
  default: { name: 'interior', prompt: interiorAdaptation },
  exterior: { name: 'exterior', prompt: exteriorAdaptation },
  mystical: {  // ADD THIS
    name: 'mystical',
    description: 'Mystical, ethereal spaces with magical atmosphere - reads DNA mood and tone',
    prompt: mysticalStylePrompt
  }
}
```

### Step 3: Test

```bash
cd packages/backend && npx tsc --noEmit
```

### Step 4: Test in Application

Try commands with mystical keywords:
- "go inside the mystical temple"
- "enter the magical chamber"
- "step into the enchanted library"

Intent classifier will detect keywords and select mystical style.

---

## Key Principles

### For Adaptations (Structural)

✅ **DO**:
- Handle structure/perspective (interior/exterior/etc.)
- Call `nicheImagePrompt()` foundation
- Add structural rules (ceiling/no ceiling, walls/open space)
- Define perspective (enclosed vs open)

❌ **DON'T**:
- Hardcode visual styles
- Skip calling the foundation
- Duplicate foundation logic

### For Styles (Aesthetic)

✅ **DO**:
- Read DNA fields (`context.currentNode.dna`)
- Enhance atmosphere based on DNA
- Reference DNA values in your hints
- Keep it DNA-driven and flexible

❌ **DON'T**:
- Hardcode visual rules ("always use red")
- Ignore DNA fields
- Make style-specific assumptions
- Duplicate adaptation logic

---

## Advanced: Layering Styles on Any Adaptation

You can make styles work with multiple adaptations:

```typescript
export function mysticalStylePrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string
): string {
  // Detect which adaptation to use
  const isExterior = intent.spaceType === 'exterior';
  
  // Get appropriate base
  const basePrompt = isExterior
    ? exteriorAdaptation(context, intent, decision, navigationFeatures)
    : interiorAdaptation(context, intent, decision, navigationFeatures);
  
  // Add mystical enhancement (works with both!)
  const mysticalHints = buildMysticalHints(context.currentNode.dna);
  
  return `${basePrompt}\n\n${mysticalHints}`;
}
```

---

## Complete Workflow

1. **Create file** in `styles/go-inside/`
2. **Import foundation** or adaptation
3. **Build your prompt** (structure or style)
4. **Register in registry.ts**
5. **Test TypeScript** compilation
6. **Test in app** with appropriate keywords

---

## Troubleshooting

### My adaptation isn't being selected
- Check registry description - make it semantic and clear
- Intent classifier uses description to understand when to apply
- Try more explicit keywords in your test command

### TypeScript errors
- Verify imports are correct
- Check function signature matches `StylePromptFunction`
- Ensure all required parameters are handled

### Style not applying
- Check logs - is the style being selected?
- Verify your style is reading DNA fields correctly
- Make sure you're calling the base adaptation

---

## Best Practices

1. **Adaptations handle structure** - Interior/exterior rules only
2. **DNA handles style** - Always read DNA fields, never hardcode
3. **Reuse foundation** - Always call `nicheImagePrompt()` for core content
4. **Keep condensed** - Token efficiency matters for LLM costs
5. **Document clearly** - Registry descriptions guide LLM selection
6. **Test thoroughly** - Verify with different locations and DNA profiles

---

## Examples Gallery

### Minimal Adaptation
```typescript
export function simpleAdaptation(context, intent, decision, navFeatures) {
  const foundation = nicheImagePrompt(context, intent, decision, navFeatures);
  return `SIMPLE HEADER\n${foundation}`;
}
```

### DNA-Reading Style
```typescript
export function dnaStyle(context, intent, decision, navFeatures) {
  const base = interiorAdaptation(context, intent, decision, navFeatures);
  const mood = context.currentNode.dna?.mood_baseline;
  return `${base}\n\nENHANCE BASED ON: ${mood}`;
}
```

### Multi-Adaptation Style
```typescript
export function flexibleStyle(context, intent, decision, navFeatures) {
  const isExterior = intent.spaceType === 'exterior';
  const base = isExterior ? exteriorAdaptation(...) : interiorAdaptation(...);
  return `${base}\n\nSTYLE HINTS`;
}
```

---

## Further Reading

- `styles/README.md` - Architecture overview
- `nicheImagePrompt.ts` - Foundation implementation
- `promptSections.ts` - Reusable section builders
- `registry.ts` - Current registry

Happy building! 🎨
