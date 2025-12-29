---
status: pending
priority: p3
issue_id: "121"
tags: [code-review, accessibility]
dependencies: []
---

# Missing Focus-Visible Styles on TOC Navigation Buttons

## Problem Statement

The TOC navigation buttons lack explicit keyboard focus indicators beyond browser defaults. This makes keyboard navigation harder for accessibility users.

**Why it matters:**
- WCAG 2.1 requires visible focus indicators (Success Criterion 2.4.7)
- Keyboard users need clear visual feedback when navigating
- Browser defaults may be insufficient or inconsistent

## Findings

**Location:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx` (Lines 332-344, 352-360)

**Current Code:**
```tsx
<button
  onClick={() => onNavigate(section.id)}
  className={cn(
    'relative block w-full py-1.5 text-left text-[14px] transition-colors',
    isActive ? 'font-medium text-zinc-900' : 'text-zinc-500 hover:text-zinc-900',
  )}
>
```

**Missing:** No `focus-visible:` styles for keyboard navigation.

## Proposed Solutions

### Solution 1: Add focus-visible ring (Recommended)
```tsx
className={cn(
  'relative block w-full py-1.5 text-left text-[14px] transition-colors',
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-900 focus-visible:ring-offset-2',
  isActive ? '...' : '...'
)}
```
- **Pros:** Clear focus indicator, WCAG compliant
- **Cons:** Minimal visual addition
- **Effort:** Small (10 min)
- **Risk:** Low

### Solution 2: Add ARIA landmark label
```tsx
<nav aria-label="Report table of contents" className="...">
```
- **Pros:** Helps screen reader navigation
- **Cons:** Doesn't address visual focus
- **Effort:** Minimal
- **Risk:** None

## Recommended Action

Implement both solutions for comprehensive accessibility.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

## Acceptance Criteria

- [ ] TOC buttons have visible focus indicator on keyboard navigation
- [ ] Focus indicator uses focus-visible (not :focus) to avoid mouse clicks
- [ ] Nav element has aria-label

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Pattern-recognition agent identified accessibility gap |

## Resources

- PR: ca43470
- WCAG 2.4.7: https://www.w3.org/WAI/WCAG21/Understanding/focus-visible.html
