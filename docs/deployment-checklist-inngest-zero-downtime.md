# Deployment Checklist: Zero-Downtime Inngest on Railway

## Overview

This deployment adds Railway environment variables to enable graceful shutdown for long-running Inngest functions (30-60 minute report generation), preventing interruptions during code deployments.

**Changes:**
1. Add `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300` (5 min new instance warm-up)
2. Add `RAILWAY_DEPLOYMENT_DRAINING_SECONDS=600` (10 min graceful shutdown)
3. Rely on Inngest's durable execution with step.run() for automatic resumption

**Risk Level:** Medium
- No code changes, only infrastructure configuration
- Functions already use step.run() checkpointing (verified in all 4 function files)
- Streaming mode already enabled in route.ts
- Risk: Increased deployment time (~15 min), potential instance overlap costs

---

## Data Invariants

The following must remain true before, during, and after deployment:

- [ ] All in-progress reports have valid `status` values (in_progress, completed, failed)
- [ ] Report generation functions can resume from last completed step
- [ ] No orphaned reports stuck in `in_progress` status after deployment
- [ ] Inngest function run history shows successful step resumption, not full re-execution
- [ ] Health check endpoint continues returning 200 during drain period
- [ ] Token usage tracking remains idempotent (no double-counting)

---

## Pre-Deploy Verification (Required)

### 1. Database State Baseline

Run these SQL queries in Supabase SQL Editor BEFORE deployment and save the results:

```sql
-- Baseline: Count of reports by status (SAVE THIS)
SELECT status, COUNT(*) as count
FROM sparlo_reports
GROUP BY status
ORDER BY status;

-- Expected results (example):
-- completed: ~50
-- in_progress: 0-5
-- failed: ~2

-- Check for long-running reports that might be interrupted
SELECT
  id,
  title,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_running
FROM sparlo_reports
WHERE status = 'in_progress'
  AND created_at > NOW() - INTERVAL '2 hours'
ORDER BY created_at DESC;

-- Expected: 0-5 reports, max age < 90 minutes

-- Verify no orphaned reports from previous deployments
SELECT COUNT(*) as orphaned_count
FROM sparlo_reports
WHERE status = 'in_progress'
  AND created_at < NOW() - INTERVAL '2 hours';

-- Expected: 0 (if > 0, investigate before proceeding)
```

### 2. Inngest Dashboard Pre-Check

