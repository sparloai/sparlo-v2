---
status: pending
priority: p2
issue_id: "109"
tags: [code-review, css, architecture, maintainability]
dependencies: []
---

# report-components.css Too Large (1914 lines)

## Problem Statement

The `report-components.css` file at 1914 lines is approaching monolithic territory, making it difficult to maintain and navigate.

**File**: `apps/web/styles/report-components.css` - 1914 lines

## Findings

- **Pattern Recognition Agent**: Identified as file size concern
- **Simplicity Reviewer**: Flagged for splitting
- Single file contains 16+ distinct component groups:
  1. Status indicators (lines 8-107)
  2. Pill badges (108-193)
  3. Indicator dots (194-251)
  4. Tag badges (252-301)
  5. Score badges (302-345)
  6. Live indicators (346-400)
  7. Percentage badges (401-443)
  8. Track indicators (444-494)
  9. Confidence badges (495-528)
  10. Viability badges (529-563)
  11. Buttons (564-667)
  12. Validation gates (668-781)
  13. Section headers (782-994)
  14. Navigation/TOC (1165-1506)
  15. Chat panel (1507-1853)
  16. Reduced motion (1854-1913)

## Proposed Solutions

### Solution A: Split Into Logical Modules (Recommended)
Create separate files:
- `report-badges.css` - all badge variants (~500 lines)
- `report-navigation.css` - TOC, scroll progress (~350 lines)
- `report-chat.css` - ask panel functionality (~350 lines)
- `report-components.css` - shared base components (~700 lines)

- **Pros**: Better maintainability, easier to navigate
- **Cons**: More files to manage, import order matters
- **Effort**: 2-3 hours
- **Risk**: Low

### Solution B: Keep Single File with Better Comments
Add clear section markers and table of contents at top.
- **Pros**: Quick fix, no structural changes
- **Cons**: Doesn't solve the size problem
- **Effort**: 30 minutes
- **Risk**: None

## Recommended Action

Implement Solution A - split into 4 focused files.

## Technical Details

**Current File:**
- `apps/web/styles/report-components.css` (1914 lines)

**Proposed Structure:**
- `apps/web/styles/report-badges.css` (~500 lines)
- `apps/web/styles/report-navigation.css` (~350 lines)
- `apps/web/styles/report-chat.css` (~350 lines)
- `apps/web/styles/report-components.css` (~700 lines)

## Acceptance Criteria

- [ ] No single CSS file exceeds 1000 lines
- [ ] Each file has single responsibility
- [ ] Import order documented
- [ ] Visual appearance unchanged
- [ ] Build succeeds

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from code review | Large files hurt maintainability |

## Resources

- CSS Architecture best practices
