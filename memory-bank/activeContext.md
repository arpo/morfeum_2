# Active Context

## Current Work Focus
Multi-pin system implemented for saved entities (characters and locations). Users can now pin unlimited characters and locations that auto-load on startup. System uses array-based storage with toggle functionality, replacing the previous single-pin-per-type limitation. All pinned entities load into tabs automatically on page refresh.

## Recent Changes

### Multi-Pin System for Saved Entities (Latest - Just Completed)
1. **Upgraded from Single to Multiple Pins**:
   - Previous: One pinned character + one pinned location maximum
   - New: Unlimited pins per entity type (pin as many characters/locations as desired)
   - All pinned entities auto-load on startup into separate chat tabs
   - Last pinned entity becomes the active chat

2. **Storage Architecture Changes**:
   **Characters Slice** (`charactersSlice.ts`):
   - Changed: `pinnedId: string | null` → `pinnedIds: string[]`
   - Removed: `setPinned()`, `clearPinned()`, `getPinnedCharacter()`
   - Added: `togglePinned(id)`, `isPinned(id)`, `getPinnedCharacters()` (returns array)
   - Toggle behavior: Click to pin/unpin (adds/removes from array)
   
   **Locations Slice** (`locationsSlice.ts`):
   - Changed: `pinnedId: string | null` → `pinnedIds: string[]`
   - Removed: `setPinned()`, `clearPinned()`, `getPinnedLocation()`
   - Added: `togglePinned(id)`, `isPinned(id)`, `getPinnedLocations()` (returns array)
   - localStorage persistence for both slices

3. **Modal UI Updates**:
   - Updated `SavedEntitiesModal` to use array-based pin checking (`pinnedEntityIds.includes(entity.id)`)
   - Multiple entities show filled pin icon simultaneously
   - Pin button next to delete button with improved spacing
   - Visual feedback: `IconPin` (outline) when unpinned, `IconPinFilled` (filled) when pinned
   - Pinned state uses primary color for visual emphasis

4. **Auto-Load Implementation**:
   - App.tsx loads all pinned entities on mount using `useEffect` with empty dependency array
   - Uses `getState()` to avoid infinite loop (previous bug with direct hook calls)
   - Loads all pinned characters first, then all pinned locations
   - Each entity creates full chat session with image and deep profile
   - Last loaded entity set as active chat
   - Console logging for debugging: `"[App] Auto-loaded X characters and Y locations"`

5. **Bug Fix - Infinite Loop**:
   - **Problem**: Calling `getPinnedCharacters()` and `getPinnedLocations()` in component body created new arrays on every render
   - **Solution**: Moved calls inside `useEffect` and used `useCharactersStore.getState()` / `useLocationsStore.getState()`
   - **Result**: Pinned entities retrieved only once on mount, not on every render

6. **UI Polish**:
   - **Button spacing**: Changed actions container gap from `var(--spacing-xs)` to `var(--spacing-sm)`
   - **Card hover**: Removed `transform: translateY(-2px)` upward movement, kept shadow effect only
   - **Image zoom**: Added smooth `ease-out` animation (0.3s) for better feel

7. **Files Modified (11 total)**:
   - `packages/frontend/src/icons/index.ts` - Added IconPin, IconPinFilled
   - `packages/frontend/src/store/slices/charactersSlice.ts` - Array-based pins, toggle function
   - `packages/frontend/src/store/slices/locationsSlice.ts` - Array-based pins, toggle function
   - `packages/frontend/src/features/saved-locations/SavedLocationsModal/types.ts` - Updated interfaces
   - `packages/frontend/src/features/saved-locations/SavedLocationsModal/useSavedLocationsLogic.ts` - Toggle handlers
   - `packages/frontend/src/features/saved-locations/SavedLocationsModal/SavedLocationsModal.tsx` - Array-based UI
   - `packages/frontend/src/features/saved-locations/SavedLocationsModal/SavedLocationsModal.module.css` - Button styles + spacing
   - `packages/frontend/src/features/app/components/App/App.tsx` - Multi-entity auto-load logic
   - Plus 3 other supporting files

8. **Key Features Delivered**:
   - ✅ **Unlimited pins**: Pin as many characters/locations as needed
   - ✅ **Toggle functionality**: Click to pin/unpin any entity
   - ✅ **All auto-load**: Every pinned entity loads on startup
   - ✅ **Visual feedback**: Filled icons for all pinned entities
   - ✅ **localStorage persistence**: All pins survive page refresh
   - ✅ **No infinite loops**: Fixed with proper state access pattern
   - ✅ **Smooth animations**: Ease-out transitions for image zoom
   - ✅ **Better spacing**: Improved button layout

