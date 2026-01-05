# feat: Analytics Tracking for Conversion Optimization

**Created**: 2025-01-03
**Type**: Enhancement
**Priority**: High
**Estimated Effort**: 3-4 weeks

## Overview

Implement comprehensive analytics tracking for Sparlo to enable conversion optimization, user behavior analysis, and product-led growth insights. The implementation will leverage the existing pluggable analytics architecture in `packages/analytics/` while adding PostHog as the primary product analytics provider and GA4 for marketing attribution.

## Problem Statement / Motivation

Currently, Sparlo has an analytics infrastructure skeleton (`packages/analytics/`) but uses only `NullAnalyticsService` (no-op). This means:

- **No visibility into conversion funnels** - Cannot measure signup → first report → subscription upgrade rates
- **No product usage insights** - Cannot identify feature adoption, drop-off points, or power user behaviors
- **No marketing attribution** - Cannot determine which channels drive highest-quality signups
- **No data-driven decisions** - Product and growth decisions are based on intuition, not evidence

**Key metrics we cannot currently measure:**
- Activation rate (users completing first report / total signups)
- Time-to-value (signup to first report completion)
- Trial-to-paid conversion rate
- Feature adoption by user segment
- Retention cohorts

## Proposed Solution

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Analytics Flow                            │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   ┌──────────────┐    ┌──────────────────┐    ┌──────────────┐ │
│   │ Cookie       │───▶│ AnalyticsManager │───▶│ PostHog      │ │
│   │ Consent      │    │ (orchestrator)   │    │ (product)    │ │
│   └──────────────┘    └──────────────────┘    └──────────────┘ │
│                              │                       │          │
│                              │                       ▼          │
│   ┌──────────────┐          │               ┌──────────────┐   │
│   │ App Events   │──────────┘               │ GA4          │   │
│   │ (existing)   │                          │ (marketing)  │   │
│   └──────────────┘                          └──────────────┘   │
│                                                                  │
│   ┌──────────────────────────────────────────────────────────┐  │
│   │                    Server-Side Tracking                   │  │
│   │  Inngest Functions → PostHog Node.js → Critical Events   │  │
│   └──────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Tool Selection

| Tool | Purpose | Cost | Rationale |
|------|---------|------|-----------|
| **PostHog** | Product analytics, feature flags, session replay | Free to ~$400/mo | All-in-one, privacy-first, developer-friendly, self-hostable option |
| **GA4** | Marketing attribution, campaign tracking | Free | Google ecosystem integration, UTM tracking, ad attribution |

### Tracking Strategy: Hybrid (70% Client / 30% Server)

**Client-Side (70%)**:
- Page views and navigation
- UI interactions (button clicks, form fields)
- Feature discovery events
- Signup flow interactions

**Server-Side (30%)**:
- Report generation completion (Inngest functions)
- Subscription events (Stripe webhooks)
- Critical state changes (first report claim)
- Background job completions

## Technical Considerations

### Existing Infrastructure

The codebase already has:
- **`packages/analytics/`** - Pluggable analytics architecture with `AnalyticsManager`
- **`AnalyticsService` interface** - `trackEvent()`, `trackPageView()`, `identify()`
- **`AppEventsProvider`** - Event-driven architecture for app-wide events
- **`CookieBanner` component** - Cookie consent UI (not integrated with analytics)
- **Basic events defined**: `user.signedIn`, `user.signedUp`, `checkout.started`

### Privacy & Compliance (GDPR/CCPA)

**Requirements:**
- Cookie consent before any tracking (except essential cookies)
- PostHog `cookieless_mode: 'on_reject'` configuration
- PostHog Cloud EU for European data residency
- Data retention policies (configurable in PostHog)
- Right to deletion support via PostHog's data deletion API

**Implementation:**
```typescript
// PostHog initialization with consent gating
posthog.init(POSTHOG_KEY, {
  api_host: POSTHOG_HOST,
  cookieless_mode: 'on_reject', // No cookies until consent
  persistence: 'localStorage+cookie',
  opt_out_capturing_by_default: false
})
```

### Event Schema (snake_case convention)

```typescript
// Core conversion events
'signup_started'           // User lands on signup page
'signup_completed'         // User completes registration
'first_report_started'     // User initiates first report
'first_report_completed'   // First report generation finishes
'report_completed'         // Any report generation finishes
'checkout_started'         // User initiates subscription upgrade
'subscription_activated'   // Subscription becomes active

// Engagement events
'page_viewed'              // Automatic page view tracking
'report_viewed'            // User views a completed report
'report_shared'            // User shares/exports a report
'feature_used'             // User interacts with specific feature
```

### Integration with Existing Event System

