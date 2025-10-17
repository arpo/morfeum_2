# Project Progress

## What Works ✅

### Character Pipeline Migration - Engine Phase 2 Complete (Latest - Just Completed) ✅
- **Complete Character Pipeline Migration**: Migrated character generation from deprecated spawn system to new `engine/` directory
- **Zero Content Changes**: Prompts identical to old system, proven to work
- **System Prompt Generation Added**: Characters respond with full personality in chat
  - `generateInitialSystemPrompt()` - From seed (basic personality using basicEntityDataFormatting → chatCharacterImpersonation)
  - `generateEnhancedSystemPrompt()` - From deep profile (full personality with 16 fields using enhancedEntityDataFormatting → chatCharacterImpersonation)
  - Both prompts emitted in SSE events (spawn:seed-complete and spawn:profile-complete)
- **Console Log Cleanup**: Removed 30 logs (28 frontend, 2 backend) - clean console following project rules
- **New Endpoint**: `/api/spawn/engine/start` for new pipeline, old `/api/spawn/start` marked deprecated
- **Files Created**: 5 new files (characterPipeline.ts + 4 prompt files)
- **Files Modified**: 13 total (3 backend, 10 frontend for log cleanup)
- **Quality Verified**: Zero TypeScript errors, characters respond in personality, clean console
- **Engine Progress**: Phase 0 ✅ Phase 1 ✅ Phase 2 ✅ (characters only, locations next)

### Engine Refactoring - Phase 0 & 1 Complete (Previously Completed) ✅
- **Strategic Refactoring Initiated**: Complete backend refactoring for prompt optimization
- **Phase 0 - Foundation Complete**:
  - ✅ Created `engine/` folder structure (generation/, navigation/, prompts/, utils/)
  - ✅ Created REASSEMBLY_PLAN.md with 10-phase roadmap and optimization tracking table
  - ✅ Added deprecation warnings to old code (SpawnManager, BasePipelineManager, navigator service)
  - ✅ Disconnected UI from backend (logs to console, UI still renders normally)
  - ✅ Created engine/README.md quick reference
- **Phase 1 - Utilities & Prompts Complete**:
  - ✅ Created `engine/utils/parseJSON.ts` - Handles markdown fences, safe parsing
  - ✅ Created `engine/types/index.ts` - Core types (EntitySeed, VisualAnalysis, DeepProfile, etc.)
  - ✅ Created `engine/prompts/templateBuilder.ts` - Tagged template system with token estimation