9. **Quality Verification**:
   - Build successful: 316.26 kB bundle, zero errors
   - Architecture compliance: All patterns followed
   - Type safety: Full TypeScript coverage
   - Performance: Single load on mount, no render loops

## Recent Changes (Continued)

### Location Creation & Dual-Entity System (Latest - Just Completed)
1. **Complete Location Generation Pipeline**:
   - Created 4 new location-specific prompt files mirroring character prompts:
     - `sampleLocationPrompts.ts` - Sample prompts for inspiration
     - `locationSeedGeneration.ts` - Initial location seed with atmosphere, mood, looks
     - `locationImageGeneration.ts` - "Landscape Overview" filter for scenic images
     - `locationDeepProfileEnrichment.ts` - Detailed location profile (looks, atmosphere, vegetation, architecture, animals, mood, sounds, genre, fictional, copyright)
   - Updated backend pipeline to handle both entity types
   - Entity type detection: locations have `atmosphere`, characters have `personality`

2. **Smart UI Adaptation**:
   - **Chat Component Refactor**: Reused existing Chat component for both entity types
   - **Conditional Rendering**:
     - Locations: Show only image + name + info button (NO chat UI, NO message history, NO input)
     - Characters: Show full chat interface with messages and input
     - Both: ImagePromptPanel always visible in right column
   - Added `entityType?: 'character' | 'location'` prop to Chat component
   - Passed entityType from App.tsx based on chat session data

3. **Entity Type Management**:
   - Added `entityType` field to `ChatSession` interface
   - Updated `createChatWithEntity()` to accept and store entityType
   - Auto-detection in `useSpawnEvents`: checks for `atmosphere` field (location) vs `personality` (character)
   - Type flows through: backend → SSE event → store → UI components

