---
status: pending
priority: p1
issue_id: "141"
tags: [security, dd-mode, authorization, critical]
dependencies: []
---

# DD Mode v2: Weak Authorization Pattern

## Problem Statement

Authorization check compares `report.account_id` with `event.data.accountId`, but the event data comes from an untrusted source. If the event creation endpoint doesn't validate account ownership, an attacker could generate reports for other users' accounts or cause billing to wrong accounts.

## Findings

**Location:** `/apps/web/lib/inngest/functions/generate-dd-report.ts:132-154`

**Vulnerable code:**
```typescript
const { data: report } = await supabase
  .from('sparlo_reports')
  .select('id, account_id')
  .eq('id', reportId)
  .single();

if (report.account_id !== accountId) {  // Comparing against attacker-supplied value
  return { success: false, error: 'Not authorized' };
}
```

**Attack scenario:**
1. Attacker discovers report creation endpoint
2. Creates event with victim's account ID
3. Report generated under victim's account
4. Victim billed for attacker's usage

**Impact:**
- Unauthorized Report Access
- Cost Attribution Attack
- Data Exposure to wrong accounts

## Proposed Solutions

### Option A: Derive Account ID from Report (Recommended)
- Don't trust event.data.accountId
- Use report's own account_id as source of truth
- Pros: Eliminates attack vector entirely
- Cons: Minor code changes
- Effort: Low (1-2 hours)
- Risk: Low

### Option B: Verify User Ownership at Event Creation
- Validate account ownership before triggering Inngest event
- Add RLS verification at API layer
- Pros: Defense in depth
- Cons: Requires changes to event trigger code
- Effort: Medium (3-4 hours)
- Risk: Low

### Option C: Add Cryptographic Event Signing
- Sign events with server secret
- Verify signature in Inngest function
- Pros: Strongest protection
- Cons: More complex, key management
- Effort: High (6+ hours)
- Risk: Medium

## Recommended Action

[To be filled during triage]

## Acceptance Criteria

- [ ] Account ID derived from report, not event data
- [ ] RLS verification added as secondary check
- [ ] Cannot generate report for another user's account
- [ ] Cannot attribute costs to another account
- [ ] Security tests verify authorization enforcement

## Technical Details

**Affected files:**
- `apps/web/lib/inngest/functions/generate-dd-report.ts`
- Event trigger endpoint (needs verification)

**Recommended fix:**
```typescript
// Use report's account_id as source of truth
const accountId = report.account_id;

// Add RLS verification
const { data: verified } = await supabase
  .from('sparlo_reports')
  .select('id')
  .eq('id', reportId)
  .single(); // RLS will restrict to user's own reports
```

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 security review
- Analyzed authorization flow vulnerabilities
- Recommended report-derived account ID pattern

**Learnings:**
- Never trust user-supplied data for authorization decisions
- Source of truth should be database, not event payload
