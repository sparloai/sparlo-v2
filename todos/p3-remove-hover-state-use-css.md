---
priority: P3
category: code-quality
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Replace useState Hover with CSS-only Solution

## Problem
The `RecentReportItem` component uses React state for hover tracking, causing unnecessary re-renders.

```typescript
// nav-sidebar.tsx
const [isHovered, setIsHovered] = useState(false);

onMouseEnter={() => setIsHovered(true)}
onMouseLeave={() => setIsHovered(false)}
```

## Impact
- Unnecessary re-renders on hover
- 5 components x 2 renders per hover = 10 renders per sidebar interaction
- Code smell - using JavaScript for what CSS handles natively

## Solution
Use CSS group-hover instead:

```typescript
// Remove useState and hover handlers

<Link
  href={`/home/reports/${report.id}`}
  onClick={onClose}
  className="group relative flex items-start gap-3 rounded-md px-2 py-2.5 transition-colors hover:bg-[--surface-overlay]"
>
  {/* ... */}
  <button
    onClick={handleArchive}
    disabled={isPending}
    className="flex-shrink-0 rounded p-1 text-[--text-muted] opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[--surface-elevated] hover:text-[--text-secondary]"
    title="Archive report"
  >
    <Archive className="h-3.5 w-3.5" />
  </button>
</Link>
```

This pattern is already correctly used in `reports-dashboard.tsx` and `archived-reports-dashboard.tsx`.

## File
`/apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx`

## Effort
30 minutes
