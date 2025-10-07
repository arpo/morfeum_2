# Active Context

## Current Work Focus
Entity generation pipeline with deep profile enrichment completed. Four-phase progressive pipeline: Seed → Image → Visual Analysis → Deep Profile. All AI responses now use reliable JSON parsing. Chat initializes immediately with seed data.

## Recent Changes

### Prompt Module Refactoring (Latest)
1. **Modular Prompt Structure Implemented**:
   - Refactored monolithic `packages/backend/src/prompts/languages/en.ts` (440+ lines)
   - Split into 9 focused modules following project architectural patterns
   - Created `en/` directory with single-responsibility files
   - All files now within 50-300 line size limits

2. **New Directory Structure**:
   ```
   packages/backend/src/prompts/languages/en/
   ├── index.ts                      # Aggregates exports (25 lines)
   ├── constants.ts                  # Core constants (11 lines)
   ├── chatSystemMessage.ts          # Simple message (6 lines)
   ├── chatCharacterImpersonation.ts # Chat prompt (42 lines)
   ├── entitySeedGeneration.ts       # Seed generation (59 lines)
   ├── entityImageGeneration.ts      # Image generation (33 lines)
   ├── visualAnalysis.ts             # Visual analysis (61 lines)
   ├── deepProfileEnrichment.ts      # Deep profile (161 lines)
   └── sampleEntityPrompts.ts        # Sample prompts (51 lines)
   ```

3. **Benefits Achieved**:
   - Each prompt in its own file with single responsibility
   - Removed duplication in deepProfileEnrichment (field definitions were repeated twice)
   - Fixed TypeScript errors (escaped apostrophes in sample prompts)
   - Same public API - no breaking changes to consumers
   - Follows same pattern as MZOO service refactoring documented in systemPatterns.md
   - Average file size: ~50 lines (down from 440+)
   - Largest file: 161 lines (deepProfileEnrichment, still well under 300 limit)

4. **Implementation Details**:
   - Constants (morfeumVibes, qualityPrompt, blackListCharacterNames) extracted to shared file
   - Each prompt function in its own module with clear documentation
   - Index.ts aggregates all exports into `en` object matching PromptTemplates interface
   - Parent index.ts import path unchanged (`./languages/en` resolves to new directory)
   - Build verification: Backend compiles successfully with zero errors

### Entity Generation Deep Profile JSON Parsing (Previous)
1. **Deep Profile JSON Conversion**:
   - Switched from regex field markers to JSON format
   - Updated `deepProfileEnrichment` prompt to explicitly request JSON
   - Prompt now includes: "IMPORTANT: Return ONLY a valid JSON object"
   - Uses same reliable JSON.parse() approach as seed generation
   - Removed fragile regex pattern matching

2. **Visual Analysis JSON Improvements**:
   - Updated `visualAnalysis` prompt to explicitly request JSON
   - Added clear instructions: "Do not include markdown, code blocks, or explanatory text"
   - Consistent JSON parsing across all AI operations

3. **Console Logging for Debugging**:
   - Frontend: Browser console logs for Seed, Visual Analysis, Deep Profile
   - Backend: No terminal spam - logging removed
   - All logging uses clear markers (=== SEED DATA ===, etc.)
   - Easy debugging without cluttering terminal

