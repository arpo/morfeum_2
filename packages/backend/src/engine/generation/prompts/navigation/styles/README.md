# Style System Documentation

The style system allows different visual variations for navigation intents without duplicating code.

## Architecture

**Registry-based**: All styles are registered in `registry.ts`  
**Intent-specific**: Each intent can have its own set of styles  
**Fallback**: Unknown styles default to 'default' style  
**Backward compatible**: No style specified = uses 'default'

## Current Styles

### GO_INSIDE
- **default**: Standard interior view (current nicheImagePrompt behavior)

## Adding New Styles

### 1. Create Style Prompt File

Create a new file for your style:

```typescript
// styles/go-inside/haunted.ts
import type { NavigationIntent, IntentResult, NavigationContext, NavigationDecision } from '../../../../navigation/types';

/**
 * Haunted interior style
 * Dark, gothic atmosphere with supernatural elements
 */
export function hauntedInteriorPrompt(
  context: NavigationContext,
  intent: IntentResult,
  decision: NavigationDecision,
  navigationFeatures?: string,
  mode: 'detailed' | 'condensed' = 'condensed'
): string {
  // Your custom prompt here
  // Can reuse sections from shared/promptSections.ts
  // Can reference parent prompt for structure
  
  return `Your custom prompt for haunted interiors...`;
}
```

### 2. Register Style

Add to `registry.ts`:

```typescript
import { hauntedInteriorPrompt } from './go-inside/haunted';

export const STYLE_REGISTRY = {
  GO_INSIDE: {
    default: {
      name: 'default',
      description: 'Standard interior view',
      prompt: nicheImagePrompt
    },
    haunted: {  // NEW!
      name: 'haunted',
      description: 'Dark, gothic, spooky interior with supernatural atmosphere',
      prompt: hauntedInteriorPrompt
    }
  }
};
```

### 3. That's It!

The style is now available. Users can trigger it by using style-related words:

**User**: "go inside the haunted mansion"  
→ Intent classifier detects "haunted" keywords  
→ Adds `style: "haunted"` to IntentResult  
→ Handler passes to pipeline  
→ Pipeline uses haunted prompt from registry

## Style Detection

The intent classifier (future enhancement) will detect style keywords from user commands:

- "haunted", "spooky", "dark" → `style: "haunted"`
- "burning man", "festival" → `style: "burning_man"`
- No keywords → `style: "default"`

## File Organization

```
styles/
  ├── registry.ts              # Central registry (edit this to add styles)
  ├── go-inside/              # Styles for GO_INSIDE intent
  │   ├── default.ts          # (future) Extracted default prompt
  │   ├── haunted.ts          # Haunted interior
  │   └── burning-man.ts      # Festival art style
  ├── enter-portal/           # Styles for ENTER_PORTAL intent
  │   ├── default.ts
  │   └── mystical.ts
  └── README.md               # This file
```

## Intent-Specific Styles

Not all intents need styles. Current support:

- ✅ **GO_INSIDE**: Creates interior nodes (supports styles)
- ❌ **GO_OUTSIDE**: Just navigation (no styles needed)
- ❌ **LOOK_AT**: View change (no styles needed)

To add style support for a new intent:

1. Add intent to STYLE_REGISTRY with default style
2. Create style-specific prompts as needed
3. Intent classifier will handle style detection

## Testing New Styles

```typescript
// Manual test:
const decision = { 
  action: 'create_niche',
  style: 'haunted',  // Force your style
  // ...
};

await runCreateLocationNodePipeline(decision, context, intent, apiKey);
```

## Phase 4: Prompt Refactoring (Future)

Currently, the `nicheImagePrompt` is hardcoded for interiors. In Phase 4, we'll refactor prompts to be more generic and accept style/perspective parameters directly.

**Phase 3 (Current)**: Infrastructure in place, prompts unchanged  
**Phase 4 (Future)**: Refactor prompts to be style-aware and generic

## Best Practices

1. **Reuse shared sections**: Use functions from `../shared/promptSections.ts`
2. **Keep prompts focused**: Each style should have a clear visual identity
3. **Document clearly**: Add description in registry for intent classifier
4. **Test thoroughly**: Ensure style produces expected visuals
5. **Consider context**: Styles should respect parent node context

## Examples

**Default Interior** (current behavior):
```
User: "go inside"
Style: default
Result: Standard interior with parent context
```

**Haunted Interior** (future):
```
User: "go inside the haunted library"
Style: haunted
Result: Dark, gothic library with supernatural atmosphere
```

**Burning Man Art** (future):
```
User: "step inside the burning man art installation"
Style: burning_man
Result: Festival art style with interactive elements
