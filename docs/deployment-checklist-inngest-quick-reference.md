# Quick Reference: Inngest Zero-Downtime Deployment

**Full checklist:** /Users/alijangbar/Desktop/sparlo-v2/docs/deployment-checklist-inngest-zero-downtime.md

---

## Pre-Deploy (5 minutes)

```sql
-- 1. Baseline report counts (Supabase SQL Editor)
SELECT status, COUNT(*) FROM sparlo_reports GROUP BY status;

-- 2. Check for orphaned reports (MUST BE 0)
SELECT COUNT(*) FROM sparlo_reports
WHERE status = 'in_progress' AND created_at < NOW() - INTERVAL '2 hours';
```

- [ ] Orphaned count = 0
- [ ] Inngest dashboard success rate > 95%
- [ ] Active reports < 90 minutes old

**If checks fail, STOP and investigate.**

---

## Deploy (2 minutes)

Railway Dashboard > Settings > Variables > Add:

```bash
RAILWAY_DEPLOYMENT_OVERLAP_SECONDS=300
RAILWAY_DEPLOYMENT_DRAINING_SECONDS=600
```

Then: `railway up` (expect 15-20 min deployment)

---

## Post-Deploy (5 minutes)

```sql
-- 1. Verify no new orphaned reports
SELECT COUNT(*) FROM sparlo_reports
WHERE status = 'in_progress' AND created_at < NOW() - INTERVAL '2 hours';
-- Must be 0

-- 2. Compare status counts to baseline
SELECT status, COUNT(*) FROM sparlo_reports GROUP BY status;
-- Should match pre-deploy baseline
```

- [ ] Health check: `curl https://your-app.railway.app/api/health`
- [ ] Inngest dashboard: No new errors during deployment window
- [ ] Test report: Generate one via UI, verify it starts successfully

**If ANY check fails, rollback immediately.**

---

## Rollback (5 minutes)

```bash
# Remove variables
railway variables delete RAILWAY_DEPLOYMENT_OVERLAP_SECONDS
railway variables delete RAILWAY_DEPLOYMENT_DRAINING_SECONDS

# Deploy
railway up
```

---

## 24-Hour Monitoring

Run every 4 hours:

```sql
-- Check for orphaned reports
SELECT id, title, created_at
FROM sparlo_reports
WHERE status = 'in_progress' AND created_at < NOW() - INTERVAL '90 minutes';

-- Recent success rate
SELECT status, COUNT(*) FROM sparlo_reports
WHERE created_at > NOW() - INTERVAL '4 hours'
GROUP BY status;
```

Check Inngest dashboard:
- Functions > Metrics > Success rate (target: > 95%)
- Functions > Runs > Filter by "Failed" (target: 0 during deployments)

**Sign-off criteria (after 24h):**
- 3+ deployments with no interruptions
- 0 orphaned reports
- Success rate > 95%

---

## Emergency

**Rollback if:**
- Orphaned reports > 5 in 1 hour
- Success rate < 90% for 4 hours
- Deployment time > 25 minutes consistently

**Contacts:**
- Inngest Dashboard: https://app.inngest.com
- Railway Dashboard: https://railway.app
- Internal escalation: [Add contact]