4. **Chat Integration Timing Fix**:
   - Chat initializes immediately with seed data (doesn't wait for deep profile)
   - Removed automatic chat update when deep profile completes
   - Progressive experience: chat available as soon as seed generates
   - User can interact while image/analysis/profile generate in background

5. **Parsing Reliability**:
   - All three AI operations now use JSON parsing (seed, visual analysis, deep profile)
   - Consistent error handling with descriptive messages
   - Raw response included in error messages for debugging
   - Same pattern: extract JSON with regex, parse with JSON.parse()

### MZOO API Routes Refactoring (Previous)

### Documentation: Adding New Services Guide (Latest)
1. **Comprehensive Service Guide Added**:
   - Added "Adding a New Service - Step by Step Guide" to systemPatterns.md
   - Documents when to create a service layer
   - Full Service + Middleware pattern with file structure
   - 6-step process with code examples
   - MZOO implementation as reference example
   - Decision guide for middleware vs service vs routes
   - File size guidelines and best practices

2. **Real-World Example Documented**:
   - MZOO service pattern fully documented
   - Benefits and metrics included
   - Shows 37% size reduction achieved
   - Demonstrates DRY, testability, maintainability

### MZOO API Routes Refactoring (Previous)
1. **Route Organization**:
   - Created dedicated `packages/backend/src/routes/mzoo.ts` (196 lines)
   - Moved all MZOO endpoints from api.ts to mzoo.ts
   - Removed `/api/test` endpoint (integration proven, no longer needed)
   - api.ts reduced to 45 lines (only generic API routes)
   - All files now within backend size limits (100-200 lines for routes)

2. **MZOO Endpoints**:
   - POST `/api/mzoo/vision` - Image analysis using Gemini Vision
   - POST `/api/mzoo/gemini/text` - Text generation with conversation history
   - POST `/api/mzoo/fal-flux-srpo/generate` - AI image generation
   - All endpoints use secure proxy pattern with server-side API key
   - Consistent error handling and response format

3. **Vision API Implementation**:
   - Accepts base64 encoded images
   - Supports multiple MIME types (defaults to image/png)
   - Uses gemini-2.5-flash model
   - Returns structured analysis in response.data

4. **Route Registration**:
   - Updated `routes/index.ts` to mount mzooRouter at `/api/mzoo`
   - Updated `/api/info` endpoint with correct MZOO endpoint paths
   - Maintains modular export pattern for testing

### MZOO Integration (Previous)
1. **Environment Configuration**:
   - Installed `dotenv` package for backend
   - Configured `server.ts` to load .env from root directory
   - MZOO_API_KEY properly read from environment variables
   - Prevents API key exposure to frontend

2. **Frontend Data Fetching**:
   - Added test data state management in `useAppLogic.ts`
   - Implemented automatic data fetch on component mount with useEffect
   - Proper loading and error state handling
   - Updated TypeScript interfaces to include test data types

3. **UI Display**:
   - Test data displayed below "Morfeum" headline
   - Clean presentation of title and body content
   - Loading spinner during data fetch
   - Error message display on failure
   - Follows design system patterns with proper spacing

### Backend Refactoring (Previous)
1. **Modular Architecture Implemented**:
   - Transformed monolithic 47-line server.ts into 12 focused modules
   - Implemented domain-driven design with clear separation of concerns
   - Created config/, middleware/, routes/, services/, types/, and utils/ directories
   - All modules follow 50-300 line size guidelines

2. **Backend Patterns Established**:
   - Configuration as Code: Environment-specific configs with type safety
   - Service Layer Pattern: Separated business logic from infrastructure
   - Middleware Pattern: CORS, error handling, and async wrappers
   - Route Organization: Domain-specific routing with clear boundaries

3. **Enhanced API Functionality**:
   - Original `/api` endpoint maintained (returns plain text)
   - Added `/api/info` with comprehensive API documentation
   - Added `/health` and `/health/detailed` for monitoring
   - Implemented proper error handling and logging

4. **Type Safety and Quality**:
   - 100% TypeScript coverage across backend
   - Comprehensive interface definitions
   - Zero build errors
   - Proper error handling with custom error classes

### Frontend Refactoring (Earlier)
1. **Component Refactoring Completed**:
   - Extracted 3 new reusable components: Card, LoadingSpinner, Message
   - All components follow strict separation rules (markup/logic/styles)
   - App component simplified to use reusable components
   - UI components index updated with proper TypeScript exports

2. **Legacy Style Cleanup**:
   - Removed unused App.css file (29 lines of legacy styles)
   - Migrated index.css from hardcoded values to design tokens
   - Eliminated conflicting button styles that interfered with design system
   - Reduced CSS complexity while maintaining functionality

3. **Icon Management Optimization**:
   - Optimized icon exports from 47 to 1 (98% reduction)
   - Only IconLoader2 exported as it's the only used icon
   - Improved bundle size through tree-shaking
   - Added clear documentation about usage policies

4. **Code Quality Improvements**:
   - All components follow 50-300 line limits
   - Strict separation of concerns maintained across all files
   - Design tokens used consistently throughout
   - Bundle size optimized (CSS: 5.09 kB → 4.96 kB)
   - Total lines reduced from 660 to 648 while adding functionality

## Next Steps
The project demonstrates:
- Complete MZOO API integration with modular route architecture
- Three AI endpoints: text generation, vision analysis, image generation
- Secure proxy pattern with server-side API key management
- Environment variable management
- Complete set of reusable UI components
- Optimized bundle size and performance
- Clean architecture following all established patterns
- All backend files within size limits (45-196 lines)
- Foundation ready for additional feature development and API integrations

## Active Decisions
- All components follow the 50-300 line limit
- Backend route files follow 100-200 line limit
- No mixing of concerns in any file
- CSS Modules used exclusively for styling
- Design tokens used instead of hardcoded values
- Icons centralized and optimized for actual usage
- Reusable components extracted for maintainability
- API keys kept server-side, never exposed to frontend
- Backend proxy pattern for secure external API access
- Domain-based route organization (api.ts for generic, mzoo.ts for MZOO)
- Environment variables loaded via dotenv in backend

## Implementation Notes
- MZOO endpoints organized by domain in dedicated mzoo.ts file
- All routes comply with backend size guidelines
- Backend properly loads environment variables from root .env file
- Vision API accepts base64 images with flexible MIME type support
- Frontend automatically fetches data on mount with proper state management
- Data displayed cleanly without raw JSON dump
- Refactoring successfully eliminated all legacy style conflicts
- New components (Card, LoadingSpinner, Message) demonstrate proper architecture
- App component now serves as example of consuming reusable components and API data
- Build system optimized with proper tree-shaking
- Route split improved maintainability: api.ts (45 lines), mzoo.ts (196 lines)
