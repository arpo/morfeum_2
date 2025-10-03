# Refactoring Plan for Morfeum Project

## Current Analysis Results

### File Size Analysis
All files are within the 50-300 line limit except:
- `Button.module.css` (119 lines) - Acceptable for a comprehensive component
- `index.css` (69 lines) - Contains legacy styles that conflict with design tokens
- `App.css` (29 lines) - Contains unused legacy styles

### Issues Identified

1. **Legacy CSS Files**: 
   - `App.css` and `index.css` contain hardcoded styles that conflict with the design token system
   - These should be removed or migrated to use design tokens

2. **Icon Management Overload**:
   - `icons/index.ts` exports 47 icons but only `IconLoader2` is used
   - Should be optimized to only export needed icons

3. **Missing Reusable Components**:
   - The App component has a card layout that could be extracted
   - Loading state and message display could be reusable components

4. **CSS Conflicts**:
   - Global styles in `index.css` override design tokens
   - Button styles conflict with the design system

## Refactoring Strategy

### Phase 1: Clean Up Legacy Styles
- Remove unused `App.css`
- Migrate necessary global styles to use design tokens
- Remove conflicting button styles from `index.css`

### Phase 2: Extract Reusable Components
- Create `Card` component from App's card layout
- Create `LoadingSpinner` component
- Create `Message` component for success/error states

### Phase 3: Optimize Icon Management
- Remove unused icon exports
- Keep only icons that are actually used

### Phase 4: Improve Component Structure
- Ensure all components follow strict separation rules
- Verify proper TypeScript usage throughout

## Expected Outcomes
- Cleaner codebase with no legacy style conflicts
- Reusable components that follow the design system
- Optimized bundle size with fewer unused exports
- Better maintainability with proper component extraction
