---
status: pending
priority: p3
issue_id: "115"
tags: [code-review, css, yagni, cleanup]
dependencies: []
---

# Potential YAGNI Features (700+ Lines)

## Problem Statement

Several CSS features appear to be speculative implementations that may not be in active use, adding ~700+ lines of potentially unnecessary code.

**Suspected Unused Features:**
1. **Expandable table rows** (report-tables.css:699-749) - 50 lines
2. **Floating TOC panel** (report-components.css:1442-1506) - 64 lines
3. **Ask panel chat system** (report-components.css:1512-1853) - 341 lines
4. **Equation blocks** (report-sections.css:1395-1651) - 256 lines
5. **Sparkline cells** (report-tables.css:559-583) - 25 lines
6. **Scan line animation** (report-animations.css:129-249) - ~40 lines
7. **Typing cursor effect** (report-animations.css:154-256) - ~30 lines

## Findings

- **Simplicity Reviewer**: Flagged as YAGNI violations
- Features built "just in case" rather than when needed
- Estimated ~700 lines of potentially unused CSS
- Need to verify actual usage before removing

## Proposed Solutions

### Solution A: Audit and Remove Unused (Recommended)
1. Search codebase for class usage
2. Remove unused CSS
3. Document remaining features

- **Pros**: Smaller bundle, cleaner code
- **Cons**: Risk of removing needed code
- **Effort**: 2-3 hours
- **Risk**: Medium (needs careful verification)

### Solution B: Extract to Optional Modules
Move to separate files loaded on-demand.
- **Pros**: Code preserved, not always loaded
- **Cons**: More complexity
- **Effort**: 4 hours
- **Risk**: Low

### Solution C: Add Usage Comments
Document where each feature is used, defer cleanup.
- **Pros**: No risk, provides documentation
- **Cons**: Doesn't reduce bundle
- **Effort**: 1 hour
- **Risk**: None

## Recommended Action

Start with Solution A - audit usage, then remove or extract.

## Technical Details

**Files to Audit:**
- `apps/web/styles/report-components.css`
- `apps/web/styles/report-tables.css`
- `apps/web/styles/report-sections.css`
- `apps/web/styles/report-animations.css`

**Estimated LOC Reduction:** 500-700 lines (if features are unused)

## Acceptance Criteria

- [ ] Each feature verified for usage in React components
- [ ] Unused features removed or extracted to optional modules
- [ ] Active features documented
- [ ] Bundle size reduced

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from simplicity review | Build what you need, not what you might need |

## Resources

- YAGNI Principle: https://martinfowler.com/bliki/Yagni.html
