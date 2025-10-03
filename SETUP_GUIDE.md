# Quick Start Guide

Get your new React/TypeScript project up and running in minutes with proven development patterns.

## 🚀 Essential Setup

### 1. Project Structure
```
your-project/
├── .clinerules/
│   ├── zustand-slice-pattern.md
│   └── design-system-components.md
├── memory-bank/
│   └── projectbrief.md
├── packages/
│   └── frontend/
│       ├── src/
│       │   ├── components/ui/
│       │   ├── features/
│       │   ├── icons/
│       │   └── styles/tokens.module.css
│       ├── package.json
│       └── vite.config.ts
└── package.json
```

### 2. Core Development Patterns

#### 🚨 STRICT SEPARATION RULES

**NEVER mix these concerns in the same file:**
- **Markup (.tsx)**: Pure JSX only, no business logic
- **Logic (.ts)**: State, effects, API calls, no JSX
- **Styles (.module.css)**: CSS only, no JavaScript

#### Component Structure
```
src/features/[feature]/components/[component]/
├── ComponentName.tsx       # PURE JSX ONLY (50-300 lines)
├── useComponentLogic.ts    # PURE LOGIC ONLY (50-300 lines)
├── types.ts               # TypeScript interfaces
├── ComponentName.module.css # PURE CSS ONLY
└── index.ts
```

#### Component Template (MARKUP ONLY)
```tsx
// ComponentName.tsx - ✅ PURE JSX ONLY
import { useComponentLogic } from './useComponentLogic';
import type { ComponentProps } from './types';

export function ComponentName(props: ComponentProps) {
  const { state, handlers, computed } = useComponentLogic(props);
  
  return (
    <div className={styles.container}>
      {/* PURE JSX RENDERING ONLY */}
      {/* NO useState, useEffect, API calls, or business logic */}
      {state.loading && <Spinner />}
      <button onClick={handlers.handleClick}>
        {computed.displayText}
      </button>
    </div>
  );
}
```

#### Logic Template (LOGIC ONLY)
```ts
// useComponentLogic.ts - ✅ PURE LOGIC ONLY
import { useState, useEffect, useCallback } from 'react';
import type { ComponentProps, ComponentLogicReturn } from './types';

export function useComponentLogic(props: ComponentProps): ComponentLogicReturn {
  // ALL STATE MANAGEMENT HERE
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // ALL SIDE EFFECTS HERE
  useEffect(() => {
    // Component lifecycle logic
  }, []);
  
  // ALL EVENT HANDLERS HERE
  const handleClick = useCallback(async () => {
    // Business logic implementation
    setLoading(true);
    try {
      const result = await apiCall();
      setData(result);
    } finally {
      setLoading(false);
    }
  }, []);
  
  // ALL COMPUTED VALUES HERE
  const displayText = computed(() => {
    return data?.name || 'Default';
  }, [data]);
  
  return {
    state: { data, loading },
    handlers: { handleClick },
    computed: { displayText }
  };
}
```

#### CSS Template (STYLES ONLY)
```css
/* ComponentName.module.css - ✅ PURE CSS ONLY */
.container {
  display: flex;
  gap: var(--spacing-md);
  padding: var(--spacing-lg);
}

/* NO JavaScript, NO logic, NO JSX */
```

#### Zustand Slice Pattern
```ts
// store/slices/featureSlice.ts
export const createFeatureSlice: StateCreator<CombinedStore> = (set, get) => ({
  features: [],
  loading: false,
  
  fetchFeatures: async () => {
    set({ loading: true });
    try {
      const data = await fetch('/api/features');
      set({ features: await data.json(), loading: false });
    } catch (error) {
      set({ loading: false });
    }
  }
});
```

### 3. Design System

#### Design Tokens
```css
/* src/styles/tokens.module.css */
:root {
  --spacing-sm: 0.5rem;
  --spacing-md: 1rem;
  --spacing-lg: 1.5rem;
  
  --color-primary: #3b82f6;
  --color-text: #1f2937;
  --color-bg: #ffffff;
  
  --text-sm: 0.875rem;
  --text-md: 1rem;
  --text-lg: 1.125rem;
  
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}
```

#### Icon Management
```ts
// src/icons/index.ts
export { IconHome, IconSettings, IconUser } from '@tabler/icons-react';
// Add new icons here ONLY
```

