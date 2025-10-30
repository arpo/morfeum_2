# Data Component Attributes

## Overview
All major UI components have `data-component` attributes on their root elements to make it easy to reference them in conversations and for debugging purposes.

## Pattern
- Add `data-component="component-name"` to the root element of each major component
- Use kebab-case naming (e.g., `spawn-input-bar`, not `spawnInputBar`)
- Place on the outermost container div/element of the component
- Add context attributes when needed (e.g., `data-entity-id`, `data-entity-type`)

## Complete List of Components
See `docs/data-component-reference.md` for the full reference of all data-component values.

### Main Components:
- `spawn-input-bar` - Main input for spawning entities
- `active-spawns-panel` - Shows spawns in progress
- `entity-tabs` - Entity navigation tabs
- `character-panel` - Character detail view
- `location-panel` - Location detail view
- `chat-history-viewer` - Chat history panel
- `image-prompt-panel` - Image prompt display
- `saved-entities-modal` - Saved entities browser
- `theme-toggle` - Theme switcher

## Usage in Conversations
When discussing components, prefer using the data-component name:
- ✅ "Update the spawn-input-bar"
- ❌ "Update the input panel on the left"

## When to Add New Attributes
Add `data-component` attributes when:
1. Creating a new major UI component
2. Creating a modal or panel
3. Creating a reusable feature component
4. Any component that might be frequently referenced

## Implementation Example
```tsx
export function MyComponent() {
  return (
    <div data-component="my-component">
      {/* component content */}
    </div>
  );
}
```

## With Additional Context
```tsx
export function EntityTab({ entityId, entityType }) {
  return (
    <div 
      data-component="entity-tab"
      data-entity-id={entityId}
      data-entity-type={entityType}
    >
      {/* tab content */}
    </div>
  );
}
```

## Benefits
- Clear component identification in browser DevTools
- Easier to reference in conversations
- Helps with debugging and testing
- Self-documenting UI structure
- Future-proofs for automated testing
