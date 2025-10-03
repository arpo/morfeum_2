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

## 🚨 STRICT SEPARATION (NON-NEGOTIABLE)

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

## Component Size Limits
- 50-300 lines per file
- Break up larger components immediately
- Each file has single responsibility
