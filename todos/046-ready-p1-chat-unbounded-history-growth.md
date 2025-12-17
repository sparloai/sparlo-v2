---
status: ready
priority: p1
issue_id: "046"
tags: [performance, database, chat, scalability]
dependencies: []
---

# Unbounded Chat History Growth in JSONB Column

## Problem Statement

Chat history is stored as a JSONB array that grows indefinitely. Long conversations will cause:
1. Increasing DB storage costs
2. Slower read/write operations
3. Eventually hitting PostgreSQL JSONB size limits (~1GB)
4. Token context limit issues when history exceeds 200K tokens

**Performance Impact:** MEDIUM-HIGH over time as users have longer conversations.

## Findings

- **File:** `apps/web/app/api/sparlo/chat/route.ts:54-55, 107-111`
- No limit on array size
- Each message pair adds ~500-2000 tokens
- After 100 exchanges: ~100K-200K tokens in context
- Report markdown adds another ~10K tokens

**Growth analysis:**
```
Messages | Est. Tokens | Est. Size (JSON)
---------|-------------|------------------
10       | 10K         | ~40KB
50       | 50K         | ~200KB
100      | 100K        | ~400KB
500      | 500K        | ~2MB  (exceeds context!)
```

**Problem code:**
```typescript
const updatedHistory: ChatMessage[] = [
  ...chatHistory,  // No limit!
  { role: 'user', content: message },
  { role: 'assistant', content: fullResponse },
];
```

## Proposed Solutions

### Option 1: Simple Message Limit

**Approach:** Keep only last N message pairs (e.g., 50).

```typescript
const MAX_MESSAGES = 100;  // 50 pairs
const updatedHistory = [
  ...chatHistory.slice(-MAX_MESSAGES + 2),  // Keep room for new pair
  { role: 'user', content: message },
  { role: 'assistant', content: fullResponse },
];
```

**Pros:**
- Simple implementation
- Predictable size
- No migration needed

**Cons:**
- Loses old messages entirely
- User might want full history

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Sliding Window with Summary

**Approach:** Keep recent messages + summarize older ones periodically.

**Pros:**
- Preserves context from old conversations
- Efficient token usage
- Better UX for returning users

**Cons:**
- Complex implementation
- Requires additional Claude call for summarization
- Summary quality varies

**Effort:** 4-6 hours

**Risk:** Medium

---

### Option 3: Archive to Separate Table

**Approach:** Move old messages to `chat_message_archive` table, keep recent in JSONB.

**Pros:**
- Full history preserved
- JSONB stays small
- Can paginate archive retrieval

**Cons:**
- Requires migration
- More complex queries
- Two sources of truth

**Effort:** 3-4 hours

**Risk:** Medium

## Recommended Action

Implement Option 1 (simple limit) immediately, consider Option 2 for future:

1. Add `MAX_HISTORY_MESSAGES = 100` constant
2. Slice history before appending new messages
3. Keep most recent 50 exchanges (100 messages)
4. Add comment noting future enhancement for summarization

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts:107-111` - Add slice before update

**Implementation:**
```typescript
const MAX_HISTORY_MESSAGES = 100;  // 50 exchanges

const updatedHistory: ChatMessage[] = [
  ...chatHistory.slice(-(MAX_HISTORY_MESSAGES - 2)),
  { role: 'user' as const, content: message },
  { role: 'assistant' as const, content: fullResponse },
];
```

**Token calculation:**
- 100 messages × ~1000 tokens avg = 100K tokens
- Report context: ~10K tokens
- Response: ~4K tokens max
- Total: ~114K tokens (within 200K limit)

## Resources

- **Commit:** `fefb735` (fix: chat API)
- **Claude Opus context:** 200K tokens

## Acceptance Criteria

- [ ] Chat history limited to 100 messages (50 exchanges)
- [ ] Oldest messages dropped when limit exceeded
- [ ] No visible change for users with <100 messages
- [ ] Test: 60+ message conversation stays at 100
- [ ] Consider UI indicator when history is truncated

## Work Log

### 2025-12-17 - Initial Discovery

**By:** Claude Code (Code Review)

**Actions:**
- Identified unbounded growth during performance-oracle review
- Calculated token and size projections
- Documented 3 solution approaches

**Learnings:**
- 200K context allows ~100-150 messages before issues
- Simple limit is sufficient for MVP
- Summarization would be nice-to-have for power users
