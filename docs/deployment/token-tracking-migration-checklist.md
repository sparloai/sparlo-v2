# Deployment Checklist: Antifragile Token Usage Tracking Migration

## Overview

**Migration**: `20260108000000_antifragile_token_tracking.sql`
**Components**:
1. New tables: `report_step_usage`, `report_reservations`
2. New RPC functions: `try_reserve_tokens`, `persist_step_usage`, `finalize_report_usage`
3. Modified: `generate-report.ts`, `generate-dd-report.ts`, `generate-discovery-report.ts`, `generate-hybrid-report.ts`
4. New: `handle-report-cancellation.ts` (Inngest function)
5. New: `cleanup-expired-reservations.ts` (Inngest cron)

**Deployment Sequence**:
- Day 1: Migration to staging, test all report types
- Day 2: Production migration, deploy functions, monitor 24h

---

## Data Invariants

These MUST remain true before and after deployment:

- [ ] All existing `usage_periods` records remain intact
- [ ] All existing `sparlo_reports` with status `complete` are unaffected
- [ ] No orphaned `report_step_usage` records (all have valid `report_id`)
- [ ] No orphaned `report_reservations` records (all have valid `account_id`)
- [ ] `increment_usage()` RPC continues to work for existing callers
- [ ] Token counts remain consistent (no double-billing, no lost billing)
- [ ] Active reservations auto-expire after 2 hours (no permanent locks)

---

## Pre-Deploy Checklist

### 1. Pre-Deploy SQL Audits (Run on Production - Read Only)

Save these baseline values BEFORE deploying:

```sql
-- =====================================================
-- BASELINE COUNTS (SAVE THESE VALUES!)
-- =====================================================

-- 1. Current usage_periods state
SELECT
    status,
    COUNT(*) as count,
    SUM(tokens_used) as total_tokens_used,
    SUM(reports_count) as total_reports
FROM usage_periods
GROUP BY status;

-- Expected: Should have 'active' and 'completed' statuses

-- 2. Recent report completions (last 24h baseline)
SELECT
    status,
    COUNT(*) as count
FROM sparlo_reports
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY status;

-- 3. Current token_usage in reports (for comparison)
SELECT
    COUNT(*) as reports_with_usage,
    SUM((token_usage->>'totalTokens')::bigint) as total_tracked_tokens
FROM sparlo_reports
WHERE token_usage IS NOT NULL
  AND (token_usage->>'totalTokens')::bigint > 0
  AND created_at > NOW() - INTERVAL '7 days';

-- 4. Active accounts with usage (for reservation impact analysis)
SELECT COUNT(DISTINCT account_id) as active_accounts
FROM usage_periods
WHERE status = 'active';
```

**Save baseline values here**:
| Metric | Pre-Deploy Value | Post-Deploy Value |
|--------|------------------|-------------------|
| Active usage_periods count | _______ | _______ |
| Completed usage_periods count | _______ | _______ |
| Total tokens_used (active) | _______ | _______ |
| Reports last 24h (complete) | _______ | _______ |
| Reports last 24h (failed) | _______ | _______ |
| Active accounts count | _______ | _______ |

### 2. Staging Verification Checklist

- [ ] Run migration on staging: `pnpm --filter web supabase migrations up`
- [ ] Verify new tables exist:
  ```sql
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_step_usage');
  SELECT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'report_reservations');
  ```
- [ ] Verify new functions exist:
  ```sql
  SELECT routine_name FROM information_schema.routines
  WHERE routine_name IN ('try_reserve_tokens', 'persist_step_usage', 'finalize_report_usage');
  ```
- [ ] Verify RLS is enabled:
  ```sql
  SELECT tablename, rowsecurity FROM pg_tables
  WHERE tablename IN ('report_step_usage', 'report_reservations');
  ```

### 3. Staging Functional Tests

Run each report type on staging and verify:

| Test | Report Type | Status | Token Usage Recorded |
|------|-------------|--------|---------------------|
| [ ] | Standard Report (generate-report.ts) | _____ | _____ |
| [ ] | DD Report (generate-dd-report.ts) | _____ | _____ |
| [ ] | Discovery Report (generate-discovery-report.ts) | _____ | _____ |
| [ ] | Hybrid Report (generate-hybrid-report.ts) | _____ | _____ |

