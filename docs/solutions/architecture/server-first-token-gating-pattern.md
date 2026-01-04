---
title: "Server-First Token Gating Pattern"
category: architecture
tags:
  - usage-limits
  - server-components
  - suspense
  - error-handling
  - ux-patterns
severity: high
component: Report Creation Flow
framework: Next.js 16, React 19
date: 2025-01-02
status: completed
---

# Server-First Token Gating Pattern

## Problem Statement

The original implementation used a modal-based client-side approach to gate users who exceeded their token limits:

```tsx
// OLD: Client-side modal approach
function NewAnalysisForm() {
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const handleSubmit = async () => {
    try {
      await createReport(data);
    } catch (error) {
      if (error.message.includes('subscription_required')) {
        setShowUpgradeModal(true); // User already typed their content!
      }
    }
  };

  return (
    <>
      <Form onSubmit={handleSubmit} />
      {showUpgradeModal && <UpgradeModal />}
    </>
  );
}
```

**Issues:**
1. User wastes effort typing detailed content before learning they can't submit
2. Poor UX - error discovered late in the flow
3. Modal-based patterns feel like interruptions
4. Error detection relied on brittle string matching

## Solution

Gate users at the **page level** before rendering the form, using server-first architecture.

### Architecture Overview

```
page.tsx (async server component)
├── Suspense boundary with PageSkeleton
└── UsageGatedContent (async inner component)
    ├── checkUsageAllowed() - server-side check
    ├── TokenGateScreen - if not allowed
    └── NewAnalysisForm - if allowed
```

### Implementation

#### 1. Page Component with Suspense Streaming

```tsx
// apps/web/app/home/(user)/reports/new/page.tsx
import { Suspense } from 'react';

async function UsageGatedContent({ prefill, error }: Props) {
  const user = await requireUserInServerComponent();

  // Server-side usage check BEFORE rendering form
  const usage = await checkUsageAllowed(
    user.id,
    USAGE_CONSTANTS.ESTIMATED_TOKENS_PER_REPORT,
  );

  // Gate: Show upgrade screen if not allowed
  if (!usage.allowed) {
    return (
      <TokenGateScreen
        variant={usage.reason}
        periodEnd={usage.periodEnd}
        percentage={usage.percentage}
      />
    );
  }

  // User is allowed - show the form
  return <NewAnalysisForm prefill={prefill} error={error} />;
}

export default async function NewReportPage({ searchParams }: PageProps) {
  const params = await searchParams;

  return (
    <Suspense fallback={<PageSkeleton />}>
      <UsageGatedContent prefill={params.prefill} error={params.error} />
    </Suspense>
  );
}
```

#### 2. Token Gate Screen Component

```tsx
// apps/web/app/home/(user)/reports/new/_components/token-gate-screen.tsx
interface TokenGateScreenProps {
  variant: 'subscription_required' | 'limit_exceeded';
  periodEnd?: string | null;
  percentage?: number;
}

export function TokenGateScreen({ variant, periodEnd, percentage }: TokenGateScreenProps) {
  const isSubscriptionRequired = variant === 'subscription_required';

  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
        <h1 className="font-heading mb-4 text-[42px] font-normal tracking-[-0.02em] text-zinc-900">
          {isSubscriptionRequired
            ? "You've used your free report"
            : "Usage limit reached"}
        </h1>

        <p className="mb-12 max-w-xl text-[18px] leading-[1.5] text-zinc-500">
          {isSubscriptionRequired
            ? "Subscribe to continue generating strategic reports..."
            : `You've used ${percentage?.toFixed(0)}% of your monthly allowance...`}
        </p>

        <UpgradeButton />
      </div>
    </main>
  );
}
```

#### 3. Typed Error Handling

Replace brittle string matching with typed error codes:

```tsx
// apps/web/lib/errors/usage-error.ts
export const USAGE_ERROR_CODES = {
  SUBSCRIPTION_REQUIRED: 'USAGE_SUBSCRIPTION_REQUIRED',
  LIMIT_EXCEEDED: 'USAGE_LIMIT_EXCEEDED',
} as const;