- **Design Decisions Confirmed**:
  - No unit tests (manual testing for speed)
  - Tagged templates (type-safe prompts)
  - Keep locationsSlice (don't rebuild storage)
  - Keep SSE (don't break events)
  - Focus on prompt optimization (main goal: trim tokens)
- **Testing Disconnected UI**:
  - Browser console shows: `[UI DISCONNECTED] Would call startSpawn with: {...}`
  - Navigation logs: `[UI DISCONNECTED] Would call NavigatorAI with: {...}`
  - UI renders normally, input clears, no actual generation
- **Files Created**: 7 new files (REASSEMBLY_PLAN.md, README.md, parseJSON.ts, types/index.ts, templateBuilder.ts)
- **Files Modified**: 5 files (deprecation warnings + UI disconnect)
- **Next Steps**: Phase 2 - Seed Generation (convert prompt to tagged template, trim and measure tokens)
- **Key Benefits**:
  - Safe refactoring (old system preserved)
  - Clean separation (new code in engine/)
  - Incremental progress (test each phase)
  - Optimization ready (foundation for trimming)
  - Full type safety (TypeScript coverage)
  - Clear documentation (roadmap + progress tracking)
- **Quality Verified**: All files compile, UI disconnected successfully, deprecation warnings in place

### LocationPanel Code Refactoring (Previously Completed) ✅
- **File Size Reduction**: Refactored useLocationPanel.ts from 477 lines to ~240 lines (50% reduction)
- **Created 3 Utility Modules**: Extracted complex logic into focused, testable modules
  - `locationNavigation.ts` (~200 lines) - NavigatorAI API calls and spatial data preparation
    - `buildCurrentLocationDetails()` - Extract visual context from node DNA
    - `buildSpatialNodes()` - Build spatial nodes with tree traversal data
    - `findDestination()` - Call NavigatorAI API with proper error handling
  - `locationCascading.ts` (~220 lines) - DNA extraction and inheritance logic
    - `buildCascadedContext()` - Extract and cascade DNA from parent nodes
    - `extractFromFlatDNA()` - Handle flat NodeDNA structure
    - `extractFromHierarchicalDNA()` - Handle hierarchical DNA structure
    - `validateParentNode()` - Validate parent is in same world tree
  - `locationSpawn.ts` (~50 lines) - Spawn initialization and parameter building
    - `startSublocationSpawn()` - Start sublocation spawn with proper parameters
- **Refactored Main Hook**: useLocationPanel.ts now focused on coordination
  - Main hook composition and state management
  - Separated `handleMoveAction()` and `handleGenerateAction()` into distinct functions
  - All functionality preserved, cleaner structure
- **Architecture Benefits**:
  - ✅ Size compliance: All files within 300-line architectural guideline
  - ✅ Separation of concerns: Each utility has single, clear responsibility
  - ✅ Easier testing: Individual functions can be tested independently
  - ✅ Better organization: Navigation, cascading, and spawn logic clearly separated
  - ✅ Code reusability: Utilities can be used by other components if needed
  - ✅ Maintainability: Easier to locate and modify specific functionality
- **Type Safety Maintained**: Fixed TypeScript error with spawn function signature
- **Quality Verification**:
  - ✅ Build success: Frontend builds successfully (361.97 kB, gzip: 107.66 kB)
  - ✅ Zero errors: TypeScript compilation passes with zero errors
  - ✅ No bundle increase: Tree shaking working correctly
  - ✅ Functionality preserved: All navigation and generation features work as before
- **Files Created/Modified**: 4 total (3 new utility files, 1 refactored hook)
- **Refactoring Pattern**:
  ```
  Before: useLocationPanel.ts (477 lines - exceeded guidelines)
  After:  useLocationPanel.ts (240 lines) + 3 focused utilities (470 lines)
  Result: Same functionality, better organization, easier maintenance
  ```

### Interior/Exterior Perspective System (Previously Completed) ✅
- **Complete Fix Chain**: NavigatorAI → Frontend → Backend → DNA → Image Generation
- **Perspective Inference**: "go to X" defaults to exterior (site), "go inside X" uses interior
- **Dynamic DNA Generation**: sublocationGeneration.ts creates exterior/interior DNA based on scale_hint
  - Exterior (site/area/macro): Uses terrain_type, outdoor lighting, weather conditions, exterior soundscapes
  - Interior (interior/detail): Uses terrain_or_interior, indoor lighting, air quality, interior soundscapes
- **Image Prompt Selection**: Correct prompt chosen based on scale_hint
  - Exterior: locationImageGeneration (outdoor focus)
  - Interior: sublocationImageGeneration (indoor focus)
- **Robust JSON Parsing**: Enhanced JSON extraction handles AI explanation text before JSON
  - Multiple fallback strategies (regex, index search, last resort extraction)
  - Works regardless of AI response format (with/without markdown fences, with/without preamble)
- **Complete Logging Chain**: Every step logged for debugging (NavigatorAI → Image Generation)
- **Quality Verified**: Zero TypeScript errors, correct DNA fields, appropriate image prompts
- **Files Modified**: 8 total (5 backend, 3 frontend)
- **Key Benefits**:
  - Correct perspectives: Marinas show harbors, not control rooms
  - Natural language: "go to marina" understood as exterior
  - Robust parsing: JSON extraction works with any AI response format
  - Complete chain: scale_hint flows from intent to final image
  - Backward compatible: Defaults to 'interior' if scale_hint missing

### Frontend
- **Project Structure**: Complete monorepo setup following SETUP_GUIDE.md
- **Design System**: Comprehensive design tokens and CSS custom properties with dark mode support
- **Component Architecture**: Strict separation of concerns implemented
- **UI Components**: Complete set of reusable components (Button, Card, LoadingSpinner, Message, ThemeToggle, Modal)
- **Icon Management**: Optimized centralized icon system with only used exports
- **State Management**: Zustand store with chat manager, spawn manager, and theme management slices
- **Multi-Spawn System**: Generate multiple AI entities simultaneously with progress tracking
- **Chat System**: Functional multi-session chat with AI entities (Gemini)
- **Entity Panels**: Dedicated CharacterPanel (chat) and LocationPanel (travel) components with shared base logic
- **Skeleton Loaders**: Immediate visual feedback with pulsating gradient effect filling entire 300px container
  - Fixed height prevents layout shifts throughout entity generation
  - Smooth pulsating animation (opacity 0.4 → 0.8, 2s cycle)
  - Proper z-index layering (skeleton: 1, image: 2, buttons: 3)
  - Buttons visible when image loaded (fullscreen, info, save)
  - Edge-to-edge gradient effect with hardcoded visible colors
- **Dark Mode Implementation**: Complete theme system with light/dark/system options, persistent storage, and WCAG compliance
- **Theme Toggle**: Optimized floating button in bottom right corner with responsive positioning
- **Build System**: Vite configuration with path aliases
- **TypeScript**: Proper type definitions throughout
- **Code Quality**: All components follow 50-300 line limits and architectural rules
- **Bundle Optimization**: Reduced bundle size with tree-shaking and unused export elimination
- **Accessibility**: WCAG AA/AAA compliant color contrasts and semantic HTML

### Backend
- **Modular Architecture**: Domain-driven design with 13 focused modules
- **Configuration Management**: Environment-specific configs (dev/prod/test)
- **Middleware Stack**: CORS, error handling, async wrappers
- **Route Organization**: Domain-based routing with clear separation (api.ts, mzoo.ts, health.ts)
- **Service Layer**: Static file serving and business logic separation
- **Type Safety**: 100% TypeScript coverage with zero build errors
- **Error Handling**: Custom error classes with proper logging
- **API Endpoints**: 
  - Generic: /api, /api/info
  - MZOO AI: /api/mzoo/vision, /api/mzoo/gemini/text, /api/mzoo/fal-flux-srpo/generate
  - Entity Generation: /api/mzoo/entity/generate-seed, /api/mzoo/entity/generate-image, /api/mzoo/entity/analyze-image, /api/mzoo/entity/enrich-profile
  - Health: /health, /health/detailed
- **Monitoring**: Enhanced health checks with system metrics
- **File Size Compliance**: All routes follow 100-200 line guidelines (api.ts: 45, mzoo.ts: 196, health.ts: 54)
- **Environment Variables**: Dotenv integration for secure configuration
- **External API Integration**: MZOO AI services with secure proxy pattern
- **Centralized Prompts**: All AI prompts in packages/backend/src/prompts/ with type safety
- **JSON Parsing**: Reliable JSON extraction and parsing for all AI responses

### Entity Generation Pipeline
- **Progressive Loading**: Four-phase pipeline (Seed → Image → Visual Analysis → Deep Profile)
- **Seed Generation**: Character data with name, looks, wearing, personality
- **Image Generation**: FAL Flux image generation from seed data
- **Visual Analysis**: Gemini Vision API analyzing generated images
- **Deep Profile**: Comprehensive character enrichment with 16 fields
- **JSON Parsing**: All AI responses use reliable JSON.parse() instead of regex
- **Frontend Logging**: Browser console debugging for seed, analysis, and profile data
- **Chat Integration**: Immediate chat initialization with seed data (progressive experience)

### Multi-Spawn Chat System
- **SpawnInputBar Component**: Textarea input with shuffle/generate buttons for character creation
- **ActiveSpawnsPanel**: Real-time progress tracking with visual progress bars (25%, 50%, 75%, 90%, 100%)
- **ChatTabs Component**: Multi-session tab management with active tab highlighting and close buttons (renamed to "Entities")
- **Chat Component**: Functional messaging with message bubbles, auto-scroll, loading states
- **Chat Manager Store**: Complete message handling (send, load, error) with personality storage
- **SSE Events**: Server-sent events for spawn progress and system prompt updates
- **Enhanced System Prompts**: Automatically upgrade from seed to deep profile (16 fields)
- **Chat UI**: Full-width entity images, personality display, clean message bubbles
- **Message Persistence**: All messages stored per chat session in Zustand store
- **Real-time Updates**: Seamless system prompt updates without disrupting conversation
- **Scrollable Lists**: Entities panel and Active Spawns panel have scrollbars when lists exceed max height

### World-Centric Tree Architecture & Saved Locations (Latest - Just Completed)
- **Complete World-Centric Saved Locations System**: Transformed UI to show only world nodes
  - Saved Locations modal displays worlds only (filtered view)
  - Each world card shows thumbnail, name, and "Contains X nodes" count
  - Clean, organized world management without nested node clutter
- **Cascade Tree Deletion**: Complete world tree removal with single action
  - `deleteWorldTree(worldId)` method recursively deletes all descendants
  - Smart confirmation: "Delete this world and all 8 nodes in it?"
  - Complete cleanup: removes nodes, tree structure, and pins
- **Node Count Helper**: `getWorldNodeCount(worldId)` returns total nodes in tree
  - Used in deletion confirmation and card display
  - Provides transparency about tree size
- **Auto-Load All World Tree Children on Startup**: Recursive child loading
  - Previous: Only world node loaded, children lost on page refresh
  - New: Recursively loads ALL children (regions, locations, sublocations)
  - Implementation in App.tsx with `loadChildren()` recursive function
  - Result: Complete tree structure visible in ChatTabs after refresh
- **ChatTabs Tree Display**: Hierarchical indentation maintained
  - Depth calculation traverses world trees
  - Visual indentation: `paddingLeft: calc(var(--spacing-md) + ${depthLevel * 20}px)`
  - Hierarchy indicator: `└─` symbol for child nodes
  - Tree structure preserved exactly as during generation
- **World Node Image & Name Fix**: Correct display in Saved Locations
  - Bug fixed: World nodes now retrieve image from chat session when created
  - Timing: image-complete → stores in chat → profile-complete → creates world node → retrieves image
  - Note: Old worlds need deletion and regeneration (data migration issue)
- **Files Modified**: 10 frontend files (no backend changes needed)
- **Quality Verified**: TypeScript zero errors, tree loading works, cascade deletion confirmed
- **Key Benefits**:
  - Clean world management interface
  - Complete tree deletion with data integrity
  - Persistent tree structure across page reloads
  - Visual consistency with thumbnails and names
  - User experience matches generation-time display

### Multi-View Preparation & Distance-Based Navigation (Latest - Just Completed)
- **generateViewDescriptions.ts Prompt**: Infrastructure for multi-view text descriptions
  - Generates north/south/east/west directional views (text only, ~1-2 seconds)
  - Output includes: looks, focusTarget, renderInstructions, hasImage flag
  - Prepared for lazy image generation when user looks in that direction
  - Optional integration in LocationSpawnManager (commented out by default)
- **Distance-Based Navigation Enhancement**:
  - **"Go closer to X"**: Generates detail child node with scale_hint: "detail"
  - **"Go back" / "move away"**: Returns to parent node (wider view)
  - Added comprehensive examples (Scenarios 7 & 8) to NavigatorAI prompt
  - Full integration into navigation decision tree
- **locationSeedGeneration.ts Updated for Close-Ups**:
  - Special detection for detail/close-up views (phrases like "Closer to", "Approach")
  - Target object becomes dominant subject filling 70%+ of frame
  - Uses tight framing (close-up, detail shot, intimate perspective)
  - Inherits parent location's atmosphere, mood, visual style
  - Minimizes new invention - focuses on what already exists
- **Type System Complete**: Added generateViewDescriptions to PromptKey and PromptTemplates
- **Error to Warning Fix**: Changed "Target node not found" from error to warning in useLocationPanel
- **Files Modified**: 6 total (4 backend prompts, 1 type file, 1 frontend logic)
- **Quality Verified**: Backend builds successfully with zero TypeScript errors

### NavigatorAI - Complete Spatial Navigation System (Latest - Just Completed)
- **Complete LLM-Powered Navigation System**: Uses Gemini 2.5 Flash Lite to analyze user intent and find/generate locations
- **architectural_tone Field Integration**: Added to NodeDNA for visual style cascading
  - Ensures architectural consistency from parent to child locations
  - Example: "Gothic cathedral" → interior sublocations inherit gothic style
  - Flows through locationDeepProfileEnrichment prompt and sublocation generation
- **NavigatorAI Action Selection Fixed**: Clear decision tree for move vs generate actions
  - Explicit rules prevent AI confusion
  - Self-move prevention (never move to same node)
  - JSON-only output with no text refusals
  - Added examples for distant location generation
- **Inside/Outside Navigation Complete**:
  - **"Go Inside" Detection**: Recognizes "go inside", "enter", "step into", "interior"
    - Action: Generates interior sublocation with scale_hint: interior
    - Parent: Current exterior location
  - **"Exit/Outside" Detection**: Recognizes "exit", "leave", "go outside", "back"
    - Action: Move to parent location
    - Backend auto-fills parent ID from tree traversal
    - User-friendly error: "You're already at the top level of this world"
- **Parent Node Tree Traversal**: Deterministic parent lookup
  - Frontend populates parent_location_id by traversing tree structure
  - Backend auto-fills targetNodeId for parent navigation
  - No more AI guessing at parent relationships
- **Visual Context Integration**: Enhanced spatial reasoning
  - CurrentLocationDetails interface provides visual anchors
  - Dominant elements and unique identifiers from current scene
  - Better AI understanding for "inside that building" commands
- **Error Handling Improvements**: User-friendly messaging
  - Top-level exit attempt: Clear message instead of technical error
  - Frontend graceful handling with clean logging
  - Ready for future toast notification integration
  - **Natural Language Commands**: "go inside", "back to beach", "explore tower", "teleport to caves"
  - **Semantic Understanding**: Matches fuzzy user intent to world nodes using LLM reasoning
  - **Smart Generation**: Creates new locations when no suitable match exists
  - Replaces traditional vector search with intelligent spatial reasoning
- **Backend Architecture**:
  - **Prompt** (`navigatorSemanticNodeSelector.ts` - 108 lines):
    - Takes user command, current focus, all world nodes as context
    - Understands hierarchy (child nodes = "inside", parent = "back to")
    - Returns JSON: action (move/generate), targetNodeId, name, relation, reason
    - Includes examples for training LLM on spatial reasoning
  - **Service** (`navigator.service.ts` - 116 lines):
    - `findDestinationNode()` main navigation function
    - Calls Gemini through MZOO service
    - JSON parsing with markdown code block extraction
    - Returns NavigationResult with action details
  - **API Endpoint** (`routes/mzoo/navigator.ts` - 81 lines):
    - POST `/api/mzoo/navigator/find-destination`
    - Validates userCommand, currentFocus, allNodes
    - Protected by MZOO API key middleware
- **Frontend Integration** (`useLocationPanel.ts`):
  - Enhanced `handleMove()` with full NavigatorAI integration
  - Fetches current location and focus state
  - Gets all nodes in world for LLM context
  - Calls backend NavigatorAI endpoint
  - **Move Action**: Updates focus to existing target location
  - **Generate Action**: Triggers location spawn with LLM-suggested name
  - Comprehensive console logging for debugging
- **NavigationResult Interface**:
  ```typescript
  {
    action: 'move' | 'generate';
    targetNodeId: string | null;      // For move
    name: string | null;               // For generate
    relation: 'sublocation' | 'adjacent' | 'nearby' | 'parent' | 'teleport' | null;
    reason: string;                    // LLM explanation
  }
  ```
- **Example Flows**:
  - **Move**: "go inside" → Finds "Lighthouse Interior" child node → Updates focus
  - **Generate**: "explore hidden tower" → No tower exists → Spawns new "Hidden Tower" location
- **Files Modified**: 7 total (4 backend, 2 type definitions, 1 frontend)
- **Quality Verification**:
  - ✅ Backend Build: Successful (zero errors)
  - ✅ Frontend Build: Successful (338.67 kB, gzip: 102.46 kB)
  - ✅ API Endpoint: Registered and protected
  - ✅ Type Safety: Full TypeScript coverage
  - ✅ Architecture: Follows all project patterns
- **Key Benefits**:
  - Natural language navigation (no precise commands needed)
  - Context-aware spatial understanding
  - Fuzzy matching for imprecise commands
  - Smart generation only when needed
  - Explainable decisions with reason field
  - Foundation for embeddings optimization
- **Integration Points**:
  - Uses Focus System for spatial context
  - Reads from locationsSlice for world nodes
  - Triggers spawn system for new locations
  - Reuses MZOO Gemini integration
  - Activates from LocationPanel travel button
- **Next Steps**:
  - Add perspective inference from commands
  - Switch active chat to target after move
  - Implement embedding-based candidate shortlisting
  - Add navigation history for "go back"
  - Support multi-hop navigation

### Focus System for Location Navigation (Previously Completed)
- **Complete Focus State Tracking**: Monitors where user is viewing from in world node tree
  - **FocusState Interface**: node_id, perspective, viewpoint, distance fields
  - Added to both backend (`packages/backend/src/services/spawn/types.ts`) and frontend types
  - Extended Location interface with optional `focus?: FocusState` field
- **Focus Management Infrastructure**:
  - **Utility Functions** (`packages/frontend/src/utils/locationFocus.ts`):
    - `initFocus(location)`: Initialize from DNA's viewContext with sensible defaults
    - `updateFocus(currentFocus, nodeId, updates)`: Create updated focus state immutably
  - **Store Methods** (`locationsSlice.ts`):
    - `updateLocationFocus(locationId, focus)`: Update focus state for a location
    - `getLocationFocus(locationId)`: Retrieve current focus state
    - `ensureFocusInitialized(locationId)`: Auto-initialize from viewContext if missing
- **LocationInfoModal Enhancements**:
  - **New 🎯 Current Focus Section**: Displays at top showing node_id, perspective, viewpoint, distance
  - **Reversed Section Order** for better information hierarchy:
    - 🎯 Current Focus (most immediate - where you are now)
    - 📍 Location (specific site details)
    - 🗺️ Region (broader area)
    - 🌐 World DNA (foundational - at bottom)
  - **Fallback Display Logic**: Shows focus from viewContext in DNA if location not saved yet
  - Works for both saved and newly spawned locations
- **Type System Updates**:
  - Added `FocusState` to LocationInfoModal types
  - Added `locationId` prop to LocationInfoModal
  - Added `activeChat` to EntityPanelBaseState for proper type safety
  - Updated LocationNode.profile to include optional viewContext field
- **Quality Assurance**:
  - ✅ Frontend Build: Successful (336.83 kB, gzip: 101.87 kB)
  - ✅ Backend Build: Successful (zero TypeScript errors)
  - ✅ Focus Display: Works for both saved and unsaved locations
  - ✅ Architecture Compliance: Follows all project patterns
- **Files Modified**: 9 total (3 backend, 6 frontend)
- **Key Benefits**:
  - Navigation Ready: System knows where user is viewing from
  - Future-Proof: Foundation for sub-location generation and world navigation
  - Better UX: Information hierarchy flows from immediate to foundational
  - Flexible Display: Works for both saved and unsaved locations
  - Type Safety: Full TypeScript coverage throughout

### Location Creation System (Previously Completed)
- **Dual-Entity Support**: Complete support for both characters AND locations
- **Location Prompts**: 4 specialized location prompt files (sample, seed, image, deep profile)
- **Smart UI Adaptation**: Chat component conditionally renders based on entity type
  - Locations: Image + name + info button only (no chat interface)
  - Characters: Full chat interface with messages and input
- **Entity Type Detection**: Auto-detects entity type (locations have `atmosphere`, characters have `personality`)
- **Visual Differentiation**: Purple color (#8b5cf6) for locations, blue (#3b82f6) for characters
- **Landscape Filter**: Locations use "Landscape Overview" filter for scenic image generation
- **Type Safety**: Full TypeScript support for entity types throughout the stack
- **No Code Duplication**: Reused Chat component with conditional rendering instead of separate viewer
- **LocationInfoModal**: Complete modal component for displaying location deep profile data
  - 5 component files following architectural patterns (types, logic, markup, styles, index)
  - **Split JSON Display**: Two distinct sections (Location Instance + World DNA)
  - Location Instance: name, looks, mood, sounds, airParticles (scene-specific)
  - World DNA: colorsAndLighting, atmosphere, flora, fauna, architecture, materials, genre, symbolicThemes, fictional, copyright (persistent environmental DNA)
  - Conditional modal rendering based on entity type in Chat component
  - ESC key support and backdrop click to close
- **Location Deep Profile Refactoring**:
  - **Flat 15-field JSON**: Refactored prompt to output flat structure instead of nested
  - **Field Renaming**: vegetation → flora, animals → fauna
  - **New Fields**: materials, symbolicThemes, airParticles
  - **Shared Utility**: Created `packages/frontend/src/utils/locationProfile.ts` as single source of truth
  - **DRY Principle**: Eliminates code duplication between useSpawnEvents and LocationInfoModal
  - **Split Architecture**: Clear separation between world DNA (reusable) and location instance (scene-specific)
  - **Scalability**: Foundation for generating multiple locations within same world

## What's Left to Build 🚧
- Additional UI components (Input, Modal, Table, etc.)
- Routing setup with react-router-dom (if needed)
- Error boundaries and enhanced loading states
- Testing infrastructure with Vitest
- ESLint configuration for code quality
- Advanced chat features (typing indicators, reactions, attachments)
- Entity management features (save, load, delete entities)
- Chat history persistence (database integration)
- User authentication and profiles
- Additional MZOO API endpoints integration

## Current Status
**Phase 1 Complete**: Core architecture and patterns established
**Phase 2 Complete**: Component refactoring and optimization finished
**Phase 3 Complete**: Backend refactoring and modular architecture implemented
**Phase 4 Complete**: MZOO database integration with secure proxy pattern
**Next Phase**: Build out additional features and API integrations

## Known Issues
- None - all TypeScript and build issues resolved

## Technical Debt
- Eliminated through refactoring - architecture enforces clean patterns
- All components follow size limits (50-300 lines)
- No mixing of concerns in any file
- Consistent naming and file organization
- Legacy styles removed and migrated to design tokens

## Performance Considerations
- Bundle size optimized: CSS reduced from 5.09 kB to 4.96 kB
- Icon exports optimized from 47 to 1 used icon
- CSS Modules prevent style conflicts
- Zustand provides efficient state management
- Component lazy loading can be added as needed

## Security Notes
- No known security issues
- Proper TypeScript usage prevents runtime errors
- CSP-friendly CSS Modules approach
- Clean dependency management with minimal unused imports

## Recent Refactoring Achievements

### Multi-Pin System for Saved Entities (Latest - Just Completed)
- **Unlimited Pins Per Type**: Upgraded from single-pin limitation to array-based storage
  - Previous: One pinned character + one pinned location maximum
  - New: Pin as many characters/locations as desired
- **Storage Architecture**: Changed `pinnedId: string | null` → `pinnedIds: string[]` in both slices
- **Toggle Functionality**: Simple pin/unpin with `togglePinned(id)` method
- **Auto-Load All Pinned**: Every pinned entity loads automatically into tabs on page refresh
- **Bug Fix**: Solved infinite loop by using `getState()` instead of hook calls in component body
- **UI Polish**: Increased button spacing, removed card lift on hover, smooth image zoom easing
- **Files Modified**: 11 files across storage slices, modal components, and App.tsx
- **Quality Verified**: Build successful (316.26 kB), zero TypeScript errors, no infinite loops

### Location Creation & UI Refinements (Previous)
- **Location Generation Pipeline**: Complete backend support with 4 specialized prompt files
- **Dual-Entity System**: Seamless handling of characters and locations in same UI
- **Smart Chat Component**: Conditional rendering based on entity type (no separate viewer needed)
- **Color Coding**: Purple for locations, blue for characters throughout UI
- **Font Size Optimizations**: Reduced textarea fonts to 12px (var(--text-xs)) for better UX
- **Scrollbar Implementation**: Both Entities and Active Spawns panels scroll when lists exceed height
- **Container Overflow Fix**: Changed overflow from hidden to visible to allow scrollbars
- **Entity Type Flow**: Backend → SSE event → store → UI components with full type safety
- **LocationInfoModal Component**: Complete modal for location deep profile display
  - Created 5 files following strict separation (types, logic, markup, styles, index)
  - **Split JSON Display**: Location Instance (5 fields) + World DNA (10 fields) sections
  - Conditional modal routing in Chat.tsx based on entityType
  - Generic button tooltips ("View info") work for both entity types
  - Type safety with appropriate casting for deep profile compatibility
- **Location Deep Profile Refactoring**:
  - Updated `locationDeepProfileEnrichment.ts` to output flat 15-field JSON
  - Renamed fields: vegetation → flora, animals → fauna
  - Added new fields: materials, symbolicThemes, airParticles
  - Created shared utility `locationProfile.ts` with WORLD_DNA_KEYS, LOCATION_INSTANCE_KEYS, and splitWorldAndLocation function
  - Updated useSpawnEvents.ts and LocationInfoModal.tsx to use shared utility
  - Console logs split JSONs (🌍 World DNA + 📍 Location Instance)
  - Modal displays split JSONs in two distinct sections
  - Architectural decision: airParticles in location instance (scene-specific, not world DNA)
- **Files Modified**: 28 files total (6 backend, 22 frontend) with zero TypeScript errors
- **Quality Verified**: All architectural patterns followed, design tokens used, no code duplication, full accessibility, DRY principle enforced

### Dark Mode Implementation (Previous)
- **Complete Theme System**: Implemented comprehensive dark mode with light/dark/system options
- **Enhanced Design Tokens**: Extended tokens.module.css with full dark theme color variables
- **Theme Management**: Created themeSlice.ts Zustand store with localStorage persistence and system detection
- **Theme Toggle Component**: Built complete component following strict architectural patterns (types, logic, markup, styles)
- **Optimized Positioning**: Moved theme toggle to bottom right corner as floating button with responsive positioning
- **Fixed All Hardcoded Colors**: Updated SpawnInputBar, EntityGenerator, and Button components to use design tokens
- **Accessibility Compliance**: WCAG AA/AAA compliant color contrasts and semantic HTML
- **Space Optimization**: Theme toggle doesn't consume sidebar space, always accessible
- **Files Modified**: 15 files total including components, styles, store, and documentation
- **Quality Verified**: TypeScript compilation passes with zero errors, all components follow architectural rules

### Deep Profile Enrichment Enhancement (Previous)
- **Original Prompt Integration**:
  - Modified `deepProfileEnrichment.ts` to accept `originalPrompt` as third parameter
  - Updated function signature: `(seedJson: string, visionJson: string, originalPrompt: string) => string`
  - Integrated original user request into prompt template for better AI context
- **Pipeline Stage Updates**:
  - Updated `pipelineStages.ts` enrichProfile() to extract and pass `seed.originalPrompt`
  - Graceful fallback to 'No specific request provided' if prompt missing
- **Type Safety Improvements**:
  - Updated `types.ts` interface for deepProfileEnrichment function
  - Updated profile route endpoint to accept `originalPrompt` in request body
  - Full TypeScript compilation success with zero errors
- **Benefits**:
  - Better character consistency with user's original request
  - More context for nuanced character development
  - Enhanced AI understanding of user intent
  - Backward compatible with existing code
- **Files Modified**: 4 files total (prompt, pipeline, types, route)

### UI Layout & Chat Enhancements (Previous)
- **Markdown-Enhanced Chat Narrative**:
  - Installed `react-markdown` package for message rendering
  - Updated chat impersonation prompt with concise markdown formatting guidelines
  - Narrative limited to 1-5 words per element (*soft laugh*, *pause*, *eyes narrow*)
  - Styled italics to be subtle/secondary (90% size, 75% opacity)
  - Dialogue-focused (70-80%), narrative as atmospheric accent (20-30%)
- **4-Column Responsive Layout**:
  - [Sidebar: 350px] | [Chat: 400-600px] | [Reserved: flex] | [History: 350px]
  - Responsive breakpoints at 1600px, 1400px, 1024px
  - Column 3 reserved for future panels
  - Chat constrained to max 600px for better readability
- **Collapsible Chat History Panel**:
  - Expandable/collapsible like ActiveSpawnsPanel
  - Message count badge
  - Collapsed by default to maximize workspace
  - Vertical detail display (not side-by-side)
- **Vertical Chat Tabs**:
  - Replaced horizontal tabs with vertical list
  - Entity images (48x48px) or letter placeholders
  - No horizontal overflow with unlimited sessions
  - "Chat Sessions" header panel
- **Text Formatting Fixes**:
  - `white-space: pre-wrap` for line break preservation
  - Vertical stacking for ChatHistoryViewer details
  - Proper markdown paragraph spacing
- **Files Modified**: 9 files total (prompt, chat components, layout)

### Multi-Spawn Chat System Implementation (Previous)
- **Functional Chat**: Complete message exchange with Gemini AI
- **Chat Manager Store**: sendMessage, setLoading, setError, entityPersonality field
- **Enhanced System Prompts**: Deep profile data (16 fields) updates seamlessly
- **Chat UI Redesign**: Full-width images, name/personality display, message bubbles
- **Components Created**:
  - SpawnInputBar (textarea, shuffle, generate)
  - ActiveSpawnsPanel (progress tracking)
  - ChatTabs (multi-session tabs)
  - Chat (functional messaging UI)
- **Files Modified**: 7 files across frontend/backend for complete chat functionality
- **Architecture**: Store-connected patterns, SSE events, message persistence

### EntityGenerator Component Refactoring (Previous)
- **Component Breakdown**: Refactored EntityGenerator.tsx from 231 lines to 89 lines (62% reduction)
- **4 New Components Created**: EntityInputSection, EntitySeedCard, VisualAnalysisCard, DeepProfileCard
- **Size Compliance**: All components now under 150 lines (largest: DeepProfileCard at 101 lines)
- **Architecture Adherence**: Strict separation of markup (.tsx), logic (.ts), and styles (.module.css)
- **Reusability**: Card components can be used independently across the application
- **Maintainability**: Easier to locate and modify specific features
- **CSS Fixes**: Fixed textarea width overflow with proper box-sizing
- **Build Verified**: TypeScript and Vite build successful with zero errors

### Entity Generation JSON Parsing (Previous)
- **Deep Profile Conversion**: Switched from regex field markers to JSON format
- **Visual Analysis Enhancement**: Explicit JSON output instructions in prompts
- **Parsing Reliability**: All three AI operations (seed, vision, profile) use consistent JSON parsing
- **Console Logging**: Frontend browser console logging for debugging (no terminal spam)
- **Chat Timing Fix**: Chat initializes immediately with seed data, doesn't wait for deep profile
- **Error Handling**: Better error messages with raw response included for debugging
- **Prompt System**: Centralized prompts in packages/backend/src/prompts/ with type safety

### MZOO Routes Refactoring (Previous)
- **Route Organization**: Created dedicated mzoo.ts (196 lines) for all MZOO endpoints
- **Code Cleanup**: Removed test endpoint, reduced api.ts to 45 lines (generic routes only)
- **Vision API**: Added POST /api/mzoo/vision endpoint for image analysis
- **File Size Compliance**: All route files within 100-200 line backend limits
- **Domain Separation**: Clear separation between generic API (api.ts) and MZOO AI (mzoo.ts)
- **Three AI Endpoints**: Text generation (Gemini), vision analysis, image generation (FAL Flux)

### MZOO Integration (Previous)
- **Backend Proxy**: Secure API proxy endpoints keeping API key server-side
- **Environment Configuration**: Dotenv integration for secure environment variable loading
- **Frontend Integration**: Automatic data fetching with proper state management
- **UI Display**: Clean presentation of MZOO data below headline
- **Security**: API keys never exposed to frontend, proper proxy pattern

### Backend Refactoring (Previous)
- **Modular Architecture**: Transformed 47-line monolith into 12 focused modules (532 lines)
- **Domain-Driven Design**: Implemented config/, middleware/, routes/, services/, types/, utils/
- **Type Safety**: Achieved 100% TypeScript coverage with zero build errors
- **Enhanced APIs**: Added /api/info, /health, /health/detailed endpoints
- **Error Handling**: Custom error classes with environment-specific responses

### Frontend Refactoring (Previous)
- **Legacy Style Cleanup**: Removed App.css, migrated index.css to design tokens
- **Component Extraction**: Created Card, LoadingSpinner, and Message reusable components
- **Icon Optimization**: Reduced icon exports by 98% (47 to 1)
- **Code Simplification**: Reduced total lines from 660 to 648 while adding functionality
- **Architecture Compliance**: All components strictly follow separation rules
