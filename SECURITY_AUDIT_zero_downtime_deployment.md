# Security Audit: Zero-Downtime Inngest Deployment Plan

**Auditor:** Claude Code (Security Specialist)
**Date:** 2026-01-06
**Scope:** Railway deployment resilience with overlapping instances
**Risk Level:** MEDIUM (Mitigatable)

---

## Executive Summary

The proposed zero-downtime deployment strategy introduces **MEDIUM security risk** through the simultaneous operation of two application instances during the overlap period. While the plan successfully addresses operational resilience, it creates temporary attack surface expansion and data consistency challenges that require specific mitigations.

**Critical Findings:**
- ✅ **SIGNING_KEY** properly configured and enforced
- ⚠️ **DUPLICATE PROCESSING RISK** - No idempotency protection for LLM calls
- ⚠️ **RACE CONDITIONS** - Database updates vulnerable during overlap
- ⚠️ **ATTACK SURFACE** - Doubled during 5-10 minute overlap window
- ✅ **RLS POLICIES** properly protect report access

**Recommended Actions:**
1. **Immediate (Phase 1)**: Add idempotency keys to prevent duplicate LLM charges
2. **Short-term (Phase 2)**: Implement database-level transaction isolation
3. **Long-term (Phase 3)**: Deploy separate worker service with enhanced security isolation

---

## Security Review by Category

### 1. Request Authentication & Integrity ✅ SECURE

**Current Implementation:**
```typescript
// /Users/alijangbar/Desktop/sparlo-v2/apps/web/app/api/inngest/route.ts
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions,
  signingKey: process.env.INNGEST_SIGNING_KEY, // ✅ Explicitly set
  streaming: 'allow',
});
```

**Analysis:**
- ✅ Inngest SDK automatically validates HMAC signatures on all requests
- ✅ `INNGEST_SIGNING_KEY` explicitly passed to serve() function
- ✅ Unsigned requests rejected with 401 Unauthorized
- ✅ Signature verification happens BEFORE function execution

**Impact of Dual Instances:**
- Both old and new instances share the SAME signing key
- Inngest Cloud validates requests before routing
- No amplification of authentication attack surface

**Verdict:** ✅ **NO NEW VULNERABILITIES** - Signing key handling is secure during transitions.

**Evidence from TODO-026:**
> The Inngest SDK's `serve()` function automatically verifies signatures when `INNGEST_SIGNING_KEY` is set in the environment.

---

### 2. Duplicate Processing & Idempotency ⚠️ HIGH RISK

**Current Implementation:**
```typescript
// /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-hybrid-report.ts
const { content, usage } = await callClaude({
  model: MODELS.OPUS,
  system: AN0_M_PROMPT,
  userMessage: userMessageWithContext,
  maxTokens: HYBRID_MAX_TOKENS,
  // ❌ NO idempotency_key parameter
});
```

**Vulnerability:**
During deployment overlap (300-600 seconds), if Inngest retries a failed step:
1. Old instance begins LLM call (AN3-M: $5-15 cost)
2. Old instance receives SIGTERM mid-call
3. Inngest detects failure, retries on new instance
4. New instance re-executes ENTIRE step from scratch
5. **Result:** $10-30 wasted on duplicate LLM calls

**Attack Scenarios:**

**Scenario A: Cost Amplification Attack**
- Attacker triggers deployment during report generation
- Each deployment interrupts in-flight LLM calls
- 10 deployments during single report = $50-150 in duplicate charges
- No rate limiting on deployment triggers

**Scenario B: Accidental Token Exhaustion**
- Developer pushes 5 times during business hours
- 20 reports in progress across customer accounts
- Each report wastes $10-20 on duplicates
- Team usage limits exhausted within 1 hour

**Current Mitigation (Partial):**
```typescript
// Token budget prevents TOTAL runaway, but not DUPLICATE costs
if (cumulativeTokens > TOKEN_BUDGET_LIMIT) {
  throw new Error(`Token budget exceeded: ${cumulativeTokens}/${TOKEN_BUDGET_LIMIT}`);
}
```