**Test Cases to Execute**:

1. **Happy Path**: Start report, let complete
   - [ ] Verify `report_step_usage` has rows for each step
   - [ ] Verify `report_reservations` status = 'completed'
   - [ ] Verify `usage_periods.tokens_used` incremented correctly

2. **Cancellation**: Start report, cancel mid-way
   - [ ] Verify partial steps recorded in `report_step_usage`
   - [ ] Verify `finalize_report_usage` called
   - [ ] Verify `report_reservations` status = 'completed' (released)
   - [ ] Verify only completed steps billed

3. **Failure**: Simulate failure (e.g., invalid input)
   - [ ] Verify `onFailure` handler runs
   - [ ] Verify partial billing for completed steps

4. **Concurrent Gaming Prevention**:
   - [ ] Start 2 reports simultaneously with limited tokens
   - [ ] Verify second report rejected with "insufficient tokens" error

### 4. Code Review Checklist

- [ ] All 4 report generators import and use `persistStepUsage()`
- [ ] All 4 report generators call `finalize_report_usage` on completion
- [ ] `handle-report-cancellation.ts` registered in `/lib/inngest/functions/index.ts`
- [ ] `cleanup-expired-reservations.ts` registered in `/lib/inngest/functions/index.ts`
- [ ] TypeScript types generated: `pnpm supabase:web:typegen`

---

## Deploy Steps

### Day 2: Production Deployment

#### Phase 1: Database Migration (Estimated: < 2 minutes)

```bash
# 1. Verify migration file is in place
ls apps/web/supabase/migrations/20260108000000_antifragile_token_tracking.sql

# 2. Run migration
pnpm --filter web supabase migrations up

# 3. Verify migration applied
pnpm --filter web supabase migrations list | grep antifragile
```

- [ ] Migration completed without errors
- [ ] New tables created
- [ ] New functions created
- [ ] RLS policies active

#### Phase 2: Deploy Inngest Functions (Estimated: < 5 minutes)

```bash
# Deploy the application (includes new Inngest functions)
# [Your deployment command here - e.g., Railway deploy]
```

- [ ] Deployment successful
- [ ] Inngest dashboard shows new functions:
  - [ ] `handle-report-cancellation`
  - [ ] `cleanup-expired-reservations` (cron: every 2 hours)

#### Phase 3: Enable Feature (If using feature flag)

```bash
# If using feature flag for gradual rollout
# Set flag in config/feature-flags.config.ts or environment
```

- [ ] Feature flag enabled (if applicable)

---

## Post-Deploy Verification

### Within 5 Minutes of Deploy

Run these verification queries on production:

```sql
-- =====================================================
-- POST-DEPLOY VERIFICATION QUERIES
-- =====================================================

-- 1. Verify new tables exist and are empty (no data corruption)
SELECT
    'report_step_usage' as table_name,
    COUNT(*) as row_count
FROM report_step_usage
UNION ALL
SELECT
    'report_reservations' as table_name,
    COUNT(*) as row_count
FROM report_reservations;

-- Expected: Both should be 0 immediately after migration

-- 2. Verify existing usage_periods unchanged
SELECT
    status,
    COUNT(*) as count,
    SUM(tokens_used) as total_tokens
FROM usage_periods
GROUP BY status;

-- Compare with pre-deploy baseline - should be identical

-- 3. Verify functions are callable (test with fake UUIDs)
SELECT try_reserve_tokens(
    '00000000-0000-0000-0000-000000000001'::uuid,
    '00000000-0000-0000-0000-000000000002'::uuid,
    180000
);

-- Expected: Returns jsonb with success: false (account doesn't exist, but function works)

-- 4. Check for any immediate errors in recent reports
SELECT id, status, error_message, created_at
FROM sparlo_reports
WHERE created_at > NOW() - INTERVAL '10 minutes'
  AND status IN ('failed', 'cancelled')
ORDER BY created_at DESC
LIMIT 10;
```

### Post-Deploy Functional Verification

Generate ONE test report after deployment:

- [ ] Start a new report via the UI
- [ ] Monitor Inngest dashboard for function execution
- [ ] After completion, verify:

