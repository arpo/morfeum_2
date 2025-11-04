# Terminology Cleanup Todo List

## Objective
Clean up terminology inconsistencies where:
- "sublocation" should be "niche" 
- "world" should be "host" (when referring to game world concept)

## Current State
- Found 121+ instances of "sublocation" that need to be "niche"
- Found 298+ instances of "world" that need review (some should be "host", others are proper nouns)

## Cleanup Plan

### Phase 1: High-Level Find and Replace
- [ ] Replace "sublocation" → "niche" in all files (excluding proper nouns)
- [ ] Replace "world" → "host" in code contexts (but preserve proper nouns like "Star Wars")
- [ ] Be careful with variable names, function names, file names

### Phase 2: Type Definition Updates
- [ ] Update interface properties using old terminology
- [ ] Fix function parameter names and return types
- [ ] Update object property references in TypeScript

### Phase 3: File Renaming
- [ ] Identify and rename files containing "sublocation" in names
- [ ] Update all import/export statements for renamed files
- [ ] Update any build configurations or paths

### Phase 4: Code Logic Updates
- [ ] Update conditional logic that checks old terminology
- [ ] Update store properties and state management references
- [ ] Fix any hardcoded strings in UI components

### Phase 5: Documentation and Comments
- [ ] Update all comments and documentation
- [ ] Update README files and inline documentation
- [ ] Ensure consistent terminology in .md files

### Phase 6: Testing and Verification
- [ ] Run TypeScript compiler to check for type errors
- [ ] Test application functionality
- [ ] Verify no broken imports or missing references
- [ ] Run build process to ensure everything compiles

## Priority Areas to Clean
1. **Backend services** - High priority, affects core functionality
2. **Frontend components** - High priority, affects user interface
3. **Type definitions** - Critical for TypeScript compilation
4. **Store/state management** - Critical for app functionality
5. **API routes and endpoints** - Critical for backend-frontend communication
6. **Documentation and comments** - Lower priority but important for maintainability

## Notes
- Exclude proper nouns (e.g., "Star Wars", "real world", "worldwide")
- Be careful with file paths and URLs
- Test after each major change to ensure no regressions
- Keep backup of important files before making changes