export type UsageErrorCode = typeof USAGE_ERROR_CODES[keyof typeof USAGE_ERROR_CODES];

export function isUsageError(errorMessage: string): boolean {
  return (
    errorMessage.includes(USAGE_ERROR_CODES.SUBSCRIPTION_REQUIRED) ||
    errorMessage.includes(USAGE_ERROR_CODES.LIMIT_EXCEEDED)
  );
}

export function createUsageErrorMessage(
  code: UsageErrorCode,
  details?: string,
): string {
  return details ? `[${code}] ${details}` : `[${code}]`;
}
```

Usage in server actions:

```tsx
// In server action
if (!usage.allowed) {
  if (usage.reason === 'subscription_required') {
    throw new Error(
      createUsageErrorMessage(
        USAGE_ERROR_CODES.SUBSCRIPTION_REQUIRED,
        'Your free report has been used...',
      ),
    );
  }
}
```

#### 4. Loading Skeleton

```tsx
// apps/web/app/home/(user)/reports/new/_components/page-skeleton.tsx
export function PageSkeleton() {
  return (
    <main className="flex flex-col bg-white">
      <div className="px-8 pt-24 pb-4">
        <div className="mx-auto w-full max-w-3xl">
          {/* Skeleton matching form layout to prevent layout shift */}
          <div className="mb-6 h-4 w-24 animate-pulse rounded bg-zinc-100" />
          <div className="mb-12 h-12 w-64 animate-pulse rounded bg-zinc-100" />
          {/* ... more skeleton elements matching form structure */}
        </div>
      </div>
    </main>
  );
}
```

#### 5. Route-Level Error Boundary

```tsx
// apps/web/app/home/(user)/reports/new/error.tsx
'use client';

export default function ErrorBoundary({ error, reset }: ErrorBoundaryProps) {
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-3xl px-8 pt-24 pb-16">
        <h1 className="font-heading mb-4 text-[42px]">
          Something went wrong
        </h1>

        {process.env.NODE_ENV === 'development' && (
          <div className="mb-10 rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
            <span className="mb-2 block text-[13px] font-semibold uppercase">
              Error Details
            </span>
            <p className="font-mono text-[14px]">{error.message}</p>
          </div>
        )}

        <button onClick={reset}>Try Again</button>
      </div>
    </main>
  );
}
```

## Benefits

| Aspect | Before (Modal) | After (Server-First) |
|--------|---------------|---------------------|
| User effort | Wasted typing before gate | Gate shown immediately |
| Error timing | Late (after submit attempt) | Early (before form renders) |
| Architecture | 757-line client component | Split server/client responsibilities |
| Error handling | Brittle string matching | Typed error codes |
| Loading UX | None | Streaming with skeleton |
| Crash recovery | None | Error boundary with retry |

## Files Changed

- `apps/web/app/home/(user)/reports/new/page.tsx` - Suspense wrapper
- `apps/web/app/home/(user)/reports/new/_components/token-gate-screen.tsx` - Gate UI
- `apps/web/app/home/(user)/reports/new/_components/page-skeleton.tsx` - Loading skeleton
- `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx` - Simplified client form
- `apps/web/app/home/(user)/reports/new/error.tsx` - Error boundary
- `apps/web/lib/errors/usage-error.ts` - Typed error handling
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` - Error code usage

## Key Patterns

### Server-First Gating
Check permissions on the server before rendering expensive client components. Users see appropriate UI immediately.

### Suspense Streaming
Wrap async server components in Suspense to stream the page shell while awaiting auth/usage checks.

### Typed Error Codes
Use error codes that survive serialization across the server/client boundary instead of string matching.

### Layout-Matching Skeletons
Skeleton components should match the exact layout of the content they're replacing to prevent layout shift.

## Related

- `docs/solutions/features/usage-based-billing-freemium.md` - Backend usage tracking
- `docs/solutions/features/token-based-usage-tracking.md` - Token tracking implementation