**Evidence from Plan:**
> "Inngest cannot checkpoint mid-LLM call - entire call must complete or restart"
> "Each interrupted LLM call wastes $5-15 in API costs"

**Recommended Fix:**
```typescript
// Add to each step.run() call
const { content, usage } = await callClaude({
  model: MODELS.OPUS,
  system: AN0_M_PROMPT,
  userMessage: userMessageWithContext,
  maxTokens: HYBRID_MAX_TOKENS,
  // ✅ Idempotency key prevents duplicate charges
  metadata: {
    idempotency_key: `${reportId}-an3m-${Date.now()}`
  }
});
```

**Verdict:** ⚠️ **HIGH RISK** - Implement idempotency keys BEFORE enabling overlap periods.

---

### 3. Database Consistency & Race Conditions ⚠️ MEDIUM RISK

**Current Implementation:**
```typescript
// /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-hybrid-report.ts
async function updateProgress(updates: Record<string, unknown>) {
  const { error } = await supabase
    .from('sparlo_reports')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId); // ❌ No version check, no locking
}
```

**Vulnerability Scenarios:**

**Scenario A: Status Race Condition**
```
Timeline:
T0: Old instance starts AN3-M (status = 'processing', current_step = 'an3-m')
T1: Old instance receives SIGTERM
T2: New instance starts (loads status = 'processing', current_step = 'an3-m')
T3: Old instance completes AN3-M write (status = 'processing', current_step = 'an4-m')
T4: New instance completes AN3-M write (status = 'processing', current_step = 'an4-m')
Result: Both instances proceed to AN4-M → DUPLICATE EXECUTION
```

**Scenario B: Token Usage Double-Counting**
```typescript
// Both instances may increment usage for the same step
await supabase.rpc('increment_usage', {
  p_account_id: event.data.accountId,
  p_tokens: totalUsage.totalTokens, // ❌ No idempotency key
});
```

**Current Mitigation (Found):**
```sql
-- /Users/alijangbar/Desktop/sparlo-v2/apps/web/supabase/migrations/20260103000003_dd_mode_increment_usage_idempotent.sql
CREATE OR REPLACE FUNCTION public.increment_usage_idempotent(
  p_idempotency_key text, -- ✅ Supports idempotency
  ...
)
```

**Problem:** Hybrid report function NOT using idempotent version:
```typescript
// ❌ Current code uses non-idempotent function
await supabase.rpc('increment_usage', { ... });

// ✅ Should use:
await supabase.rpc('increment_usage_idempotent', {
  p_idempotency_key: `${reportId}-completion`,
  ...
});
```

**Evidence from TODO-034:**
> "Database updates happen without transaction boundaries, risking partial state corruption."

**Recommended Fixes:**

**Fix 1: Optimistic Locking (Immediate)**
```typescript
async function updateProgress(updates: Record<string, unknown>) {
  const { data, error } = await supabase
    .from('sparlo_reports')
    .update({
      ...updates,
      version: supabase.raw('version + 1'), // Increment version
      updated_at: new Date().toISOString(),
    })
    .eq('id', reportId)
    .eq('version', currentVersion) // ✅ Only update if version matches
    .select()
    .single();

  if (error || !data) {
    throw new Error('Concurrent modification detected - another instance updated this report');
  }
}
```

**Fix 2: Use Idempotent Usage Tracking (Immediate)**
```typescript
await supabase.rpc('increment_usage_idempotent', {
  p_account_id: event.data.accountId,
  p_tokens: totalUsage.totalTokens,
  p_idempotency_key: `${reportId}-${stepName}`, // ✅ Prevents double-counting
  p_report_id: reportId,
});
```

**Verdict:** ⚠️ **MEDIUM RISK** - Add version locking and use idempotent RPCs immediately.

---

### 4. Authorization & Access Control ✅ SECURE

