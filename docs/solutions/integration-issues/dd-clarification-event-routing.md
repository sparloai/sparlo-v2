# DD Clarification Event Routing Bug

## Metadata

```yaml
title: DD Reports Clarification Answers Not Sent to Inngest
category: integration-issues
tags: [inngest, clarification, dd-reports, event-routing, server-actions]
severity: high
component: sparlo-reports-server-actions
date: 2026-01-07
```

## Symptoms

- DD report clarification options clicked but no response recorded
- `wait-for-dd-clarification` Inngest step never receives event
- Users cannot complete DD report clarification workflow
- Inngest dashboard shows step stuck waiting indefinitely

## Root Cause

The `answerClarification` server action in `sparlo-reports-server-actions.ts` only handled `discovery` and `hybrid` modes when determining which Inngest event to send:

```typescript
// BEFORE: Missing DD mode handling
let eventName: ClarificationEventName = 'report/clarification-answered';
if (mode === 'discovery') {
  eventName = 'report/discovery-clarification-answered';
} else if (mode === 'hybrid') {
  eventName = 'report/hybrid-clarification-answered';
}
// DD mode fell through to default 'report/clarification-answered'
```

DD reports have `mode: 'dd'` in their `report_data`, so they fell through to the default event name (`report/clarification-answered`), which the DD workflow wasn't listening for.

The DD Inngest workflow uses `step.waitForEvent('report/dd-clarification-answered')`, but the server action was sending `report/clarification-answered` instead.

## Solution

Added explicit `mode === 'dd'` check to send the correct event:

**File:** `apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts`

```typescript
// AFTER: Complete mode handling
type ClarificationEventName =
  | 'report/clarification-answered'
  | 'report/discovery-clarification-answered'
  | 'report/hybrid-clarification-answered'
  | 'report/dd-clarification-answered';

let eventName: ClarificationEventName = 'report/clarification-answered';
if (mode === 'discovery') {
  eventName = 'report/discovery-clarification-answered';
} else if (mode === 'hybrid') {
  eventName = 'report/hybrid-clarification-answered';
} else if (mode === 'dd') {
  eventName = 'report/dd-clarification-answered';
}
```

### Why This Works

1. **Type Safety:** Adding `'report/dd-clarification-answered'` to the union type ensures TypeScript validation
2. **Complete Mode Coverage:** All supported report modes now have explicit event routing
3. **Workflow Event Matching:** The DD Inngest workflow's `step.waitForEvent` now receives the correct event

## Event Routing Reference

| Report Mode | Clarification Event Name |
|-------------|--------------------------|
| (default) | `report/clarification-answered` |
| `discovery` | `report/discovery-clarification-answered` |
| `hybrid` | `report/hybrid-clarification-answered` |
| `dd` | `report/dd-clarification-answered` |

## Prevention Strategies

### 1. Centralized Event Routing

Consider creating a centralized event router:

```typescript
// apps/web/lib/reports/event-routing.ts
const CLARIFICATION_EVENTS: Record<string, string> = {
  discovery: 'report/discovery-clarification-answered',
  hybrid: 'report/hybrid-clarification-answered',
  dd: 'report/dd-clarification-answered',
};

export function getClarificationEventName(mode?: string): string {
  return CLARIFICATION_EVENTS[mode ?? ''] ?? 'report/clarification-answered';
}
```

### 2. Checklist for Adding New Report Modes

When adding a new report mode:

1. Define the mode in `report_data.mode` when creating reports
2. Add event type to `apps/web/lib/inngest/client.ts` Events type
3. **Update `answerClarification` in `sparlo-reports-server-actions.ts`**
4. Update API route in `apps/web/app/api/reports/[id]/clarify/route.ts`
5. Add `step.waitForEvent` in the new mode's Inngest function

### 3. Testing Approach

```typescript
// Test that each mode sends correct event
describe('answerClarification', () => {
  it.each([
    ['dd', 'report/dd-clarification-answered'],
    ['hybrid', 'report/hybrid-clarification-answered'],
    ['discovery', 'report/discovery-clarification-answered'],
  ])('sends correct event for %s mode', async (mode, expectedEvent) => {
    // Setup report with mode
    // Call answerClarification
    // Assert inngest.send was called with expectedEvent
  });
});
```

## Related Documentation

- **Feature Plan:** `plans/feat-dd-clarification-flow.md`
- **Dashboard Status:** `docs/solutions/ui/needs-clarification-dashboard-status.md`
- **Inngest Patterns:** `docs/solutions/integration-issues/inngest-report-cancellation.md`

## Files Involved

- `apps/web/app/app/_lib/server/sparlo-reports-server-actions.ts` - Server action (fixed)
- `apps/web/app/api/reports/[id]/clarify/route.ts` - API route (already had DD handling)
- `apps/web/lib/inngest/client.ts` - Event type definitions
- `apps/web/lib/inngest/functions/generate-dd-report.ts` - DD workflow with `waitForEvent`
