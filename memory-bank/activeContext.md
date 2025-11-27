# Active Context

## Recent Changes (2025-11-27)

### Media Metadata Structure Cleanup (Nov 27, 2025)
- **Simplified Metadata**: Removed redundant `seed` object from media metadata that was storing duplicate character information already available in entity data.
- **Added originalPrompt**: Extracted and preserved only the user's original input as `originalPrompt` field at metadata root level.
- **Data Migration**: Created `cleanupMediaMetadata.ts` script that successfully migrated 11 existing media items to the new structure.
- **Type Updates**: Updated `MediaMetadata` interface to include `originalPrompt?: string` field.
- **Migration Script Updates**: Updated `migrateToMediaSystem.ts` to only extract `originalPrompt` from seed data, not the entire object.
- **Documentation**: Created `METADATA_CLEANUP_SUMMARY.md` documenting the changes and rationale.

**Metadata structure change:**
```typescript
// Before: Had redundant character data
{ prompt: "...", model: "FLUX", seed: { originalPrompt, name, looks, wearing, personality, presence, setting } }

// After: Clean structure with only essential data
{ prompt: "...", model: "FLUX", originalPrompt: "..." }
```

## Recent Changes (2025-11-26)

### Pipeline & Image Streaming Improvements (Nov 26, 2025)
- **Immediate Image Display**: All pipelines (character, worldTree, createNode) now display generated images in the entity background as soon as the image is ready, before the full pipeline completes.
- **Tree Expansion Fix**: Tree unfolding logic updated to support both legacy (`regions`, `locations`, `niches`) and new (`children`) node formats. Ensures correct node is unfolded and selected after pipeline completion.
- **Image Flicker Issue**: There is still a flicker when an image/node is selected and the same image is set again. This is the current focus for further improvement.

### Keyboard Shortcuts & Focus Mode Implementation (Nov 26, 2025)
- Centralized keyboard shortcut handling for UI toggles and focus mode.
- Focus mode hides all UI for distraction-free image viewing.
- State management and configuration improvements.

## Current Focus
- Resolving the image flicker issue when re-selecting a node with the same image.
- Ensuring robust, flicker-free image updates in all entity pipelines.

## Next Steps
- Implement logic to prevent redundant image updates when the image has not changed.
- Test for edge cases in entity selection and image rendering.
- Continue refining pipeline and UI responsiveness.

## Previous Context
(See below for earlier changes)
