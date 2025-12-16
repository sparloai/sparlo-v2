---
status: pending
priority: p1
issue_id: "010"
tags: [race-condition, react, state-management, frontend]
dependencies: []
---

# Race Condition: Refs Not Reset on Conversation Change

Multiple refs in use-sparlo.ts are not properly reset when switching conversations, causing message loss and state corruption.

## Problem Statement

The `use-sparlo.ts` hook uses several refs to track processing state and prevent race conditions. However, these refs are not reset when the active conversation changes, leading to:

1. Messages being silently ignored due to stale `messageProcessingRef`
2. Clarification flow corruption from stale `subsequentMessageSentRef`
3. Incorrect timing data from stale `lastMessageTimeRef`

**Severity:** P1 - Causes user-visible bugs (lost messages, broken flows)

## Findings

- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Issue 1: messageProcessingRef not reset**
```typescript
// Line ~963-968
if (messageProcessingRef.current) {
  console.warn('[useSparlo] Message already being processed, ignoring');
  return;  // Message silently dropped!
}
messageProcessingRef.current = true;
```
If conversation changes while processing, ref stays true and blocks all new messages.

**Issue 2: subsequentMessageSentRef cleanup missing**
- Not reset on failures in clarification flow
- Not reset on conversation change
- Can cause clarification responses to be treated as new messages

**Issue 3: lastMessageTimeRef stale across conversations**
- Timing calculations wrong for new conversations
- Affects any debouncing or timing logic

## Proposed Solutions

### Option 1: Reset All Refs in Conversation Change Effect

**Approach:** Add cleanup in the effect that handles conversation changes

**Pros:**
- Simple and direct fix
- Addresses all three issues
- No structural changes needed

**Cons:**
- Need to ensure effect runs at right time
- Must reset refs before any async operations

**Effort:** 1-2 hours

**Risk:** Low

**Implementation:**
```typescript
useEffect(() => {
  // Reset all processing refs when conversation changes
  messageProcessingRef.current = false;
  subsequentMessageSentRef.current = false;
  lastMessageTimeRef.current = 0;

  // ... rest of conversation change logic
}, [activeConversation?.id]);
```

---

### Option 2: Consolidate Refs into Single State Object

**Approach:** Replace multiple refs with single consolidated ref object

**Pros:**
- Single reset point
- Easier to reason about
- Reduces total ref count (from 12 to ~5)

**Cons:**
- More refactoring required
- Must ensure object mutations are correct

**Effort:** 3-4 hours

**Risk:** Medium

---

### Option 3: Add Conversation-Scoped Ref Keys

**Approach:** Include conversation ID in ref checks

**Pros:**
- No reset needed - stale refs automatically invalid
- More explicit about conversation scoping

**Cons:**
- More complex check logic
- All ref usages need updating

**Effort:** 2-3 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts`
  - `messageProcessingRef` - Line ~950
  - `subsequentMessageSentRef` - Line ~600
  - `lastMessageTimeRef` - Line ~400
  - `pollingSessionRef` - Already properly scoped ✓

**Related refs that ARE properly handled:**
- `pollingSessionRef` - Includes session tracking, good pattern

## Resources

- **React Refs and Effects:** https://react.dev/reference/react/useRef
- **Previous stability work:** Issues 001-008

## Acceptance Criteria

- [ ] messageProcessingRef reset on conversation change
- [ ] subsequentMessageSentRef reset on conversation change
- [ ] subsequentMessageSentRef reset on clarification failures
- [ ] lastMessageTimeRef reset on conversation change
- [ ] No console warnings about ignored messages after switching conversations
- [ ] Clarification flow works correctly after switching conversations
- [ ] All tests pass

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Race Condition Review Agent)

**Actions:**
- Analyzed ref lifecycle in use-sparlo.ts
- Identified three refs with stale state issues
- Traced conversation change effects
- Verified pollingSessionRef has correct pattern

**Learnings:**
- `pollingSessionRef` pattern is good - includes session tracking
- Other refs followed simpler (incomplete) pattern
- Race window exists between conversation change and ref reset
- The warning message at line ~964 is actually hiding real bugs

## Notes

- Related to Issue 007 (polling race condition fixes) - those were done correctly
- User symptom: "My message disappeared" after switching conversations
- Can be reproduced by: 1) Send message 2) Switch conversation while processing 3) Try to send in new conversation
