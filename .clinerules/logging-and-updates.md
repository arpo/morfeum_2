## Brief overview
Project-specific guidelines for logging practices and memory bank management in the Morfeum application.

## Logging practices
- **No automatic logging**: Do NOT add `console.log()` or terminal logging statements unless explicitly requested by the user
- **Emoji usage**: Avoid using emojis in logs or outputs
- **Reason**: Excessive logging creates spam and clutters output
- **When logging is acceptable**: Only when user explicitly asks for debugging output or logging

## Memory bank updates
- **Update only when requested**: Do NOT proactively update memory bank files
- **Trigger phrase**: Only update memory bank when user explicitly says "update memory bank"
- **Files to update**: activeContext.md, progress.md, and other relevant files when triggered
- **What to update**: Recent work, completed features, architectural changes

## Code changes
- **Clean implementation**: Focus on implementing features without debug statements
- **Production-ready**: Code should be clean and ready for use without verbose logging
