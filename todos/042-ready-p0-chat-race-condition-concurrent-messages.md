---
status: ready
priority: p0
issue_id: "042"
tags: [data-integrity, race-condition, chat, database]
dependencies: []
---

# Race Condition on Concurrent Chat Messages Causes Lost Updates

## Problem Statement

The chat API reads chat history, appends new messages, then writes the entire array back. If two messages are sent concurrently (e.g., rapid clicking, multiple tabs), the second write overwrites the first, losing messages.

**Data Impact:** HIGH - User messages silently disappear from chat history.

## Findings

- **File:** `apps/web/app/api/sparlo/chat/route.ts:53-55, 107-116`
- Pattern: Read → Append → Write (classic lost update race)
- No optimistic locking or version checking
- No database-level atomic append

**Vulnerable code sequence:**
```typescript
// Read existing history
const chatHistory: ChatMessage[] = history.success ? history.data : [];

// ... stream response ...

// Append and write (RACE WINDOW)
const updatedHistory: ChatMessage[] = [
  ...chatHistory,          // Stale if another request completed
  { role: 'user', content: message },
  { role: 'assistant', content: fullResponse },
];

await client
  .from('sparlo_reports')
  .update({ chat_history: updatedHistory })
  .eq('id', reportId);
```

**Race scenario:**
1. Request A reads history: `[msg1, msg2]`
2. Request B reads history: `[msg1, msg2]`
3. Request A writes: `[msg1, msg2, A_user, A_response]`
4. Request B writes: `[msg1, msg2, B_user, B_response]` ← Overwrites A's messages!

## Proposed Solutions

### Option 1: PostgreSQL JSONB Append Function

**Approach:** Use `jsonb_array_elements` and array concatenation in a single UPDATE statement.

```sql
UPDATE sparlo_reports
SET chat_history = chat_history || $1::jsonb
WHERE id = $2;
```

**Pros:**
- Atomic at database level
- No application-level locking needed
- Simple implementation

**Cons:**
- Requires raw SQL or RPC function
- Can't easily remove duplicates

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: Optimistic Locking with Version Column

**Approach:** Add `chat_version` column, increment on each write, reject if version changed.

**Pros:**
- Standard pattern for concurrent updates
- Explicit conflict detection
- Works with existing Supabase client

**Cons:**
- Requires migration
- Client must handle retry on conflict
- More complex error handling

**Effort:** 3-4 hours

**Risk:** Medium

---

### Option 3: Frontend Mutex (UI-Level Prevention)

**Approach:** Disable send button during request, prevent concurrent submissions.

**Pros:**
- Simplest implementation
- Already partially implemented (`isSending` state)
- No backend changes

**Cons:**
- Doesn't prevent multi-tab scenarios
- Not a real fix, just mitigation
- Can still race with slow networks

**Effort:** 30 minutes

**Risk:** Low (but incomplete)

## Recommended Action

Implement Option 1 (atomic JSONB append) with Option 3 as additional UX safeguard:

1. Create Supabase RPC function for atomic append
2. Update route to call RPC instead of read-modify-write
3. Ensure frontend `isSending` state prevents double-clicks
4. Consider adding message deduplication by timestamp

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts:107-116` - Replace update logic
- `apps/web/supabase/migrations/` - New migration for RPC function

**RPC function:**
```sql
CREATE OR REPLACE FUNCTION append_chat_messages(
  p_report_id UUID,
  p_messages JSONB
) RETURNS void AS $$
BEGIN
  UPDATE sparlo_reports
  SET chat_history = COALESCE(chat_history, '[]'::jsonb) || p_messages
  WHERE id = p_report_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## Resources

- **Commit:** `fefb735` (fix: chat API)
- **PostgreSQL JSONB docs:** https://www.postgresql.org/docs/current/functions-json.html

## Acceptance Criteria

- [ ] Chat history updates are atomic (no lost messages)
- [ ] Test: Rapid consecutive messages all persist
- [ ] Test: Multi-tab scenario preserves all messages
- [ ] Frontend prevents double-submit while streaming
- [ ] Error handling for failed appends

## Work Log

### 2025-12-17 - Initial Discovery

**By:** Claude Code (Code Review)

**Actions:**
- Identified read-modify-write race condition during data-integrity review
- Analyzed PostgreSQL JSONB atomic operations
- Documented 3 solution approaches

**Learnings:**
- JSONB `||` operator provides atomic array concatenation
- RPC functions can encapsulate atomic operations
- Frontend mitigation alone is insufficient
