# Enterprise Security Audit - Pre-Launch Master Plan

**Type:** Security
**Priority:** Critical
**Status:** Planning
**Date:** 2025-12-22

## Overview

Comprehensive security audit before production launch covering all aspects of the Sparlo codebase. This plan establishes enterprise-level security across secrets management, authentication, authorization, API security, database security, third-party integrations, local development practices, and monitoring.

**Tech Stack:**
- Next.js 16 with App Router
- Supabase (database, auth, storage)
- Stripe (payments)
- Inngest (background jobs)
- Railway (deployment)
- GitHub (source control)

---

## Critical Issues - Fix Immediately

### 1. Environment Files Committed to Git

**Location:** `.gitignore:30` - only ignores `.env*.local`

**Files at Risk:**
- `apps/web/.env`
- `apps/web/.env.development`
- `apps/web/.env.production`
- `apps/web/.env.test`
- `apps/e2e/.env`

**Remediation Steps:**

```bash
# Step 1: Backup current secrets (securely, NOT in repo)
# Step 2: Update .gitignore
echo "# Environment files - ALL should be excluded
.env
.env.*
!.env.example" >> .gitignore

# Step 3: Remove from Git tracking (keeps local files)
git rm --cached apps/web/.env apps/web/.env.* apps/e2e/.env

# Step 4: Clean Git history (optional but recommended)
# Using BFG Repo-Cleaner:
bfg --delete-files .env --delete-files '.env.*'
git reflog expire --expire=now --all && git gc --prune=now --aggressive

# Step 5: Force push cleaned history
git push origin --force --all

# Step 6: CRITICAL - Rotate ALL secrets that were ever committed
```

**Secrets to Rotate:**
- [ ] Supabase service role key
- [ ] Supabase anon key
- [ ] Stripe secret key
- [ ] Stripe webhook secret
- [ ] Inngest event key
- [ ] Inngest signing key
- [ ] Anthropic API key
- [ ] Database connection strings
- [ ] Any other API keys

---

### 2. Missing Share Token Revocation Check

**Location:** `apps/web/app/share/[token]/_lib/server/shared-report.loader.ts:36`

**Current Code:**
```typescript
const { data, error } = await adminClient
  .from('report_shares')
  .select(`report_id, sparlo_reports!inner(...)`)
  .eq('share_token', token)
  .single();
```

**Fixed Code:**
```typescript
const { data, error } = await adminClient
  .from('report_shares')
  .select(`report_id, sparlo_reports!inner(...)`)
  .eq('share_token', token)
  .is('revoked_at', null)  // ADD THIS
  .gte('expires_at', new Date().toISOString())  // Also check expiration
  .single();
```

---

### 3. Webhook Signature Timing Attack Vulnerability

**Location:** `packages/database-webhooks/src/server/services/verifier/postgres-database-webhook-verifier.service.ts:18-21`

**Current Code (Vulnerable):**
```typescript
verifySignatureOrThrow(header: string) {
  if (header !== webhooksSecret) {
    throw new Error('Invalid signature');
  }
}
```

**Fixed Code:**
```typescript
import { timingSafeEqual } from 'crypto';

verifySignatureOrThrow(header: string) {
  const headerBuffer = Buffer.from(header);
  const secretBuffer = Buffer.from(webhooksSecret);

  if (headerBuffer.length !== secretBuffer.length ||
      !timingSafeEqual(headerBuffer, secretBuffer)) {
    throw new Error('Invalid signature');
  }

  return Promise.resolve(true);
}
```

---

## Phase 1: Secrets Management (Week 1)

### 1.1 Railway Sealed Variables Setup

**Required Environment Variables (Production):**

```bash
# Mark these as SEALED in Railway Dashboard:
SUPABASE_SERVICE_ROLE_KEY=<sealed>
STRIPE_SECRET_KEY=<sealed>
STRIPE_WEBHOOK_SECRET=<sealed>
INNGEST_SIGNING_KEY=<sealed>
INNGEST_EVENT_KEY=<sealed>
ANTHROPIC_API_KEY=<sealed>
DATABASE_URL=<sealed>

# Public variables (not sealed):
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_...
NODE_ENV=production
```