```typescript
// apps/web/components/analytics-provider.tsx
// Extend existing analyticsMapping
const analyticsMapping: AnalyticsMapping = {
  'user.signedUp': (event, analytics) => {
    analytics.trackEvent('signup_completed', {
      method: event.payload.method,
      timestamp: new Date().toISOString()
    });
  },
  // Add new mappings...
};
```

## Acceptance Criteria

### Functional Requirements

- [x] **PostHog Integration**: PostHog provider implemented and tracking events
- [ ] **GA4 Integration**: GA4 provider implemented for marketing attribution (deferred)
- [x] **Consent Gating**: Analytics only fires after cookie consent accepted
- [x] **Signup Funnel**: Track `signup_started` → `signup_completed` with conversion rate
- [x] **Activation Funnel**: Track `first_report_started` → `first_report_completed`
- [x] **Report Lifecycle**: Track all report types (discovery, hybrid, dd) completion
- [x] **Subscription Funnel**: Track `checkout_started` → `subscription_activated`
- [x] **User Identification**: `identify()` called on login with user traits
- [x] **Server-Side Tracking**: Inngest functions emit completion events

### Non-Functional Requirements

- [x] **Performance**: Analytics loading doesn't block page render (dynamic import)
- [x] **Privacy**: GDPR-compliant with consent-first approach
- [x] **Reliability**: Analytics failures don't break user flows (fire-and-forget)
- [x] **Testability**: Development mode logs to console, doesn't pollute production data

### Quality Gates

- [x] TypeScript types for all event schemas (simplified - inline types)
- [ ] Unit tests for analytics service implementations
- [ ] E2E test verifying core funnel tracking
- [x] Privacy policy updated with PostHog disclosure
- [x] Cookie policy updated with analytics cookies

## Success Metrics

| Metric | Target | Measurement Method |
|--------|--------|-------------------|
| Signup → First Report | Establish baseline | PostHog funnel |
| Time to First Report | Establish baseline | PostHog insight |
| Trial → Paid Conversion | Establish baseline | PostHog funnel |
| Feature Adoption Rate | Establish baseline | PostHog retention |
| Analytics Data Accuracy | >95% event capture | Compare DB inserts to events |

## Dependencies & Prerequisites

### Required Before Implementation

- [ ] PostHog account created (Cloud or self-hosted decision)
- [ ] PostHog API key obtained
- [ ] GA4 property created and Measurement ID obtained
- [ ] Legal review of privacy policy updates

### Environment Variables Needed

```bash
# PostHog
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
NEXT_PUBLIC_POSTHOG_HOST="https://app.posthog.com" # or EU: https://eu.posthog.com
POSTHOG_PERSONAL_API_KEY="phx_..." # Server-side only

# GA4
NEXT_PUBLIC_GA_MEASUREMENT_ID="G-XXXXXXXXXX"
```

## Implementation Plan

### Phase 1: Foundation ✅ COMPLETED

**Goal**: Core infrastructure and consent integration

**Completed:**
1. ✅ Created `PostHogClientService` with dynamic import for lazy loading
2. ✅ Created `PostHogServerService` for server-side tracking via HTTP API
3. ⏸️ GA4 deferred to future iteration
4. ✅ Integrated cookie consent with analytics provider initialization
5. ✅ Added environment variables (`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`)

**Files Created/Modified:**
- `packages/analytics/src/posthog-client-service.ts` (NEW)
- `packages/analytics/src/posthog-server-service.ts` (NEW)
- `apps/web/components/analytics-provider.tsx` (MODIFIED)
- `apps/web/components/cookie-consent-banner.tsx` (MODIFIED)

### Phase 2: Core Conversion Events ✅ COMPLETED

**Goal**: Track critical conversion funnel

**Completed:**
1. ✅ Implemented signup flow tracking (`signup_started`, `signup_completed`)
2. ✅ Implemented first report tracking with server-side completion events
3. ✅ Added server-side tracking to all Inngest report generation functions
4. ✅ Implemented user identification on login (no PII sent)

**Code Review Fixes Applied:**
- Dynamic import for PostHog (~70KB bundle savings)
- Ref-based deduplication for tracking components
- Fire-and-forget pattern for server-side tracking
- AbortController with 5s timeout on HTTP requests

**Files Created/Modified:**
- `apps/web/app/auth/sign-up/page.tsx` (MODIFIED)
- `apps/web/components/analytics-events.tsx` (NEW)
- `apps/web/lib/inngest/utils/analytics.ts` (NEW)
- `apps/web/lib/inngest/functions/generate-*.ts` (MODIFIED - 3 files)

### Phase 3: Subscription & Engagement ✅ COMPLETED

**Goal**: Complete funnel and engagement tracking

**Completed:**
1. ✅ Track `subscription_activated` in Stripe webhook
2. ✅ Pageview tracking already in analytics provider
3. ✅ Report viewing tracking (`report_viewed`)
4. ✅ Report sharing/export tracking (`report_shared`)

