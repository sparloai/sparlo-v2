---
title: "Archive Button Event Propagation Fix"
description: "Archive button on reports dashboard (/home) was not responding to clicks due to event propagation bubbling to parent card container"
category: ui
severity: medium
date_solved: 2025-12-29
tags:
  - event-propagation
  - react
  - click-handlers
  - user-feedback
  - accessibility
  - toast-notifications
related_components:
  - ArchiveToggleButton
  - ReportsDashboard
  - archiveReport (server action)
related_docs:
  - docs/solutions/architecture/reports-dashboard-refactoring.md
  - docs/solutions/ux/an0-auto-redirect-and-error-handling.md
---

# Archive Button Event Propagation Fix

## Problem

The archive button on the reports page (`/home`) did nothing when clicked. Users reported no visual feedback and no action occurring.

### Symptoms

- Archive button click had no visible effect
- No loading indicator during operation
- No success/error feedback to user
- Page sometimes navigated away unexpectedly

## Root Cause

Two related issues:

1. **Event Propagation**: The archive button was nested inside a clickable card that navigated to the report detail page. When clicking the button, the click event bubbled up to the parent card's `onClick` handler, causing navigation instead of archiving.

2. **Silent Failures**: Even when the event was caught, there was no user feedback - the server action result wasn't properly checked, and no toast notifications were shown.

## Solution

### 1. Stop Event Propagation on Container

In `reports-dashboard.tsx`, wrap the actions area with an onClick handler that stops propagation:

```tsx
{/* Actions */}
<div
  className="absolute top-1/2 right-5 flex -translate-y-1/2 items-center gap-1"
  onClick={(e) => e.stopPropagation()}
>
  <ArchiveToggleButton
    reportId={report.id}
    isArchived={false}
    onComplete={() => router.refresh()}
  />
</div>
```

### 2. Add User Feedback with Toast Notifications

In `archive-toggle-button.tsx`:

```tsx
import { toast } from '@kit/ui/sonner';
import { cn } from '@kit/ui/utils';

const handleClick = (e: React.MouseEvent) => {
  e.preventDefault();
  e.stopPropagation();

  if (isPending) return;

  startTransition(async () => {
    try {
      const result = await archiveReport({
        id: reportId,
        archived: !isArchived,
      });

      if (result.success) {
        toast.success(isArchived ? 'Report restored' : 'Report archived');
        onComplete?.();
        router.refresh();
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update report',
      );
    }
  });
};
```

### 3. Add Loading State and Accessibility

```tsx
const Icon = isPending ? Loader2 : isArchived ? RotateCcw : Archive;
const label = isArchived ? 'Restore report' : 'Archive report';

return (
  <button
    type="button"
    onClick={handleClick}
    disabled={isPending}
    aria-label={label}
    aria-busy={isPending}
    className="rounded p-1.5 text-[--text-muted] opacity-0 transition-all group-hover:opacity-100 hover:bg-[--surface-overlay] hover:text-[--text-secondary] disabled:opacity-50"
    title={label}
  >
    <Icon className={cn('h-4 w-4', isPending && 'animate-spin')} />
  </button>
);
```

## Files Changed

- `apps/web/app/home/(user)/_components/shared/archive-toggle-button.tsx`
- `apps/web/app/home/(user)/_components/reports-dashboard.tsx`

## Prevention Checklist

### When Building Interactive Elements Inside Clickable Containers:

- [ ] Add `onClick={(e) => e.stopPropagation()}` to the container wrapping interactive elements
- [ ] Use `type="button"` on buttons to prevent form submission
- [ ] Add `e.preventDefault()` and `e.stopPropagation()` in button click handlers
- [ ] Provide loading state feedback (spinner, disabled state)
- [ ] Add toast notifications for success/error
- [ ] Include accessibility attributes (`aria-label`, `aria-busy`)
- [ ] Use `cn()` utility for conditional classes instead of template strings

### Code Review Questions:

1. Is the button nested inside a clickable parent?
2. Is event propagation properly stopped?
3. Is there user feedback for all states (loading, success, error)?
4. Are accessibility attributes present?

## Testing

```tsx
// Test that clicking archive doesn't navigate
it('should not navigate when archive button is clicked', async () => {
  render(<ReportCard report={mockReport} />);

  const archiveButton = screen.getByLabelText('Archive report');
  await userEvent.click(archiveButton);

  expect(mockRouter.push).not.toHaveBeenCalled();
  expect(mockArchiveReport).toHaveBeenCalledWith({
    id: mockReport.id,
    archived: true,
  });
});

// Test loading state
it('should show loading spinner while pending', async () => {
  render(<ArchiveToggleButton reportId="123" isArchived={false} />);

  const button = screen.getByRole('button');
  await userEvent.click(button);

  expect(button).toHaveAttribute('aria-busy', 'true');
  expect(button).toBeDisabled();
});
```

## Key Learnings

1. **Always stop propagation for nested interactive elements** - When buttons are inside clickable cards, the parent's onClick will fire unless explicitly stopped.

2. **Trust TypeScript types** - Instead of defensive `result && 'success' in result && result.success`, just use `result.success` when types are properly defined.

3. **User feedback is essential** - Silent failures are worse than visible errors. Always show loading states and success/error feedback.

4. **Accessibility matters** - `aria-label` and `aria-busy` help screen reader users understand the button's state.
