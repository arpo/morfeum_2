# System Patterns

## Architecture Overview
Morfeum follows strict component-based architecture with clear separation of concerns for both frontend and backend.

## Frontend Architecture

### Component Patterns

#### Strict Separation Rules
- **Markup (.tsx)**: Pure JSX only, no business logic
- **Logic (.ts)**: Business logic only, no JSX
- **Styles (.module.css)**: Pure CSS only
- **Types (types.ts)**: TypeScript interfaces

#### Component Size Limits
- Maximum 300 lines per file
- Minimum 50 lines for substantial components
- Index files 2-15 lines for exports

#### File Organization
```
ComponentName/
├── ComponentName.tsx      # Pure JSX markup
├── useComponentLogic.ts   # Business logic
├── ComponentName.module.css
├── types.ts
└── index.ts
```

### Design System Integration

#### Token Usage
- Never hardcode colors, spacing, or sizes
- Always use CSS custom properties: `var(--token-name)`
- Theme-aware tokens for dark/light mode

#### Dark Mode Pattern
```css
:root {
  --color-bg: #ffffff;
  --color-text: #1f2937;
}

[data-theme="dark"] {
  --color-bg: #111827;
  --color-text: #f9fafb;
}
```

### State Management Patterns

#### Zustand Slice Pattern
- 50-150 lines per slice
- Use `get()` for immediate access
- Use `getState()` for current state
- Side-effects in hooks, not slices
- Cross-slice communication via get()/getState()
- **No persist middleware** - persistence handled by backend storage service

#### Storage Integration Pattern
Stores now use backend API instead of localStorage:
```typescript
// In store slice
const saveToBackend = async () => {
  const response = await fetch('/api/worlds', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  return response.ok;
};

const loadFromBackend = async () => {
  const response = await fetch('/api/worlds');
  const data = await response.json();
  set({ data });
};
```

### Icon Management
- Centralized in `@/icons/index.ts`
- Never import directly from @tabler/icons-react
- Only export icons actually used

### Import Patterns
```typescript
// Correct
import { Button } from '@/components/ui';
import { IconLoader2 } from '@/icons';
```

## Backend Architecture

### Module Organization
```
packages/backend/src/
├── server.ts                 # Entry point (50-150 lines)
├── config/                   # Application configuration
├── middleware/               # Request processing
├── routes/                   # API endpoints
│   ├── storage.ts           # Storage API endpoints
│   └── ...
├── services/                 # Business logic
│   ├── storage/             # File storage service
│   └── ...
├── types/                    # Type definitions
└── utils/                    # Utilities
```

### Storage Service Pattern
Centralized file-based storage for development:
- Location: `packages/backend/src/services/storage/storageService.ts`
- Storage directory: `packages/backend/temp-db/`
- Files: `worlds.json`, `characters.json`
- Purpose: Temporary storage before database migration
- API: GET/POST/DELETE endpoints at `/api/worlds` and `/api/characters`

**Storage Flow:**
```
Frontend Store → POST /api/worlds → storageService.ts → temp-db/worlds.json
temp-db/worlds.json → storageService.ts → GET /api/worlds → Frontend Store
```

### Service Layer Pattern
Services handle business logic separate from routes:
- External API calls
- Complex data transformations
- Reusable functionality
- 100-250 lines per service

### Middleware Pattern
Middleware for cross-cutting concerns:
- Authentication/authorization
- Request validation
- Error handling
- 20-50 lines per middleware

### Route Organization
Routes are thin layers that:
- Handle HTTP-specific logic
- Call services for business logic
- Format responses
- 100-200 lines per route file

## DNA System Architecture

### Core Concept
Separate structures for storage vs LLM usage:

**Storage (Database/Store)**
- Clean nodes without nested arrays
- Each node has only its own data
- Optimized for queries

**LLM Usage (Image Generation)**
- Merged DNA with inheritance
- Complete context for generation
- Child nulls inherit parent values

### Core Functions

#### extractCleanDNA
- Purpose: Strip nested arrays for storage
- Location: `packages/frontend/src/utils/nodeDNAExtractor.ts`
- Usage: When receiving backend data

#### getMergedDNA
- Purpose: Merge with inheritance for LLM
- Location: `packages/frontend/src/utils/nodeDNAExtractor.ts`
- Usage: Before sending to backend APIs

### Data Flow
```
Backend (nested) → extractCleanDNA → Store (clean)
Store → getCascadedDNA → getMergedDNA → Backend LLM (merged)
```

## Navigation System Patterns

### Two-Step Architecture
1. **Intent Classification (LLM)**: Analyze natural language
2. **Navigation Routing (Deterministic)**: Execute intent

### 13 Intent Types
1. GO_INSIDE - Enter enclosed space
2. GO_OUTSIDE - Exit to exterior
3. GO_TO_ROOM - Navigate within structure
4. GO_TO_PLACE - Navigate to location
5. LOOK_AT - Examine something
6. LOOK_THROUGH - Look through opening
7. CHANGE_VIEW - Change perspective
8. GO_UP_DOWN - Change elevation
9. ENTER_PORTAL - Special passage
10. APPROACH - Move closer
11. EXPLORE_FEATURE - Follow feature
12. RELOCATE - Travel to area
13. UNKNOWN - Cannot determine

### Handler Architecture
Modular handlers under 300 lines each:
- basicMovement.ts - GO_INSIDE, GO_OUTSIDE, etc.
- viewing.ts - LOOK_AT, LOOK_THROUGH, etc.
- special.ts - GO_UP_DOWN, ENTER_PORTAL, etc.
- exploration.ts - EXPLORE_FEATURE, RELOCATE

## Development Guidelines

### File Size Limits
- Components: 50-300 lines
- Services: 100-250 lines
- Routes: 100-200 lines
- Middleware: 20-50 lines
- Slices: 50-150 lines

### Quality Standards
- 100% TypeScript coverage
- No `any` types
- Clean module boundaries
- Single responsibility per file
- Comprehensive error handling

### CSS Architecture
- CSS Modules only
- Design tokens for all values
- Theme support via CSS variables
- No global CSS classes

### Build Optimization
- Tree shaking via selective exports
- Code splitting for large features
- CSS Modules prevent conflicts
- Icon optimization through centralization
