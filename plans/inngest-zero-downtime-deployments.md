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

**Key insight**: Inngest's durable execution means completed steps are **never re-executed**. If a deployment interrupts a function between steps, Inngest automatically resumes from the last checkpoint on the new instance.

## Proposed Solution

### Phase 1: Railway Grace Periods (Quick Fix)

Add environment variables to Railway:

```bash
# Keep old instance alive for 5 minutes during transition
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300

# Allow 10 minutes for graceful shutdown after SIGTERM
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=600
```

**Why these values:**
- 300s overlap ensures new instance is fully ready before old receives SIGTERM
- 600s drain allows most in-progress steps to complete
- Total deployment time increases by ~15 minutes max

**Implementation**:
1. Add env vars in Railway dashboard (Settings → Variables)
2. No code changes required
3. Test with a deployment during active report generation

### Phase 2: Monitoring & Validation

Add metrics to validate the solution works:

```typescript
// In function completion handlers
await step.run('track-completion', async () => {
  await analytics.track('report_completed', {
    reportId,
    durationMs: Date.now() - startTime,
    wasResumed: attempt > 0, // Inngest provides attempt number
    deploymentDuringExecution: checkDeploymentWindow()
  });
});
```

**Success metrics:**
- Function success rate during deployment windows
- Resume/retry rate (should be near zero with grace periods)
- User-reported failures (should drop to zero)

### Phase 3: Separate Worker Service (Optional, for Maximum Isolation)

If Phase 1 is insufficient for very long functions:

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Web Service   │────▶│  Inngest Cloud  │────▶│ Worker Service  │
│ (deploys often) │     │   (routes jobs) │     │(deploys rarely) │
└─────────────────┘     └─────────────────┘     └─────────────────┘
        │                                               │
        └───────────── Shared Database ─────────────────┘
```

**Benefits:**
- Web deployments don't affect running reports
- Worker has independent, longer grace periods (15+ minutes)
- Can scale workers independently

**Trade-offs:**
- Additional Railway service cost (~$5-10/month)
- Slightly more complex deployment coordination
- Requires code reorganization

## Acceptance Criteria

- [ ] Railway env vars configured: `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300`, `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=600`
- [ ] Zero user-visible report failures during deployments (validated over 1 week)
- [ ] Inngest dashboard shows no function failures correlated with deployment times
- [ ] Documentation updated with deployment best practices

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

### Idempotency Check (Important)

Ensure all `step.run()` operations are idempotent:

```typescript
// ✅ Safe - Supabase upsert
await step.run('save-result', async () => {
  await supabase.from('sparlo_reports')
    .update({ report_data: result })
    .eq('id', reportId);  // Update, not insert - idempotent
});

// ⚠️ Check external APIs
await step.run('track-usage', async () => {
  // Should use idempotency key if available
  await trackUsage(reportId, tokens);
});
```

### Healthcheck Behavior During Drain

Current healthcheck at `/api/health` should continue returning 200 during drain to allow Inngest callbacks to complete. No changes needed.

## References

- `apps/web/app/api/inngest/route.ts` - Inngest serve configuration
- `apps/web/lib/inngest/functions/generate-dd-report.ts` - DD report function (longest running)
- `railway.json` - Current Railway configuration
- [Inngest Durable Execution Docs](https://www.inngest.com/docs/learn/how-functions-are-executed)
- [Railway Deployment Teardown Guide](https://docs.railway.com/guides/deployment-teardown)
