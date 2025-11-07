# Product Context

## Why Morfeum Exists

Morfeum is a demonstration project showcasing modern React development patterns and architectural best practices. It serves as a reference implementation for building scalable, maintainable web applications.

### Core Purpose
- **Pattern Demonstration**: Show clean architecture principles in React
- **Developer Education**: Provide learning resources for modern workflows
- **Template Foundation**: Starting point for production applications
- **Best Practices**: Document and enforce coding standards

## Problems Morfeum Solves

### Development Challenges
1. **Component Architecture Chaos**: Demonstrates strict separation of concerns
2. **Style Management Issues**: Implements design systems with CSS Modules
3. **State Management Complexity**: Provides Zustand patterns
4. **Bundle Size Inflation**: Demonstrates optimization techniques
5. **Code Duplication**: Shows reusable component creation
6. **Inconsistent Patterns**: Establishes clear guidelines

## How Morfeum Works

### Core Functionality
1. **Component System**: Reusable UI components with strict architecture
   - Separation of markup (.tsx), logic (.ts), and styles (.module.css)
   - 50-300 line file size limits
   - TypeScript interfaces for all components

2. **Design System**: Comprehensive design tokens and styling patterns
   - CSS variables for theming
   - Dark/light mode support
   - Consistent spacing and typography

3. **State Management**: Efficient handling with Zustand
   - Slice pattern with clear boundaries
   - Cross-slice communication patterns
   - Side-effects in hooks, not slices

4. **Build System**: Optimized process with Vite
   - Fast development server
   - Tree shaking and code splitting
   - Path aliases for clean imports

### Technical Implementation
- **Monorepo Structure**: Frontend and backend packages
- **Path Aliases**: Clean imports with @/ shortcuts
- **CSS Modules**: Scoped styling preventing conflicts
- **TypeScript**: Full type safety across application
- **Modern React**: Hooks, functional components, latest patterns

## User Experience Goals

### Developer Experience
- **Intuitive Workflows**: Clear patterns make development straightforward
- **Fast Builds**: Sub-2 second build times with Vite
- **Type Safety**: Full TypeScript coverage prevents runtime errors
- **Maintainability**: Code that's easy to understand and modify

### Application Features
- **Entity System**: Characters and locations with rich hierarchies
- **Navigation System**: AI-powered spatial navigation with 13 intent types
- **DNA System**: Inheritance-based property system for consistent world-building
- **Image Generation**: FLUX integration for visual content
- **Real-time Updates**: SSE for live spawn progress

## Target Users

**Primary**: React developers learning modern patterns and architecture
**Secondary**: Team leads establishing coding standards and best practices

## Current Implementation Status

- **Frontend Architecture**: Complete with component library and design system
- **Backend Architecture**: Domain-driven modules with service layer pattern
- **Navigation System**: Phase 1 complete (intent classification), Phase 2 pending
- **Location System**: Fully operational with 4-level hierarchies
- **DNA System**: Production-ready with inheritance and clean storage
