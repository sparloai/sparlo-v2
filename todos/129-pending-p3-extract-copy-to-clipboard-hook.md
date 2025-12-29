---
status: pending
priority: p3
issue_id: 129
tags: [code-review, dry, patterns, chat-components]
dependencies: []
---

# Extract Copy-to-Clipboard Pattern to Reusable Hook

## Problem Statement

The copy-to-clipboard pattern with fallback logic is duplicated across 8 files in the project. This creates maintenance burden and inconsistent implementations.

**Why it matters**: ~20 lines duplicated per usage, inconsistent error handling across usages.

## Findings

**Duplicate locations**:
1. `/apps/web/app/home/(user)/reports/[id]/_components/chat/code-block.tsx` (lines 20-39)
2. `/apps/web/app/home/(user)/reports/[id]/_components/share-modal.tsx` (lines 46-58)
3. Multiple other locations in codebase

**Current pattern**:
```typescript
const handleCopy = useCallback(async () => {
  try {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch {
    // Fallback implementation
    const textarea = document.createElement('textarea');
    // ... 10+ lines
  }
}, [text]);
```

## Proposed Solutions

### Option A: Create useCopyToClipboard hook (Recommended)
```typescript
// _lib/hooks/use-copy-to-clipboard.ts
export function useCopyToClipboard() {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async (text: string, options?: {
    onSuccess?: () => void;
    onError?: (error: Error) => void;
    timeout?: number;
  }) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      options?.onSuccess?.();
    } catch (error) {
      // Fallback
      options?.onError?.(error);
    }
    setTimeout(() => setCopied(false), options?.timeout ?? 2000);
  }, []);

  return { copied, copy };
}
```

**Pros**: Single source of truth, consistent behavior
**Cons**: Requires updating all usages
**Effort**: 1 hour
**Risk**: Low

## Recommended Action

Create the hook and refactor code-block.tsx to use it. Other files can be updated incrementally.

## Technical Details

**Affected files**:
- Create: `/apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-copy-to-clipboard.ts`
- Update: `/apps/web/app/home/(user)/reports/[id]/_components/chat/code-block.tsx`
- Update: (other files with copy logic)

## Acceptance Criteria

- [ ] Hook created with proper error handling
- [ ] code-block.tsx refactored to use hook
- [ ] Toast notifications on success/failure
- [ ] ~20 lines per usage reduced to ~3 lines

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Pattern recognition identified 8 duplicate locations |

## Resources

- Commit: 91f42b1
