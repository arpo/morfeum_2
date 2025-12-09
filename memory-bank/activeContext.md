# Active Context

## Recent Changes (2025-12-09)

- **`--furnish` flag implemented end-to-end:** New optional flag for GOTO and GO_INSIDE commands that triggers detailed furnishing analysis in structure analyzer. Furnishing details (suggested items, placement notes) appear in image prompts.
- **Command flag system:** Extended COMMAND_FLAGS in backend config to support `--furnish`. Frontend commandParser now handles flag parsing and reconstructs text with flags for API transmission.
- **Backend flag parsing refactored:** Flags are now parsed at TOP of command handler (before building intent) to ensure clean text flows through the entire pipeline without flag leakage.
- **DNA inheritance system:** All child nodes inherit parent materials, palette, and mood via full parent DNA context and CSS-like merge logic.
- **Navigation pipelines:** GOTO and GO_INSIDE commands create correct sibling/child nodes with real-time progress bar steps.
- **Image generation:** Two-step LLM prompt system produces rich, DNA-accurate images for interiors and exteriors.

## Current Focus

- Monitor `--furnish` flag behavior and image quality with furnishing details.
- Plan database migration (Supabase/PostgreSQL).
- Expand testing coverage (unit, integration, E2E).
- Implement advanced navigation and media management features.

## Next Steps

- Test `--furnish` flag with various space types and parent contexts.
- Begin database migration planning.
- Expand automated test coverage.
- Continue feature development for chat, navigation, and media management.