**Files to Create:**

### `.env.example`
```bash
# apps/web/.env.example
# Copy this to .env and fill in values

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Inngest
INNGEST_EVENT_KEY=your-event-key
INNGEST_SIGNING_KEY=your-signing-key

# Anthropic
ANTHROPIC_API_KEY=your-api-key
```

### 1.2 Secret Rotation Schedule

| Secret Type | Rotation Frequency | Procedure |
|-------------|-------------------|-----------|
| Supabase Service Key | Quarterly | Dashboard → Project Settings → API |
| Stripe Secret Key | Annually or on suspicion | Stripe Dashboard → API Keys → Roll Key |
| Webhook Signing Secrets | Annually | Regenerate in respective dashboards |
| Database Password | Quarterly | Supabase Dashboard → Database → Reset Password |
| JWT Signing Key | Annually | Supabase Dashboard → Auth → JWT |
| Anthropic API Key | Annually | Anthropic Console → API Keys |

### 1.3 Local Development Security

**Files to Create:**

### `.pre-commit-config.yaml`
```yaml
repos:
  - repo: https://github.com/Yelp/detect-secrets
    rev: v1.4.0
    hooks:
      - id: detect-secrets
        args: ['--baseline', '.secrets.baseline']
        exclude: package-lock.json|pnpm-lock.yaml

  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.5.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-added-large-files
        args: ['--maxkb=1000']
      - id: check-merge-conflict
      - id: detect-private-key

  - repo: local
    hooks:
      - id: no-env-files
        name: Prevent .env commits
        entry: bash -c 'git diff --cached --name-only | grep -E "\.env($|\.)(?!example)" && exit 1 || exit 0'
        language: system
        pass_filenames: false
```

**Setup Commands:**
```bash
# Install pre-commit
pip install pre-commit

# Install hooks
pre-commit install

# Create baseline for existing secrets (false positives)
detect-secrets scan > .secrets.baseline

# Install git-secrets
brew install git-secrets
git secrets --install
git secrets --register-aws

# Add custom patterns
git secrets --add 'SUPABASE_SERVICE_ROLE_KEY'
git secrets --add 'sk_live_[a-zA-Z0-9]{24,}'
git secrets --add 'whsec_[a-zA-Z0-9]{24,}'
```

---

## Phase 2: Authentication & Authorization (Week 1-2)

### 2.1 Supabase RLS Audit

**Automated RLS Coverage Test:**

```typescript
// tests/security/rls-coverage.test.ts
import { createClient } from '@supabase/supabase-js';

const adminClient = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

describe('RLS Coverage', () => {
  it('all tables have RLS enabled', async () => {
    const { data: tables } = await adminClient.rpc('get_tables_without_rls');

    expect(tables).toEqual([]);
  });

  it('prevents cross-organization access', async () => {
    // Create two test orgs
    const orgA = await createTestOrg('Org A');
    const orgB = await createTestOrg('Org B');

    // Create user in Org A
    const userA = await createTestUser(orgA.id);

    // Attempt to access Org B data
    const clientA = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_ANON_KEY!,
      { global: { headers: { Authorization: `Bearer ${userA.token}` } } }
    );

    const { data } = await clientA
      .from('sparlo_reports')
      .select('*')
      .eq('account_id', orgB.id);

    expect(data).toEqual([]);
  });
});
```

