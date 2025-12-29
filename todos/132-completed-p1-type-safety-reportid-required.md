---
status: completed
priority: p1
issue_id: "132"
tags: [typescript, code-review, share-export]
dependencies: []
---

# Type Safety Violation: reportId Optional but Required

## Problem Statement

The `reportId` prop is typed as optional (`reportId?: string`) but is documented as "Required when showActions is true". This creates a runtime failure mode where users can share auth-gated URLs instead of public share links.

**Why it matters**: Silent failure mode where share button copies auth-gated URL, recipients can't access shared content.

## Findings

**Source**: Kieran TypeScript review of commit d08d4fa

**File**: `/apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`

```typescript
interface BrandSystemReportProps {
  showActions?: boolean;
  reportId?: string;  // Optional but REQUIRED when showActions is true
}

const handleShare = useCallback(async () => {
  if (!reportId) {
    // Fallback to copying current URL if no reportId
    const shareUrl = getCleanShareUrl();
    await navigator.clipboard.writeText(shareUrl);  // SHARES AUTH-GATED URL!
    toast.success('Link copied to clipboard');
    return;
  }
  // ...
}, [displayTitle, reportId]);
```

**Impact**: Users unknowingly share URLs that recipients cannot access.

## Proposed Solutions

### Option A: Discriminated Union Types (Recommended)

```typescript
type BrandSystemReportProps =
  | {
      showActions: false;
      reportId?: never;
      // ... other props
    }
  | {
      showActions?: true;
      reportId: string;  // Required when showActions is true
      // ... other props
    };
```

**Pros**: Compile-time enforcement, impossible to misuse
**Cons**: More complex type definition
**Effort**: Small (30 min)
**Risk**: Low

### Option B: Runtime Validation + Error

```typescript
const handleShare = useCallback(async () => {
  if (showActions && !reportId) {
    console.error('[Share] reportId is required when showActions is true');
    toast.error('Cannot share: configuration error');
    return;
  }
  // ...
}, [displayTitle, reportId, showActions]);
```

**Pros**: Simple, catches issues at runtime
**Cons**: Not compile-time safe
**Effort**: Small (15 min)
**Risk**: Low

## Recommended Action

Option A for compile-time safety, with Option B as additional runtime guard.

## Technical Details

**Affected Files**:
- `apps/web/app/home/(user)/reports/[id]/_components/brand-system/brand-system-report.tsx`
- `apps/web/app/home/(user)/reports/_lib/types/hybrid-report-display.types.ts`

## Acceptance Criteria

- [ ] TypeScript enforces reportId is required when showActions=true
- [ ] Runtime check prevents sharing auth-gated URLs
- [ ] Clear error message if configuration is wrong

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Type safety finding from commit d08d4fa |

## Resources

- Commit: d08d4fa
