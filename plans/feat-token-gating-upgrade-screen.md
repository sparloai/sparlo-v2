# feat: Token Gating with Full-Page Upgrade Screen

> **Status:** Revised (Post-Review)
> **Created:** 2026-01-02
> **Reviewed by:** DHH, Kieran, Simplicity agents
> **Author:** AI Planning Agent

---

## Overview

Replace the current modal-based upgrade prompt with a full-page upgrade screen that appears **immediately on page load** when users have exhausted their free tokens (1 report + chat) and try to access `/home/reports/new`.

**Current Behavior:** User sees the analysis form → clicks "Run Analysis" → error caught → modal appears
**Proposed Behavior:** User navigates to page → server checks tokens → upgrade screen renders instead of form

---

## Problem Statement

The current implementation has several UX issues:

1. **False Promise**: Users see the analysis form, spend time entering their challenge, only to be blocked after clicking submit
2. **Wasted Effort**: Users lose their typed content when the modal appears
3. **Poor Conversion**: Pop-up modals feel intrusive and have lower conversion rates than in-context screens
4. **Delayed Feedback**: Users don't learn about restrictions until they try to act

---

## Proposed Solution

### Architecture: Server Component with Conditional Rendering

Convert the page to use a server component that conditionally renders:
- **TokenGateScreen** (server component) when tokens are insufficient
- **NewAnalysisForm** (existing client component) when user has access

```
/reports/new/page.tsx (Server Component)
├── checkUsageAllowed() → server-side
├── if !allowed → <TokenGateScreen variant={reason} />
└── if allowed → <NewAnalysisForm />
```

---

## Technical Approach

### Files to Create

| File | Purpose |
|------|---------|
| `apps/web/app/home/(user)/reports/new/_components/token-gate-screen.tsx` | Unified upgrade/limit screen |

### Files to Modify

| File | Change |
|------|--------|
| `apps/web/app/home/(user)/reports/new/page.tsx` | Convert to server component wrapper |
| `apps/web/app/home/(user)/_lib/server/usage.service.ts` | Ensure `periodEnd` in response |

---

## Implementation Phases

### Phase 1: Server Component Wrapper + Token Gate Screen

**Goal:** Move usage check to server-side, render appropriate screen.

#### 1.1 Update Page Component

```typescript
// apps/web/app/home/(user)/reports/new/page.tsx

import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { requireUser } from '@kit/supabase/require-user';
import { redirect } from 'next/navigation';
import { checkUsageAllowed } from '../../_lib/server/usage.service';
import { ESTIMATED_TOKENS_PER_REPORT } from '~/lib/usage/constants';
import { TokenGateScreen } from './_components/token-gate-screen';
import { NewAnalysisForm } from './_components/new-analysis-form';

export const metadata = {
  title: 'New Analysis - Sparlo',
};

export default async function NewReportPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string; error?: string }>;
}) {
  const client = getSupabaseServerClient();

  // 1. Authenticate user
  const result = await requireUser(client);
  if (result.error) {
    redirect(result.redirectTo);
  }

  const user = result.data;

  // 2. Check usage (server-side, before rendering)
  const usage = await checkUsageAllowed(user.id, ESTIMATED_TOKENS_PER_REPORT);

  // 3. Conditional rendering based on usage status
  if (!usage.allowed) {
    return (
      <TokenGateScreen
        variant={usage.reason}
        periodEnd={usage.periodEnd}
        percentage={usage.percentage}
      />
    );
  }

  // 4. User has access - render the form
  const params = await searchParams;
  return <NewAnalysisForm prefill={params.prefill} error={params.error} />;
}
```

#### 1.2 Create Unified Token Gate Screen

Single component handling both `subscription_required` and `limit_exceeded` variants:

```typescript
// apps/web/app/home/(user)/reports/new/_components/token-gate-screen.tsx

import Link from 'next/link';
import { ArrowLeft, ArrowRight, Clock, Sparkles } from 'lucide-react';

interface TokenGateScreenProps {
  variant: 'subscription_required' | 'limit_exceeded';
  periodEnd?: string;
  percentage?: number;
}

const FEATURES = [
  'Unlimited AI-powered design analysis',
  'Deep strategic insights for every challenge',
  'Export reports in multiple formats',
  'Priority processing queue',
];

export function TokenGateScreen({
  variant,
  periodEnd,
  percentage = 100,
}: TokenGateScreenProps) {
  const isLimitExceeded = variant === 'limit_exceeded';

  const resetDate = periodEnd
    ? new Date(periodEnd).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : 'your next billing period';

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
        {/* Back Link */}
        <Link
          href="/home/reports"
          className="mb-6 inline-flex items-center gap-1.5 text-[13px] tracking-[-0.02em] text-zinc-400 transition-colors hover:text-zinc-600"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Reports
        </Link>

        {/* Page Title */}
        <h1 className="font-heading text-[42px] font-normal tracking-[-0.02em] text-zinc-900 mb-4">
          {isLimitExceeded ? 'Monthly Limit Reached' : 'Unlock Unlimited Analysis'}
        </h1>

        {/* Subtitle */}
        <p className="text-[18px] leading-[1.5] tracking-[-0.02em] text-zinc-500 mb-12 max-w-xl">
          {isLimitExceeded
            ? `You've used all your analysis tokens for this period. Your limit resets on ${resetDate}.`
            : "You've explored your free report. Subscribe to continue generating powerful AI-driven design analysis."}
        </p>

        {/* Content with Left Border Accent */}
        <div className="border-l-2 border-zinc-900 pl-10">
          {isLimitExceeded ? (
            /* Usage Stats for Limit Exceeded */
            <div className="mb-10">
              <span className="mb-4 block text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
                Current Usage
              </span>
              <div className="rounded-xl border border-zinc-200 bg-white p-6">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[15px] text-zinc-700">Monthly tokens</span>
                  <span className="text-[15px] font-medium text-zinc-900">
                    {percentage}% used
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-zinc-100 overflow-hidden">
                  <div
                    className="h-full bg-zinc-900 rounded-full"
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>
                <div className="mt-3 flex items-center gap-2 text-[13px] text-zinc-500">
                  <Clock className="h-3.5 w-3.5" />
                  <span>Resets {resetDate}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Features for Subscription Required */
            <div className="mb-10">
              <span className="mb-4 block text-[13px] font-semibold tracking-[0.06em] uppercase text-zinc-500">
                What you'll unlock
              </span>
              <div className="space-y-4">
                {FEATURES.map((feature) => (
                  <div key={feature} className="flex items-start gap-3">
                    <div className="mt-1 h-1.5 w-1.5 rounded-full bg-zinc-900 flex-shrink-0" />
                    <span className="text-[18px] leading-[1.3] tracking-[-0.02em] text-zinc-700">
                      {feature}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Pricing/Upgrade Hint */}
          <div className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
            <div className="flex items-center gap-3 mb-2">
              <Sparkles className="h-5 w-5 text-zinc-600" />
              <span className="text-[15px] font-medium text-zinc-900">
                {isLimitExceeded ? 'Need more capacity?' : 'Plans start at $199/month'}
              </span>
            </div>
            <p className="text-[14px] text-zinc-500">
              {isLimitExceeded
                ? 'Upgrade your plan for higher limits and additional features'
                : 'Choose from Standard, Pro, or Max based on your team's needs'}
            </p>
          </div>

          {/* Single Primary CTA */}
          <Link
            href="/home/billing"
            className="inline-flex items-center justify-center gap-2 bg-zinc-900 px-8 py-4 text-[15px] font-medium text-white transition-colors hover:bg-zinc-800 rounded-lg"
          >
            {isLimitExceeded ? 'Upgrade Plan' : 'View Plans'}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </main>
  );
}
```

#### 1.3 Rename Existing Form Component

Rename the existing client component (keep all logic):

```typescript
// apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx

'use client';

// Move existing page.tsx client logic here
// Remove: showUpgradeModal state
// Remove: SubscriptionRequiredModal import
// Remove: error handling that shows modal
// Keep: All form logic, attachments, detection, etc.

interface NewAnalysisFormProps {
  prefill?: string;
  error?: string;
}

export function NewAnalysisForm({ prefill, error }: NewAnalysisFormProps) {
  // ... existing form implementation
}
```

### Phase 2: Update Usage Service (If Needed)

Verify `periodEnd` is returned in the usage response. Current type already includes it:

```typescript
// apps/web/app/home/(user)/_lib/server/usage.service.ts

// Verify this is returned in the limit_exceeded case:
if (!usage.allowed) {
  return {
    allowed: false as const,
    reason: 'limit_exceeded' as const,
    isAtLimit: true,
    percentage: usage.percentage,
    periodEnd: usage.period_end, // Ensure this is included
  };
}
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Users with `first_report_used_at = NULL` see the normal analysis form
- [ ] Users with no subscription after first report see the token gate screen (subscription variant)
- [ ] Users with active subscription within limits see the normal analysis form
- [ ] Users with active subscription at/over limits see the token gate screen (limit variant)
- [ ] Super admins bypass all checks and see the normal form
- [ ] Cancelled subscriptions in grace period are treated as active
- [ ] Back button navigates to `/home/reports`
- [ ] "View Plans" / "Upgrade Plan" CTA navigates to `/home/billing`

### Non-Functional Requirements

- [ ] Page loads in < 500ms (server-side rendering)
- [ ] Zero JavaScript shipped for blocked users (server component)
- [ ] WCAG AA accessibility compliance (contrast, focus)
- [ ] Components follow Sparlo design system (monochrome, left border accent)

### Quality Gates

- [ ] TypeScript compiles without errors (`pnpm typecheck`)
- [ ] Lint passes (`pnpm lint`)
- [ ] E2E tests pass for all user states

---

## User Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                    User navigates to /reports/new               │
└─────────────────────────────────────────────────────────────────┘
                                  │
                                  ▼
                    ┌─────────────────────────┐
                    │   Server: requireUser() │
                    └─────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    ▼                           ▼
            [Not Authenticated]          [Authenticated]
                    │                           │
                    ▼                           ▼
            redirect(/auth/sign-in)   ┌─────────────────────────┐
                                      │ Server: checkUsageAllowed()
                                      └─────────────────────────┘
                                                  │
                    ┌─────────────────────────────┼─────────────────┐
                    ▼                             ▼                 ▼
          [allowed: true]              [subscription_required]  [limit_exceeded]
                    │                             │                 │
                    ▼                             └────────┬────────┘
          ┌─────────────────┐                              ▼
          │ NewAnalysisForm │                    ┌─────────────────────┐
          │ (Client)        │                    │  TokenGateScreen    │
          └─────────────────┘                    │  variant={reason}   │
                                                 └─────────────────────┘
```

---

## Testing Plan

### E2E Test Scenarios

```typescript
// apps/e2e/tests/token-gating/token-gate-screen.spec.ts

test.describe('Token Gating', () => {
  test('new user sees analysis form', async ({ page }) => {
    // Setup: User with first_report_used_at = NULL
    await page.goto('/home/reports/new');
    await expect(page.getByPlaceholder('Describe your design challenge')).toBeVisible();
  });

  test('free user exhausted sees upgrade screen', async ({ page }) => {
    // Setup: User with first_report_used_at = <date>, no subscription
    await page.goto('/home/reports/new');
    await expect(page.getByRole('heading', { name: 'Unlock Unlimited Analysis' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'View Plans' })).toBeVisible();
  });

  test('subscriber within limits sees form', async ({ page }) => {
    // Setup: User with active subscription, tokens_used < tokens_limit
    await page.goto('/home/reports/new');
    await expect(page.getByPlaceholder('Describe your design challenge')).toBeVisible();
  });

  test('subscriber at limit sees limit exceeded screen', async ({ page }) => {
    // Setup: User with active subscription, tokens_used >= tokens_limit
    await page.goto('/home/reports/new');
    await expect(page.getByRole('heading', { name: 'Monthly Limit Reached' })).toBeVisible();
    await expect(page.getByText(/Resets/)).toBeVisible();
  });

  test('super admin bypasses restrictions', async ({ page }) => {
    // Setup: Super admin user
    await page.goto('/home/reports/new');
    await expect(page.getByPlaceholder('Describe your design challenge')).toBeVisible();
  });

  test('upgrade CTA navigates to billing', async ({ page }) => {
    // Setup: User with no subscription
    await page.goto('/home/reports/new');
    await page.getByRole('link', { name: 'View Plans' }).click();
    await expect(page).toHaveURL('/home/billing');
  });
});
```

---

## Edge Cases

### Race Condition (Multi-Tab)

If user exhausts tokens in Tab A while Tab B still shows form:
- Tab B submission will fail at server action level
- Server action already throws usage error
- Client catches error and can redirect to `/home/reports/new` (server will show gate screen)

**No additional code needed** - existing error handling covers this.

### Database Error

Let Next.js error boundary handle it. No custom error screen needed.

---

## Risk Analysis

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Hydration mismatch | Low | High | Server-only component for blocked state |
| Users confused by instant block | Medium | Medium | Clear messaging, back button |
| Database timeout on load | Low | Medium | Next.js error boundary |

---

## References

### Internal References

- Usage service: `apps/web/app/home/(user)/_lib/server/usage.service.ts:47-171`
- Current modal: `apps/web/app/home/(user)/_components/subscription-required-modal.tsx`
- Design system: `docs/SPARLO-DESIGN-SYSTEM.md`
- Usage constants: `apps/web/lib/usage/constants.ts`

### External References

- [Next.js Server Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Freemium Conversion Best Practices](https://www.appcues.com/blog/best-freemium-upgrade-prompts)

---

## Post-Review Changes

Based on feedback from DHH, Kieran, and Simplicity reviewers:

| Change | Reason |
|--------|--------|
| Merged 2 screens into 1 `TokenGateScreen` | 90% identical structure, -106 LOC |
| Removed i18n (Phase 5) | YAGNI - no multi-language requirement |
| Collapsed 5 phases to 2 | Simpler implementation path |
| Removed secondary CTAs | Single conversion path is clearer |
| Removed custom error screens | Use Next.js error boundary |
| Removed visual regression tests | E2E functional tests sufficient |

**Future Consideration (DHH's feedback):** The form itself should be refactored to use server actions with `useFormState` instead of 757 lines of client-side JS. This is out of scope for this feature but should be addressed separately.

---

## Appendix: Design Mockup

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│  ← Back to Reports                                             │
│                                                                │
│  Unlock Unlimited Analysis                                     │
│  (or: Monthly Limit Reached)                                   │
│                                                                │
│  You've explored your free report. Subscribe to continue       │
│  generating powerful AI-driven design analysis.                │
│  (or: You've used all tokens. Resets on Feb 1, 2026.)          │
│                                                                │
│  │                                                             │
│  │  WHAT YOU'LL UNLOCK (or: CURRENT USAGE)                     │
│  │                                                             │
│  │  • Unlimited AI-powered design analysis                     │
│  │  • Deep strategic insights (or: progress bar + reset date)  │
│  │  • Export reports in multiple formats                       │
│  │  • Priority processing queue                                │
│  │                                                             │
│  │  ┌──────────────────────────────────────────────────────┐   │
│  │  │ ✨ Plans start at $199/month                         │   │
│  │  │    (or: Need more capacity? Upgrade for higher       │   │
│  │  │    limits and additional features)                   │   │
│  │  └──────────────────────────────────────────────────────┘   │
│  │                                                             │
│  │  ┌─────────────────┐                                        │
│  │  │  View Plans  →  │                                        │
│  │  └─────────────────┘                                        │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

---

*Plan revised based on review feedback from: dhh-rails-reviewer, kieran-rails-reviewer, code-simplicity-reviewer*