#### Usage Rules
```tsx
// ✅ Correct
import { IconHome } from '@/icons';
import { Button } from '@/components/ui';

<Button leftIcon="IconHome" variant="primary">Home</Button>

// ❌ Wrong
import { IconHome } from '@tabler/icons-react';
<Button leftIcon={<IconHome />}>Home</Button>
```

### 4. Essential Configuration

#### package.json
```json
{
  "name": "your-project",
  "private": true,
  "workspaces": ["packages/*"],
  "scripts": {
    "dev": "cd packages/frontend && npm run dev",
    "build": "cd packages/frontend && npm run build",
    "test": "cd packages/frontend && npm test",
    "lint": "cd packages/frontend && npm run lint"
  }
}
```

#### Frontend package.json
```json
{
  "name": "@your-project/frontend",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "test": "vitest"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.15.0",
    "zustand": "^4.4.0"
  }
}
```

#### vite.config.ts
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
  },
  server: { port: 5173 }
});
```

### 5. .clinerules (Essential Files Only)

#### zustand-slice-pattern.md
```markdown
## Component Separation Rules
- Presentation (.tsx): Pure JSX, consume hook output
- Logic (.ts): Business logic, state management, API calls
- Types (types.ts): Component interfaces

## Store Rules
- 50-150 lines per slice
- Cross-slice communication via get()/getState()
- Side-effects in hooks, not slices

## File Naming
- Components: PascalCase.tsx
- Hooks: useFeatureLogic.ts
- Types: types.ts
```

#### design-system-components.md
```markdown
## Component Usage
- Use unified components from @/components/ui
- Import icons from @/icons ONLY
- Use design tokens, not hardcoded values

## Import Pattern
```tsx
import { Button, Icon } from '@/components/ui';
import { IconHome } from '@/icons';
```

## Styling
- Use CSS custom properties: var(--spacing-md)
- No hardcoded colors/sizes
- CSS Modules for component styles
```

## 🏃‍♂️ Get Started

### 1. Create Project
```bash
mkdir your-project && cd your-project
npm init -y
```

### 2. Setup Structure
```bash
mkdir -p .clinerules memory-bank packages/frontend/src/{components/ui,features,icons,styles}
```

### 3. Install Dependencies
```bash
npm install react react-dom react-router-dom zustand
npm install -D vite @vitejs/plugin-react typescript @types/react @types/react-dom
```

### 4. Create Files
Copy the templates from above into your project structure.

### 5. Start Development
```bash
npm run dev
```

## 📋 Key Rules to Follow

### 🚨 STRICT SEPARATION (NON-NEGOTIABLE)

1. **Markup Files (.tsx)** - PURE JSX ONLY
   - ✅ JSX rendering, conditional logic, event binding
   - ❌ NO useState, useEffect, API calls, business logic
   - ❌ NO calculations, data processing, side effects

2. **Logic Files (.ts)** - PURE LOGIC ONLY
   - ✅ useState, useEffect, API calls, calculations
   - ✅ Event handlers, data processing, side effects
   - ❌ NO JSX, NO rendering, NO CSS classes

3. **Style Files (.module.css)** - PURE CSS ONLY
   - ✅ CSS rules, animations, responsive design
   - ❌ NO JavaScript, NO logic, NO imports

### Additional Rules

4. **Component Size**: 50-300 lines per file, break up larger ones
5. **Icons**: Centralize in @/icons, never import directly
6. **Styling**: Use design tokens, CSS Modules only
7. **State**: Zustand slices, 50-150 lines each
8. **Naming**: Be consistent, follow established patterns

### 🚨 FORBIDDEN PATTERNS

```tsx
// ❌ NEVER DO THIS - Mixed concerns
export function BadComponent() {
  const [data, setData] = useState(null); // Logic in markup
  
  useEffect(() => { // Logic in markup
    fetchData();
  }, []);
  
  return (
    <div style={{ color: 'red' }}> {/* Inline styles */}
      {data.map(item => <span>{item.name}</span>)} {/* Complex logic in JSX */}
    </div>
  );
}
```

```tsx
// ✅ ALWAYS DO THIS - Pure separation
// ComponentName.tsx - Pure JSX
export function ComponentName(props: ComponentProps) {
  const { state, handlers } = useComponentLogic(props);
  
  return (
    <div className={styles.container}>
      {state.data.map(item => (
        <Item key={item.id} name={item.name} />
      ))}
    </div>
  );
}
```

## 🎯 Next Steps

1. Create your first feature following the component structure
2. Set up your design tokens and icon system
3. Build a few components to establish patterns
4. Expand documentation as needed

That's it! You now have a solid foundation for building maintainable React applications.
