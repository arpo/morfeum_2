# Morfeum

A React/TypeScript monorepo application demonstrating modern development patterns and architectural best practices.

## Overview

Morfeum is built with strict architectural principles that enforce clean code patterns, maintainability, and scalability. The project follows a component-based architecture with clear separation of concerns and a comprehensive design system.

## Architecture Principles

### 1. Strict Separation of Concerns

Every component follows a rigid separation pattern:

- **`.tsx` files**: Pure JSX markup only - no logic, no hooks (except the consuming hook)
- **`.ts` files**: Pure business logic - hooks, state management, API calls
- **`.module.css` files**: Pure CSS styles - no JavaScript, no inline styles
- **`types.ts` files**: TypeScript interfaces and types

**Example Structure:**
```
ComponentName/
├── ComponentName.tsx         # Pure JSX markup
├── useComponentLogic.ts      # Pure business logic
├── ComponentName.module.css  # Pure CSS styles
├── types.ts                  # TypeScript interfaces
└── index.ts                  # Public exports
```

### 2. Component Size Limits

- **Maximum**: 300 lines per file
- **Minimum**: 50 lines for substantial components
- Files exceeding limits must be split into smaller components

### 3. Design System

All styling uses CSS custom properties (design tokens) - **no hardcoded values**:

```css
.component {
  background-color: var(--color-bg);
  padding: var(--spacing-md);
  border-radius: var(--radius-md);
}
```

**Available tokens:**
- Spacing: `--spacing-sm|md|lg|xl`
- Colors: `--color-primary|secondary|text|bg|border|error|success`
- Typography: `--text-xs|sm|md|lg|xl|2xl`
- Border radius: `--radius-sm|md|lg|full`
- Shadows: `--shadow-sm|md|lg`
- Transitions: `--transition-fast|normal|slow`

### 4. Icon Management

All icons are centralized in `@/icons/index.ts`:

```typescript
// ✅ Correct - Import from centralized location
import { IconLoader2 } from '@/icons';

// ❌ Wrong - Never import directly from package
import { IconLoader2 } from '@tabler/icons-react';
```

### 5. State Management

Uses Zustand with a slice pattern:
- 50-150 lines per slice
- Cross-slice communication via `get()`/`getState()`
- Side effects in hooks, not in slices

## Project Structure

```
morfeum/
├── memory-bank/              # Project documentation
│   ├── projectbrief.md      # Foundation document
│   ├── productContext.md    # Product vision
│   ├── systemPatterns.md    # Architecture patterns
│   ├── techContext.md       # Technical details
│   ├── activeContext.md     # Current work focus
│   └── progress.md          # Status tracking
├── packages/
│   ├── frontend/            # React/TypeScript frontend
│   │   ├── src/
│   │   │   ├── components/ui/      # Reusable UI components
│   │   │   ├── features/           # Feature-specific components
│   │   │   ├── icons/              # Centralized icon exports
│   │   │   ├── store/              # Zustand state management
│   │   │   └── styles/             # Design tokens
│   │   └── vite.config.ts
│   └── backend/             # Express.js backend
│       └── src/
│           ├── config/      # Configuration management
│           ├── middleware/  # Express middleware
│           ├── routes/      # API routes
│           ├── services/    # Business logic
│           ├── types/       # TypeScript types
│           └── utils/       # Utility functions
└── package.json             # Root workspace config
```

## Getting Started

### Installation

Install all dependencies for both frontend and backend:

```bash
npm install
```

### Development

**Start both frontend and backend:**
```bash
npm run dev
```

- Backend: `http://localhost:3030`
- Frontend: `http://localhost:5173`

**Start backend only:**
```bash
cd packages/backend
npm run dev
```

**Start frontend only:**
```bash
cd packages/frontend
npm run dev
```

### Build

Build both packages:
```bash
npm run build
```

Rebuild and restart dev servers:
```bash
npm run redev
```

## Development Guidelines

### Creating a New Component

1. Create component directory structure:
```bash
ComponentName/
├── ComponentName.tsx
├── useComponentLogic.ts
├── ComponentName.module.css
├── types.ts
└── index.ts
```

2. Implement logic hook first (`useComponentLogic.ts`)
3. Create markup component (`ComponentName.tsx`)
4. Add styles using design tokens (`ComponentName.module.css`)
5. Define TypeScript interfaces (`types.ts`)
6. Export from index file (`index.ts`)

### Path Aliases

Use TypeScript path aliases for clean imports:

```typescript
// ✅ Correct
import { Button, Card } from '@/components/ui';
import { IconHome } from '@/icons';

// ❌ Wrong
import { Button } from '../../../components/ui/Button';
import { IconHome } from '@tabler/icons-react';
```

### Adding a New Icon

1. Add export to `packages/frontend/src/icons/index.ts`:
```typescript
export { IconNewIcon } from '@tabler/icons-react';
```

2. Use in components:
```typescript
import { IconNewIcon } from '@/icons';
```

## API Endpoints

### Backend API
- `GET /api` - Root API endpoint
- `GET /api/info` - API information and available endpoints
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed health check

### Frontend Proxy

The frontend proxies API requests to avoid CORS issues during development. Configured in `packages/frontend/vite.config.ts`.

## Memory Bank System

The `memory-bank/` directory contains project documentation that provides context and architectural decisions:

- **projectbrief.md** - Foundation document defining core requirements
- **productContext.md** - Product vision and goals
- **systemPatterns.md** - Detailed architecture patterns
- **techContext.md** - Technology stack and setup
- **activeContext.md** - Current work and focus areas
- **progress.md** - What works, what's left, and status

Review these files to understand the project's evolution and current state.

## Project Intelligence (.clinerules)

The `.clinerules/` directory contains project-specific patterns and preferences that guide development:

- Component usage patterns
- Import conventions
- Design token usage
- Zustand slice patterns
- Code separation rules

## Deployment

### Configuration

1. Copy the environment example:
```bash
cp .env.example .env
```

2. Edit `.env` with your GCP project details

### Deploy to GCP

Run the interactive deployment script:
```bash
npm run deploy
```

The script will build a Docker image and deploy to Google Cloud Run.

## Current Status

**Phase 2 Complete** - Core architecture and patterns established

### What Works ✅
- Complete monorepo setup
- Design system with tokens
- Strict component separation
- UI component library (Button, Card, LoadingSpinner, Message)
- Optimized icon management
- Zustand store structure
- Backend with modular architecture
- Build system with path aliases

### Planned Features 🚧
- Additional UI components (Input, Modal, etc.)
- React Router integration
- Testing infrastructure (Vitest)
- ESLint configuration
- Error boundaries
- Additional Zustand slices

## Tech Stack

**Frontend:**
- React 18 with TypeScript
- Vite (build tool)
- CSS Modules (styling)
- Zustand (state management)
- Tabler Icons (icons)

**Backend:**
- Node.js with TypeScript
- Express.js (web framework)
- Modular architecture

**Development:**
- npm workspaces (monorepo)
- TypeScript (type safety)
- CSS custom properties (design tokens)

## Contributing

When contributing, ensure all code follows the established patterns:

1. ✅ Strict separation: markup, logic, styles, types in separate files
2. ✅ Component size limits: 50-300 lines per file
3. ✅ Design tokens: Use CSS custom properties, no hardcoded values
4. ✅ Centralized icons: Import from `@/icons` only
5. ✅ Path aliases: Use `@/` imports
6. ✅ TypeScript: Proper typing, no `any`

## License

Private project.
