# Progress

## What Works ✅

### Core Application Features
- Contextual slash commands for navigation and node creation (NEW_HOST, NEW_REGION, NEW_LOCATION, NEW_NICHE, VIEW, GO_INSIDE, GOTO) with optional `--furnish` flag
- Entity system for character and location creation, storage, and management
- World tree system with hierarchical location structures
- 3D World View with depth rendering and stereo support
- Visual effects system with scene presets, particles, and post-processing
- Navigation system with AI-powered spatial navigation and intent classification
- Centralized media system with image storage and depth map generation
- Training data export for LoRA model training
- Real-time external view sync
- Chat system with entity sessions
- UI state management (panel toggles, focus mode, explorers)
- Full-screen image drag and drop for AI description

### Technical Architecture
- Strict component separation (JSX, logic, styles)
- All files under 300-line limit
- Zustand state management with clean slices
- Centralized design tokens and icon management
- TypeScript compilation and Vite builds working
- Feature-based folder structure

### Recent Improvements (Nov-Dec 2025)
- **Scale Consistency System (Dec 9):** Improved interior/exterior size matching:
  - `inferScaleFromDescription()` detects scale from parent descriptions ("modest" → small)
  - Tighter dimension ranges: small (2-4m), medium (4-10m), large (10-30m)
  - Critical scale rule: interior MUST be smaller than exterior
- **Opening Shape Inheritance (Dec 9):** Windows/openings now match exterior:
  - `extractOpeningShapesFromParent()` scans parent dominantElements for window shapes
  - New `openingShape` field in Structure interface
  - Image prompts include explicit window shape descriptions
- **`--furnish` command flag (Dec 9):** Optional flag for GOTO/GO_INSIDE that triggers furnishing analysis
- DNA inheritance system fixed: child nodes inherit parent materials, palette, and mood
- Navigation pipelines refactored: GOTO and GO_INSIDE create correct sibling/child nodes
- Two-step image generation: LLM prompt system for DNA-accurate images

## What's Left to Build 🚧

### Feature Development
- Enhanced chat features (rich text, file sharing, history)
- Advanced navigation (pathfinding, map view, bookmarks)
- Media management (bulk ops, filtering, metadata editing)
- User preferences (themes, layout)
- Collaboration (multi-user, shared worlds)

### Technical Improvements
- Performance optimization (code splitting, lazy loading)
- Testing (unit, integration, E2E)
- Documentation (components, API)
- Accessibility (ARIA, keyboard nav)
- Error handling (boundaries, feedback)

### Architecture Enhancements
- Plugin system for extensibility
- API versioning
- Advanced caching
- Real-time collaboration (WebSocket)

## Current Status 📊

- All files under size limits
- 100% TypeScript coverage, no any types
- All builds passing
- Strict separation patterns enforced
- Scale consistency system implemented for interior/exterior matching
- Opening shape inheritance for window consistency
- Pending: database migration, testing, CI/CD, advanced features

## Known Issues 🐛

- Legacy components may not follow latest patterns
- Bundle size warning (865KB) - needs code splitting
- Some Three.js ops could be optimized
- FAL API returns PNG despite JPEG request
- Route ordering for backend wildcards

## Development Standards 📋

- File size: 50-300 lines
- Separation: markup (.tsx), logic (.ts), styles (.module.css)
- Zustand slices with clear boundaries
- Centralized icons and design tokens
- TypeScript compilation success
- No console errors in dev
