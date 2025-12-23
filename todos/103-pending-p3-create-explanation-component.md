---
status: pending
priority: p3
issue_id: "103"
tags:
  - code-review
  - simplification
  - react
  - dry
dependencies: []
---

# Create Reusable Explanation Component

## Problem Statement

The "What It Is" / "Why It Works" rendering pattern is repeated 5+ times across the hybrid report display, creating unnecessary code duplication.

## Findings

- **File:** `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
- **Lines:** 1345-1367, 1707-1731, 1593-1610 (and more)
- **Agent:** Code Simplicity Reviewer

**Repeated Pattern:**
```tsx
{track.primary.what_it_is && (
  <div className="mb-4">
    <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
      What It Is
    </span>
    <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
      {track.primary.what_it_is}
    </p>
  </div>
)}
{track.primary.why_it_works && (
  <div className="mb-4">
    <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase dark:text-zinc-400">
      Why It Works
    </span>
    <p className="mt-1 text-sm leading-relaxed text-zinc-700 dark:text-zinc-200">
      {track.primary.why_it_works}
    </p>
  </div>
)}
```

## Proposed Solutions

### Option A: Create ExplanationBlock Component (Recommended)
**Pros:** DRY, reusable, consistent
**Cons:** New component to maintain
**Effort:** 1 hour
**Risk:** Low

```tsx
function ExplanationBlock({ whatItIs, whyItWorks }: {
  whatItIs?: string;
  whyItWorks?: string;
}) {
  if (!whatItIs && !whyItWorks) return null;

  return (
    <div className="space-y-4">
      {whatItIs && (
        <div className="mb-4">
          <span className="text-xs font-medium tracking-wider text-zinc-500 uppercase">
            What It Is
          </span>
          <p className="mt-1 text-sm leading-relaxed text-zinc-700">
            {whatItIs}
          </p>
        </div>
      )}
      {/* Similar for whyItWorks */}
    </div>
  );
}

// Usage:
<ExplanationBlock
  whatItIs={track.primary.what_it_is}
  whyItWorks={track.primary.why_it_works}
/>
```

## Technical Details

### Affected Files
- `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`
- New: `apps/web/app/home/(user)/reports/[id]/_components/report/shared/explanation-block.tsx`

### LOC Savings
~100 lines reduced through DRY principle

## Acceptance Criteria

- [ ] ExplanationBlock component created
- [ ] All instances of pattern replaced
- [ ] Consistent styling across usages
- [ ] TypeScript types defined

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from simplification review | - |

## Resources

- PR: Current uncommitted changes
- Related: Code Simplicity Reviewer findings
