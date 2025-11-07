# Active Context

## Current State (Nov 2025)
The Morfeum application is in active development with core systems operational.

### Recent Work Completed
- **Memory Bank Optimization**: Reduced from 18,800 to 5,800 lines (69% reduction)
- **Terminology Standardization**: Changed "sublocation" → "niche" across entire codebase
- **Added Memory Bank Update Rules**: Created `.clinerules/memory-bank-updates.md` to prevent unnecessary updates

### Core Systems Status
- **Character Generation**: New engine pipeline operational
- **Location Generation**: Hierarchy system with world/region/location/niche layers
- **Navigation System**: NavigatorAI for spatial movement (disabled generate action currently)
- **Tree-Based Architecture**: Nodes (flat storage) + World Trees (nested structure)
- **Event System**: SSE for real-time spawn updates

### Known Issues
1. **Navigation Generate Action**: Currently disabled in frontend
   - Backend supports niche generation
   - Frontend handleGenerateAction commented out
   - Ready to enable when needed

2. **Backend Route Naming**: Some routes still use old naming
   - `/api/spawn/sublocation/*` routes in backend need renaming
   - Event names like `spawn:sublocation-*` in dist/ files
   - These are compiled files - source files are clean

### Architecture Decisions
- **Flat Storage + Tree References**: Nodes store DNA, trees store relationships
- **Cascaded DNA**: DNA inheritance through tree traversal
- **Component Separation**: Strict separation of markup (.tsx), logic (.ts), styles (.css)
- **Zustand Slices**: 50-150 lines per slice for maintainability

### Next Potential Work
- Enable navigation generate action in frontend
- Update backend compiled files with new niche terminology
- Add more navigation features (look around, change perspective)
- Implement saved entities browser
- Add character-to-location chat switching
