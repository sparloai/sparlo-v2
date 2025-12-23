---
status: pending
priority: p1
issue_id: "094"
tags:
  - code-review
  - typescript
  - error-handling
  - ux
dependencies: []
---

# Silent Checkout Failure - No User Feedback on Error

## Problem Statement

The pricing table checkout flow silently fails without providing any user feedback when an error occurs. Users see the loading state disappear with no explanation of what went wrong.

## Findings

- **File:** `apps/web/app/home/(user)/billing/_components/pricing-table.tsx`
- **Lines:** 58-68
- **Agent:** TypeScript Reviewer

The catch block resets state but provides no feedback:
```typescript
startTransition(async () => {
  try {
    appEvents.emit({ type: 'checkout.started', payload: { planId } });
    const { checkoutToken } = await createPersonalAccountCheckoutSession({
      planId,
      productId,
    });
    setCheckoutToken(checkoutToken);
  } catch {
    setSelectedPlan(null); // Silent failure - no user feedback
  }
});
```

## Proposed Solutions

### Option A: Add Toast Notification (Recommended)
**Pros:** Simple, user-friendly, consistent with app patterns
**Cons:** None significant
**Effort:** 10 minutes
**Risk:** Low

```typescript
catch (error) {
  setSelectedPlan(null);
  toast.error('Failed to start checkout. Please try again.');
  console.error('Checkout error:', error);
}
```

### Option B: Inline Error Message
**Pros:** More visible, stays on screen
**Cons:** Requires additional state management
**Effort:** 30 minutes
**Risk:** Low

## Technical Details

### Affected Files
- `apps/web/app/home/(user)/billing/_components/pricing-table.tsx`

## Acceptance Criteria

- [ ] Error message displayed to user on checkout failure
- [ ] Error logged to console for debugging
- [ ] User can retry checkout after failure

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-23 | Created from code review | - |

## Resources

- PR: Current uncommitted changes
- Related: TypeScript reviewer finding
