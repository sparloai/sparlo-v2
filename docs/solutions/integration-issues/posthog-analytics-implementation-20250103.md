---
module: Analytics
date: 2025-01-03
problem_type: integration_issue
component: service_object
symptoms:
  - "No visibility into conversion funnels (signup → first report → subscription)"
  - "No product usage insights or feature adoption tracking"
  - "No marketing attribution data (UTM parameters not captured)"
  - "Analytics package using NullAnalyticsService (no-op)"
root_cause: config_error
resolution_type: code_fix
severity: high
tags: [analytics, posthog, gdpr, conversion-tracking, cookie-consent, performance]
---

# PostHog Analytics Implementation with GDPR Compliance

## Problem
Sparlo had an analytics infrastructure skeleton (`packages/analytics/`) but used only `NullAnalyticsService` (no-op), providing zero visibility into user behavior, conversion funnels, or product metrics needed for data-driven growth decisions.

## Environment
- Module: Analytics Package (`packages/analytics/`)
- Framework: Next.js 16 with React 19
- Affected Components: Client analytics, server analytics, Inngest functions, Stripe webhooks
- Date: 2025-01-03 when this was solved

## Symptoms
- No conversion funnel visibility (signup → first report → subscription rates unknown)
- No product usage insights (feature adoption, drop-off points undiscovered)
- No marketing attribution (UTM parameters not tracked)
- Analytics package defaulted to `NullAnalyticsService` with console debug logs

## What Didn't Work

**Attempted Solution 1:** Simple PostHog installation without consent management
- **Why it failed:** GDPR/CCPA compliance requires explicit consent before tracking. Eager loading also added ~70KB to initial bundle for all users.

**Attempted Solution 2:** Server-side tracking without consent propagation
- **Why it failed:** Server-side analytics (Inngest functions) can't access client-side cookie consent state, risking GDPR violations.

## Solution

### Phase 1: PostHog Client with Dynamic Import

Created lazy-loading PostHog client that only imports the SDK after consent:

```typescript
// packages/analytics/src/posthog-client-service.ts
'use client';

let posthogInstance: typeof import('posthog-js').default | null = null;
let initPromise: Promise<void> | null = null;

export function createPostHogClientService(config: PostHogConfig): AnalyticsService {
  return {
    async initialize(): Promise<void> {
      if (typeof window === 'undefined') return;
      if (posthogInstance || initPromise) return initPromise ?? Promise.resolve();
      if (!config.apiKey) return;

      // Dynamic import - ~70KB saved for non-consenting users
      initPromise = (async () => {
        const { default: posthog } = await import('posthog-js');
        posthog.init(config.apiKey, {
          api_host: config.apiHost ?? 'https://us.i.posthog.com',
          person_profiles: 'identified_only',
          capture_pageview: false,  // Manual tracking
          autocapture: false,
          persistence: 'localStorage',
        });
        posthogInstance = posthog;
      })();
      return initPromise;
    },
    // ... trackEvent, trackPageView, identify methods
  };
}
```

### Phase 2: Server-Side Tracking with HTTP API

Created lightweight server service using fetch instead of posthog-node:

```typescript
// packages/analytics/src/posthog-server-service.ts
import 'server-only';

export function createPostHogServerService(config: PostHogServerConfig): AnalyticsService {
  const timeoutMs = config.timeout ?? 5000;

  async function capture(event: string, properties: Record<string, unknown>): Promise<void> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      await fetch(`${apiHost}/capture/`, {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          api_key: config.apiKey,
          event,
          properties: { ...properties, $lib: 'sparlo-server' },
          distinct_id: properties.user_id ?? 'anonymous',
          timestamp: new Date().toISOString(),
        }),
      });
    } finally {
      clearTimeout(timeoutId);
    }
  }
  // ...
}
```

### Phase 3: Tracking Components with Deduplication

Created tracking components that prevent double-firing from React re-renders:

```typescript
// apps/web/components/analytics-events.tsx
export function TrackSignupStarted() {
  const { status } = useCookieConsent();
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);  // Deduplication

  useEffect(() => {
    if (hasTracked.current || status !== 'accepted') return;
    hasTracked.current = true;

    const properties: Record<string, string> = {};
    ['utm_source', 'utm_medium', 'utm_campaign'].forEach((param) => {
      const value = searchParams.get(param);
      if (value) properties[param] = value;
    });

    void analytics.trackEvent('signup_started', properties);
  }, [status, searchParams]);

  return null;
}
```

### Phase 4: Fire-and-Forget Server Tracking

Made Inngest analytics non-blocking to prevent analytics failures from affecting report generation:

