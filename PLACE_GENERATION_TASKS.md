# Place Generation System Implementation Tasks

## Overview
Implement a place generation system that mirrors the existing entity generation architecture, allowing users to create detailed locations/environments using the same 4-stage pipeline approach.

## Phase 1: Backend Place Pipeline Foundation

### 1.1 Create Place Types
- [ ] Add `PlaceSeed`, `PlaceVisualAnalysis`, and `PlaceProfile` interfaces to `packages/backend/src/services/spawn/types.ts`
- [ ] Define place-specific fields (name, type, architecture, atmosphere, features, environment, timeOfDay, scale)
- [ ] Create `PlaceProcess` interface extending base process types
- [ ] Update union types to include place processes

### 1.2 Create Place Generation Prompts
- [ ] Create `packages/backend/src/prompts/languages/en/placeSeedGeneration.ts`
- [ ] Create `packages/backend/src/prompts/languages/en/placeImageGeneration.ts`
- [ ] Create `packages/backend/src/prompts/languages/en/placeVisualAnalysis.ts`
- [ ] Create `packages/backend/src/prompts/languages/en/placeProfileEnrichment.ts`
- [ ] Update `packages/backend/src/prompts/languages/en/index.ts` to export place prompts
- [ ] Update `packages/backend/src/prompts/types.ts` to include place prompt interfaces

### 1.3 Implement Place Pipeline Stages
- [ ] Add `generatePlaceSeed()` function to `packages/backend/src/services/spawn/pipelineStages.ts`
- [ ] Add `generatePlaceImage()` function to pipeline stages
- [ ] Add `analyzePlaceImage()` function to pipeline stages
- [ ] Add `enrichPlaceProfile()` function to pipeline stages
- [ ] Ensure proper error handling and JSON parsing for all place stages

### 1.4 Create Place API Routes
- [ ] Create `packages/backend/src/routes/mzoo/place.ts` with place endpoints
- [ ] Add `/api/mzoo/place/generate-seed` endpoint
- [ ] Add `/api/mzoo/place/generate-image` endpoint
- [ ] Add `/api/mzoo/place/analyze-image` endpoint
- [ ] Add `/api/mzoo/place/enrich-profile` endpoint
- [ ] Update `packages/backend/src/routes/mzoo/index.ts` to include place routes
- [ ] Test all place endpoints with proper error handling

## Phase 2: Extend Spawn Manager for Places

### 2.1 Update Spawn Manager Types
- [ ] Extend `SpawnProcess` type to support both entities and places
- [ ] Add `contentType: 'entity' | 'place'` field to process interface
- [ ] Update spawn manager state to handle mixed content types
- [ ] Ensure backward compatibility with existing entity processes

### 2.2 Extend Spawn Manager Logic
- [ ] Update `packages/backend/src/services/spawn/SpawnManager.ts` to handle place spawning
- [ ] Add place pipeline execution to spawn manager
- [ ] Update SSE events to include place progress updates
- [ ] Ensure proper abort handling for place processes
- [ ] Add place-specific error handling and cleanup

### 2.3 Update Spawn Store
- [ ] Extend `packages/frontend/src/store/slices/spawnManagerSlice.ts` for place support
- [ ] Update spawn state to track content types
- [ ] Ensure place processes integrate with existing UI components
- [ ] Add place-specific selectors and actions

## Phase 3: Frontend Place Generation Components

### 3.1 Create PlaceGenerator Component Structure
- [ ] Create `packages/frontend/src/features/place-generation/` directory
- [ ] Create `packages/frontend/src/features/place-generation/components/PlaceGenerator/` directory
- [ ] Create `PlaceGenerator/types.ts` with place-specific interfaces
- [ ] Create `PlaceGenerator/usePlaceGeneratorLogic.ts` following entity pattern
- [ ] Create `PlaceGenerator/PlaceGenerator.tsx` main component
- [ ] Create `PlaceGenerator/PlaceGenerator.module.css` styling

### 3.2 Create Place Display Cards
- [ ] Create `PlaceGenerator/PlaceSeedCard/` component (50-60 lines)
- [ ] Create `PlaceGenerator/PlaceAnalysisCard/` component (40-50 lines)
- [ ] Create `PlaceGenerator/PlaceProfileCard/` component (80-120 lines)
- [ ] Each card follows strict separation: types.ts, .tsx, .module.css
- [ ] Ensure all cards use design tokens and follow UI patterns

