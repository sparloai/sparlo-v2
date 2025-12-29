---
status: pending
priority: p3
issue_id: "120"
tags: [code-review, quality, yagni]
dependencies: []
---

# Unused Features in useTocScroll Hook (YAGNI Violation)

## Problem Statement

The `useTocScroll` hook exports features (`trackProgress`, `trackVisibility`, `progress`, `hasScrolled`) that are not used anywhere in the codebase. This is speculative generality that adds maintenance burden.

**Why it matters:**
- ~45 lines of unused code to maintain
- Adds complexity to the hook interface
- Violates YAGNI (You Aren't Gonna Need It) principle

## Findings

**Location:** `apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-toc-scroll.ts`

**Unused features:**
- `trackProgress` option (lines 40-43)
- `trackVisibility` option (lines 50-54)
- `progress` return value (lines 73-74)
- `hasScrolled` return value
- Scroll listener for progress/visibility (lines 101-133)
- Constants: `TOC_STICKY_TOP_WITH_NAV`, `SCROLL_VISIBILITY_THRESHOLD`

**Current usage in codebase:**
```tsx
// Only these are used:
const { activeSection, navigateToSection } = useTocScroll({ sectionIds, scrollOffset });
```

## Proposed Solutions

### Solution 1: Remove unused features (Recommended)
Remove `trackProgress`, `trackVisibility`, and related code. Re-add when actually needed.

- **Pros:** Smaller bundle, simpler API, less maintenance
- **Cons:** Needs re-implementation if features become needed
- **Effort:** Small (20 min)
- **Risk:** Low (can always add back)

### Solution 2: Document as future API
Add JSDoc noting these are experimental/planned features.

- **Pros:** No code changes
- **Cons:** Still maintaining unused code
- **Effort:** Minimal
- **Risk:** None

## Recommended Action

Implement Solution 1 - remove unused features following YAGNI.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-toc-scroll.ts`

**Estimated LOC reduction:** ~45 lines

## Acceptance Criteria

- [ ] Unused options removed from hook interface
- [ ] Unused return values removed
- [ ] Unused scroll listener code removed
- [ ] Unused constants removed
- [ ] Existing functionality unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Simplicity-reviewer identified YAGNI violation |

## Resources

- PR: ca43470