```sql
-- Check the test report's step usage
SELECT
    step_name,
    input_tokens,
    output_tokens,
    total_tokens,
    completed_at
FROM report_step_usage
WHERE report_id = '[TEST_REPORT_ID]'
ORDER BY completed_at;

-- Check reservation was released
SELECT status, created_at, expires_at
FROM report_reservations
WHERE report_id = '[TEST_REPORT_ID]';

-- Verify usage was billed
SELECT tokens_used, reports_count
FROM usage_periods
WHERE account_id = '[TEST_ACCOUNT_ID]'
  AND status = 'active';
```

- [ ] Step usage recorded for all steps (AN0, AN1.5, AN1.7, AN2, AN3, AN4, AN5)
- [ ] Reservation status = 'completed'
- [ ] `usage_periods.tokens_used` increased by sum of step tokens

---

## 24-Hour Monitoring Plan

### Metrics to Watch

| Metric | Alert Threshold | Dashboard/Location |
|--------|-----------------|-------------------|
| Report completion rate | < 90% (normal ~95%) | Inngest Dashboard |
| Report failure rate | > 5% for 5 min | Inngest Dashboard |
| Avg report duration | > 10 min (normal ~5 min) | Inngest Dashboard |
| Orphaned reservations | > 10 active for > 3h | SQL Query below |
| Token billing errors | Any | Application logs |
| `finalize_report_usage` failures | Any | Application logs |

### Monitoring Queries (Run at +1h, +4h, +24h)

```sql
-- =====================================================
-- MONITORING QUERIES
-- =====================================================

-- 1. Check for orphaned active reservations (should auto-expire)
SELECT
    r.id,
    r.report_id,
    r.account_id,
    r.status,
    r.created_at,
    r.expires_at,
    sr.status as report_status
FROM report_reservations r
LEFT JOIN sparlo_reports sr ON sr.id = r.report_id
WHERE r.status = 'active'
  AND r.created_at < NOW() - INTERVAL '2 hours';

-- Expected: 0 rows (cleanup cron should handle these)

-- 2. Check for reports without step usage (possible issue)
SELECT
    r.id,
    r.status,
    r.created_at,
    r.mode
FROM sparlo_reports r
LEFT JOIN report_step_usage rsu ON rsu.report_id = r.id
WHERE r.status = 'complete'
  AND r.created_at > NOW() - INTERVAL '24 hours'
  AND rsu.id IS NULL;

-- Expected after 24h: Only reports from BEFORE migration

-- 3. Usage accuracy check (step sum vs billed)
SELECT
    r.id as report_id,
    r.account_id,
    SUM(rsu.total_tokens) as step_total,
    up.tokens_used as period_total,
    up.reports_count
FROM sparlo_reports r
JOIN report_step_usage rsu ON rsu.report_id = r.id
JOIN usage_periods up ON up.account_id = r.account_id AND up.status = 'active'
WHERE r.created_at > NOW() - INTERVAL '24 hours'
GROUP BY r.id, r.account_id, up.tokens_used, up.reports_count
LIMIT 50;

-- 4. Cleanup cron verification
SELECT
    status,
    COUNT(*) as count,
    MIN(created_at) as oldest,
    MAX(created_at) as newest
FROM report_reservations
GROUP BY status;

-- 5. Error rate check
SELECT
    DATE_TRUNC('hour', created_at) as hour,
    status,
    COUNT(*) as count
FROM sparlo_reports
WHERE created_at > NOW() - INTERVAL '24 hours'
GROUP BY DATE_TRUNC('hour', created_at), status
ORDER BY hour DESC;
```

### Console Spot Checks

Run in production console at +1h:

```javascript
// Quick sanity check - get recent completed reports
const { data: recentReports } = await supabase
  .from('sparlo_reports')
  .select('id, status, created_at')
  .eq('status', 'complete')
  .gte('created_at', new Date(Date.now() - 3600000).toISOString())
  .limit(5);

console.log('Recent completed reports:', recentReports?.length);

// Check step usage for each
for (const report of recentReports || []) {
  const { data: steps } = await supabase
    .from('report_step_usage')
    .select('step_name, total_tokens')
    .eq('report_id', report.id);

  console.log(`Report ${report.id}: ${steps?.length || 0} steps tracked`);
}
```

---

## Rollback Plan

### Can We Roll Back?

