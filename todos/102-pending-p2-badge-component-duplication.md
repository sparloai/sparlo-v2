---
status: pending
priority: p2
issue_id: "102"
tags:
  - code-review
  - architecture
  - duplication
dependencies: []
---

# Badge Component Duplication and Inconsistency

## Problem Statement

Two competing badge implementation patterns exist in the codebase, causing import confusion and maintenance overhead.

## Findings

- **Files:**
  - `apps/web/app/home/(user)/reports/[id]/_components/report/shared/badges.tsx`
  - `apps/web/app/home/(user)/reports/[id]/_components/report/shared/badges/viability-badge.tsx`
  - `apps/web/app/home/(user)/reports/[id]/_components/report/shared/badges/confidence-badge.tsx`
- **Agent:** Pattern Recognition Specialist

**Differences Found:**
- `badges.tsx`: Uses `style` variable, minimal config
- `badges/viability-badge.tsx`: Uses `config` with `defaultLabel` property
- `badges/confidence-badge.tsx`: Includes icon support, different API

**Issues:**
- Import confusion
- Maintenance overhead
- API inconsistency

## Proposed Solutions

### Option A: Consolidate to Directory Structure (Recommended)
**Pros:** Clear organization, consistent API
**Cons:** More files
**Effort:** 1-2 hours
**Risk:** Low

Keep `badges/` directory, delete `badges.tsx`, create barrel export.

### Option B: Consolidate to Single File
**Pros:** Single import location
**Cons:** Large file
**Effort:** 1 hour
**Risk:** Low

## Technical Details

### Affected Files
- `apps/web/app/home/(user)/reports/[id]/_components/report/shared/badges.tsx`
- `apps/web/app/home/(user)/reports/[id]/_components/report/shared/badges/`

## Acceptance Criteria

- [ ] Single, clear badge component pattern
- [ ] Consistent API across all badges
- [ ] All imports updated to use new pattern
- [ ] No duplicate implementations

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from pattern review | - |

## Resources

- PR: Current uncommitted changes
- Related: Pattern Recognition Specialist findings
