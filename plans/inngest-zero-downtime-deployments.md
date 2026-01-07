# Zero-Downtime Inngest Deployments on Railway

## Overview

Ensure long-running Inngest functions (30-60 minute report generation) are not interrupted during Railway deployments, allowing frequent code pushes without impacting user reports in progress.

## Problem Statement

When Railway deploys new code:
1. Old instance receives SIGTERM
2. Default 3-second drain period is insufficient for long-running functions
3. Inngest function connections are severed mid-execution
4. Users experience failed or interrupted reports

**Current error observed**: DNS resolution failures when Inngest tries to callback to Railway during/after deployment.

## Current State (Already Good)

The codebase already has several resilience features:

| Feature | File | Status |
|---------|------|--------|
| Streaming mode | `app/api/inngest/route.ts:35` | `streaming: 'allow'` enabled |
| Step-based functions | `lib/inngest/functions/*.ts` | All functions use `step.run()` |
| Health check | `railway.json` | `/api/health` with 120s timeout |
| Durable execution | Inngest architecture | State persisted externally |
| Token usage idempotency | `token_usage_events` table | Uses idempotency keys |

**Key insight**: Inngest's durable execution means completed steps are **never re-executed**. If a deployment interrupts a function between steps, Inngest automatically resumes from the last checkpoint on the new instance.

> ⚠️ **Research Finding**: The existing architecture may already handle deployments gracefully. Before implementing changes, test the current behavior by deploying during an active report to validate whether changes are actually needed.

## Proposed Solution

### Phase 0: Validate Current Behavior (RECOMMENDED FIRST STEP)

Before implementing any changes, validate whether the current Inngest setup already handles deployments:

1. Start a report generation
2. Trigger a Railway deployment mid-execution
3. Monitor Inngest dashboard for automatic retry/resume behavior
4. Check if report completes successfully

**Why**: Inngest's durable execution + `streaming: 'allow'` may already provide sufficient resilience. The DNS error observed was transient and may have self-resolved through Inngest's built-in retry mechanism.

### Phase 1: Railway Grace Periods

Add environment variables to Railway **only if Phase 0 shows failures**:

```bash
# Keep old instance alive during transition
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300

# Allow time for graceful shutdown after SIGTERM
# Longest step is ~6 minutes, so 900s (15 min) provides 2.5x safety margin
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=900
```

**Revised rationale** (from architecture review):
- 900s is sufficient because we're protecting **individual steps**, not entire functions
- Longest steps take ~6 minutes (360s) - 900s provides 2.5x safety margin
- Inngest automatically resumes from the last completed step on the new instance
- Formula: `drain_seconds = longest_step_duration * 2.5`

**Implementation**:
1. Add env vars in Railway dashboard (Settings → Variables)
2. No code changes required
3. Test with a deployment during active report generation

**Potential issues to monitor**:
- Database connection pool exhaustion during overlap (two instances sharing pool)
- Memory usage if old instance holds large report data in memory
- API rate limits if both instances make concurrent external calls

### Phase 2: Idempotency Audit (Security Critical)

The codebase has `token_usage_events` with idempotency keys, but verify ALL step operations are idempotent:

```typescript
// ✅ Already safe - token tracking uses idempotency
await step.run('track-usage', async () => {
  await trackTokenUsage({
    accountId,
    tokens,
    idempotencyKey: `${reportId}-${stepName}`,  // Prevents double-counting
    reportId
  });
});

// ✅ Safe - Supabase update with WHERE clause
await step.run('save-result', async () => {
  await supabase.from('sparlo_reports')
    .update({ report_data: result })
    .eq('id', reportId);  // Idempotent: same result on retry
});

// ⚠️ AUDIT: Check all external API calls
await step.run('send-notification', async () => {
  // If using email/Slack APIs, ensure they handle duplicates
  // Or add idempotency key if API supports it
});
```

