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

## Icon Management
- All icons centralized in @/icons/index.ts
- Never import directly from @tabler/icons-react
- Use string references for icon props

## Design Tokens
- Spacing: var(--spacing-sm|md|lg)
- Colors: var(--color-primary|text|bg)
- Typography: var(--text-sm|md|lg)
- Border radius: var(--radius-sm|md)
