# Active Context

## Current State (Nov 2025)
The Morfeum application is in active development with core systems operational.

### Recent Work Completed
- **Cascading Delete System** (Nov 7, 2025): Implemented proper cleanup when deleting nodes
  - Added `deleteNodeWithChildren()` method in locations store
  - Collects all descendant nodes recursively before deletion
  - Deletes from both location store and entity manager (tabs)
  - Cleans up pins for deleted nodes
  - Saves changes to backend automatically
  - Fixed orphaned tabs/nodes issue completely
  
- **Console Log Cleanup** (Nov 7, 2025): Removed spam logging
  - Cleaned 56+ console.log statements across 10 files
  - Kept only console.error/warn for actual issues
  - Professional, clean console output

- **Storage System**: Backend file storage operational (temp-db/)
  - Fixed backend path resolution issue (__dirname vs process.cwd())
  - Auto-save on all state mutations (pin/unpin/delete)
  - API endpoints: GET/POST/DELETE for `/api/worlds` and `/api/characters`

- **Memory Bank Optimization**: Reduced from 18,800 to 5,800 lines (69% reduction)
- **Terminology Standardization**: Changed "sublocation" → "niche" across entire codebase

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

2. **Backend Route Naming**: Some compiled files still use old naming
   - Event names like `spawn:sublocation-*` in dist/ files
   - Source files are clean

### Architecture Decisions
- **Flat Storage + Tree References**: Nodes store DNA, trees store relationships
- **Cascaded DNA**: DNA inheritance through tree traversal
- **Component Separation**: Strict separation of markup (.tsx), logic (.ts), styles (.css)
- **Zustand Slices**: 50-150 lines per slice for maintainability

### Next Steps
- Enable navigation generate action in frontend
- Enhance saved entities browser functionality
- Add more navigation features (look around, change perspective)
- Add character-to-location chat switching
- Move from temp-db to real database (when ready)
