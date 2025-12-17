---
status: ready
priority: p0
issue_id: "043"
tags: [data-integrity, error-handling, chat, reliability]
dependencies: []
---

# Silent Data Loss on Chat History Save Failure

## Problem Statement

The chat API logs save errors but doesn't inform the user when chat history fails to persist. Users believe their conversation is saved when it may not be, leading to data loss on page refresh.

**Data Impact:** HIGH - Users lose conversation history without any indication.

## Findings

- **File:** `apps/web/app/api/sparlo/chat/route.ts:113-121`
- Save error is logged but stream continues normally
- User sees response but history may not persist
- No retry mechanism for transient failures
- `[DONE]` signal sent regardless of save success

**Problematic code:**
```typescript
const { error: saveError } = await client
  .from('sparlo_reports')
  .update({ chat_history: updatedHistory })
  .eq('id', reportId);

if (saveError) {
  console.error('[Chat] Failed to save history:', saveError);
  // Don't fail the response if save fails - user got their answer
}

controller.enqueue(encoder.encode('data: [DONE]\n\n'));  // Always sent!
```

**User experience:**
1. User sends message
2. AI response streams back ✓
3. Save fails (DB issue, RLS, constraint violation)
4. User sees `[DONE]`, assumes success
5. User refreshes → message gone!

## Proposed Solutions

### Option 1: Send Save Status in Stream

**Approach:** Add `save_status` field to `[DONE]` event, let frontend show warning.

```typescript
controller.enqueue(encoder.encode(
  `data: ${JSON.stringify({ done: true, saved: !saveError })}\n\n`
));
```

**Pros:**
- User informed of save failure
- Can show "retry" or "copy response" option
- Non-breaking change to stream format

**Cons:**
- Requires frontend update to handle new field
- User may still lose data if they ignore warning

**Effort:** 1-2 hours

**Risk:** Low

---

### Option 2: Retry Save with Exponential Backoff

**Approach:** Retry save 3 times before giving up, then warn user.

**Pros:**
- Handles transient failures automatically
- Better reliability for temporary DB issues
- Combined with Option 1 for transparency

**Cons:**
- Delays stream completion
- May not help permanent failures (constraint violations)

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 3: Write-Ahead Log Pattern

**Approach:** Write message to separate "pending" table first, then update main history.

**Pros:**
- Never lose messages
- Can reconcile on next load
- Handles all failure modes

**Cons:**
- Significant complexity increase
- Requires migration and new table
- Over-engineered for current scale

**Effort:** 6-8 hours

**Risk:** Medium

## Recommended Action

Implement Option 1 + Option 2 (notify user AND retry):

1. Add retry logic (3 attempts with 100ms, 500ms, 1000ms delays)
2. Track save status in stream completion event
3. Update frontend to show warning toast on save failure
4. Include "Copy response" button in warning for recovery

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts:113-124` - Add retry and status
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` - Handle save status

**Stream completion format:**
```typescript
// Instead of: 'data: [DONE]\n\n'
// Send: 'data: {"done":true,"saved":true}\n\n'
// Or:   'data: {"done":true,"saved":false,"error":"Database unavailable"}\n\n'
```

## Resources

- **Commit:** `fefb735` (fix: chat API)
- **Comment in code:** "Don't fail the response if save fails - user got their answer"

## Acceptance Criteria

- [ ] Save failures trigger retry (3 attempts)
- [ ] Stream completion includes `saved` status
- [ ] Frontend shows warning toast on save failure
- [ ] Warning includes option to copy AI response
- [ ] Test: Simulate save failure, verify warning shown
- [ ] Test: Transient failure recovered by retry

## Work Log

### 2025-12-17 - Initial Discovery

**By:** Claude Code (Code Review)

**Actions:**
- Identified silent data loss during data-integrity review
- Analyzed failure scenarios and user impact
- Documented 3 solution approaches

**Learnings:**
- "User got their answer" comment shows intentional decision to not fail
- Need balance between UX (don't fail visible response) and reliability
- Notification + retry provides best balance
