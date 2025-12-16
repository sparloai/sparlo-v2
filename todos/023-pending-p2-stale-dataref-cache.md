---
status: pending
priority: p2
issue_id: "023"
tags: [state-management, react, data-integrity, code-review]
dependencies: []
---

# Stale dataRef Cache Causes Missing Messages on Report Switch

## Problem Statement

When chat messages are saved, `dataRef.current.reports` is never updated. This causes users to see stale/missing messages when switching between reports.

**Why it matters:**
- Users lose recent chat messages when switching reports and back
- Creates confusion about whether messages were saved
- Inconsistent UI state vs database state

## Findings

**Location:** `apps/web/app/home/(user)/_lib/use-sparlo.ts:379-407`

**Data flow showing the bug:**
```
1. User loads Report A (chat_history: [msg1, msg2])
   → dataRef.reports[A] = [msg1, msg2]

2. User sends msg3 in Report A
   → useChat.messages = [msg1, msg2, msg3]
   → Supabase chat_history = [msg1, msg2, msg3]
   → dataRef.reports[A] = [msg1, msg2]  // NEVER UPDATED!

3. User switches to Report B, then back to A
   → getActiveReportChatHistory() reads from dataRef
   → Returns [msg1, msg2]  // msg3 is missing!
```

**Root cause:**
- `dataRef` only updates on initial load (line 403-407)
- No mechanism to sync `dataRef` with mutations
- Three sources of truth: `dataRef`, `useChat.messages`, Supabase

## Proposed Solutions

### Option A: Add Cache Update Method (Recommended)

```typescript
// use-sparlo.ts - Add cache update method
const updateReportCache = useCallback((reportId: string, updates: Partial<SparloReport>) => {
  const idx = dataRef.current.reports.findIndex(r => r.id === reportId);
  if (idx !== -1) {
    dataRef.current.reports[idx] = {
      ...dataRef.current.reports[idx]!,
      ...updates,
    };
  }
}, []);

// Expose to consumers
return { ...existingReturns, updateReportCache };

// use-chat.ts - Update cache on save
useEffect(() => {
  // ... save logic ...
  updateReport({ id: reportId, chatHistory: serialized })
    .then(() => {
      updateReportCache(reportId, { chat_history: serialized });
    })
    .catch(...);
}, [messages, updateReportCache]);
```

**Pros:** Simple fix, maintains existing architecture
**Cons:** Manual cache management
**Effort:** Small (30 min)
**Risk:** Low

### Option B: Use React Query for Cache Management

Replace manual caching with React Query which handles cache invalidation automatically.

**Pros:** Robust cache management, automatic revalidation
**Cons:** Significant refactor, new dependency
**Effort:** Large (4+ hours)
**Risk:** Medium

## Recommended Action

Implement Option A for immediate fix. Consider Option B for future scalability.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts` - Add updateReportCache
- `apps/web/app/home/(user)/_lib/use-chat.ts` - Call updateReportCache on save

**Root cause:**
- Mixing refs for "synchronous access" with async mutations
- No cache invalidation strategy

## Acceptance Criteria

- [ ] New messages persist across report switches
- [ ] dataRef.reports[id].chat_history matches database after save
- [ ] No visible message loss when switching reports
- [ ] Console shows successful cache updates

## Work Log

### 2025-12-15 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified via architecture and race condition reviews
- Documented data flow showing cache staleness
- Proposed cache update method

**Learnings:**
- Three sources of truth = synchronization bugs
- Refs for perf optimization need careful cache invalidation

## Resources

- Architecture Review findings
- Race Condition Review findings
