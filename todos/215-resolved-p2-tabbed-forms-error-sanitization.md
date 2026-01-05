---
status: pending
priority: p2
issue_id: "215"
tags: [code-review, security, error-handling]
dependencies: []
---

# Sanitize Error Messages in Form Components

## Problem Statement

Error messages from server actions are displayed directly to users without sanitization. This can expose internal database details, schema information, and implementation details that could aid attackers or confuse users.

**Example leaked information:**
```
Failed to create report: duplicate key value violates unique constraint "sparlo_reports_conversation_id_key"
```

## Findings

- **Technical Form:** `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx` (lines 313-318)
  ```typescript
  const errorMessage = err instanceof Error
    ? err.message  // ❌ Exposes full error including DB details
    : 'Failed to start report generation';
  ```

- **DD Form:** `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx` (lines 304-309)
  - Same pattern

- **Server Actions:** `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts` (lines 167-169)
  ```typescript
  if (error) {
    throw new Error(`Failed to create report: ${error.message}`);
    // ❌ Supabase error details leaked
  }
  ```

## Proposed Solutions

### Option 1: Client-Side Error Mapping

**Approach:** Create error mapping function in forms to translate technical errors to user-friendly messages.

```typescript
function getUserFriendlyError(message: string): string {
  if (message.includes('duplicate') || message.includes('unique constraint')) {
    return 'A report with this identifier already exists.';
  }
  if (message.includes('permission') || message.includes('rls')) {
    return 'You do not have permission to perform this action.';
  }
  if (message.includes('rate limit')) {
    return 'Please wait a moment before trying again.';
  }
  return 'An error occurred. Please try again.';
}
```

**Pros:**
- Quick to implement
- Doesn't require server changes

**Cons:**
- Error details still transmitted to client
- Pattern matching is fragile

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Server-Side Error Sanitization

**Approach:** Sanitize errors in server actions before throwing.

```typescript
// In server action
if (error) {
  console.error('Failed to create report:', error); // Log full error
  throw new Error(sanitizeErrorMessage(error)); // Throw safe message
}
```

**Pros:**
- Sensitive details never reach client
- Single point of control

**Cons:**
- Requires changes to all server actions

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 3: Error Boundary with Generic Fallback

**Approach:** Add error boundary that catches all errors and shows generic message.

**Pros:**
- Catches unexpected errors too

**Cons:**
- Less specific user feedback
- Adds component layer

**Effort:** 1 hour

**Risk:** Low

## Recommended Action

*To be filled during triage.*

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx:313-318`
- `apps/web/app/home/(user)/reports/new/_components/due-diligence-analysis-form.tsx:304-309`
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts:167-169, 206-208`
- `apps/web/app/home/(user)/_lib/server/dd-reports-server-actions.ts`

## Acceptance Criteria

- [ ] Database error details not exposed to users
- [ ] User-friendly error messages displayed
- [ ] Full errors logged server-side
- [ ] Tests pass
- [ ] Manual test with intentional error confirms sanitization

## Work Log

### 2026-01-04 - Code Review Finding

**By:** Claude Code (security-sentinel agent)

**Actions:**
- Identified error exposure pattern
- Traced error flow from server action to client display
- Documented specific error types that could leak

**Learnings:**
- Supabase errors contain detailed schema information
- Current pattern exposes all error messages directly

## Notes

- This is a security hardening item, not a critical vulnerability
- Consider logging more context server-side when sanitizing
- Related to general error handling patterns in the codebase
