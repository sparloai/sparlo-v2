---
status: complete
priority: p1
issue_id: "020"
tags: [security, typescript, validation, code-review]
dependencies: []
---

# Loose Zod Schema Allows Arbitrary Data Injection

## Problem Statement

The `chatHistory` field in `UpdateReportSchema` uses `z.array(z.record(z.unknown()))` which is essentially `z.any()` in disguise. This defeats type safety and allows arbitrary data injection into the database.

**Why it matters:**
- Attackers can inject any JSON structure, not just chat messages
- No validation on array size (DoS potential via storage exhaustion)
- No content length limits (single message could be megabytes)
- Prototype pollution potential with malicious keys

## Findings

**Location:** `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts:38`

```typescript
// CURRENT - Dangerously permissive
chatHistory: z.array(z.record(z.unknown())).optional(),
```

**Evidence from Security Review:**
- Input validation is CRITICAL vulnerability
- `z.unknown()` accepts any value type
- No size limits on array or content

## Proposed Solutions

### Option A: Strict Zod Schema (Recommended)

```typescript
const ChatHistoryMessageSchema = z.object({
  id: z.string().uuid(),
  role: z.enum(['user', 'assistant']),
  content: z.string().max(10000), // Limit content size
  timestamp: z.string().datetime(), // ISO 8601 validation
});

const UpdateReportSchema = z.object({
  id: z.string().uuid(),
  // ... other fields ...
  chatHistory: z.array(ChatHistoryMessageSchema).max(100).optional(),
});
```

**Pros:** Complete type safety, size limits, runtime validation
**Cons:** Slightly more verbose
**Effort:** Small (30 min)
**Risk:** Low - straightforward schema change

### Option B: Add Database-Level Constraints

```sql
ALTER TABLE sparlo_reports ADD CONSTRAINT chat_history_size_check
  CHECK (pg_column_size(chat_history) < 1048576); -- 1MB limit

ALTER TABLE sparlo_reports ADD CONSTRAINT chat_history_length_check
  CHECK (jsonb_array_length(chat_history) <= 100);
```

**Pros:** Defense in depth, catches bypasses
**Cons:** Additional migration needed
**Effort:** Small (15 min)
**Risk:** Low

## Recommended Action

Implement Option A immediately, consider Option B as additional safeguard.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

**Related components:**
- `use-chat.ts` - Client-side should also enforce limits before sending

## Acceptance Criteria

- [ ] `chatHistory` schema validates structure (id, role, content, timestamp)
- [ ] Array limited to max 100 messages
- [ ] Content limited to max 10000 characters
- [ ] Timestamp validated as ISO 8601
- [ ] Invalid data rejected with meaningful error
- [ ] TypeScript compiles without errors

## Work Log

### 2025-12-15 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified via security review agent
- Confirmed as P1 critical vulnerability
- Documented recommended fix

**Learnings:**
- `z.record(z.unknown())` is an anti-pattern for typed data
- Always prefer explicit schemas for user-controlled data

## Resources

- Security Review findings
- [Zod Documentation](https://zod.dev/)
