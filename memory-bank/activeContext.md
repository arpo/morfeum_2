# Active Context

## Recent Changes (2025-12-09)

- **Memory bank fully reviewed and updated.**
- **DNA inheritance system:** All child nodes now inherit parent materials, palette, and mood via full parent DNA context and CSS-like merge logic.
- **Navigation pipelines:** GOTO and GO_INSIDE commands now create correct sibling/child nodes and show progress bar steps in real time.
- **Image generation:** Two-step LLM prompt system produces rich, DNA-accurate images for both interiors and exteriors.
- **Component separation:** All major files refactored to comply with 50-300 line limits and strict markup/logic/style separation.
- **Design system:** Centralized tokens, icon management, and CSS Modules enforced across frontend.
- **Backend storage:** File-based storage in temp-db/ is stable; migration to Supabase/PostgreSQL planned.
- **Testing and CI:** Pending implementation of Vitest, Playwright, and CI/CD pipeline.

## Current Focus

- Monitor pipeline performance and image quality.
- Plan database migration (Supabase/PostgreSQL).
- Expand testing coverage (unit, integration, E2E).
- Implement advanced navigation and media management features.
- Maintain documentation and update .clinerules only when new patterns or decisions arise.

## Next Steps

- Begin database migration planning.
- Expand automated test coverage.
- Continue feature development for chat, navigation, and media management.
- Update documentation as new patterns emerge.
