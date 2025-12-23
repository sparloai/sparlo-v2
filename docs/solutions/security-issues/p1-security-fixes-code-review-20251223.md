---
module: Sparlo Web
date: 2025-12-23
problem_type: security_issue
component: authentication
symptoms:
  - "Share token enumeration vulnerability - invalid tokens could be probed"
  - "First report race condition - concurrent requests could claim multiple free reports"
  - "Silent checkout failures - users not informed when payment fails"
  - "Unsafe property access - potential runtime crashes from missing nested properties"
root_cause: missing_validation
resolution_type: code_fix
severity: critical
tags: [security, race-condition, validation, P1, code-review]
---

# P1 Security & Stability Fixes from Code Review

## Problem

Multi-agent code review identified 4 critical (P1) issues across the codebase that could lead to security vulnerabilities, data integrity issues, and poor user experience.

## Environment

- Module: Sparlo Web Application
- Framework: Next.js 16 with Supabase
- Date: 2025-12-23
- Review Method: 8 parallel specialized agents (Security, Architecture, Performance, Data Integrity, Pattern Recognition, Code Simplicity, Agent-Native, TypeScript)

## Symptoms

1. **Share Token Enumeration**: Invalid share tokens could be probed without rate limiting or validation
2. **First Report Race Condition**: Two concurrent requests could both pass the "is first report available" check
3. **Silent Checkout Failure**: Errors in checkout flow swallowed silently, leaving users confused
4. **Unsafe Property Access**: Nested property access without optional chaining causing potential crashes

## What Didn't Work

**Direct solution:** All issues were identified through systematic code review and fixed on first attempt.

## Solution

### 1. Share Token Enumeration (P1-096)

**File:** `apps/web/app/share/[token]/_lib/server/shared-report.loader.ts`

```typescript
// Before (vulnerable):
export const loadSharedReport = cache(async (token: string) => {
  const { data, error } = await adminClient
    .from('report_shares')
    .select('...')
    .eq('share_token', token)
    .single();
  // No validation, timing attacks possible
});

// After (secure):
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function maskToken(token: string): string {
  return token.length > 8 ? `${token.slice(0, 8)}...` : token;
}

export const loadSharedReport = cache(async (token: string) => {
  // Validate format before DB query
  if (!UUID_REGEX.test(token)) {
    console.warn(`[Share Loader] Invalid token format: ${maskToken(token)}`);
    return null; // Uniform response prevents timing attacks
  }
  // ... rest of implementation
});
```

**Migration Added:** `20251223114425_add_report_shares_expiry.sql`
```sql
ALTER TABLE public.report_shares
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ
    DEFAULT (NOW() + INTERVAL '30 days');
```

### 2. First Report Race Condition (P1-097)

**File:** `apps/web/app/home/(user)/_lib/server/usage.service.ts`

```typescript
// Before (race condition):
async function checkAndClaimFirstReport(accountId: string) {
  const hasUsed = await checkFirstReportUsed(accountId);
  if (!hasUsed) {
    await markFirstReportUsed(accountId); // RACE: two requests can pass check
  }
}

// After (atomic):
export type ClaimResult = 'CLAIMED' | 'ALREADY_USED' | 'UNAUTHORIZED';

export async function tryClaimFirstReport(accountId: string): Promise<ClaimResult> {
  const client = getSupabaseServerClient();
  const { data, error } = await client.rpc('try_claim_first_report', {
    p_account_id: accountId,
  });
  if (error) throw new Error(`Failed to claim: ${error.message}`);
  if (data === 'UNAUTHORIZED') throw new Error('Unauthorized');
  return data as ClaimResult;
}
```

**Migration Added:** `20251223114500_add_atomic_first_report_claim.sql`
```sql
CREATE OR REPLACE FUNCTION public.try_claim_first_report(p_account_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
BEGIN
  -- Authorization check
  IF p_account_id != auth.uid() AND NOT public.has_role_on_account(p_account_id) THEN
    RETURN 'UNAUTHORIZED';
  END IF;

  -- Atomic update with implicit row lock
  UPDATE public.accounts
  SET first_report_used_at = NOW()
  WHERE id = p_account_id AND first_report_used_at IS NULL;

  IF FOUND THEN RETURN 'CLAIMED';
  ELSE RETURN 'ALREADY_USED';
  END IF;
END;
$$;
```

### 3. Silent Checkout Failure (P1-094)

**File:** `apps/web/app/home/(user)/billing/_components/pricing-table.tsx`

```typescript
// Before (silent failure):
} catch (error) {
  console.error('[Checkout] Error:', error);
  // User sees nothing
}

// After (user feedback):
const [checkoutError, setCheckoutError] = useState<string | null>(null);

} catch (error) {
  setSelectedPlan(null);
  setCheckoutError('Failed to start checkout. Please try again or contact support.');
  console.error('[Checkout] Error:', error);
}

// In render:
{checkoutError && (
  <Alert variant="destructive" className="mb-6">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>{checkoutError}</AlertDescription>
  </Alert>
)}
```

### 4. Unsafe Property Access (P1-095)

**File:** `apps/web/app/home/(user)/reports/[id]/_components/hybrid-report-display.tsx`

```typescript
// Before (crashes on missing data):
{portfolio.recommended_innovation.breakthrough_potential.if_it_works && (...)}

// After (safe access):
{portfolio.recommended_innovation?.breakthrough_potential?.if_it_works && (...)}
```

## Why This Works

1. **Token Validation**: UUID regex validation fails fast before database query, preventing timing-based enumeration. Masked logging prevents token leakage.

2. **Atomic Claim**: PostgreSQL's UPDATE with WHERE clause is atomic. If `first_report_used_at IS NULL` passes, the row is locked and updated atomically. Concurrent requests get `ALREADY_USED`.

3. **Error Feedback**: React state captures errors and displays them to users, following UX best practices for payment flows.

4. **Optional Chaining**: TypeScript's `?.` operator short-circuits on null/undefined, preventing runtime crashes from missing nested properties.

## Prevention

- **Security Reviews**: Run multi-agent code reviews before merging significant changes
- **Race Condition Pattern**: Always use atomic database operations for claim/reserve patterns
- **User Feedback**: Never swallow errors in user-facing flows, especially payments
- **Defensive Coding**: Use optional chaining for any nested property access from external data
- **Token Security**: Validate format before database queries, use uniform response timing

## Related Issues

- See also: [usage-tracking-security-hardening.md](../security/usage-tracking-security-hardening.md) - TOCTOU and authorization patterns
- See also: [usage-based-billing-freemium.md](../features/usage-based-billing-freemium.md) - First report freemium model
- See also: [schema-antifragility-llm-output-20251223.md](../architecture/schema-antifragility-llm-output-20251223.md) - Schema validation fixes
- See also: [type-extraction-large-components-20251223.md](../best-practices/type-extraction-large-components-20251223.md) - Component refactoring
