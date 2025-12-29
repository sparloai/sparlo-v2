---
title: "Fix non-clickable 'Needs Clarification' dashboard cards"
category: ui-bugs
tags:
  - dashboard
  - user-experience
  - state-management
  - navigation
  - clarification-flow
  - inngest
components_affected:
  - ReportsDashboard
  - ProcessingScreen
  - ConversationStatus
severity: high
date_solved: "2025-12-29"
---

## Problem

Reports in `clarifying` status were rendering as non-clickable "Processing xxh xxm elapsed" cards, preventing users from returning to the clarification form if they navigated away from the page.

**User impact**: Users were stranded with no way to return to answer clarification questions, effectively blocking their report from completing.

## Root Cause

1. The `isProcessing()` function included `clarifying` as a processing state
2. No distinct UI card design existed for the clarifying state
3. The `error` status also fell through to the complete card (secondary bug caught in review)

## Solution

### 1. Modified `isProcessing()` Function

**File:** `apps/web/app/home/(user)/_components/reports-dashboard.tsx`

```typescript
// Before: included clarifying
const isProcessing = (status: ConversationStatus) =>
  status === 'processing' || status === 'clarifying' || status === 'confirm_rerun';

// After: clarifying is its own state
const isProcessing = (status: ConversationStatus) =>
  status === 'processing' || status === 'confirm_rerun';
```

### 2. Added `isClarifying` State Check

```typescript
const isFailed = report.status === 'failed' || report.status === 'error';
const isCancelled = report.status === 'cancelled';
const isClarifying = report.status === 'clarifying';  // New check
```

### 3. Created Amber-Themed Clickable Card

New 55-line JSX block for clarifying state with:
- Pulsing amber status dot
- "Needs Clarification" label in amber
- AlertCircle + ChevronRight icons
- Hover effects with lift animation
- Links to `/home/reports/${report.id}`

```typescript
if (isClarifying) {
  return (
    <Link
      key={report.id}
      href={`/home/reports/${report.id}`}
      className={cn(
        'group relative flex items-start gap-4 p-5 transition-all duration-200',
        'cursor-pointer hover:-translate-y-0.5 hover:bg-amber-100',
        'bg-amber-50/50 dark:bg-amber-900/10',
      )}
    >
      {/* Pulsing amber status dot */}
      <div className="relative mt-1.5 flex-shrink-0">
        <div className="h-2 w-2 animate-pulse rounded-full bg-amber-500" />
        <div className="absolute inset-0 h-2 w-2 animate-ping rounded-full bg-amber-500 opacity-75" />
      </div>

      <div className="min-w-0 flex-1">
        <span className="font-mono text-xs tracking-wider text-amber-600 uppercase">
          Needs Clarification
        </span>
        <p className="mt-2 text-xs text-amber-600">
          We need more information to continue
        </p>
      </div>

      {/* Action indicator */}
      <AlertCircle className="h-4 w-4 text-amber-500" />
      <ChevronRight className="h-4 w-4 text-amber-600 opacity-0 group-hover:opacity-100" />
    </Link>
  );
}
```

### 4. Fixed Redirect Logic

**File:** `apps/web/app/home/(user)/_components/processing-screen.tsx`

```typescript
// Memoized check for pending clarifications
const hasPendingClarification = useMemo(
  () => progress.clarifications?.some((c) => c.answer == null) ?? false,
  [progress.clarifications],
);

// Don't redirect when clarification is pending
const noClarificationNeeded = movedPastAN0 && !hasPendingClarification;
```

**Key fix**: Changed `!c.answer` to `c.answer == null` to handle empty strings correctly.

### 5. Fixed `error` Status Handling

```typescript
// Before: error fell through to complete card
const isFailed = report.status === 'failed';

// After: error shows failed card
const isFailed = report.status === 'failed' || report.status === 'error';
```

## UI State Matrix

| Status | Card Theme | Clickable | Icon | Label |
|--------|-----------|-----------|------|-------|
| `processing` | Purple | No | Spinning Loader | "Processing" |
| `clarifying` | **Amber** | **Yes** | AlertCircle | **"Needs Clarification"** |
| `complete` | Green | Yes | Dot with glow | Date + concepts |
| `failed`/`error` | Red | No | Dot | "Failed" |
| `cancelled` | Gray | No | Dot | "Cancelled" |

## Files Modified

- `apps/web/app/home/(user)/_components/reports-dashboard.tsx`
- `apps/web/app/home/(user)/_components/processing-screen.tsx`

## Prevention Strategies

### 1. Status State Machine Completeness

Use TypeScript exhaustiveness checking:

```typescript
const assertExhaustive = (value: never): never => {
  throw new Error(`Unhandled status: ${value}`);
};

// Compiler errors on unhandled states
switch (report.status) {
  case 'processing': return <ProcessingCard />;
  case 'clarifying': return <ClarifyingCard />;
  case 'complete': return <CompleteCard />;
  case 'failed':
  case 'error': return <FailedCard />;
  case 'cancelled': return <CancelledCard />;
  default: return assertExhaustive(report.status);
}
```

### 2. Test Coverage for All Status States

```typescript
const allStatuses: ConversationStatus[] = [
  'clarifying', 'processing', 'complete', 'error',
  'failed', 'cancelled', 'confirm_rerun',
];

it.each(allStatuses)('renders %s status correctly', (status) => {
  const { getByTestId } = render(
    <ReportsDashboard reports={[{ status, ...baseReport }]} />
  );
  expect(getByTestId(`status-card-${status}`)).toBeInTheDocument();
});
```

### 3. Code Review Checklist for New Status States

When adding new states to `ConversationStatusSchema`:
- [ ] Zod enum updated
- [ ] Dashboard card component updated
- [ ] Switch statement handles new case
- [ ] Test cases for UI rendering
- [ ] No fallthrough to default behavior

## Related Documentation

- `plans/feat-needs-clarification-dashboard-status.md` - Original feature plan
- `plans/clarification-ux-redesign.md` - UX approach for clarification flow
- `docs/solutions/integration-issues/inngest-report-cancellation.md` - Related Inngest patterns

## Key Learnings

1. **Type Definition ≠ UI Coverage**: Adding states to Zod schema doesn't guarantee UI handles them
2. **Implicit Defaults Are Dangerous**: Sequential `if` statements without exhaustive checking create fallthrough bugs
3. **Review Process Works**: Code review caught the `error` status issue before deployment
4. **Null vs Falsy**: Use `== null` not `!value` when empty strings are valid answers
