---
priority: P3
category: code-quality
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Merge ArchiveButton and RestoreButton Components

## Problem
Two nearly identical button components that differ only in:
- Icon (Archive vs RotateCcw)
- Action parameter (archived: true vs false)

`ArchiveButton` (reports-dashboard.tsx: 132-160)
`RestoreButton` (archived-reports-dashboard.tsx: 108-136)

## Impact
- 50 lines of duplicated code
- Changes must be made in two places
- Violates DRY principle

## Solution
Create a unified toggle component:

```typescript
// _components/shared/archive-toggle-button.tsx
function ArchiveToggleButton({
  reportId,
  archived,
  onToggle,
}: {
  reportId: string;
  archived: boolean;
  onToggle: () => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startTransition(async () => {
      await archiveReport({ id: reportId, archived: !archived });
      onToggle();
    });
  };

  const Icon = archived ? RotateCcw : Archive;
  const title = archived ? "Restore report" : "Archive report";

  return (
    <button onClick={handleToggle} disabled={isPending} className="..." title={title}>
      <Icon className="h-4 w-4" />
    </button>
  );
}
```

Usage:
```typescript
// In reports-dashboard.tsx
<ArchiveToggleButton
  reportId={report.id}
  archived={false}
  onToggle={() => router.refresh()}
/>

// In archived-reports-dashboard.tsx
<ArchiveToggleButton
  reportId={report.id}
  archived={true}
  onToggle={() => router.refresh()}
/>
```

## Files
- Create: `/apps/web/app/home/(user)/_components/shared/archive-toggle-button.tsx`
- Update: `/apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- Update: `/apps/web/app/home/(user)/archived/_components/archived-reports-dashboard.tsx`

## Effort
1 hour
