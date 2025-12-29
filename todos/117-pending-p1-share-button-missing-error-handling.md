---
status: completed
priority: p1
issue_id: "117"
tags: [code-review, security, error-handling]
dependencies: []
---

# Missing Error Handling on Share/Export Buttons

## Problem Statement

The Share and Export buttons in `brand-system-report.tsx` use Promise-based browser APIs (`navigator.share`, `navigator.clipboard.writeText`) without any error handling. Both APIs can reject, leading to silent failures with no user feedback.

**Why it matters:**
- User clicks Share → Native share dialog appears → User cancels → Promise rejects → No feedback
- Clipboard write fails due to permissions → Silent failure → User assumes it worked
- Unhandled promise rejections in console (can mask other errors)

## Findings

**Location:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx` (Lines 404-428)

**Current Code:**
```tsx
onClick={() => {
  if (navigator.share) {
    navigator.share({
      title: title || normalizedData.title || 'Report',
      url: window.location.href,
    });
  } else {
    navigator.clipboard.writeText(window.location.href);
  }
}}
```

**Evidence from codebase:** The existing `share-modal.tsx` properly handles errors:
```typescript
const handleCopy = useCallback(async () => {
  try {
    await navigator.clipboard.writeText(shareUrl);
    toast.success('Link copied to clipboard');
  } catch (error) {
    console.error('[ShareModal] Failed to copy:', error);
    toast.error('Failed to copy link');
  }
}, [shareUrl]);
```

## Proposed Solutions

### Solution 1: Add try/catch with toast notifications (Recommended)
```tsx
onClick={async () => {
  try {
    if (navigator.share) {
      await navigator.share({
        title: title || normalizedData.title || 'Report',
        url: window.location.href,
      });
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success('Link copied to clipboard');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('[Share] Error sharing report:', error);
      toast.error('Failed to share report');
    }
  }
}}
```
- **Pros:** Matches existing share-modal.tsx pattern, user feedback
- **Cons:** Requires adding toast import
- **Effort:** Small (15 min)
- **Risk:** Low

### Solution 2: Extract to separate handler function
```tsx
const handleShare = useCallback(async () => {
  try {
    const shareData = { title: displayTitle, url: window.location.href };
    if (navigator.share) {
      await navigator.share(shareData);
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast.success('Link copied to clipboard');
    }
  } catch (error) {
    if (error.name !== 'AbortError') {
      console.error('[Share] Error:', error);
      toast.error('Failed to share');
    }
  }
}, [displayTitle]);
```
- **Pros:** Testable, separates concerns, cleaner JSX
- **Cons:** More lines of code
- **Effort:** Small (20 min)
- **Risk:** Low

## Recommended Action

Implement Solution 2 (extract handler function) as it provides better testability and cleaner code structure.

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

**Components:** ReportContent

## Acceptance Criteria

- [ ] Share button wrapped in try/catch
- [ ] Export button has appropriate error handling
- [ ] User sees toast notification on clipboard copy
- [ ] AbortError (user cancel) is handled gracefully (no error shown)
- [ ] Console logs errors for debugging
- [ ] Unit tests cover error scenarios

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Security-sentinel agent identified missing error handling |
| 2025-12-29 | Implemented Solution 2 | Added handleShare with try/catch, AbortError handling, toast notifications |

## Resources

- PR: ca43470
- Existing pattern: `apps/web/app/home/(user)/reports/[id]/_components/share-modal.tsx`
- MDN Web Share API: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/share
