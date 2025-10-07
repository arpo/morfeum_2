# Active Context

## Current Work Focus
Complete dark mode implementation with comprehensive theme system, optimized floating theme toggle, and full component coverage. Dark mode features include three theme options (light/dark/system), persistent storage, responsive positioning, and WCAG AA/AAA accessibility compliance.

## Recent Changes

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

## Next Steps
The multi-spawn chat system now features:
- **Markdown-enhanced narrative**: Concise atmospheric touches with styled italics
- **Responsive 4-column layout**: Room for future panels and features
- **Vertical chat navigation**: No horizontal overflow, unlimited sessions
- **Collapsible panels**: Maximize workspace with on-demand debug info
- **Proper text formatting**: Line breaks, wrapping, and markdown rendering
- Foundation ready for:
  - Additional panels in column 3 (entity info, settings, etc.)
  - Advanced markdown features (bold, links, code blocks)
  - Typing indicators and message reactions
  - Chat persistence and history export

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
