---
module: Report System
date: 2025-12-29
problem_type: security_issue
component: frontend_stimulus
symptoms:
  - "Share button leaks URL query params and hash fragments to external parties"
  - "Promise rejections from navigator.share() silently fail with no user feedback"
  - "Duplicate button styling across Share/Export buttons (DRY violation)"
root_cause: missing_validation
resolution_type: code_fix
severity: medium
tags: [security, share-button, url-sanitization, error-handling, dry, code-review, P1, P2]
---

# Share/Export Button Security and Quality Refactor

## Problem

Multi-agent code review identified 3 issues with the Share/Export buttons in the report header: URL information leakage (P2-security), missing error handling (P1), and duplicate styling (P2-DRY).

## Environment

- Module: Report System (brand-system-report.tsx)
- Framework: Next.js 16 with React 19
- Date: 2025-12-29
- Review Method: 6 parallel specialized agents (Security-Sentinel, Pattern-Recognition, Code-Simplicity, Kieran-TypeScript, Architecture-Strategist, Performance-Oracle)

## Symptoms

1. **URL Information Leakage**: `window.location.href` shared without sanitization, potentially exposing:
   - Session tokens in URL (`?session_id=abc123`)
   - Debug/staging parameters (`?preview_token=secret`)
   - Hash fragments with sensitive state (`#access_token=bearer_xyz`)

2. **Silent Promise Rejections**: `navigator.share()` and `navigator.clipboard.writeText()` can reject:
   - User cancels share dialog → AbortError → No feedback
   - Clipboard permission denied → Silent failure → User assumes it worked
   - Unhandled promise rejections in console

3. **Duplicate Button Styling**: 100+ character className duplicated:
   ```tsx
   // Line 415 - Share button
   className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2..."

   // Line 423 - Export button (identical)
   className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2..."
   ```

## What Didn't Work

**Direct solution:** All issues identified through systematic code review and fixed on first attempt.

## Solution

### 1. URL Sanitization (P2-119)

**File:** `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

```tsx
// Added: URL sanitization helper
function getCleanShareUrl(): string {
  if (typeof window === 'undefined') return '';
  const url = new URL(window.location.href);
  return `${url.origin}${url.pathname}`;  // Strips query params and hash
}
```

### 2. Error Handling with Toast Notifications (P1-117)

```tsx
// Before (vulnerable):
onClick={() => {
  if (navigator.share) {
    navigator.share({
      title: title || normalizedData.title || 'Report',
      url: window.location.href,  // Leaks sensitive data
    });
  } else {
    navigator.clipboard.writeText(window.location.href);  // Silent failure
  }
}}

// After (robust):
const handleShare = useCallback(async () => {
  const shareUrl = getCleanShareUrl();
  const shareTitle = displayTitle || 'Report';

  try {
    if (navigator.share) {
      await navigator.share({ title: shareTitle, url: shareUrl });
    } else {
      await navigator.clipboard.writeText(shareUrl);
      toast.success('Link copied to clipboard');
    }
  } catch (error) {
    // AbortError means user cancelled - no error needed
    if (error instanceof Error && error.name === 'AbortError') {
      return;
    }
    console.error('[Share] Error sharing report:', error);
    toast.error('Failed to share report');
  }
}, [displayTitle]);
```

### 3. ActionButton Component (P2-118)

```tsx
// Before: Duplicate 100+ char className strings

// After: Extracted reusable component
interface ActionButtonProps {
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  ariaLabel: string;
}

function ActionButton({ onClick, icon, label, ariaLabel }: ActionButtonProps) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-2 rounded border border-zinc-200 px-3 py-2 text-[13px] tracking-[-0.01em] text-zinc-600 transition-colors hover:border-zinc-400 hover:text-zinc-900"
      aria-label={ariaLabel}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </button>
  );
}

// Usage:
<ActionButton
  onClick={handleShare}
  icon={<Share2 className="h-4 w-4" />}
  label="Share"
  ariaLabel="Share report"
/>
<ActionButton
  onClick={handleExport}
  icon={<Download className="h-4 w-4" />}
  label="Export"
  ariaLabel="Export report"
/>
```

## Why This Works

1. **URL Sanitization**: `new URL().origin + pathname` strips everything after the path:
   - Query string (`?foo=bar`) removed
   - Hash fragment (`#section`) removed
   - Only canonical report URL shared

2. **Error Handling**:
   - `AbortError` check prevents error toast when user intentionally cancels share dialog
   - Toast notifications give clear user feedback
   - Console logging preserves debugging capability

3. **ActionButton Component**:
   - Single source of truth for button styling
   - TypeScript interface enforces required props
   - Styling changes only need one update

## Prevention

- **Always sanitize URLs before external sharing**: Use `origin + pathname` pattern
- **Wrap browser APIs in try/catch**: `navigator.share`, `navigator.clipboard`, `Notification` API all throw
- **Handle AbortError specially**: Users canceling dialogs is normal, not an error
- **Extract components at 2+ duplications**: Don't wait for 3+ occurrences for shared UI patterns
- **Run multi-agent code reviews**: Catches security, quality, and DRY issues systematically

## Related Issues

- See also: [p1-security-fixes-code-review-20251223.md](./p1-security-fixes-code-review-20251223.md) - Previous P1 security fixes from code review
- See also: [type-extraction-large-components-20251223.md](../best-practices/type-extraction-large-components-20251223.md) - Component extraction patterns

## Todo Files

Issue tracking files updated:
- `todos/117-pending-p1-share-button-missing-error-handling.md` → completed
- `todos/118-pending-p2-share-button-duplicate-styling.md` → completed
- `todos/119-pending-p2-url-sanitization-share-button.md` → completed