```typescript
// apps/web/lib/inngest/utils/analytics.ts
export function trackReportCompleted(params: TrackReportCompletedParams): void {
  const properties = {
    report_id: params.reportId,
    report_type: params.reportType,
    generation_time_ms: String(params.generationTimeMs),
    user_id: params.accountId,
  };

  // Fire-and-forget: don't await, just log errors
  analytics.trackEvent('report_completed', properties).catch((error) => {
    console.error('[Analytics] Failed to track report_completed:', error);
  });
}
```

### Phase 5: Subscription Tracking in Stripe Webhook

```typescript
// apps/web/app/api/billing/webhook/route.ts
function trackSubscriptionActivated(subscription: UpsertSubscriptionParams) {
  analytics
    .trackEvent('subscription_activated', {
      plan_id: subscription.line_items?.[0]?.variant_id ?? 'unknown',
      billing_cycle: subscription.line_items?.[0]?.interval === 'year' ? 'yearly' : 'monthly',
      user_id: subscription.target_account_id,
    })
    .catch(console.error);
}

// In webhook handler:
await service.handleWebhookEvent(request, {
  onCheckoutSessionCompleted: async (payload) => {
    if (!('target_order_id' in payload)) {
      trackSubscriptionActivated(payload as UpsertSubscriptionParams);
    }
  },
});
```

## Why This Works

1. **Dynamic Import**: PostHog SDK (~70KB) only loads after consent, improving Core Web Vitals for all users and especially non-consenting visitors.

2. **Consent-Gated Initialization**: Analytics only initializes when `status === 'accepted'` from the cookie consent banner, ensuring GDPR/CCPA compliance.

3. **Ref-Based Deduplication**: The `hasTracked.current` pattern prevents double-firing from React Suspense re-renders caused by `useSearchParams()`.

4. **Fire-and-Forget Pattern**: Server-side tracking uses `.catch()` without `await`, ensuring analytics failures never block critical paths like report generation or subscription processing.

5. **AbortController Timeout**: 5-second timeout on server HTTP requests prevents hanging requests from blocking Inngest function completion.

6. **HTTP API vs Node SDK**: Using raw `fetch()` instead of `posthog-node` keeps the server bundle lean and avoids Node.js SDK compatibility issues.

## Events Tracked

| Event | Trigger | Tracking |
|-------|---------|----------|
| `signup_started` | User lands on signup page | Client |
| `signup_completed` | User completes registration | Client |
| `report_started` | User initiates report | Client |
| `report_completed` | Report generation finishes | Server |
| `first_report_completed` | First report for account | Server |
| `report_viewed` | User opens completed report | Client |
| `report_shared` | User shares link/exports PDF | Client |
| `checkout_started` | User clicks upgrade | Client |
| `subscription_activated` | Stripe confirms subscription | Server |
| `$pageview` | Every page navigation | Client |

## Prevention

1. **Always use dynamic import for analytics SDKs** - Never statically import analytics libraries that should be consent-gated.

2. **Use ref-based deduplication for tracking components** - Any component using `useSearchParams()` or other Suspense-triggering hooks needs deduplication.

3. **Make server-side analytics fire-and-forget** - Never `await` analytics in critical paths; use `.catch()` for error logging.

4. **Add AbortController to HTTP requests** - Server analytics should have timeouts to prevent blocking on network issues.

5. **Document consent requirements in GDPR** - Server-side tracking of internal metrics (generation times, costs) is legitimate interest under GDPR Article 6(1)(f), but behavioral tracking requires consent.

## Files Modified

**New Files:**
- `packages/analytics/src/posthog-client-service.ts`
- `packages/analytics/src/posthog-server-service.ts`
- `apps/web/components/analytics-events.tsx`
- `apps/web/lib/inngest/utils/analytics.ts`

**Modified Files:**
- `packages/analytics/src/index.ts`
- `packages/analytics/src/server.ts`
- `apps/web/components/analytics-provider.tsx`
- `apps/web/app/auth/sign-up/page.tsx`
- `apps/web/app/api/billing/webhook/route.ts`
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`
- `apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-report-actions.ts`
- `apps/web/lib/inngest/functions/generate-hybrid-report.ts`
- `apps/web/lib/inngest/functions/generate-discovery-report.ts`
- `apps/web/lib/inngest/functions/generate-dd-report.ts`
- `apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx`
- `apps/web/app/(marketing)/(legal)/cookie-policy/page.tsx`

## Related Issues

- See also: [token-based-usage-tracking.md](../features/token-based-usage-tracking.md) - Related usage tracking implementation
- See also: [usage-based-billing-freemium.md](../features/usage-based-billing-freemium.md) - Billing integration that analytics supports
