---
priority: P2
category: ux
status: pending
source: code-review-2e709f0
created: 2025-12-20
---

# Add Error Handling to Archive/Restore Actions

## Problem
All archive/restore actions silently fail without user feedback.

```typescript
// nav-sidebar.tsx, reports-dashboard.tsx, archived-reports-dashboard.tsx
const handleArchive = (e: React.MouseEvent) => {
  e.preventDefault();
  startTransition(async () => {
    await archiveReport({ id: report.id, archived: true });  // No error handling
    router.refresh();
  });
};
```

## Impact
- If `archiveReport` fails (network error, authorization, etc.), user gets no feedback
- UI might refresh showing the report still there, leaving users confused
- Poor user experience on failure

## Solution
Add error state and toast notification:

```typescript
const [error, setError] = useState<string | null>(null);

const handleArchive = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();
  startTransition(async () => {
    try {
      const result = await archiveReport({ id: report.id, archived: true });
      if (!result.success) {
        setError('Failed to archive report');
        return;
      }
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive report');
    }
  });
};
```

Consider using a toast notification component for better UX.

## Files
- `/apps/web/app/home/(user)/_components/navigation/nav-sidebar.tsx`
- `/apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- `/apps/web/app/home/(user)/archived/_components/archived-reports-dashboard.tsx`

## Effort
2 hours
