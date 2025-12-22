# Security Fixes - Pre-Launch

**Type:** Security
**Priority:** Critical
**Status:** Ready to Implement
**Date:** 2025-12-22
**Estimated Time:** 2 days

## Overview

Simplified security fixes based on reviewer feedback. Cut the enterprise bloat, fix the actual bugs.

---

## Critical Fixes (Day 1)

### 1. Share Token Revocation Check

**File:** `apps/web/app/share/[token]/_lib/server/shared-report.loader.ts`

**Current Issue:** Revoked share tokens still work.

```typescript
// BEFORE (line ~36)
const { data, error } = await adminClient
  .from('report_shares')
  .select(`report_id, sparlo_reports!inner(...)`)
  .eq('share_token', token)
  .single();

// AFTER
const { data, error } = await adminClient
  .from('report_shares')
  .select(`report_id, sparlo_reports!inner(...)`)
  .eq('share_token', token)
  .is('revoked_at', null)
  .gte('expires_at', new Date().toISOString())
  .single();
```

---

### 2. Webhook Signature Timing Attack (Proper Fix)

**File:** `packages/database-webhooks/src/server/services/verifier/postgres-database-webhook-verifier.service.ts`

**Current Issue:** Simple string comparison is vulnerable to timing attacks.

```typescript
// BEFORE (lines 18-24)
verifySignatureOrThrow(header: string) {
  if (header !== webhooksSecret) {
    throw new Error('Invalid signature');
  }
  return Promise.resolve(true);
}

// AFTER - Proper constant-time comparison
import { timingSafeEqual, createHmac } from 'crypto';

verifySignatureOrThrow(payload: string, header: string) {
  // For simple shared secret comparison, pad to equal length
  const headerBuffer = Buffer.from(header);
  const secretBuffer = Buffer.from(webhooksSecret);

  // Pad shorter buffer to prevent length timing leak
  const maxLength = Math.max(headerBuffer.length, secretBuffer.length);
  const paddedHeader = Buffer.concat([headerBuffer, Buffer.alloc(maxLength - headerBuffer.length)]);
  const paddedSecret = Buffer.concat([secretBuffer, Buffer.alloc(maxLength - secretBuffer.length)]);

  // Length must match AND content must match
  const lengthMatch = headerBuffer.length === secretBuffer.length;
  const contentMatch = timingSafeEqual(paddedHeader, paddedSecret);

  if (!lengthMatch || !contentMatch) {
    throw new Error('Invalid signature');
  }

  return Promise.resolve(true);
}
```

---

### 3. Fix .gitignore (Prevent Future Secret Commits)

**File:** `.gitignore`

```gitignore
# Environment files - exclude ALL
.env
.env.*
!.env.example
```

**Then remove tracked files:**
```bash
git rm --cached apps/web/.env apps/web/.env.* apps/e2e/.env 2>/dev/null || true
git commit -m "fix: remove tracked env files from git"
```

---

### 4. Rotate Committed Secrets

**Manual Steps (do once):**

| Service | Action | Dashboard URL |
|---------|--------|---------------|
| Supabase | Regenerate service role key | Project Settings → API |
| Supabase | Regenerate anon key | Project Settings → API |
| Stripe | Roll secret key | Dashboard → Developers → API Keys |
| Stripe | Roll webhook secret | Dashboard → Developers → Webhooks |
| Inngest | Regenerate signing key | Dashboard → Manage → Signing Key |
| Anthropic | Create new API key | Console → API Keys |

**Update Railway sealed variables after rotation.**

---

## Important Fixes (Day 2)

### 5. Verify RLS on All Tables

**Run once in Supabase SQL Editor:**

```sql
-- Find tables WITHOUT RLS enabled
SELECT schemaname, tablename
FROM pg_tables
WHERE schemaname = 'public'
  AND tablename NOT IN ('schema_migrations', 'spatial_ref_sys')
  AND tablename NOT IN (
    SELECT tablename FROM pg_tables t
    JOIN pg_class c ON c.relname = t.tablename
    WHERE c.relrowsecurity = true
  );
```

**If any tables returned, enable RLS:**
```sql
ALTER TABLE "table_name" ENABLE ROW LEVEL SECURITY;
```

---

### 6. Add Basic Security Headers

**File:** `apps/web/next.config.js`

```javascript
const securityHeaders = [
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'payment=(self "https://js.stripe.com")' },
];

module.exports = {
  // ... existing config
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};
```

---

### 7. Enable GitHub Secret Scanning

**Manual Steps:**
1. Go to GitHub repo → Settings → Code security and analysis
2. Enable:
   - ✅ Secret scanning
   - ✅ Push protection

---

### 8. Configure Railway Sealed Variables

**In Railway Dashboard for production service:**

Mark these as **Sealed**:
- `SUPABASE_SERVICE_ROLE_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `INNGEST_SIGNING_KEY`
- `INNGEST_EVENT_KEY`
- `ANTHROPIC_API_KEY`
- `DATABASE_URL`

---

## Acceptance Criteria

- [ ] Share tokens respect `revoked_at` and `expires_at`
- [ ] Webhook signature uses timing-safe comparison
- [ ] `.env*` files not tracked in git
- [ ] All committed secrets rotated
- [ ] All public tables have RLS enabled
- [ ] Security headers present on all responses
- [ ] GitHub secret scanning enabled
- [ ] Railway production secrets are sealed

---

## What We're NOT Doing (Per Reviewer Feedback)

**Cut entirely:**
- ❌ Audit logging infrastructure (no users to audit)
- ❌ Anomaly detection (no traffic to analyze)
- ❌ Incident response playbooks (premature)
- ❌ Pre-commit hooks (GitHub secret scanning handles this)
- ❌ Secret rotation schedules (rotate on compromise, not calendar)
- ❌ CSP nonce implementation (breaks things, marginal benefit)
- ❌ Tiered rate limiting (no tiers yet)
- ❌ File upload validation (feature doesn't exist)

**Defer 30-90 days post-launch:**
- CSP headers (when you're ready for debugging pain)
- Advanced rate limiting (when you see abuse patterns)
- Audit logging (when you have customers who need it)

---

## Implementation Order

```
Day 1 Morning:
1. Fix share token revocation check (15 min)
2. Fix webhook timing attack (30 min)
3. Update .gitignore and remove tracked files (10 min)
4. Run typecheck and test (30 min)

Day 1 Afternoon:
5. Rotate all committed secrets (2 hours)
6. Update Railway sealed variables (30 min)

Day 2 Morning:
7. Verify RLS on all tables (30 min)
8. Add security headers to next.config.js (15 min)
9. Enable GitHub secret scanning (5 min)
10. Final verification and deploy (1 hour)
```

**Total: ~6 hours of actual work**

---

## References

- Share loader: `apps/web/app/share/[token]/_lib/server/shared-report.loader.ts`
- Webhook verifier: `packages/database-webhooks/src/server/services/verifier/postgres-database-webhook-verifier.service.ts`
- Next config: `apps/web/next.config.js`
