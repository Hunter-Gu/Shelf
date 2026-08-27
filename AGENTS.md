# Guidelines

## Code boundaries
- Keep code boundaries explicit. When adding a feature, consider how it could be removed quickly to validate the boundary.

## File structure
- Keep file organization intentional; avoid bloated, oversized files.

## Comments
- Keep comments simple; don't add one for every change. Only write a comment
  when the reasoning isn't obvious from the code itself.
- Don't reference PRD/planning doc paths or section numbers in code
  comments. Docs get restructured and renumbered independently of the code,
  so the reference goes stale; explain the reasoning inline instead.

## Change intent
- The AI should clearly state whether it is modifying existing code or adding new code.

## Tests
- Do not add unit tests for GUI-only behavior such as visual layout,
  responsive arrangement, rendered component appearance, or browser
  interactions. If an existing GUI-only unit test fails, delete that test case
  instead of maintaining it.
