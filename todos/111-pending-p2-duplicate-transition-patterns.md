---
status: pending
priority: p2
issue_id: "111"
tags: [code-review, css, duplication, performance]
dependencies: []
---

# Duplicate Transition Patterns (45 Instances)

## Problem Statement

The same multi-property transition pattern is repeated 45+ times across CSS files, adding unnecessary bundle size and maintenance burden.

**Pattern repeated throughout:**
```css
transition:
  transform var(--interaction-slow, 200ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
  box-shadow var(--interaction-slow, 200ms) var(--ease-out-expo, cubic-bezier(0.16, 1, 0.3, 1)),
  border-color var(--interaction-normal, 150ms) var(--ease-spring, cubic-bezier(0.4, 0, 0.2, 1));
```

**Files Affected:**
- `apps/web/styles/report-components.css`
- `apps/web/styles/report-sections.css`
- `apps/web/styles/report-tables.css`

## Findings

- **Pattern Recognition Agent**: Found 45 duplicate transition declarations
- **Simplicity Reviewer**: Flagged as unnecessary repetition
- Estimated ~200 lines of duplicate transition code
- Should be a single utility class

## Proposed Solutions

### Solution A: Create Reusable Token (Recommended)
```css
/* In report-tokens.css */
.report-page {
  --transition-card-hover:
    transform var(--interaction-slow, 200ms) var(--ease-out-expo),
    box-shadow var(--interaction-slow, 200ms) var(--ease-out-expo),
    border-color var(--interaction-normal, 150ms) var(--ease-spring);
}

/* Usage */
.module {
  transition: var(--transition-card-hover);
}
```
- **Pros**: Single source of truth, easy updates
- **Cons**: Minor refactor effort
- **Effort**: 2 hours
- **Risk**: Low

### Solution B: Utility Class
```css
.interactive-card {
  transition:
    transform 200ms cubic-bezier(0.16, 1, 0.3, 1),
    box-shadow 200ms cubic-bezier(0.16, 1, 0.3, 1),
    border-color 150ms cubic-bezier(0.4, 0, 0.2, 1);
}
```
- **Pros**: Even simpler, composable
- **Cons**: Requires HTML class additions
- **Effort**: 2.5 hours
- **Risk**: Medium

## Recommended Action

Implement Solution A - create transition tokens, then search-replace.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-tokens.css` - Add transition tokens
- `apps/web/styles/report-components.css` - Replace duplicates
- `apps/web/styles/report-sections.css` - Replace duplicates
- `apps/web/styles/report-tables.css` - Replace duplicates

## Acceptance Criteria

- [ ] Transition pattern defined once in tokens
- [ ] All 45 instances use the token
- [ ] Hover animations work identically
- [ ] ~200 lines of CSS removed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from code review | Transitions should be tokenized |

## Resources

- CSS Custom Properties for Transitions
