# Memory Bank Update Guidelines

## When to Update Memory Bank

Memory bank updates should ONLY occur when explicitly requested by the user with the phrase **"update memory bank"**.

## What Not to Do

- **DO NOT** proactively update memory bank files during normal task execution
- **DO NOT** update memory bank after implementing features unless asked
- **DO NOT** suggest memory bank updates unless the user asks for advice
- **DO NOT** automatically update memory bank when you think it needs updating

## Update Process

When user says **"update memory bank"**:

1. **Review ALL memory bank files** even if some don't need changes
2. **Focus on these files** (in priority order):
   - `activeContext.md` - Current work and recent changes
   - `progress.md` - Update task status and completion
   - `productContext.md` - Only if product understanding changed
   - `systemPatterns.md` - Only if architecture changed
   - `techContext.md` - Only if tech stack changed
   - `projectbrief.md` - Rarely needs updates

## Content Guidelines

### Keep It Concise
- Remove completed tasks from activeContext
- Consolidate repetitive information
- Use bullet points over paragraphs
- Remove outdated TODOs

### Focus on What Matters
- Current implementation state
- Active decisions and trade-offs
- Next immediate steps
- Known issues and blockers

### Avoid Redundancy
- Don't repeat information across files
- Reference other files instead of duplicating
- Keep each file focused on its purpose

## Example Trigger

✅ **User says**: "update memory bank"
❌ **User says**: "implement feature X" (don't update unless also asked)
❌ **You think**: "This seems important, I should update memory bank" (wait for user request)

## Memory Bank File Purposes

- **activeContext.md**: What you're working on RIGHT NOW
- **progress.md**: Feature completion checklist
- **productContext.md**: Why this project exists
- **systemPatterns.md**: How the system is architected
- **techContext.md**: Technologies and setup
- **projectbrief.md**: Core requirements (rarely changes)

## Size Targets

Aim to keep memory bank files concise:
- activeContext.md: < 200 lines
- progress.md: < 400 lines  
- Each other file: < 350 lines
- Total memory bank: < 6,000 lines

Remember: The memory bank should help you quickly understand context, not overwhelm you with details.