**Audit checklist**:
- [ ] All database writes use UPDATE (not INSERT) or have conflict handling
- [ ] External API calls use idempotency keys where available
- [ ] No side effects outside of step.run() blocks
- [ ] Token/credit tracking has idempotency protection (already done ✅)

### Phase 3: Monitoring (Optional)

Add lightweight monitoring only if Phase 1 is implemented:

```typescript
// Simple logging approach (no new analytics dependency)
const logger = await getLogger();

await step.run('complete-report', async () => {
  logger.info({
    name: 'report-completion',
    reportId,
    attempt: event.data.attempt ?? 0,
    instanceId: process.env.RAILWAY_REPLICA_ID
  }, 'Report generation completed');

  // Your completion logic
});
```

**Success indicators**:
- Inngest dashboard shows no function failures during deployments
- `attempt > 0` logs are rare (indicates retries happened)
- User-reported failures drop to zero

### Phase 4: Separate Worker Service (DEFERRED)

> ⚠️ **Not recommended initially**. Only consider if:
> - Phase 1 proves insufficient after extended testing
> - Report generation regularly exceeds 2 hours
> - You need completely independent scaling for workers

The added complexity and cost ($5-10/month) isn't justified until simpler solutions fail.

## Acceptance Criteria

- [ ] Phase 0: Tested deployment during active report - documented current behavior
- [ ] Phase 1: Railway env vars configured: `OVERLAP=300`, `DRAINING=900` (if needed based on Phase 0)
- [ ] Phase 2: Idempotency audit completed for all step.run() operations
- [ ] Zero user-visible report failures during deployments (validated over 1 week)
- [ ] Inngest dashboard shows automatic recovery (if interruptions occur)

## Technical Considerations

### Why Inngest's Architecture Already Helps

```typescript
// Each step.run() is a checkpoint
const an0Result = await step.run('an0-problem-framing', async () => {
  // If deployment happens HERE, this step retries on new instance
  return await callClaude({ ... });
});

// an0Result is memoized - never re-executed even after deployment
const an1Result = await step.run('an1-solution-mapping', async () => {
  // Uses an0Result, which was already persisted
  return await callClaude({ previousResult: an0Result, ... });
});
```

### Instance Overlap Considerations

When `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS` is set, two instances run simultaneously:

1. **Database connections**: Supabase connection pooling handles this, but monitor for exhaustion
2. **Memory**: Old instance may hold report data in memory - ensure adequate RAM
3. **Rate limits**: Both instances may hit external APIs - Inngest's step-based execution naturally staggers calls

### Healthcheck Behavior During Drain

Current healthcheck at `/api/health` should continue returning 200 during drain to allow Inngest callbacks to complete. No changes needed.

### Graceful Shutdown Signal Handling

Next.js handles SIGTERM automatically. Verify no custom signal handlers interfere:

```typescript
// DON'T add custom handlers that exit immediately
// process.on('SIGTERM', () => process.exit(0)); // BAD

// Next.js will gracefully drain connections
```

## Deployment Verification Checklist

### Pre-Deployment (When Reports May Be Running)
- [ ] Check Inngest dashboard for active function runs
- [ ] Note function IDs of in-progress reports
- [ ] Have rollback plan ready (Railway instant rollback)

### Post-Deployment
- [ ] Verify noted functions completed or resumed successfully
- [ ] Check Inngest for any new function failures
- [ ] Monitor for user-reported issues for 24 hours

### Rollback Triggers
- Multiple function failures immediately after deployment
- DNS errors persisting beyond 5 minutes
- Users reporting stuck/failed reports

## References

- `apps/web/app/api/inngest/route.ts` - Inngest serve configuration
- `apps/web/lib/inngest/functions/generate-dd-report.ts` - DD report function (longest running)
- `apps/web/supabase/migrations/20260103000002_dd_mode_token_usage_events.sql` - Idempotency table
- `railway.json` - Current Railway configuration
- [Inngest Durable Execution Docs](https://www.inngest.com/docs/learn/how-functions-are-executed)
- [Railway Deployment Teardown Guide](https://docs.railway.com/guides/deployment-teardown)
