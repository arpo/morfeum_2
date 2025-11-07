# Technical Context

## Technology Stack

### Frontend
- **React 18**: Modern React with hooks and concurrent features
- **TypeScript**: Full type safety and enhanced developer experience
- **Vite**: Fast build tool and development server
- **CSS Modules**: Scoped styling preventing conflicts
- **Zustand**: Lightweight state management
- **Tabler Icons**: Icon library (centralized exports)

### Backend
- **Node.js**: JavaScript runtime for server-side code
- **Express.js**: Web framework for API endpoints
- **TypeScript**: Type-safe backend development
- **Dotenv**: Environment variable management

### Development Tools
- **ESLint**: Code linting and quality enforcement
- **Prettier**: Code formatting and consistency
- **npm**: Package management
- **Git**: Version control

## Architecture Decisions

### Monorepo Structure
```
morfeum_2/
├── packages/
│   ├── frontend/          # React application
│   └── backend/           # Express API server
├── memory-bank/           # Project documentation
├── .clinerules/           # Development patterns
└── Configuration files    # Root-level setup
```

**Benefits**: Shared configuration, simplified workflow, consistent tooling

### Component Architecture
- Strict separation: markup (.tsx), logic (.ts), styles (.module.css), types (.ts)
- 50-300 line file limits enforced
- Single responsibility per file

### State Management
**Zustand chosen for**:
- Minimal boilerplate (~2.3KB bundle size)
- Excellent TypeScript inference
- Simple learning curve
- Efficient re-rendering

## Build Configuration

### Vite Setup
```typescript
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**Features**: Path aliases, HMR, tree shaking, optimized builds

### TypeScript Configuration
- Target: ES2020
- Module: ESNext
- Strict mode enabled
- Path aliases configured
- No unused locals/parameters

## Design System

### CSS Custom Properties
```css
:root {
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  --color-primary: #3b82f6;
  --color-text: #1f2937;
  --color-bg: #ffffff;
}
```

### Theme Support
- CSS variables for all design tokens
- Dark/light mode toggle
- Consistent spacing and typography
- No hardcoded values

## Development Workflow

### Local Development
```bash
# Frontend
cd packages/frontend && npm run dev

# Backend  
cd packages/backend && npm run dev

# Full stack
npm run dev
```

### Build Process
```bash
npm run build        # Production build
npm run type-check   # TypeScript checking
npm run lint         # ESLint
```

## API Architecture

### Endpoints
- **Health**: `/health` - Basic health check
- **API**: `/api/*` - Main API routes
- **MZOO Proxy**: `/api/mzoo/*` - External API proxy
- **Spawn**: `/api/spawn/*` - Entity generation
- **Static**: `/*` - SPA catch-all

### Environment Variables
```env
MZOO_API_KEY=xxx        # External API key
PORT=3030               # Server port
NODE_ENV=development    # Environment
```

## Performance Targets

### Frontend
- Bundle size: < 150KB gzipped
- First contentful paint: < 2 seconds
- Build time: < 2 seconds

### Backend
- Response time: < 100ms for local operations
- Startup time: < 1 second
- Memory usage: < 100MB baseline

## Technical Constraints

### Browser Support
- Modern browsers only (Chrome, Firefox, Safari, Edge)
- ES2020 features used
- No IE11 support

### Development Requirements
- Node.js 18.x or higher
- npm package manager
- VS Code recommended

### Platform Support
- macOS, Linux, Windows
- Docker optional
- Cloud deployment ready

## Current Technical State

### Implemented
- ✅ Component library with design system
- ✅ Zustand state management
- ✅ Navigation system (13 intent types)
- ✅ Location hierarchy system (4 levels)
- ✅ DNA inheritance system
- ✅ FLUX image generation integration
- ✅ SSE for real-time updates

### Pending
- ⏳ Testing infrastructure (Vitest)
- ⏳ E2E testing (Playwright)
- ⏳ CI/CD pipeline
- ⏳ Performance monitoring
