---
status: pending
priority: p2
issue_id: "024"
tags: [security, performance, validation, code-review]
dependencies: ["020"]
---

# No Size Limits on Chat History (DoS Risk)

## Problem Statement

There are no limits on chat history array size or individual message content length. Users could create massive chat histories that:
- Exhaust storage quotas
- Slow down database queries
- Cause memory issues when loading
- Increase hosting costs

**Why it matters:**
- Potential Denial of Service via storage exhaustion
- Performance degradation for legitimate users
- Cost escalation in Supabase billing

## Findings

**Location:** Multiple files

**Current state:**
- Migration has no size constraints
- Zod schema has no array/content limits (addressed in issue 020)
- Client-side has no input validation

**Evidence from reviews:**
- Security review flagged as CRITICAL vulnerability
- Performance review noted unbounded JSONB growth

## Proposed Solutions

### Option A: Application-Level Limits (Recommended)

```typescript
// use-chat.ts - Add client-side limits
const MAX_MESSAGES = 100;
const MAX_CONTENT_LENGTH = 10000;

// Before saving
const trimmedMessages = messages.slice(-MAX_MESSAGES);
const serialized = trimmedMessages.map((m) => ({
  id: m.id,
  role: m.role,
  content: m.content.slice(0, MAX_CONTENT_LENGTH),
  timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
}));

// In chat input component
if (chatInput.length > MAX_CONTENT_LENGTH) {
  toast.error(`Message too long (max ${MAX_CONTENT_LENGTH} characters)`);
  return;
}
```

**Pros:** Immediate protection, good UX with feedback
**Cons:** Can be bypassed by direct API calls
**Effort:** Small (20 min)
**Risk:** Low

### Option B: Database-Level Constraints

```sql
-- Migration: add_chat_history_constraints.sql
ALTER TABLE sparlo_reports ADD CONSTRAINT chat_history_size_check
  CHECK (pg_column_size(chat_history) < 1048576); -- 1MB

ALTER TABLE sparlo_reports ADD CONSTRAINT chat_history_length_check
  CHECK (jsonb_array_length(chat_history) <= 100);
```

**Pros:** Defense in depth, cannot be bypassed
**Cons:** Additional migration required
**Effort:** Small (15 min)
**Risk:** Low

## Recommended Action

Implement both options for defense in depth.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-chat.ts` - Add trim logic
- `apps/web/app/home/(user)/_components/complete-phase.tsx` - Add input validation
- `apps/web/supabase/migrations/` - New migration for constraints

## Acceptance Criteria

- [ ] Chat history limited to 100 messages max
- [ ] Individual messages limited to 10,000 characters
- [ ] User sees feedback when limits exceeded
- [ ] Database rejects oversized data
- [ ] Existing oversized histories handled gracefully

## Work Log

### 2025-12-15 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified via security review agent
- Documented DoS risk
- Proposed layered limits

**Learnings:**
- Defense in depth: validate at client, server, and database
- Always limit user-controlled array/string sizes

## Resources

- Security Review findings
- Performance Review findings