Navigate to Inngest Dashboard (https://app.inngest.com):

- [ ] Verify current function run success rate > 95%
- [ ] Check for any ongoing function runs (Functions > Runs > Running)
- [ ] Note current "Function Interrupted" error count (should be 0 or near 0)
- [ ] Screenshot baseline metrics for comparison

### 3. Railway Current Configuration

Run in Railway dashboard or CLI:

```bash
# Check current Railway environment variables
railway variables list | grep RAILWAY_DEPLOYMENT

# Expected output: (these should NOT exist yet)
# RAILWAY_DEPLOYMENT_OVERLAP_SECONDS (not found)
# RAILWAY_DEPLOYMENT_DRAINING_SECONDS (not found)
```

### 4. Verify Code is Ready

Confirm the following in codebase (no changes needed, just verification):

```bash
# Verify streaming mode is enabled
grep "streaming: 'allow'" /Users/alijangbar/Desktop/sparlo-v2/apps/web/app/api/inngest/route.ts

# Expected output:
# streaming: 'allow',

# Verify health check exists
curl -f https://your-app.railway.app/api/health

# Expected output:
# {"status":"healthy","timestamp":"2026-01-06T..."}

# Count step.run() usage across all Inngest functions
grep -r "step\.run" /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/*.ts | wc -l

# Expected: 45+ (confirmed: 45 checkpoints across 4 functions)
```

### 5. Go/No-Go Decision Point

**STOP deployment if:**
- Orphaned reports > 0 (indicates previous deployment issues)
- Current success rate < 95% (underlying function issues)
- Active reports running > 90 minutes (wait for completion)
- Health check failing (infrastructure issues)

**PROCEED if:**
- All queries return expected results
- Inngest dashboard shows healthy state
- Code verification confirms step.run() usage
- Team acknowledges ~15 min deployment time increase

---

## Deploy Steps

### Step 1: Add Environment Variables (Railway Dashboard)

**Time estimate:** 2 minutes

1. Navigate to Railway project: Settings > Variables
2. Add the following variables:

```bash
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=600
```

3. **DO NOT** trigger a deployment yet - just save the variables

**Verification:**
```bash
railway variables list | grep RAILWAY_DEPLOYMENT
# Should now show both variables with values 300 and 600
```

### Step 2: Trigger Deployment (Railway)

**Time estimate:** 15-20 minutes (increased from normal 3-5 min)

**During peak hours (8am-6pm weekdays):**
- Check Inngest dashboard for active report generations
- If active runs > 3, consider waiting or coordinate with team

**Deploy command:**
```bash
# Option 1: Trigger via Railway CLI
railway up

# Option 2: Trigger via Git push (if configured)
git push origin main

# Option 3: Manual trigger in Railway dashboard
# Navigate to project > Deployments > Deploy
```

**Expected behavior:**
1. New instance starts (0-5 min)
2. Health check passes on new instance (0-1 min)
3. Overlap period begins - both instances alive (5 min)
4. Old instance receives SIGTERM
5. Drain period - old instance finishes in-flight requests (up to 10 min)
6. Old instance terminates

**Monitor during deployment:**
- Railway deployment logs (should show graceful shutdown messages)
- Inngest dashboard (watch for connection interruptions)
- Application /api/health endpoint (should stay healthy)

---

## Post-Deploy Verification (Within 5 Minutes)

### 1. Verify Environment Variables Applied

```bash
# SSH into Railway instance (or check via dashboard)
railway run printenv | grep RAILWAY_DEPLOYMENT

# Expected output:
# RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300
# RAILWAY_DEPLOYMENT_DRAINING_SECONDS=600
```

### 2. Database State Verification

Run the same baseline queries and compare results:

```sql
-- Compare report counts (should match pre-deploy baseline)
SELECT status, COUNT(*) as count
FROM sparlo_reports
GROUP BY status
ORDER BY status;

-- Verify no new orphaned reports created during deployment
SELECT COUNT(*) as new_orphaned
FROM sparlo_reports
WHERE status = 'in_progress'
  AND created_at < NOW() - INTERVAL '2 hours';

-- Expected: 0

-- Check if any reports transitioned during deployment
SELECT
  id,
  title,
  status,
  updated_at,
  EXTRACT(EPOCH FROM (NOW() - updated_at))/60 as minutes_since_update
FROM sparlo_reports
WHERE updated_at > NOW() - INTERVAL '20 minutes'
ORDER BY updated_at DESC
LIMIT 10;

-- Expected: Normal status transitions (in_progress -> completed)
```

### 3. Inngest Dashboard Post-Check

Within 5 minutes of deployment completion:

- [ ] Check Functions > Runs for any new "Failed" runs during deployment window
- [ ] Verify "Function Interrupted" error count did NOT increase
- [ ] Check if any functions show "Resumed from step X" (indicates successful checkpoint recovery)
- [ ] Compare success rate to pre-deploy baseline (should be unchanged or improved)

### 4. Health Check Validation

```bash
# Verify health endpoint responded during drain period
# (Check Railway logs for /api/health requests during deployment)

# Current health check
curl -f https://your-app.railway.app/api/health

# Expected: 200 OK with JSON response
```

### 5. Application Smoke Test

Trigger a test report generation to verify end-to-end functionality:

```bash
# Via application UI:
# 1. Navigate to /app/reports
# 2. Click "Generate New Report"
# 3. Fill in test data
# 4. Submit

# Expected behavior:
# - Report enters "in_progress" state
# - Inngest function executes successfully
# - Report transitions to "completed" within 30-60 minutes
```

**Go/No-Go for Sign-Off:**
- All SQL verification queries match expected results
- Inngest dashboard shows no degradation
- Health check passing
- Test report generation initiated successfully

If ANY check fails, proceed to Rollback section immediately.

---

## Post-Deploy Monitoring (First 24 Hours)

### Immediate Monitoring (First Hour)

| Metric/Log | Alert Condition | Check Frequency | Where to Check |
|------------|-----------------|-----------------|----------------|
| Inngest function success rate | < 95% for 5 min | Every 5 min | Inngest Dashboard > Metrics |
| Function interruption errors | > 0 in 1 hour | Every 15 min | Inngest Dashboard > Functions > Errors |
| Orphaned report count | > 0 | Every 15 min | SQL query (see below) |
| Health check failures | > 1 in 10 min | Every 5 min | Railway logs + /api/health |
| Deployment duration | > 20 min | Per deployment | Railway deployment logs |

**Monitoring SQL (run every 15 minutes for first hour):**

```sql
-- Check for orphaned reports
SELECT
  id,
  title,
  status,
  created_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as stuck_for_minutes
FROM sparlo_reports
WHERE status = 'in_progress'
  AND created_at < NOW() - INTERVAL '90 minutes';

-- Expected: 0 rows

-- Check recent report success rate
SELECT
  status,
  COUNT(*) as count,
  ROUND(100.0 * COUNT(*) / SUM(COUNT(*)) OVER (), 2) as percentage
FROM sparlo_reports
WHERE created_at > NOW() - INTERVAL '1 hour'
GROUP BY status;

-- Expected: completed > 90%, failed < 5%
```

### Extended Monitoring (24 Hours)

| Checkpoint | Actions | Success Criteria |
|------------|---------|------------------|
| +1 hour | Run monitoring SQL, check Inngest dashboard | No orphaned reports, success rate > 95% |
| +4 hours | Verify at least 1 deployment occurred during active reports | Reports completed successfully, no interruptions |
| +8 hours | Check overnight reports (if applicable) | All completed or in reasonable progress |
| +24 hours | Final verification, document lessons learned | All metrics stable, sign off deployment |

### Inngest-Specific Monitoring

**Key metrics to watch in Inngest Dashboard:**

1. **Function Duration Distribution**
   - Path: Functions > [function-name] > Metrics > Duration
   - Expected: No significant change in p50/p95/p99 (indicates no re-execution overhead)

2. **Step Retry Rate**
   - Path: Functions > [function-name] > Steps
   - Expected: Retry rate < 1% (indicates successful durable execution)

3. **Function Attempt Count**
   - Path: Functions > Runs > [specific-run]
   - Expected: attempt = 1 for most runs (indicates no interruptions)

4. **Deployment Correlation**
   - Cross-reference Railway deployment times with Inngest error spikes
   - Expected: No correlation between deployments and errors (our goal)

### Alert Configuration (Recommended)

Set up alerts in Inngest Dashboard (Settings > Alerts):

```yaml
- name: "High Function Failure Rate"
  condition: error_rate > 5%
  window: 5 minutes
  channels: [email, slack]

- name: "Function Interrupted During Deployment"
  condition: error_message contains "ECONNREFUSED" OR "DNS resolution"
  window: 1 minute
  channels: [email, slack]

- name: "Step Retry Storm"
  condition: step_retry_count > 10
  window: 10 minutes
  channels: [email, slack]
```

---

## Rollback Plan

### Can We Roll Back?

**YES - Full Rollback Possible**

This deployment only adds environment variables. Rollback is safe and immediate because:
- No code changes (no git revert needed)
- No database migrations
- No data transformations
- Inngest functions continue working with or without these variables

**Rollback Risk:** Very Low
- Removes graceful shutdown (returns to 3-second drain)
- In-flight reports during rollback deployment may be interrupted (same as original problem)
- No data loss - functions will resume from last checkpoint

### Rollback Steps

**Time estimate:** 5 minutes

#### Step 1: Remove Environment Variables

```bash
# Option 1: Railway CLI
railway variables delete RAILWAY_DEPLOYMENT_OVERLAP_SECONDS
railway variables delete RAILWAY_DEPLOYMENT_DRAINING_SECONDS

# Option 2: Railway Dashboard
# Navigate to Settings > Variables
# Delete both RAILWAY_DEPLOYMENT_* variables
```

#### Step 2: Verify Removal

```bash
railway variables list | grep RAILWAY_DEPLOYMENT
# Expected: No results (variables removed)
```

#### Step 3: Deploy Removal

**Note:** This deployment will be FAST (3-5 min) because variables are now removed.

```bash
# Trigger new deployment to apply variable removal
railway up
# Or wait for automatic deployment trigger
```

#### Step 4: Post-Rollback Verification

```sql
-- Check for reports that may have been interrupted during rollback deployment
SELECT
  id,
  title,
  status,
  updated_at
FROM sparlo_reports
WHERE status = 'in_progress'
  AND updated_at < NOW() - INTERVAL '90 minutes';

-- If any found, these were likely interrupted
-- They will auto-resume via Inngest's durable execution
```

**Monitor Inngest Dashboard:**
- Check for step resumption in interrupted reports
- Verify functions complete successfully after resumption

### Rollback Decision Criteria

**Trigger rollback if:**
- Deployment time consistently exceeds 25 minutes (indicates infrastructure issue)
- Function success rate drops below 90% within 4 hours
- Orphaned report count increases by > 5 in 1 hour
- Railway costs increase unexpectedly due to instance overlap
- Team determines deployment time increase is unacceptable

**DO NOT rollback for:**
- Single function failure (investigate root cause, likely unrelated)
- Expected deployment time increase (15-20 min is normal with these settings)
- Temporary Inngest API issues (retry behavior is expected)

---

## Success Metrics & Sign-Off

### Definition of Success

This deployment is considered successful when ALL of the following are true after 24 hours:

- [ ] Zero user-reported report failures during deployment windows
- [ ] Inngest function success rate remains > 95%
- [ ] No correlation between deployment times and function interruptions
- [ ] Orphaned report count remains at 0
- [ ] At least 3 deployments occurred during active report generation with no interruptions
- [ ] Railway deployment logs show graceful shutdown messages
- [ ] Team acknowledges deployment time trade-off is acceptable

### Quantitative Targets

| Metric | Target | Measurement Period |
|--------|--------|-------------------|
| Function success rate | > 95% | 24 hours post-deploy |
| Deployment-related interruptions | 0 | 1 week post-deploy |
| Orphaned reports | 0 | 24 hours post-deploy |
| Step retry rate | < 1% | 24 hours post-deploy |
| User complaints | 0 | 1 week post-deploy |

### Sign-Off Checklist

**After 24 Hours:**

- [ ] All quantitative targets met
- [ ] Monitoring SQL queries show healthy state
- [ ] Inngest dashboard metrics stable or improved
- [ ] Railway deployment logs reviewed (no anomalies)
- [ ] Team retrospective completed (document learnings)
- [ ] Update deployment runbook with actual timings and observations
- [ ] Close deployment ticket

**Sign-Off Approval:**
- Engineer: _________________ Date: _______
- Tech Lead: ________________ Date: _______

---

## Additional Considerations

### Cost Impact

**Expected Railway cost increase:**
- Overlap period (5 min): Minimal, ~$0.01 per deployment
- Instance hours: Negligible increase (<1% monthly cost)

**Monitor Railway billing dashboard for unexpected increases.**

### Alternative Approaches (If This Fails)

If the grace period approach proves insufficient:

1. **Phase 2: Separate Worker Service**
   - Deploy Inngest functions to dedicated Railway service
   - Web deployments won't affect report generation
   - Worker service has independent 15-30 min grace periods
   - Trade-off: Additional $5-10/month, more complex deployment coordination

2. **Phase 3: Inngest Queued Function Pause**
   - Use Inngest's "Pause Function" API before deployments
   - Resume after deployment completes
   - Trade-off: Manual/automated coordination required

3. **Phase 4: Maintenance Window Deployments**
   - Deploy only during low-traffic periods (e.g., 2-4 AM UTC)
   - Trade-off: Limits deployment flexibility

### Idempotency Validation (Post-Deploy Task)

After deployment stabilizes, audit all step.run() operations for idempotency:

```typescript
// Check these patterns in function files:
// ✅ Safe: Supabase .update() with .eq(id)
// ✅ Safe: Supabase .upsert()
// ⚠️ Check: External API calls (should use idempotency keys)
// ⚠️ Check: Token tracking (already uses idempotent keys - verify)
```

Audit files:
- /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-report.ts
- /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-discovery-report.ts
- /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-hybrid-report.ts
- /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-dd-report.ts

### Documentation Updates (Post-Deploy)

- [ ] Update `/Users/alijangbar/Desktop/sparlo-v2/plans/inngest-zero-downtime-deployments.md` with actual results
- [ ] Document deployment timings in internal runbook
- [ ] Share lessons learned with team
- [ ] Update Railway deployment best practices doc

---

## Emergency Contacts & Resources

**Inngest Support:**
- Dashboard: https://app.inngest.com
- Docs: https://www.inngest.com/docs/learn/how-functions-are-executed
- Support: support@inngest.com

**Railway Support:**
- Dashboard: https://railway.app
- Docs: https://docs.railway.com/guides/deployment-teardown
- Community: https://discord.gg/railway

**Internal:**
- Deployment lead: [Your name]
- On-call engineer: [Name]
- Escalation: [Tech lead name]

**Related Documentation:**
- /Users/alijangbar/Desktop/sparlo-v2/plans/inngest-zero-downtime-deployments.md
- /Users/alijangbar/Desktop/sparlo-v2/railway.json
- /Users/alijangbar/Desktop/sparlo-v2/apps/web/app/api/inngest/route.ts

---

## Lessons Learned (Fill After 24 Hours)

**What went well:**
-
-

**What could be improved:**
-
-

**Unexpected issues:**
-
-

**Action items for future deployments:**
-
-

---

**Deployment Date:** __________
**Completed By:** __________
**Status:** [ ] Success [ ] Rollback [ ] Partial Success
**Notes:** ________________________________
