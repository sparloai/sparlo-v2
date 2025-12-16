---
status: complete
priority: p2
issue_id: "022"
tags: [performance, react, optimization, code-review]
dependencies: []
---

# No Debouncing for Chat Persistence Causes Excessive Saves

## Problem Statement

The current persistence effect runs on every message change without debouncing. This causes:
- JSON.stringify on every keystroke during streaming
- Hundreds of potential save attempts per chat response
- Server hammering during rapid interactions

**Why it matters:**
- Performance degradation during streaming responses
- Unnecessary server load
- Potential rate limiting issues

## Findings

**Location:** `apps/web/app/home/(user)/_lib/use-chat.ts:67-96`

**Current behavior:**
```typescript
useEffect(() => {
  // Runs on EVERY message change
  const serialized = messages.map((m) => ({...})); // O(n) serialization
  const serializedStr = JSON.stringify(serialized); // O(n) stringification

  if (serializedStr === lastSavedRef.current) return; // Dedup check
  if (messages.some((m) => m.isStreaming)) return;    // Streaming check

  // Save fires immediately after streaming ends
  updateReport({...}).catch(...);
}, [messages]);
```

**Issues:**
1. Serialization runs even when we'll early-return
2. No debounce - saves fire immediately after each streaming completion
3. Rapid message additions = rapid server calls

## Proposed Solutions

### Option A: Simple setTimeout Debounce (Recommended)

```typescript
useEffect(() => {
  if (!reportId || messages.length === 0) return;
  if (messages.some((m) => m.isStreaming)) return;

  const timer = setTimeout(() => {
    const serialized = messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
    }));

    updateReport({
      id: reportId,
      chatHistory: serialized,
    }).catch((err) => console.error('[useChat] Failed to save:', err));
  }, 1000); // 1 second debounce

  return () => clearTimeout(timer);
}, [reportId, messages]);
```

**Pros:** Simple, uses React's built-in cleanup, natural deduplication
**Cons:** Slightly delayed saves (1s after last change)
**Effort:** Small (15 min)
**Risk:** Low

### Option B: Move Streaming Check First

```typescript
useEffect(() => {
  // FIRST: Check streaming before expensive operations
  if (messages.some((m) => m.isStreaming)) return;

  if (!currentReportIdRef.current || messages.length === 0) return;

  // Only serialize when we're actually going to save
  const serialized = messages.map((m) => ({...}));
  // ... rest of logic
}, [messages]);
```

**Pros:** Prevents wasted serialization during streaming
**Cons:** Doesn't address rapid post-streaming saves
**Effort:** Trivial (5 min)
**Risk:** Very Low

## Recommended Action

Implement Option A (debounce) and apply Option B (early streaming check) together for maximum benefit.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-chat.ts`

**Performance impact:**
- Current: ~100-500 serializations per streaming response
- After fix: 1 serialization after streaming completes + 1s delay

## Acceptance Criteria

- [ ] No serialization occurs during streaming
- [ ] Saves are debounced by at least 500ms
- [ ] Only one save occurs per user message exchange
- [ ] No perceptible delay in UI responsiveness

## Work Log

### 2025-12-15 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified via performance review agent
- Documented impact on streaming performance
- Proposed debounce solution

**Learnings:**
- Effect cleanup with setTimeout is a standard debounce pattern
- Check cheap conditions before expensive operations

## Resources

- Performance Review findings
- [React useEffect cleanup documentation](https://react.dev/learn/synchronizing-with-effects#how-to-handle-the-effect-firing-twice-in-development)