**SQL Function to Check RLS:**
```sql
-- Create helper function to find tables without RLS
CREATE OR REPLACE FUNCTION get_tables_without_rls()
RETURNS TABLE(table_name text) AS $$
BEGIN
  RETURN QUERY
  SELECT c.relname::text
  FROM pg_class c
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE c.relkind = 'r'
    AND n.nspname = 'public'
    AND NOT c.relrowsecurity
    AND c.relname NOT IN ('schema_migrations', 'spatial_ref_sys');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 2.2 Admin Client Usage Audit

**Files Using Admin Client (Require Review):**

| File | Purpose | Risk Level | Action |
|------|---------|------------|--------|
| `app/api/billing/webhook/route.ts:24` | Stripe webhooks | ✅ Acceptable | Webhooks bypass RLS |
| `app/join/accept/route.ts:40` | Invitation acceptance | ⚠️ Review | Add authorization comment |
| `app/join/page.tsx` | Join page | ⚠️ Review | Add authorization comment |
| `app/share/[token]/_lib/server/shared-report.loader.ts:19` | Shared reports | ⚠️ Fix Required | Add revoked_at check |

**Admin Client Usage Policy:**
```typescript
// ACCEPTABLE uses of getSupabaseServerAdminClient():
// 1. Webhook handlers (no user session available)
// 2. System-level operations (user deletion, data migration)
// 3. Background jobs with explicit authorization checks
// 4. Pre-authentication flows (invitation acceptance)

// NEVER use admin client for:
// 1. Regular user data access (use RLS)
// 2. Avoiding RLS "for convenience"
// 3. Cross-organization queries without explicit checks
```

### 2.3 Session Security Configuration

**Supabase Auth Settings:**
```typescript
// Recommended auth configuration
const authConfig = {
  // Session settings
  session: {
    expiresIn: 3600, // 1 hour access token
    refreshThreshold: 300, // Refresh 5 min before expiry
  },

  // Password requirements
  password: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
  },

  // Rate limiting (Supabase default)
  rateLimiting: {
    signIn: { limit: 5, period: 900 }, // 5 attempts per 15 min
    signUp: { limit: 3, period: 3600 }, // 3 signups per hour
    passwordReset: { limit: 3, period: 3600 },
  },
};
```

---

## Phase 3: API Security (Week 2)

### 3.1 Security Headers

**File:** `apps/web/next.config.js`

```javascript
const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on'
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload'
  },
  {
    key: 'X-Frame-Options',
    value: 'DENY'
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff'
  },
  {
    key: 'X-XSS-Protection',
    value: '1; mode=block'
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin'
  },
  {
    key: 'Permissions-Policy',
    value: 'geolocation=(), microphone=(), camera=(), payment=(self "https://js.stripe.com")'
  }
];