4. **Visual Differentiation**:
   - **Purple (#8b5cf6) for locations** vs **Blue (#3b82f6) for characters**
   - Added design tokens:
     ```css
     --color-entity-character: #3b82f6;  /* Blue */
     --color-entity-location: #8b5cf6;   /* Purple */
     ```
   - Applied to:
     - Active state in entity tabs (ChatTabs)
     - Image placeholders in entity list
     - Visual indicator throughout UI

5. **UI Label Updates**:
   - Changed "Chat Sessions" → "Entities" in ChatTabs header
   - More accurate terminology for dual-entity system

6. **Font Size Refinements**:
   - **SpawnInputBar textarea**: 16px → 12px (var(--text-md) → var(--text-xs))
   - **EntityInputSection textarea**: 14px → 12px (var(--text-sm) → var(--text-xs))
   - More compact, professional appearance

7. **Scrollbar Implementation**:
   - **Entities Panel (ChatTabs)**:
     - `.chatList`: Added `max-height: 400px` + `overflow-y: auto`
     - `.container`: Changed `overflow: hidden` → `overflow: visible`
   - **Active Spawns Panel**:
     - `.spawnsList`: Added `max-height: 300px` + `overflow-y: auto`
     - `.container`: Changed `overflow: hidden` → `overflow: visible`
   - Prevents list items from disappearing when lists grow too long
   - Scrollbar appears automatically when content exceeds max-height

8. **Files Modified (17 total)**:
   - **Backend (5 files)**:
     - `packages/backend/src/prompts/languages/en/sampleLocationPrompts.ts` - New location prompts
     - `packages/backend/src/prompts/languages/en/locationSeedGeneration.ts` - Location seed template
     - `packages/backend/src/prompts/languages/en/locationImageGeneration.ts` - Location image gen (Landscape Overview)
     - `packages/backend/src/prompts/languages/en/locationDeepProfileEnrichment.ts` - Location profile enrichment
     - `packages/backend/src/services/spawn/pipelineStages.ts` - Entity type handling, filter override
   - **Frontend State (2 files)**:
     - `packages/frontend/src/store/slices/chatManagerSlice.ts` - EntityType field, type signature update
     - `packages/frontend/src/hooks/useSpawnEvents.ts` - Auto-detect and pass entityType
   - **Frontend UI (10 files)**:
     - `packages/frontend/src/features/chat/components/Chat/types.ts` - ChatProps with entityType
     - `packages/frontend/src/features/chat/components/Chat/Chat.tsx` - Conditional rendering based on entityType
     - `packages/frontend/src/features/app/components/App/App.tsx` - Pass entityType to Chat
     - `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.tsx` - Data attribute + label change
     - `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.module.css` - Color coding + scrollbar
     - `packages/frontend/src/styles/tokens.module.css` - Entity color tokens
     - `packages/frontend/src/features/spawn-input/SpawnInputBar/SpawnInputBar.module.css` - Font size
     - `packages/frontend/src/features/entity-generation/.../EntityInputSection.module.css` - Font size
     - `packages/frontend/src/features/spawn-panel/ActiveSpawnsPanel/ActiveSpawnsPanel.module.css` - Scrollbar
     - `packages/frontend/src/features/app/components/App/App.module.css` - (No location viewer - reused Chat)

9. **Key Features Delivered**:
   - **Dual-Entity System**: Seamless support for characters AND locations
   - **Smart UI**: Single Chat component adapts based on entity type
   - **No Code Duplication**: Reused existing components with conditional rendering
   - **Visual Clarity**: Color coding differentiates entity types at a glance
   - **UX Refinements**: Smaller fonts, scrollable lists, clearer labels
   - **Type Safety**: Full TypeScript support for entity types throughout

10. **Quality Verification**:
    - TypeScript compilation: Zero errors
    - Architecture compliance: Followed all separation rules
    - Design tokens: All colors use CSS custom properties
    - No duplicate code: Reused Chat component intelligently
    - Responsive: All UI changes work across screen sizes

11. **LocationInfoModal Component with Split JSON Display** (Latest Addition):
    - **New Component Created**: LocationInfoModal following CharacterInfoModal pattern
    - **Component Structure** (5 files):
      - `types.ts` - LocationProfile interface (15 fields - refactored)
      - `useLocationInfoLogic.ts` - ESC key handling logic
      - `LocationInfoModal.tsx` - Pure JSX with split JSON sections
      - `LocationInfoModal.module.css` - Styled modal matching CharacterInfoModal
      - `index.ts` - Exports
    - **Split JSON Display Architecture**:
      - **📍 Location Instance** (scene-specific details): name, looks, mood, sounds, airParticles
      - **🌍 World DNA** (persistent environmental DNA): colorsAndLighting, atmosphere, flora, fauna, architecture, materials, genre, symbolicThemes, fictional, copyright
    - **Modal Routing**:
      - Updated Chat.tsx to conditionally render modals based on entityType
      - Characters → CharacterInfoModal
      - Locations → LocationInfoModal
    - **Generic Button Tooltips**: Changed from "View character info" to "View info"
    - **Type Safety**: Used type casting for deep profile compatibility
    - **Files Modified**: 6 total (5 new LocationInfoModal files + 1 updated Chat.tsx)

12. **Location Deep Profile Refactoring** (Latest - Just Completed):
    - **Backend Prompt Refactoring**:
      - Updated `locationDeepProfileEnrichment.ts` to output flat 15-field JSON
      - Renamed fields: `vegetation` → `flora`, `animals` → `fauna`
      - Added new fields: `materials`, `symbolicThemes`, `airParticles`
      - Enhanced field descriptions with clearer guidance and sentence counts
      - Field order matches split structure for easier processing
    - **Shared Utility Creation**:
      - Created `packages/frontend/src/utils/locationProfile.ts` as single source of truth
      - Exported `WORLD_DNA_KEYS` constant (10 fields)
      - Exported `LOCATION_INSTANCE_KEYS` constant (5 fields)
      - Exported `splitWorldAndLocation()` function
      - Eliminates code duplication between useSpawnEvents and LocationInfoModal
    - **Frontend Integration**:
      - Updated `useSpawnEvents.ts` to use shared utility, logs split JSONs to console
      - Updated `LocationInfoModal.tsx` to use shared utility, displays split JSONs in modal
      - Updated `types.ts` with all 15 fields in LocationProfile interface
    - **Key Architectural Decision**: `airParticles` moved to location instance
      - Rationale: Air particles (dust, mist, embers) are scene-specific, not world DNA
      - Allows same world to have different particle effects in different locations
    - **Files Modified**: 5 total (1 prompt, 1 utility, 3 frontend files)
    - **Benefits**:
      - **DRY Principle**: Single source of truth for field splitting logic
      - **Maintainability**: Future updates only need to be made in one place
      - **Clarity**: Clear separation between reusable world data and scene instances
      - **Scalability**: Foundation for generating multiple locations within same world

## Recent Changes (Continued)

### Character Info Modal & Fullscreen Viewer (Latest - Just Completed)
1. **Character Information Modal**:
   - New CharacterInfoModal component displaying comprehensive deep profile data
   - Organized sections: Identity, Physical Appearance, Style & Presence, Personality & Communication, Metadata
   - Info button (ⓘ) in lower right corner of character image
   - Button disabled until deep profile data is ready (grayed out, not clickable)
   - Displays all 16 deep profile fields in organized, scrollable layout
   - Modal overlay with backdrop and click-outside-to-close functionality

2. **Deep Profile Data Flow**:
   - Added `DeepProfile` interface to chatManagerSlice
   - Created `updateChatDeepProfile` action to store deep profile data
   - Updated `useSpawnEvents` to capture deep profile from `spawn:profile-complete` event
   - Deep profile stored in chat session for persistent access
   - Data flows from backend enrichment → SSE event → store → modal display

3. **Fullscreen Image Viewer**:
   - Fullscreen button (⛶) next to info button in lower right corner
   - Image stretches to fill entire viewport while maintaining aspect ratio
   - Uses `width: 100%`, `height: 100%` with `object-fit: contain`
   - Dark overlay (95% black) for maximum focus
   - Close button in top-right corner with hover effects

4. **Keyboard Accessibility**:
   - ESC key closes Character Info Modal
   - ESC key closes Fullscreen Image Viewer
   - Event listeners only attach when overlays are open
   - Proper cleanup on component unmount
   - Follows accessibility best practices

5. **UI/UX Enhancements**:
   - Two buttons positioned together in lower right of image
   - Semi-transparent dark backgrounds with backdrop blur
   - Hover effects: scale 1.1x, darker background
   - Disabled state: 40% opacity, no pointer cursor
   - Tooltips: "View character info" / "Character info not ready" / "View fullscreen"
   - High z-index layering: fullscreen (2000) > modal (1000)

6. **Name Mismatch Fix**:
   - Identified issue: deep profile `name` field contained "Morfeum" (world name from AI prompt)
   - Solution: Modal now displays actual character name from chat session (`entityName`)
   - Character name passed as separate prop to CharacterInfoModal
   - Ensures consistency across all UI elements

7. **Component Architecture**:
   - **CharacterInfoModal/** - Complete component with strict separation:
     - `types.ts` - Component interfaces
     - `useCharacterInfoLogic.ts` - Pure logic with ESC key handling
     - `CharacterInfoModal.tsx` - Pure JSX only
     - `CharacterInfoModal.module.css` - Pure CSS only
     - `index.ts` - Exports
   - Added icons: `IconInfoCircle`, `IconX`, `IconMaximize`, `IconMinimize`

8. **Files Modified (10 total)**:
   - `packages/frontend/src/store/slices/chatManagerSlice.ts` - DeepProfile interface, updateChatDeepProfile action
   - `packages/frontend/src/hooks/useSpawnEvents.ts` - Capture deep profile from SSE
   - `packages/frontend/src/features/chat/components/CharacterInfoModal/` - New component (5 files)
   - `packages/frontend/src/features/chat/components/Chat/types.ts` - Modal and fullscreen state
   - `packages/frontend/src/features/chat/components/Chat/useChatLogic.ts` - Modal/fullscreen handlers, ESC key
   - `packages/frontend/src/features/chat/components/Chat/Chat.tsx` - Button UI, modals
   - `packages/frontend/src/features/chat/components/Chat/Chat.module.css` - Button and overlay styles
   - `packages/frontend/src/icons/index.ts` - Added new icons

9. **Key Features Delivered**:
   - **Progressive Enhancement**: Button disabled until data ready
   - **Multiple View Options**: In-chat view, detailed modal, fullscreen image
   - **Keyboard Navigation**: ESC key support for overlays
   - **Visual Consistency**: Matches existing design system
   - **Mobile Friendly**: Responsive layouts, touch-optimized buttons
   - **Accessibility**: Proper ARIA labels, semantic HTML, keyboard support

10. **Quality Verification**:
    - TypeScript compilation: Zero errors
    - Architecture compliance: Follows all separation rules
    - Design tokens: All styling uses CSS custom properties
    - Name consistency: Fixed across all displays
    - Event cleanup: Proper listener removal

## Recent Changes (Continued)

### Dark Mode Implementation (Latest - Just Completed)
1. **Enhanced Design Token System**:
   - Extended `tokens.module.css` with comprehensive light and dark theme variables
   - Used CSS data attributes (`[data-theme="light|dark"]`) for theme switching
   - Added smooth transitions for all theme changes
   - Maintained backward compatibility with existing light theme

2. **Theme Management Infrastructure**:
   - Created robust `themeSlice.ts` Zustand store with localStorage persistence
   - Implemented system preference detection with manual override capability
   - Added automatic theme rehydration on app initialization
   - Included real-time system theme change listeners

3. **Theme Toggle Component**:
   - Built complete `ThemeToggle` component following strict architectural patterns:
     - **Types** (`types.ts`) - Component interfaces
     - **Logic** (`useThemeToggleLogic.ts`) - Pure business logic
     - **Markup** (`ThemeToggle.tsx`) - Pure JSX only
     - **Styles** (`ThemeToggle.module.css`) - Pure CSS only
   - Added sun/moon/system icons to centralized icon system
   - Implemented compact variant for space optimization

4. **Optimized Theme Toggle Positioning**:
   - **NEW**: Positioned in bottom right corner as fixed floating button
   - High z-index (1000) to float above all other content
   - Elegant container with background, shadow, and border
   - Responsive positioning for mobile devices:
     - Desktop: `bottom: var(--spacing-lg); right: var(--spacing-lg)`
     - Tablet (≤1024px): `bottom: var(--spacing-md); right: var(--spacing-md)`
     - Mobile (≤768px): `bottom: var(--spacing-sm); right: var(--spacing-sm)`
   - Space optimization: Moved from sidebar to save valuable space

5. **Fixed ALL Hardcoded Colors**:
   - **SpawnInputBar Component** (Generate button container):
     - Fixed container background from hardcoded `#f9fafb` to `var(--color-bg-secondary)`
     - Fixed all textarea, button, and interactive element colors
   - **EntityGenerator Component**:
     - Fixed empty state, error messages, loading containers
     - Fixed image container backgrounds and shadows
   - **Button Component**:
     - Fixed secondary button hover state to use design tokens

6. **Application Integration**:
   - Updated `App.tsx` to initialize theme on mount
   - Moved theme toggle out of sidebar to bottom right corner
   - Integrated theme system with existing component architecture
   - Maintained all existing functionality

7. **Accessibility & Quality Assurance**:
   - **WCAG AA Compliance**: All color combinations meet 4.5:1 contrast ratio
   - **WCAG AAA Compliance**: Primary text meets 7:1 contrast ratio
   - **Semantic HTML**: Proper button elements with ARIA labels
   - **Keyboard Navigation**: Full keyboard accessibility
   - **Screen Reader Support**: Comprehensive labeling
   - **Mobile Accessibility**: Touch-friendly positioning (44px minimum)

8. **Files Modified (15 total)**:
   - `packages/frontend/src/styles/tokens.module.css` - Dark theme tokens
   - `packages/frontend/src/store/slices/themeSlice.ts` - Theme state management
   - `packages/frontend/src/store/index.ts` - Theme store integration
   - `packages/frontend/src/components/ui/ThemeToggle/` - Complete theme toggle component (5 files)
   - `packages/frontend/src/icons/index.ts` - Added theme icons
   - `packages/frontend/src/components/ui/index.ts` - Theme toggle exports
   - `packages/frontend/src/features/app/components/App/App.tsx` - Theme integration
   - `packages/frontend/src/features/app/components/App/App.module.css` - Toggle positioning
   - `packages/frontend/src/index.css` - Smooth transitions
   - `packages/frontend/src/features/entity-generation/components/EntityGenerator/EntityGenerator.module.css` - Fixed hardcoded colors
   - `packages/frontend/src/components/ui/Button.module.css` - Fixed button colors
   - `packages/frontend/src/features/spawn-input/SpawnInputBar/SpawnInputBar.module.css` - Fixed container colors
   - `packages/frontend/src/styles/accessibility-check.md` - Accessibility documentation

9. **Key Features Delivered**:
   - **Complete Theme Coverage**: ALL components respect dark mode
   - **Space Optimization**: Theme toggle doesn't consume sidebar space
   - **Three Theme Options**: Light, Dark, and System (follows OS preference)
   - **Persistent Storage**: Theme choice saved across sessions
   - **Instant Switching**: No page reload required, smooth transitions
   - **System Integration**: Automatically detects and follows OS theme changes
   - **Responsive Design**: Works perfectly on all device sizes
   - **Full Accessibility**: WCAG AA/AAA compliant

10. **Quality Verification**:
    - **Build Success**: TypeScript compilation passes with zero errors
    - **Architecture Compliance**: Follows all project patterns and separation rules
    - **Performance**: CSS-only theme switching with minimal JavaScript overhead
    - **Complete Coverage**: All components use design tokens
    - **Mobile Optimized**: Responsive positioning for all screen sizes

## Recent Changes (Continued)

## Recent Changes

### Deep Profile Enrichment Enhancement (Latest - Just Completed)
1. **Original Prompt Integration**:
   - Modified `deepProfileEnrichment.ts` to accept `originalPrompt` as third parameter
   - Updated function signature: `(seedJson: string, visionJson: string, originalPrompt: string) => string`
   - Integrated original user request into prompt template for better context
   - AI now has access to user's original intent when enriching character profiles

2. **Pipeline Stage Updates**:
   - Updated `pipelineStages.ts` `enrichProfile()` function to extract and pass `seed.originalPrompt`
   - Graceful fallback: `'No specific request provided'` if prompt missing
   - Maintains consistency with other pipeline stages

3. **Type Safety Improvements**:
   - Updated `types.ts` interface: `deepProfileEnrichment: (seedJson: string, visionJson: string, originalPrompt: string) => string`
   - Updated profile route endpoint to accept `originalPrompt` in request body
   - Full TypeScript compilation success with zero errors

4. **Benefits**:
   - Better character consistency with user's original request
   - More context for nuanced character development
   - Enhanced AI understanding of user intent
   - Backward compatible with existing code

5. **Files Modified (4 total)**:
   - `packages/backend/src/prompts/languages/en/deepProfileEnrichment.ts` - Added originalPrompt parameter
   - `packages/backend/src/services/spawn/pipelineStages.ts` - Pass originalPrompt to prompt function
   - `packages/backend/src/prompts/types.ts` - Updated type definition
   - `packages/backend/src/routes/mzoo/profile.ts` - Accept originalPrompt in API endpoint

## Recent Changes (Continued)

### UI Layout & Chat Enhancements (Latest)
1. **Markdown-Enhanced Chat Narrative**:
   - Installed `react-markdown` for message content rendering
   - Updated chat impersonation prompt to use concise markdown formatting
   - Narrative elements limited to 1-5 words (*soft laugh*, *pause*, *eyes narrow*)
   - Dialogue remains primary (70-80%), narrative as accent (20-30%)
   - Styled italic text to be subtle/secondary (90% size, 75% opacity)
   - Visual hierarchy: dialogue prominent, narrative atmospheric touches only

2. **4-Column Responsive Layout**:
   ```
   [Sidebar: 350px] | [Chat: 400-600px] | [Reserved: flex] | [History: 350px]
   - SpawnInputBar       Active chat        Future panels    Collapsible
   - ActiveSpawnsPanel   content                             debug panel
   - ChatTabs (vertical)
   ```
   - Responsive breakpoints: 1600px, 1400px, 1024px
   - Column 3 reserved for future panel additions
   - Chat constrained width for better readability

3. **Collapsible Chat History Panel**:
   - ChatHistoryViewer now collapsible (like ActiveSpawnsPanel)
   - Click header to expand/collapse
   - Shows message count badge
   - Collapsed by default to maximize screen space
   - Message details display vertically (not side-by-side) for better readability

4. **Vertical Chat Tabs**:
   - Replaced horizontal scrolling tabs with vertical list
   - Entity image (48x48px) or letter placeholder
   - Entity name with text truncation
   - Close button (✕) per chat session
   - No more horizontal overflow with unlimited chat sessions
   - "Chat Sessions" header panel

5. **Text Formatting Fixes**:
   - Added `white-space: pre-wrap` to preserve line breaks in messages
   - Fixed ChatHistoryViewer detail rows from 2-column to vertical stack
   - Long system prompts now readable with proper wrapping
   - Markdown paragraphs properly spaced

6. **Files Modified (9 total)**:
   - `packages/backend/src/prompts/languages/en/chatCharacterImpersonation.ts` - Markdown formatting instructions
   - `packages/frontend/src/features/chat/components/Chat/Chat.tsx` - ReactMarkdown integration
   - `packages/frontend/src/features/chat/components/Chat/Chat.module.css` - Narrative styling
   - `packages/frontend/src/features/chat/components/ChatHistoryViewer/ChatHistoryViewer.tsx` - Collapsible panel
   - `packages/frontend/src/features/chat/components/ChatHistoryViewer/ChatHistoryViewer.module.css` - Panel styles
   - `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.tsx` - Vertical layout with images
   - `packages/frontend/src/features/chat-tabs/ChatTabs/ChatTabs.module.css` - Vertical styles
   - `packages/frontend/src/features/app/components/App/App.tsx` - 4-column structure
   - `packages/frontend/src/features/app/components/App/App.module.css` - Grid layout

## Recent Changes (Continued)

### Multi-Spawn Chat System Implementation (Latest)
1. **Functional Chat Messaging**:
   - Chat component connected to Zustand chat manager store
   - Messages persist across chat sessions
   - Real-time message exchange with Gemini AI
   - Store-connected `useChatLogic` replacing old local state
   - Each entity has independent chat history

2. **Chat Manager Store Enhancement**:
   ```typescript
   // New capabilities added:
   - sendMessage(spawnId, content) - Send user message, call API, store response
   - setLoading(spawnId, loading) - Per-chat loading state
   - setError(spawnId, error) - Per-chat error handling
   - entityPersonality field - Store personality from seed
   ```

3. **Enhanced System Prompt Updates**:
   - **Backend** (`spawnManager.ts`): Generate enhanced system prompt when deep profile completes
   - Includes all 16 deep profile fields (face, body, hair, voice, speechStyle, etc.)
   - **Frontend** (`useSpawnEvents.ts`): Update system prompt seamlessly
   - Chat history preserved - only system message updates
   - User sees no interruption, debug panel shows updated prompt

4. **Chat UI Redesign**:
   ```
   Old Layout:                    New Layout:
   ┌─────────────────────┐       ┌─────────────────────┐
   │ [img] Name          │       │  [Full-width Image] │
   ├─────────────────────┤       ├─────────────────────┤
   │ Messages...         │       │  Name               │
   │                     │       │  Personality text   │
                                 ├─────────────────────┤
                                 │ Messages...         │
   ```
   - Full-width entity image at top
   - Name and personality displayed below
   - Clean, professional header layout
   - Message bubbles (user right/blue, assistant left/gray)

5. **Key Components**:
   - **SpawnInputBar**: Textarea for multi-line character descriptions, shuffle button, generate button
   - **ActiveSpawnsPanel**: Real-time progress tracking with visual progress bars (25%, 50%, 75%, 90%, 100%)
   - **ChatTabs**: Multi-session tab management with close buttons
   - **Chat**: Functional messaging with auto-scroll, loading states, error handling

6. **Files Modified**:
   - `packages/frontend/src/store/slices/chatManagerSlice.ts` - Message handling, personality field
   - `packages/frontend/src/features/chat/components/Chat/useChatLogic.ts` - Store connection
   - `packages/frontend/src/features/chat/components/Chat/Chat.tsx` - New UI with header
   - `packages/frontend/src/features/chat/components/Chat/Chat.module.css` - Header styles
   - `packages/frontend/src/features/chat/components/Chat/types.ts` - Added entityPersonality
   - `packages/backend/src/services/spawnManager.ts` - Enhanced system prompt
   - `packages/frontend/src/hooks/useSpawnEvents.ts` - System prompt update listener

### Frontend Component Refactoring (Previous)
1. **EntityGenerator Component Breakdown**:
   - Refactored monolithic EntityGenerator.tsx from 231 lines to 89 lines (62% reduction)
   - Extracted 4 new focused components following single-responsibility principle
   - All new components follow strict separation of concerns (markup, logic, styles)

2. **New Component Structure**:
   ```
   EntityGenerator/
   ├── EntityGenerator.tsx (89 lines - coordinator)
   ├── EntityGenerator.module.css (77 lines - shared styles)
   ├── useEntityGeneratorLogic.ts (218 lines - unchanged)
   ├── EntityInputSection/ (50 lines) - Input field and action buttons
   ├── EntitySeedCard/ (56 lines) - Basic character seed display
   ├── VisualAnalysisCard/ (40 lines) - Visual analysis results
   └── DeepProfileCard/ (101 lines) - Comprehensive character profile
   ```

### Prompt Module Refactoring (Previous)
1. **Modular Prompt Structure Implemented**:
   - Refactored monolithic `packages/backend/src/prompts/languages/en.ts` (440+ lines)
   - Split into 9 focused modules following project architectural patterns
   - All files now within 50-300 line size limits

### Entity Generation Deep Profile JSON Parsing (Previous)
1. **Deep Profile JSON Conversion**: Switched from regex field markers to JSON format
2. **Visual Analysis JSON Improvements**: Explicit JSON request in prompts
3. **Chat Integration Timing Fix**: Chat initializes immediately with seed data
4. **Parsing Reliability**: All three AI operations use JSON parsing (seed, visual, deep)

## Recent Changes (Continued)

### UI Refactoring - Modal Component (Latest - Just Completed)
1. **Reusable Modal Component Created** (`@/components/ui/Modal/`):
   - **Modal.tsx** (65 lines) - Main modal with overlay, ESC key handling, click-outside-to-close
   - **Modal.module.css** (118 lines) - Complete modal styling with responsive breakpoints
   - **types.ts** (22 lines) - TypeScript interfaces for all modal components
   - **index.ts** (3 lines) - Clean barrel exports
   - **Subcomponents**: Modal, ModalHeader, ModalContent, ModalSection

2. **Modal Features**:
   - Automatic ESC key handling for accessibility
   - Click-outside-to-close functionality
   - 3 size variants (sm/md/lg) via maxWidth prop
   - Fully accessible (ARIA labels, semantic HTML)
   - Dark mode compatible (uses design tokens)
   - Responsive design with mobile breakpoints
   - Overlay with backdrop blur effect

3. **CharacterInfoModal Refactored**:
   - **Before**: 127 lines TSX + 97 CSS = 224 total lines
   - **After**: 106 lines TSX + 26 CSS = 132 total lines
   - **Reduction**: 92 lines (41% smaller)
   - **Changes**: 
     - Removed overlay, modal, header, closeButton, content, section styles (now from Modal component)
     - Kept only field-specific styles (grid layout, hover states)
     - Simplified component structure using Modal subcomponents

4. **LocationInfoModal Refactored**:
   - **Before**: 145 lines TSX + 117 CSS = 262 total lines
   - **After**: 116 lines TSX + 27 CSS = 143 total lines
   - **Reduction**: 119 lines (45% smaller)
   - **Changes**:
     - Removed all modal infrastructure styles (overlay, modal, header, etc.)
     - Kept only field-specific styles (label, value formatting)
     - Consistent structure with CharacterInfoModal

5. **Eliminated Duplication**:
   - **CSS Classes Centralized**: .overlay, .modal, .header, .title, .closeButton, .content, .section, .sectionTitle, .sectionDescription
   - **Total Lines Saved**: ~211 lines across both modal components
   - **Future Benefit**: Any new modal/dialog takes 5 minutes to implement
   - **Single Source of Truth**: All modal behavior and styling defined once

6. **Files Modified (13 total)**:
   - **Created**:
     - `packages/frontend/src/components/ui/Modal/types.ts` - Modal TypeScript interfaces
     - `packages/frontend/src/components/ui/Modal/Modal.module.css` - Centralized modal styles
     - `packages/frontend/src/components/ui/Modal/Modal.tsx` - Reusable modal components
     - `packages/frontend/src/components/ui/Modal/index.ts` - Modal exports
   - **Updated**:
     - `packages/frontend/src/components/ui/index.ts` - Added Modal exports to UI system
     - `packages/frontend/src/features/chat/components/CharacterInfoModal/CharacterInfoModal.tsx` - Refactored to use Modal
     - `packages/frontend/src/features/chat/components/CharacterInfoModal/CharacterInfoModal.module.css` - Removed duplicated styles
     - `packages/frontend/src/features/chat/components/LocationInfoModal/LocationInfoModal.tsx` - Refactored to use Modal
     - `packages/frontend/src/features/chat/components/LocationInfoModal/LocationInfoModal.module.css` - Removed duplicated styles

7. **Quality Verification**:
   - **Build Status**: TypeScript compilation successful (zero errors)
   - **Bundle Size**: 303.71 kB (unchanged - tree shaking working correctly)
   - **Architecture**: Follows all project patterns (strict separation, design tokens, 50-300 line limits)
   - **Maintainability**: Single source of truth for modal patterns
   - **Accessibility**: Full keyboard navigation, ARIA labels, semantic HTML
   - **Dark Mode**: Works seamlessly with existing theme system

8. **Key Benefits**:
   - **DRY Principle**: Modal structure defined once, used everywhere
   - **Consistency**: All modals have identical behavior and styling
   - **Developer Experience**: New modals can be created in minutes
   - **Type Safety**: Full TypeScript coverage with proper interfaces
   - **Scalability**: Easy to add new modal variants or features

9. **Design System Integration**:
   - Modal component now part of unified UI component system
   - Exports alongside Button, Card, CollapsiblePanel, etc.
   - Uses existing design tokens for all styling
   - Follows same architectural patterns as other UI components

## Next Steps
The multi-spawn chat system now features:
- **Markdown-enhanced narrative**: Concise atmospheric touches with styled italics
- **Responsive 4-column layout**: Room for future panels and features
- **Vertical chat navigation**: No horizontal overflow, unlimited sessions
- **Collapsible panels**: Maximize workspace with on-demand debug info
- **Proper text formatting**: Line breaks, wrapping, and markdown rendering
- **Reusable Modal System**: Zero duplication, instant modal creation
- Foundation ready for:
  - Additional panels in column 3 (entity info, settings, etc.)
  - Advanced markdown features (bold, links, code blocks)
  - Typing indicators and message reactions
  - Chat persistence and history export
  - More modals using the centralized Modal component

## Active Decisions
- Multi-spawn architecture: Multiple entities can be generated simultaneously
- Progressive chat initialization: Chat available immediately after seed
- System prompt enhancement: Updates automatically when deep profile completes
- Chat persistence: All messages stored in chat manager
- **Narrative style**: Markdown-enhanced with concise atmospheric touches (1-5 words)
- **Layout**: 4-column responsive grid with reserved space for future features
- **Navigation**: Vertical chat tabs with entity images for better scalability
- **UI patterns**: Full-width images, personality display, message bubbles, collapsible panels
- Debug visibility: ChatHistoryViewer shows raw message data for inspection (collapsible)

## Implementation Notes
- Chat manager handles all message operations (send, load, error)
- Store-connected logic pattern eliminates local state
- SSE events drive spawn progress and chat updates
- Enhanced system prompts include all 16 deep profile fields
- Chat history preserved during system prompt updates
- Full-width image layout provides immersive chat experience
- Personality display gives context for entity character
- **Markdown rendering**: `react-markdown` processes message content
- **Narrative styling**: Italics rendered smaller/lighter for visual hierarchy
- **Text formatting**: `white-space: pre-wrap` preserves line breaks
- **Responsive grid**: `minmax()` constrains chat width, flexible reserved space
- **Vertical tabs**: No horizontal overflow, supports unlimited chat sessions
- **Collapsible panels**: User controls workspace visibility