**RLS Policy Analysis:**
```sql
-- /Users/alijangbar/Desktop/sparlo-v2/apps/web/supabase/migrations/20251212000000_triz_reports.sql
create policy "Users can update their own reports"
  on public.triz_reports
  for update
  using (account_id = auth.uid()); -- ✅ Prevents cross-account access
```

**Inngest Function Authorization:**
```typescript
// /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-hybrid-report.ts
const { data: report, error: authError } = await supabase
  .from('sparlo_reports')
  .select('id, account_id')
  .eq('id', reportId)
  .single();

if (report.account_id !== event.data.accountId) {
  return { success: false, error: 'Not authorized' }; // ✅ Explicit check
}
```

**Impact of Dual Instances:**
- Both instances use `getSupabaseServerAdminClient()` (bypasses RLS)
- BUT: Explicit `account_id` validation happens BEFORE data access
- RLS policies still prevent unauthorized access via API routes

**Verdict:** ✅ **NO NEW VULNERABILITIES** - Authorization properly enforced at function level.

---

### 5. Attack Surface Analysis ⚠️ MEDIUM RISK

**Normal Operation:**
```
1 Instance Running
├─ /api/inngest endpoint exposed
├─ Signature verification enforced
└─ Rate limiting: 1 request/instance/time
```

**During Overlap (300-600 seconds):**
```
2 Instances Running Simultaneously
├─ /api/inngest on OLD instance (still accepting requests)
├─ /api/inngest on NEW instance (accepting requests)
├─ Inngest Cloud distributes load between both
└─ Rate limiting: 2 requests/instance/time (DOUBLED capacity)
```

**Attack Scenarios:**

**Scenario A: Resource Exhaustion via Deployment Timing**
- Attacker observes deployment patterns (Railway webhooks public?)
- Triggers 100 report generation requests during overlap window
- Both instances process requests → 2x resource consumption
- Database connections exhausted, service degraded

**Scenario B: Signature Key Rotation Attack**
- If `INNGEST_SIGNING_KEY` changed between deployments
- Old instance validates with OLD key (valid requests)
- New instance validates with NEW key (rejects old signatures)
- Inconsistent behavior creates confusion, potential for bypasses

**Current Mitigations:**
- ✅ Rate limiting via `distributed_rate_limits` table
- ✅ Token budget limits prevent runaway costs
- ❌ No per-account deployment frequency limits

**Recommended Hardening:**
```typescript
// Add deployment frequency check
const recentDeployments = await getDeploymentCount(accountId, '5m');
if (recentDeployments > 3) {
  throw new Error('Too many deployments in short period');
}
```

**Verdict:** ⚠️ **MEDIUM RISK** - Add deployment frequency monitoring and alerts.

---

### 6. Data Integrity During Graceful Shutdown ⚠️ MEDIUM RISK

**Proposed Shutdown Handler:**
```typescript
// From plan: apps/web/instrumentation.ts
process.on('SIGTERM', async () => {
  const startTime = Date.now();
  while (activeExecutions > 0 && Date.now() - startTime < MAX_SHUTDOWN_WAIT_MS) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  process.exit(0); // ❌ Force exit regardless of completion
});
```

**Vulnerability:**
If `MAX_SHUTDOWN_WAIT_MS` (180s) exceeded:
1. Old instance force-exits with in-flight LLM calls
2. Database updates partially written
3. Inngest retries on new instance
4. **Result:** Partial state + duplicate processing

**Recommended Improvements:**

**Fix 1: Graceful Degradation**
```typescript
process.on('SIGTERM', async () => {
  console.log('[Shutdown] Marking instance as draining...');

  // Stop accepting NEW work immediately
  isDraining = true;

  // Wait for EXISTING work to complete
  const startTime = Date.now();
  while (activeExecutions > 0 && Date.now() - startTime < MAX_SHUTDOWN_WAIT_MS) {
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  if (activeExecutions > 0) {
    // ✅ Log which reports were interrupted for monitoring
    console.error(`[Shutdown] FORCED EXIT with ${activeExecutions} active executions`);
    await logInterruptedReports(activeExecutionIds);
  }

  process.exit(0);
});
```