### 3.3 Create Place Input Section
- [ ] Create `PlaceGenerator/PlaceInputSection/` component (40-50 lines)
- [ ] Add place-specific sample prompts
- [ ] Include shuffle button for place prompt samples
- [ ] Integrate with existing SpawnInputBar patterns

## Phase 4: UI Integration and Enhancement

### 4.1 Extend SpawnInputBar for Places
- [ ] Add entity/place toggle to `packages/frontend/src/features/spawn-input/SpawnInputBar/`
- [ ] Update `useSpawnInputLogic.ts` to handle content type selection
- [ ] Add place-specific placeholder text and samples
- [ ] Ensure smooth switching between entity and place modes

### 4.2 Update ActiveSpawnsPanel
- [ ] Extend `packages/frontend/src/features/spawn-panel/ActiveSpawnsPanel/` to show place icons
- [ ] Add place-specific progress indicators
- [ ] Update `SpawnRow.tsx` to handle place content display
- [ ] Ensure proper visual distinction between entities and places

### 4.3 Extend Chat System for Places
- [ ] Update `packages/frontend/src/store/slices/chatManagerSlice.ts` for place chat
- [ ] Add place-specific chat system prompts
- [ ] Extend chat UI to handle place descriptions and interactions
- [ ] Update `useSpawnEvents.ts` for place system prompt updates

## Phase 5: Testing and Polish

### 5.1 Backend Testing
- [ ] Test all place API endpoints manually
- [ ] Verify JSON parsing for all place responses
- [ ] Test error handling and edge cases
- [ ] Ensure place pipeline stages execute correctly
- [ ] Verify SSE events work for place spawning

### 5.2 Frontend Testing
- [ ] Test place generation flow end-to-end
- [ ] Verify place cards display correctly
- [ ] Test entity/place switching in SpawnInputBar
- [ ] Ensure ActiveSpawnsPanel handles mixed content types
- [ ] Test place chat interactions

### 5.3 Integration Testing
- [ ] Test simultaneous entity and place generation
- [ ] Verify UI consistency across all components
- [ ] Test dark mode compatibility for place components
- [ ] Ensure responsive design works for place cards
- [ ] Verify TypeScript compilation with zero errors

### 5.4 Performance and Polish
- [ ] Optimize place generation prompts for faster responses
- [ ] Add loading states and error handling for place components
- [ ] Ensure proper cleanup of place processes
- [ ] Add accessibility features for place UI elements
- [ ] Verify bundle size impact is minimal

## Phase 6: Documentation and Final Touches

### 6.1 Update Documentation
- [ ] Update `memory-bank/progress.md` with place generation features
- [ ] Update `memory-bank/activeContext.md` with current work
- [ ] Add place generation examples to documentation
- [ ] Update any relevant API documentation

### 6.2 Code Quality
- [ ] Ensure all place components follow 50-300 line limits
- [ ] Verify strict separation of concerns in all place files
- [ ] Check for hardcoded values and replace with design tokens
- [ ] Ensure proper TypeScript coverage for all place code
- [ ] Run final build and lint checks

## Success Criteria

### Functional Requirements
- [ ] Users can generate places using natural language descriptions
- [ ] Place generation follows same 4-stage pipeline as entities
- [ ] Places can be generated alongside entities without conflicts
- [ ] Place chat interactions work seamlessly
- [ ] All place data persists correctly in the system

### Technical Requirements
- [ ] Zero TypeScript compilation errors
- [ ] All components follow architectural patterns
- [ ] Proper error handling throughout the system
- [ ] Responsive design works on all screen sizes
- [ ] Dark mode compatibility for all place components

### User Experience Requirements
- [ ] Intuitive switching between entity and place generation
- [ ] Clear visual distinction between entities and places
- [ ] Consistent loading states and progress indicators
- [ ] Smooth chat interactions with generated places
- [ ] Professional UI that matches existing design system

## Estimated Timeline
- **Phase 1**: 2-3 days (Backend foundation)
- **Phase 2**: 1-2 days (Spawn manager extensions)
- **Phase 3**: 2-3 days (Frontend components)
- **Phase 4**: 2 days (UI integration)
- **Phase 5**: 1-2 days (Testing and polish)
- **Phase 6**: 1 day (Documentation)

**Total Estimated Time**: 9-13 days

## Notes
- Follow all existing architectural patterns strictly
- Reuse components where possible to maintain consistency
- Test each phase thoroughly before proceeding to the next
- Keep the same user experience patterns as entity generation
- Ensure backward compatibility with existing entity system
