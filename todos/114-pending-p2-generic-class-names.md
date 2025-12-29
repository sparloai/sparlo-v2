---
status: pending
priority: p2
issue_id: "114"
tags: [code-review, css, naming, architecture]
dependencies: []
---

# Generic Class Names Could Conflict

## Problem Statement

Several CSS classes use overly generic names without the `report-` namespace prefix, risking conflicts with other features or libraries.

**Generic Classes Found:**
```css
.status        /* Too generic, could conflict */
.callout       /* Could conflict with other features */
.btn           /* Global impact */
.badge-pill    /* Missing report- prefix */
.sorted        /* Should be .sortable--sorted */
.expanded      /* Should be .data-table-row--expanded */
.expandable    /* Should be .data-table-row--expandable */
```

**Files Affected:**
- `apps/web/styles/report-components.css`
- `apps/web/styles/report-tables.css`

## Findings

- **Architecture Agent**: Identified as naming convention violation
- **Pattern Recognition Agent**: Flagged inconsistent naming
- Report CSS should use `report-` namespace
- State classes should use BEM `--` modifier syntax

## Proposed Solutions

### Solution A: Add report- Prefix (Recommended)
```css
/* Before */
.status { ... }
.btn { ... }

/* After */
.report-status { ... }
.report-btn { ... }
```
- **Pros**: Prevents conflicts, consistent namespace
- **Cons**: Requires HTML updates
- **Effort**: 2 hours
- **Risk**: Medium (requires component updates)

### Solution B: Scoped CSS Modules
Convert to CSS Modules for automatic scoping.
- **Pros**: True isolation, no naming concerns
- **Cons**: Significant refactor
- **Effort**: 8+ hours
- **Risk**: High

## Recommended Action

Implement Solution A - add `report-` prefix to generic classes.

## Technical Details

**Affected Files:**
- `apps/web/styles/report-components.css`
- `apps/web/styles/report-tables.css`
- React components using these classes

**Classes to Rename:**
- `.status` → `.report-status`
- `.callout` → `.report-callout`
- `.btn` → `.report-btn`
- `.badge-pill` → `.report-badge-pill`
- `.sorted` → `.sortable--sorted-asc` / `.sortable--sorted-desc`
- `.expanded` → `.data-table-row--expanded`
- `.expandable` → `.data-table-row--expandable`

## Acceptance Criteria

- [ ] All generic class names prefixed with `report-`
- [ ] State classes use BEM `--` modifier syntax
- [ ] No conflicts with Tailwind or other features
- [ ] Visual appearance unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-25 | Created from architecture review | Namespace CSS to prevent conflicts |

## Resources

- BEM Naming: https://getbem.com/naming/