**Fix 2: Checkpointing Critical State**
```typescript
// Before each expensive LLM call
await supabase
  .from('sparlo_reports')
  .update({
    checkpoint: {
      step: 'an3-m',
      timestamp: Date.now(),
      partialResults: safeToResumeFrom
    }
  })
  .eq('id', reportId);
```

**Verdict:** ⚠️ **MEDIUM RISK** - Add interruption logging and consider checkpointing for expensive steps.

---

## Risk Matrix

| Risk Category | Likelihood | Impact | Severity | Mitigated? |
|---------------|-----------|--------|----------|------------|
| Duplicate LLM Calls | HIGH | HIGH | **CRITICAL** | ❌ No |
| Race Conditions | MEDIUM | MEDIUM | **HIGH** | ⚠️ Partial |
| Token Double-Counting | MEDIUM | MEDIUM | **HIGH** | ⚠️ Function exists, not used |
| Attack Surface Expansion | LOW | MEDIUM | **MEDIUM** | ⚠️ Rate limits only |
| Forced Shutdown Data Loss | MEDIUM | MEDIUM | **MEDIUM** | ❌ No |
| Signing Key Issues | LOW | LOW | **LOW** | ✅ Yes |
| Authorization Bypass | LOW | HIGH | **MEDIUM** | ✅ Yes |

---

## Recommended Security Enhancements

### Phase 1: Immediate (Before Enabling Overlap)

**Priority 1: Prevent Duplicate LLM Charges**
```typescript
// File: /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/llm/client.ts
export async function callClaude({
  idempotencyKey, // ✅ Add this parameter
  ...
}: ClaudeCallOptions) {
  // Check cache for this idempotency key
  const cached = await getCachedResponse(idempotencyKey);
  if (cached) return cached;

  const response = await anthropic.messages.create({
    ...params,
    metadata: { idempotency_key: idempotencyKey }
  });

  await cacheResponse(idempotencyKey, response);
  return response;
}
```

**Priority 2: Use Idempotent Usage Tracking**
```typescript
// File: /Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-hybrid-report.ts
// Line 766: Replace increment_usage with increment_usage_idempotent
const { error: usageError } = await supabase.rpc('increment_usage_idempotent', {
  p_account_id: event.data.accountId,
  p_tokens: totalUsage.totalTokens,
  p_idempotency_key: `${reportId}-completion-${Date.now()}`, // ✅ Unique per attempt
  p_report_id: reportId,
  p_is_report: true,
  p_is_chat: false,
});
```

**Priority 3: Add Optimistic Locking**
```sql
-- Migration: Add version column to sparlo_reports
ALTER TABLE public.sparlo_reports
ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- Add index for version checks
CREATE INDEX idx_sparlo_reports_version ON sparlo_reports(id, version);
```

### Phase 2: Short-Term (Within Sprint)

**1. Deployment Monitoring**
```typescript
// Add to monitoring/alerting
const DEPLOYMENT_FREQUENCY_LIMIT = 5; // per 10 minutes
const CONCURRENT_REPORTS_THRESHOLD = 20;

async function checkDeploymentSafety() {
  const activeReports = await countActiveReports();
  if (activeReports > CONCURRENT_REPORTS_THRESHOLD) {
    throw new Error('Too many active reports - delay deployment');
  }
}
```

**2. Interruption Tracking**
```sql
CREATE TABLE public.deployment_interruptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id uuid REFERENCES public.sparlo_reports(id),
  interrupted_at timestamptz NOT NULL DEFAULT now(),
  current_step text,
  tokens_wasted integer,
  deployment_id text
);
```

**3. Enhanced Shutdown Logging**
```typescript
async function logInterruptedReports(activeExecutionIds: string[]) {
  await supabase.from('deployment_interruptions').insert(
    activeExecutionIds.map(id => ({
      report_id: id,
      deployment_id: process.env.RAILWAY_DEPLOYMENT_ID,
      current_step: getCurrentStep(id)
    }))
  );
}
```