module.exports = {
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

### 3.2 Content Security Policy

**File:** `apps/web/middleware.ts` (add to existing)

```typescript
// Add CSP header generation
function generateCSP(nonce: string, isDev: boolean): string {
  const csp = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      `'nonce-${nonce}'`,
      "'strict-dynamic'",
      isDev ? "'unsafe-eval'" : '',
      'https://js.stripe.com',
    ].filter(Boolean),
    'style-src': [
      "'self'",
      isDev ? "'unsafe-inline'" : `'nonce-${nonce}'`,
    ],
    'img-src': ["'self'", 'blob:', 'data:', 'https://*.supabase.co'],
    'font-src': ["'self'"],
    'connect-src': [
      "'self'",
      'https://api.stripe.com',
      'https://*.supabase.co',
      'https://api.inngest.com',
      'https://api.anthropic.com',
      isDev ? 'ws://localhost:*' : '',
    ].filter(Boolean),
    'frame-src': ['https://js.stripe.com', 'https://hooks.stripe.com'],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': [],
  };

  return Object.entries(csp)
    .map(([key, values]) => `${key} ${values.join(' ')}`)
    .join('; ');
}
```

### 3.3 Rate Limiting Enhancement

**Current Implementation:** `apps/web/supabase/migrations/20251218000000_distributed_rate_limits.sql`

**Enhancement - Tiered Rate Limits:**

```sql
-- Add tiered rate limits based on user tier
CREATE OR REPLACE FUNCTION check_rate_limit_tiered(
  p_user_id UUID,
  p_endpoint TEXT,
  p_tier TEXT DEFAULT 'free'
)
RETURNS TABLE(allowed BOOLEAN, remaining INTEGER, retry_after INTEGER) AS $$
DECLARE
  v_hourly_limit INTEGER;
  v_daily_limit INTEGER;
BEGIN
  -- Set limits based on tier
  CASE p_tier
    WHEN 'enterprise' THEN
      v_hourly_limit := 1000;
      v_daily_limit := 10000;
    WHEN 'pro' THEN
      v_hourly_limit := 100;
      v_daily_limit := 1000;
    ELSE -- 'free'
      v_hourly_limit := 30;
      v_daily_limit := 150;
  END CASE;

  RETURN QUERY
  SELECT * FROM check_rate_limit(p_user_id, p_endpoint, v_hourly_limit, v_daily_limit);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
```

### 3.4 Input Validation Patterns

**Existing Pattern (Good):**
```typescript
// apps/web/app/api/sparlo/chat/route.ts:12-20
const ChatRequestSchema = z.object({
  reportId: z.string().uuid(),
  message: z.string().min(1).max(4000),
});
```

**Add File Upload Validation:**

```typescript
// lib/validations/file-upload.ts
import { z } from 'zod';

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
] as const;

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const FileUploadSchema = z.object({
  file: z.object({
    name: z.string().max(255),
    size: z.number().max(MAX_FILE_SIZE),
    type: z.enum(ALLOWED_MIME_TYPES),
  }),
});

// Validate magic bytes for file type verification
export async function validateFileMagicBytes(
  file: File
): Promise<boolean> {
  const buffer = await file.slice(0, 8).arrayBuffer();
  const bytes = new Uint8Array(buffer);

  // Check magic bytes for each allowed type
  const signatures: Record<string, number[]> = {
    'image/jpeg': [0xFF, 0xD8, 0xFF],
    'image/png': [0x89, 0x50, 0x4E, 0x47],
    'image/gif': [0x47, 0x49, 0x46],
    'application/pdf': [0x25, 0x50, 0x44, 0x46],
  };

  const signature = signatures[file.type];
  if (!signature) return false;

  return signature.every((byte, i) => bytes[i] === byte);
}
```

---

## Phase 4: Third-Party Integration Security (Week 2)

### 4.1 Stripe Webhook Security

**Current Implementation:** ✅ Correct (`packages/billing/stripe/src/services/stripe-webhook-handler.service.ts:47-69`)

**Additional Hardening:**

```typescript
// Add idempotency check
const processedEvents = new Set<string>();

async function handleWebhook(event: Stripe.Event) {
  // Skip duplicate events
  if (processedEvents.has(event.id)) {
    console.log(`Skipping duplicate event: ${event.id}`);
    return;
  }

  // Check database for processed events (distributed safety)
  const { data } = await supabase
    .from('webhook_events')
    .select('id')
    .eq('event_id', event.id)
    .single();

  if (data) {
    console.log(`Event already processed: ${event.id}`);
    return;
  }

  // Mark as processing
  await supabase
    .from('webhook_events')
    .insert({ event_id: event.id, status: 'processing' });

  try {
    // Process event...
    await processEvent(event);

    // Mark as completed
    await supabase
      .from('webhook_events')
      .update({ status: 'completed' })
      .eq('event_id', event.id);
  } catch (error) {
    await supabase
      .from('webhook_events')
      .update({ status: 'failed', error: error.message })
      .eq('event_id', event.id);
    throw error;
  }
}
```

### 4.2 Inngest Security

**Current Implementation:** ✅ Correct (`apps/web/app/api/inngest/route.ts:31`)

**Additional Encryption for Sensitive Data:**

```typescript
// lib/inngest/middleware/encryption.ts
import { encryptionMiddleware } from "@inngest/middleware-encryption";

export const inngestEncryption = encryptionMiddleware({
  key: process.env.INNGEST_ENCRYPTION_KEY!,
  // Encrypt specific event fields
  eventEncryptionField: "encrypted",
  // Fallback keys for rotation
  fallbackDecryptionKeys: process.env.INNGEST_ENCRYPTION_KEY_PREV
    ? [process.env.INNGEST_ENCRYPTION_KEY_PREV]
    : undefined,
});

// Add to Inngest client
export const inngest = new Inngest({
  id: 'sparlo',
  middleware: [inngestEncryption],
});
```

---

## Phase 5: Monitoring & Audit Logging (Week 3)

### 5.1 Audit Log Schema

**Migration File:**

```sql
-- migrations/20251223000000_create_audit_logs.sql
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who
  user_id UUID REFERENCES auth.users(id),
  user_email TEXT,
  api_key_id TEXT,

  -- Where
  ip_address INET NOT NULL,
  user_agent TEXT,

  -- When
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- What
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  action TEXT NOT NULL,

  -- How
  method TEXT NOT NULL,
  endpoint TEXT NOT NULL,

  -- Details
  changes JSONB,
  metadata JSONB,

  -- Security
  severity TEXT NOT NULL DEFAULT 'low' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  success BOOLEAN NOT NULL DEFAULT TRUE,
  error_message TEXT
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_timestamp ON audit_logs(timestamp DESC);
CREATE INDEX idx_audit_logs_resource ON audit_logs(resource_type, resource_id);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity) WHERE severity IN ('high', 'critical');

-- Enable RLS
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Only admins can read
CREATE POLICY "Admins can read audit logs" ON audit_logs
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM accounts_memberships am
      WHERE am.user_id = auth.uid()
      AND am.account_role = 'owner'
    )
  );

-- System can insert (via service role)
CREATE POLICY "System can insert audit logs" ON audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (TRUE);

-- Immutable - no updates or deletes via API
-- (Only service role can modify)
```

### 5.2 Audit Logging Utility

```typescript
// lib/audit/log.ts
import { getSupabaseServerAdminClient } from '@kit/supabase/server-admin-client';

interface AuditLogEntry {
  userId?: string;
  userEmail?: string;
  ipAddress: string;
  userAgent?: string;
  resourceType: string;
  resourceId: string;
  action: string;
  method: string;
  endpoint: string;
  changes?: { before?: unknown; after?: unknown };
  metadata?: Record<string, unknown>;
  severity?: 'low' | 'medium' | 'high' | 'critical';
  success?: boolean;
  errorMessage?: string;
}

export async function createAuditLog(entry: AuditLogEntry): Promise<void> {
  const supabase = getSupabaseServerAdminClient();

  try {
    await supabase.from('audit_logs').insert({
      user_id: entry.userId,
      user_email: entry.userEmail,
      ip_address: entry.ipAddress,
      user_agent: entry.userAgent,
      resource_type: entry.resourceType,
      resource_id: entry.resourceId,
      action: entry.action,
      method: entry.method,
      endpoint: entry.endpoint,
      changes: entry.changes,
      metadata: entry.metadata,
      severity: entry.severity ?? 'low',
      success: entry.success ?? true,
      error_message: entry.errorMessage,
    });
  } catch (error) {
    // Logging failures should not break the application
    console.error('[AuditLog] Failed to create audit log:', error);
  }
}

// Events to always log
export const AUDIT_EVENTS = {
  // Authentication
  'auth.login.success': { severity: 'low' as const },
  'auth.login.failed': { severity: 'medium' as const },
  'auth.logout': { severity: 'low' as const },
  'auth.password.changed': { severity: 'high' as const },
  'auth.mfa.enabled': { severity: 'high' as const },
  'auth.mfa.disabled': { severity: 'high' as const },

  // Data operations
  'report.created': { severity: 'low' as const },
  'report.deleted': { severity: 'medium' as const },
  'report.shared': { severity: 'medium' as const },
  'report.share.revoked': { severity: 'medium' as const },

  // Admin operations
  'admin.user.deleted': { severity: 'critical' as const },
  'admin.service_key.used': { severity: 'high' as const },
  'admin.config.changed': { severity: 'critical' as const },

  // Billing
  'billing.subscription.created': { severity: 'low' as const },
  'billing.subscription.cancelled': { severity: 'medium' as const },
  'billing.payment.failed': { severity: 'high' as const },
};
```

### 5.3 Anomaly Detection

```typescript
// inngest/functions/security-monitoring.ts
import { inngest } from '../client';

export const detectSecurityAnomalies = inngest.createFunction(
  { id: 'security-anomaly-detection' },
  { cron: '*/10 * * * *' }, // Every 10 minutes
  async ({ step }) => {
    const alerts = await step.run('check-anomalies', async () => {
      const supabase = getSupabaseServerAdminClient();
      const now = new Date();
      const tenMinutesAgo = new Date(now.getTime() - 10 * 60 * 1000);

      const checks = await Promise.all([
        // Multiple failed logins from same IP
        detectFailedLogins(supabase, tenMinutesAgo),
        // Service key usage outside business hours
        detectUnusualServiceKeyUsage(supabase, tenMinutesAgo),
        // Mass data deletion
        detectMassDeletion(supabase, tenMinutesAgo),
        // Cross-organization access attempts
        detectCrossOrgAttempts(supabase, tenMinutesAgo),
      ]);

      return checks.flat().filter(Boolean);
    });

    if (alerts.length > 0) {
      await step.run('send-alerts', async () => {
        await sendSecurityAlerts(alerts);
      });
    }

    return { alertsSent: alerts.length };
  }
);

async function detectFailedLogins(supabase: any, since: Date) {
  const { data } = await supabase
    .from('audit_logs')
    .select('ip_address, count')
    .eq('action', 'auth.login.failed')
    .gte('timestamp', since.toISOString())
    .group('ip_address')
    .having('count', 'gt', 5);

  return data?.map((row: any) => ({
    type: 'multiple_failed_logins',
    severity: 'high',
    details: { ip: row.ip_address, count: row.count },
  })) ?? [];
}
```

---

## Phase 6: GitHub Security (Week 3)

### 6.1 Branch Protection Rules

**Apply to:** `main`, `production` branches

```yaml
# Settings → Branches → Add rule
Protection Rule for 'main':
  - Require pull request reviews: true
    - Required approving reviews: 2
    - Dismiss stale reviews: true
    - Require review from Code Owners: true

  - Require status checks:
    - Strict mode: true
    - Required checks:
      - CI / build
      - CI / typecheck
      - CI / lint
      - CodeQL

  - Require signed commits: true
  - Require linear history: true
  - Include administrators: true
```

### 6.2 Enable Security Features

```yaml
# Settings → Code security and analysis

Secret scanning:
  ✅ Enabled
  ✅ Push protection enabled

Dependabot:
  ✅ Dependabot alerts enabled
  ✅ Dependabot security updates enabled

Code scanning:
  ✅ CodeQL analysis enabled
```

### 6.3 Dependabot Configuration

**File:** `.github/dependabot.yml`

```yaml
version: 2
updates:
  - package-ecosystem: "npm"
    directory: "/"
    schedule:
      interval: "weekly"
      day: "monday"
      time: "09:00"
    open-pull-requests-limit: 10
    reviewers:
      - "security-team"
    labels:
      - "dependencies"
      - "security"
    groups:
      production-dependencies:
        patterns:
          - "*"
        update-types:
          - "security"
```

### 6.4 CodeQL Workflow

**File:** `.github/workflows/codeql.yml`

```yaml
name: "CodeQL"

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 0 * * 1'

jobs:
  analyze:
    name: Analyze
    runs-on: ubuntu-latest
    permissions:
      actions: read
      contents: read
      security-events: write

    strategy:
      matrix:
        language: ['javascript', 'typescript']

    steps:
      - name: Checkout repository
        uses: actions/checkout@v4

      - name: Initialize CodeQL
        uses: github/codeql-action/init@v3
        with:
          languages: ${{ matrix.language }}
          queries: security-and-quality

      - name: Autobuild
        uses: github/codeql-action/autobuild@v3

      - name: Perform CodeQL Analysis
        uses: github/codeql-action/analyze@v3
```

---

## Phase 7: Incident Response (Week 4)

### 7.1 Severity Levels

| Level | Name | Response Time | Examples |
|-------|------|---------------|----------|
| P0 | Critical | 15 minutes | Active breach, data exfiltration, service down |
| P1 | High | 1 hour | Vulnerability discovered, suspicious activity |
| P2 | Medium | 24 hours | Security misconfiguration, failed compliance |
| P3 | Low | 72 hours | Minor security improvement, dependency update |

### 7.2 Incident Response Playbook

**P0 - Active Breach:**
1. **Contain** (15 min)
   - Revoke compromised credentials
   - Block suspicious IPs
   - Disable affected features

2. **Assess** (30 min)
   - Identify scope of breach
   - Determine data affected
   - Document timeline

3. **Remediate** (2-4 hours)
   - Patch vulnerability
   - Rotate all secrets
   - Deploy fixes

4. **Notify** (within 72 hours for GDPR)
   - Notify affected users
   - Report to regulators if required
   - Update status page

5. **Review** (within 1 week)
   - Conduct post-mortem
   - Update security controls
   - Document lessons learned

### 7.3 On-Call Rotation

```yaml
# PagerDuty / Opsgenie configuration
schedules:
  security-oncall:
    rotation: weekly
    members:
      - primary: security-lead
      - secondary: senior-engineer

escalation:
  - level: 1
    timeout: 10min
    notify: [primary]
  - level: 2
    timeout: 15min
    notify: [secondary]
  - level: 3
    timeout: 20min
    notify: [engineering-manager]
```

---

## Acceptance Criteria

### Critical (Must Complete Before Launch)

- [ ] All committed secrets rotated and Git history cleaned
- [ ] Share token revocation check implemented
- [ ] Webhook timing attack vulnerability fixed
- [ ] RLS enabled on all tables with automated tests
- [ ] Security headers configured
- [ ] Rate limiting in production
- [ ] GitHub branch protection enabled
- [ ] Secret scanning enabled
- [ ] Railway sealed variables configured

### Important (Complete Within 30 Days)

- [ ] Pre-commit hooks deployed to all developers
- [ ] Audit logging implemented
- [ ] CSP headers configured
- [ ] Anomaly detection running
- [ ] CodeQL analysis in CI
- [ ] Dependabot enabled with SLAs
- [ ] Incident response playbooks documented

### Recommended (Ongoing)

- [ ] Quarterly secret rotation
- [ ] Annual penetration testing
- [ ] Security awareness training
- [ ] SOC 2 Type II preparation
- [ ] Bug bounty program consideration

---

## Success Metrics

1. **Zero critical vulnerabilities** in production
2. **100% RLS coverage** on all tables
3. **< 15 minute** mean-time-to-detect for security incidents
4. **100% secret rotation** after any potential exposure
5. **Zero secrets** in Git history
6. **All PRs** pass security checks before merge

---

## References

### Internal Files
- RLS policies: `apps/web/supabase/migrations/`
- Rate limiting: `apps/web/supabase/migrations/20251218000000_distributed_rate_limits.sql`
- Inngest route: `apps/web/app/api/inngest/route.ts`
- Stripe webhook: `packages/billing/stripe/src/services/stripe-webhook-handler.service.ts`
- Share loader: `apps/web/app/share/[token]/_lib/server/shared-report.loader.ts`

### External Documentation
- [Supabase RLS](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Next.js Security](https://nextjs.org/docs/app/guides/content-security-policy)
- [Stripe Webhooks](https://docs.stripe.com/webhooks)
- [Inngest Security](https://www.inngest.com/docs/learn/security)
- [Railway Variables](https://docs.railway.com/guides/variables)
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