**Files Modified:**
- `apps/web/app/api/billing/webhook/route.ts` (MODIFIED)
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` (MODIFIED)
- `apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-report-actions.ts` (MODIFIED)

### Phase 4: Dashboards & Validation ✅ COMPLETED

**Goal**: Actionable insights and quality assurance

**Completed:**
1. ⏸️ PostHog dashboards - to be created in PostHog UI
2. ⏸️ GA4 reports - deferred
3. ✅ Privacy policy updated with PostHog disclosure
4. ✅ Cookie policy updated with analytics cookies

**Files Modified:**
- `apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx` (MODIFIED)
- `apps/web/app/(marketing)/(legal)/cookie-policy/page.tsx` (MODIFIED)

## File Structure

```
packages/analytics/
├── src/
│   ├── services/
│   │   ├── posthog-client.ts       # NEW: PostHog browser SDK wrapper
│   │   ├── posthog-server.ts       # NEW: PostHog Node.js SDK wrapper
│   │   ├── ga4-client.ts           # NEW: GA4 gtag wrapper
│   │   └── null-analytics.ts       # EXISTING: No-op service
│   ├── schemas/
│   │   └── events.ts               # NEW: Event type definitions
│   ├── index.ts                    # MODIFY: Export new providers
│   └── server.ts                   # MODIFY: Export server provider

apps/web/
├── components/
│   └── analytics-provider.tsx      # MODIFY: Consent integration
├── lib/
│   └── analytics/
│       └── config.ts               # NEW: Provider configuration
```

## Event Catalog

### Signup Flow

| Event | Trigger | Properties | Tracking |
|-------|---------|------------|----------|
| `signup_started` | Load signup page | `{ source, utm_* }` | Client |
| `signup_completed` | Successful registration | `{ method, user_id }` | Client |

### Activation Flow

| Event | Trigger | Properties | Tracking |
|-------|---------|------------|----------|
| `first_report_started` | User initiates first report | `{ report_type }` | Client |
| `first_report_completed` | First report generation done | `{ report_id, generation_time_ms }` | Server |

### Report Lifecycle

| Event | Trigger | Properties | Tracking |
|-------|---------|------------|----------|
| `report_started` | User initiates any report | `{ report_type, is_first }` | Client |
| `report_completed` | Report generation done | `{ report_id, report_type, generation_time_ms }` | Server |
| `report_viewed` | User opens report | `{ report_id }` | Client |
| `report_shared` | User shares/exports | `{ report_id, share_type }` | Client |

### Subscription Flow

| Event | Trigger | Properties | Tracking |
|-------|---------|------------|----------|
| `checkout_started` | User clicks upgrade | `{ plan_id, current_plan }` | Client |
| `subscription_activated` | Stripe webhook confirms | `{ plan_id, mrr, billing_cycle }` | Server |

## PostHog Configuration

```typescript
// apps/web/lib/analytics/config.ts
export const posthogConfig = {
  api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,

  // Privacy settings
  cookieless_mode: 'on_reject' as const,
  disable_session_recording: false, // Enable for debugging
  mask_all_text: false,
  mask_all_element_attributes: false,

  // Performance settings
  autocapture: false, // Manual tracking only
  capture_pageview: false, // We'll handle this manually
  capture_pageleave: true,

  // Feature flags (future use)
  bootstrap: {},

  // Debug in development
  loaded: (posthog: PostHog) => {
    if (process.env.NODE_ENV === 'development') {
      posthog.debug();
    }
  }
};
```

## Risk Analysis & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| PostHog API outage | Low | Low | Fire-and-forget tracking, no user-facing impact |
| Data accuracy issues | Medium | Medium | Validate against DB, automated tests |
| GDPR compliance gaps | Medium | High | Legal review, consent-first implementation |
| Performance impact | Low | Medium | Async loading, minimal bundle impact |
| Event schema changes | Medium | Low | Versioned schemas, backwards compatibility |

## References & Research

### Internal References

- Analytics package: `packages/analytics/src/`
- Existing events: `packages/shared/src/events/index.tsx`
- Cookie banner: `packages/ui/src/components/cookie-banner.tsx`
- Privacy policy: `apps/web/app/(marketing)/(legal)/privacy-policy/page.tsx`

### External References

- [PostHog Next.js Integration](https://posthog.com/docs/libraries/next-js)
- [PostHog GDPR Compliance](https://posthog.com/docs/privacy/gdpr-compliance)
- [GA4 Next.js Integration](https://nextjs.org/docs/app/guides/third-party-libraries)
- [B2B SaaS Conversion Benchmarks](https://userpilot.com/blog/b2b-saas-funnel-conversion-benchmarks/)

### Related Work

- Event system architecture: `packages/shared/src/events/`
- Monitoring integration: `packages/monitoring/`