### Phase 3: Long-Term (Production Hardening)

**1. Separate Worker Service** (From Plan)
- Isolate Inngest functions from web deployments
- Independent security policies for worker vs web
- Dedicated signing keys per service
- Enhanced monitoring and alerting

**2. Circuit Breaker for Deployments**
```typescript
const COST_THRESHOLD_PER_HOUR = 100; // USD
const deploymentCircuitBreaker = new CircuitBreaker({
  threshold: COST_THRESHOLD_PER_HOUR,
  checkInterval: '1h',
  action: async () => {
    await notifyTeam('Deployment circuit breaker triggered');
    await pauseDeployments();
  }
});
```

**3. Blue-Green Deployment Strategy**
- Fully test new instance before switching traffic
- Zero overlap period (instant cutover)
- Rollback capability within 30 seconds

---

## Security Testing Checklist

Before enabling `RAILWAY_DEPLOYMENT_OVERLAP_SECONDS`:

- [ ] **Idempotency**: Verify LLM calls don't duplicate on retry
- [ ] **Concurrency**: Test 2 instances updating same report simultaneously
- [ ] **Token Tracking**: Confirm usage counted only once per step
- [ ] **Authorization**: Verify RLS policies enforce account isolation
- [ ] **Signature Validation**: Test unsigned request rejection
- [ ] **Graceful Shutdown**: Confirm in-flight requests complete or cleanly fail
- [ ] **Monitoring**: Set up alerts for interrupted reports
- [ ] **Cost Tracking**: Monitor token usage during overlap periods
- [ ] **Rate Limiting**: Verify limits apply across both instances
- [ ] **Rollback**: Test emergency shutdown of overlapping instance

**Test Script:**
```bash
# 1. Start report generation
curl -X POST https://your-app/api/reports/generate

# 2. Trigger deployment mid-report
railway up --detach

# 3. Verify:
# - Report completes successfully
# - Token usage counted only once
# - No duplicate LLM calls in logs
# - Database state is consistent
# - Graceful shutdown logged
```

---

## Conclusion

The zero-downtime deployment plan is **VIABLE WITH MODIFICATIONS**. The core security mechanisms (RLS, signature verification) remain sound, but the operational complexity introduces **race conditions and duplicate processing risks** that must be addressed.

**Go/No-Go Decision:**

✅ **GO** if:
1. Idempotency keys implemented for all LLM calls
2. Optimistic locking added to database updates
3. Interruption monitoring and alerting deployed
4. Testing checklist completed with 100% pass rate

❌ **NO-GO** if:
- Deploying without idempotency protections
- Unable to monitor/alert on interrupted reports
- Cost controls not in place

**Recommended Path:** Implement Phase 1 immediately (1-2 days), enable overlap with conservative settings (60s overlap, 120s drain), monitor for 1 week, then extend to full 300s/600s configuration.

---

## Appendix: File References

**Security-Critical Files:**
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/app/api/inngest/route.ts` - Signature verification
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/client.ts` - Client configuration
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/lib/inngest/functions/generate-hybrid-report.ts` - Main function logic
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/supabase/migrations/20251212000000_triz_reports.sql` - RLS policies
- `/Users/alijangbar/Desktop/sparlo-v2/apps/web/supabase/migrations/20260103000003_dd_mode_increment_usage_idempotent.sql` - Idempotent usage tracking

**Plan Documents:**
- `/Users/alijangbar/Desktop/sparlo-v2/plans/inngest-deployment-resilience.md`
- `/Users/alijangbar/Desktop/sparlo-v2/todos/026-ready-p0-inngest-signature-verification.md`
- `/Users/alijangbar/Desktop/sparlo-v2/todos/034-ready-p1-transaction-boundaries-inngest.md`

---

**Audit Completed:** 2026-01-06
**Next Review:** After Phase 1 implementation (or before production deployment)
