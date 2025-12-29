---
status: completed
priority: p2
issue_id: "118"
tags: [code-review, quality, dry]
dependencies: []
---

# Duplicate Button Styling in Share/Export Buttons

## Problem Statement

The Share and Export buttons use identical className strings (100+ characters each), violating the DRY principle. If the button style needs updating, it must be changed in two places.

**Why it matters:**
- Maintenance burden: style changes require updates in multiple locations
- Inconsistency risk: one button could be updated while the other is forgotten
- Code bloat: ~200 characters of duplicated CSS classes

## Findings

**Location:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx` (Lines 415, 423)

**Current Code:**
```tsx
// Line 415
<button className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-[13px] tracking-[-0.01em] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900" ...>

// Line 423 (identical)
<button className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-[13px] tracking-[-0.01em] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900" ...>
```

## Proposed Solutions

### Solution 1: Extract to shared component (Recommended)
```tsx
const ActionButton = ({ onClick, icon, label, ariaLabel }) => (
  <button
    onClick={onClick}
    className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-[13px] tracking-[-0.01em] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
    aria-label={ariaLabel}
  >
    {icon}
    <span className="hidden sm:inline">{label}</span>
  </button>
);
```
- **Pros:** DRY, reusable, single source of truth
- **Cons:** Slight indirection
- **Effort:** Small (15 min)
- **Risk:** Low

### Solution 2: Extract className to constant
```tsx
const actionButtonStyles = "flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-[13px] tracking-[-0.01em] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900";

<button className={actionButtonStyles} ...>
```
- **Pros:** Simple, minimal change
- **Cons:** Still has some duplication in button structure
- **Effort:** Small (5 min)
- **Risk:** Low

## Recommended Action

Implement Solution 1 (extract component) for full DRY compliance.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

## Acceptance Criteria

- [ ] Button styling defined in one place
- [ ] Both Share and Export use same component/styles
- [ ] Styling changes only need to be made once

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Pattern-recognition agent identified duplication |
| 2025-12-29 | Implemented Solution 1 | Created ActionButton component with typed props interface |

## Resources

- PR: ca43470