- [x] **Yes - Additive changes only**: Migration adds new tables/functions without modifying existing ones
- [x] **Yes - Code is backwards compatible**: Old `increment_usage()` still works
- [ ] **Partial rollback possible**: Can revert code while keeping new tables

### Rollback Steps

#### Severity Level 1: Function Issues Only (No Data Loss)

If Inngest functions are failing but database is fine:

```bash
# 1. Revert to previous code version
git revert [commit-sha]

# 2. Deploy previous version
[Your deployment command]

# 3. Verify old behavior restored
# Reports should complete using old increment_usage() path
```

- [ ] Previous version deployed
- [ ] Reports completing successfully
- [ ] No new entries in report_step_usage (expected)

#### Severity Level 2: Database Migration Issues

If new tables/functions are causing problems:

```sql
-- WARNING: Only run if absolutely necessary
-- This will lose any data in new tables

-- 1. Drop new functions
DROP FUNCTION IF EXISTS try_reserve_tokens(uuid, uuid, integer);
DROP FUNCTION IF EXISTS persist_step_usage(uuid, uuid, text, integer, integer, integer, text);
DROP FUNCTION IF EXISTS finalize_report_usage(uuid, uuid);

-- 2. Drop new tables
DROP TABLE IF EXISTS report_step_usage;
DROP TABLE IF EXISTS report_reservations;

-- 3. Remove migration record (so it can be re-run later)
DELETE FROM supabase_migrations
WHERE name = '20260108000000_antifragile_token_tracking';
```

- [ ] Functions dropped
- [ ] Tables dropped
- [ ] Migration record removed
- [ ] Previous code deployed

#### Post-Rollback Verification

```sql
-- Verify existing system still works
SELECT increment_usage(
    '[test-account-id]'::uuid,
    1000,
    true,
    false
);

-- Should return jsonb with tokens_used, tokens_limit, etc.
```

---

## Checklist Summary

### Pre-Deploy (Required)

- [ ] Run baseline SQL queries
- [ ] Save expected values in table above
- [ ] Staging migration tested
- [ ] All 4 report types tested on staging
- [ ] Cancellation flow tested
- [ ] Concurrent request blocking tested
- [ ] Code review completed
- [ ] Rollback plan reviewed by team

### Deploy Steps

1. [ ] Deploy commit: `_______________`
2. [ ] Run migration: `pnpm --filter web supabase migrations up`
3. [ ] Verify new tables/functions exist
4. [ ] Deploy application (Inngest functions)
5. [ ] Verify Inngest dashboard shows new functions

### Post-Deploy (Within 5 Minutes)

- [ ] Run verification queries
- [ ] Compare with baseline (no data loss)
- [ ] Start test report
- [ ] Verify step usage recorded
- [ ] Verify reservation released
- [ ] Check error dashboard

### Monitoring (24 Hours)

- [ ] Set up alerts for metrics
- [ ] Check at +1h: `_______________` (notes)
- [ ] Check at +4h: `_______________` (notes)
- [ ] Check at +24h: `_______________` (notes)
- [ ] Run cleanup cron verification
- [ ] Close deployment ticket

### Rollback (If Needed)

1. [ ] Assess severity level (1 or 2)
2. [ ] Execute rollback steps
3. [ ] Verify rollback successful
4. [ ] Document incident
5. [ ] Schedule post-mortem

---

## Appendix: Key File Locations

| Component | File Path |
|-----------|-----------|
| Migration | `/apps/web/supabase/migrations/20260108000000_antifragile_token_tracking.sql` |
| Standard Report | `/apps/web/lib/inngest/functions/generate-report.ts` |
| DD Report | `/apps/web/lib/inngest/functions/generate-dd-report.ts` |
| Discovery Report | `/apps/web/lib/inngest/functions/generate-discovery-report.ts` |
| Hybrid Report | `/apps/web/lib/inngest/functions/generate-hybrid-report.ts` |
| Cancellation Handler | `/apps/web/lib/inngest/functions/handle-report-cancellation.ts` |
| Cleanup Cron | `/apps/web/lib/inngest/functions/cleanup-expired-reservations.ts` |
| Function Index | `/apps/web/lib/inngest/functions/index.ts` |
| Usage Tracking Base | `/apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql` |
| Plan Document | `/plans/antifragile-token-usage-tracking.md` |

---

## Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Engineer | | | |
| Reviewer | | | |
| On-Call | | | |
