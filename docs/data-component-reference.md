# Data Component Reference

This document lists all `data-component` attributes used throughout the application for easy reference when discussing UI elements.

## Main UI Components

### Navigation & Input
- `data-component="spawn-input-bar"` - Main input area for spawning entities
- `data-component="active-spawns-panel"` - Panel showing spawns in progress
- `data-component="entity-tabs"` - Tabs for switching between loaded entities
  - `data-component="entity-tab"` - Individual entity tab
  - `data-entity-id="{id}"` - ID of the entity
  - `data-entity-type="{type}"` - Type of entity (character/location)

### Detail Panels
- `data-component="character-panel"` - Character detail panel (center column)
- `data-component="location-panel"` - Location detail panel (center column)

### Side Panels
- `data-component="chat-history-viewer"` - Chat history panel (right column)
- `data-component="image-prompt-panel"` - Image generation prompt panel (right column)

### Modals
- `data-component="saved-entities-modal"` - Modal for browsing saved characters/locations

### UI Controls
- `data-component="theme-toggle"` - Theme switcher button (bottom-right)

## Usage Examples

When referencing components in conversation:
- "the spawn-input-bar" - main input area
- "the active-spawns-panel" - spawns in progress
- "the entity-tabs" - tabs list
- "the character-panel" or "the location-panel" - center detail view
- "the chat-history-viewer" - right side chat history
- "the image-prompt-panel" - image prompt display
- "the saved-entities-modal" - saved items browser
- "the theme-toggle" - theme switcher

## Additional Context Attributes

Some components include additional context:
- Entity tabs include `data-entity-id` and `data-entity-type` for specific identification
- Modals may include component-specific data attributes

## Implementation Notes

- All `data-component` attributes are placed on the root element of each component
- Attributes use kebab-case naming convention
- Additional context is provided via `data-*` attributes when needed
- These attributes are for development/communication purposes and don't affect functionality
