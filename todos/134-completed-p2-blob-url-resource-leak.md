---
status: completed
priority: p2
issue_id: "134"
tags: [memory-leak, code-review, share-export]
dependencies: []
---

# Resource Leak: Blob URLs Not Cleaned Up on Error

## Problem Statement

In `handleExport`, if an error occurs after `URL.createObjectURL()` but before `URL.revokeObjectURL()`, the object URL will leak memory.

**Why it matters**: Memory leak on error, accumulates if users repeatedly hit errors.

## Findings

**Source**: Kieran TypeScript review of commit d08d4fa

**File**: `/apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

```typescript
const handleExport = useCallback(async () => {
  setIsExporting(true);
  try {
    const response = await fetch(`/api/reports/${reportId}/pdf`);
    if (!response.ok) throw new Error('Failed to generate PDF');
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);  // Created here
    const a = document.createElement('a');
    a.href = url;
    a.download = `${displayTitle || 'report'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);  // Only cleaned up on success
    toast.success('PDF downloaded');
  } catch (error) {
    // URL is NEVER revoked if error occurs after createObjectURL
    toast.error('Failed to export PDF');
  } finally {
    setIsExporting(false);
  }
}, [reportId, displayTitle]);
```

## Proposed Solutions

### Option A: Use Finally Block for Cleanup (Recommended)

```typescript
const handleExport = useCallback(async () => {
  let objectUrl: string | null = null;

  setIsExporting(true);
  try {
    const response = await fetch(`/api/reports/${reportId}/pdf`);
    if (!response.ok) throw new Error('Failed to generate PDF');

    const blob = await response.blob();
    objectUrl = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = objectUrl;
    a.download = `${displayTitle || 'report'}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);

    toast.success('PDF downloaded');
  } catch (error) {
    toast.error('Failed to export PDF');
  } finally {
    if (objectUrl) {
      URL.revokeObjectURL(objectUrl);
    }
    setIsExporting(false);
  }
}, [reportId, displayTitle]);
```

**Pros**: Guarantees cleanup in all code paths
**Cons**: Slightly more code
**Effort**: Small (15 min)
**Risk**: Very low

## Recommended Action

Option A - Use finally block to ensure cleanup.

## Technical Details

**Affected Files**:
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` (if same pattern exists)

## Acceptance Criteria

- [ ] Object URLs are revoked in both success and error paths
- [ ] No memory leaks in PDF export functionality

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Resource leak from commit d08d4fa |

## Resources

- Commit: d08d4fa
- MDN: URL.revokeObjectURL()
