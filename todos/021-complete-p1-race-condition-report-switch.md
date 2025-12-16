---
status: complete
priority: p1
issue_id: "021"
tags: [race-condition, react, data-integrity, code-review]
dependencies: []
---

# Race Condition: Report Switching During Save Causes Data Corruption

## Problem Statement

When a user switches reports while a chat save is in-flight, the save can write to the wrong report. This causes chat history corruption where Report B receives Report A's messages.

**Why it matters:**
- **Data corruption**: Chat history saved to wrong report
- **Silent failure**: Fire-and-forget pattern means no error feedback
- **Data loss**: Original chat history in target report overwritten

## Findings

**Location:** `apps/web/app/home/(user)/_lib/use-chat.ts:59-96`

**Race Condition Scenario:**
1. User is on Report A, types a message
2. `messages` array updates, triggering persistence effect
3. Effect starts serialization (lines 73-83)
4. **User switches to Report B before `updateReport` is called**
5. `currentReportIdRef.current` updates to Report B's ID (line 63)
6. `updateReport` executes with Report B's ID but Report A's messages
7. **Report B gets corrupted with Report A's chat history**

**Code showing the vulnerability:**
```typescript
const currentReportIdRef = useRef(reportId);

useEffect(() => {
  currentReportIdRef.current = reportId;  // Updates immediately on switch
  setMessages(initialMessages);
}, [reportId, initialMessages]);

useEffect(() => {
  // ... serialization happens here ...
  updateReport({
    id: currentReportIdRef.current,  // Uses potentially NEW report ID
    chatHistory: serialized,          // With OLD report's messages
  }).catch(...);
}, [messages]);
```

## Proposed Solutions

### Option A: Capture reportId in Closure (Recommended)

```typescript
// Capture reportId at effect creation time
useEffect(() => {
  const capturedReportId = reportId;  // Capture in closure

  if (!capturedReportId || messages.length === 0) return;
  if (messages.some((m) => m.isStreaming)) return;

  const serialized = messages.map((m) => ({...}));
  const serializedStr = JSON.stringify(serialized);
  if (serializedStr === lastSavedRef.current) return;

  lastSavedRef.current = serializedStr;

  updateReport({
    id: capturedReportId,  // Uses captured value, not ref
    chatHistory: serialized,
  }).catch((err) => console.error('[useChat] Failed to save:', err));
}, [messages, reportId]);  // Add reportId to deps
```

**Pros:** Simple fix, each effect closure captures correct ID
**Cons:** Dependency array change may cause extra effect runs
**Effort:** Small (15 min)
**Risk:** Low

### Option B: Abort Controller Pattern

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  // Cancel any in-flight save for previous report
  abortControllerRef.current?.abort();
  abortControllerRef.current = new AbortController();

  const controller = abortControllerRef.current;
  const capturedReportId = reportId;

  if (!capturedReportId || messages.length === 0) return;
  if (messages.some((m) => m.isStreaming)) return;

  const serialized = messages.map((m) => ({...}));

  // Don't save if already aborted
  if (controller.signal.aborted) return;

  updateReport({
    id: capturedReportId,
    chatHistory: serialized,
  }).catch((err) => {
    if (!controller.signal.aborted) {
      console.error('[useChat] Failed to save:', err);
    }
  });

  return () => controller.abort();
}, [messages, reportId]);
```

**Pros:** Clean cancellation on report switch
**Cons:** More complex
**Effort:** Medium (30 min)
**Risk:** Low

## Recommended Action

Implement Option A for simplicity. Consider Option B if save operations are long-running.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-chat.ts`

**Root cause:**
- Ref updates synchronously on report switch
- Effect closure doesn't capture the reportId at creation time
- Async save uses stale ref value

## Acceptance Criteria

- [ ] Switching reports during save does not corrupt target report
- [ ] Each save writes to the correct report
- [ ] No data loss when rapidly switching reports
- [ ] Console shows no cross-contamination warnings

## Work Log

### 2025-12-15 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified via race condition review agent
- Documented exploitation scenario
- Proposed closure-capture fix

**Learnings:**
- Refs for "synchronous access" + async operations = race conditions
- Capture values in closure for async operations

## Resources

- Race Condition Review findings
- React useEffect closure documentation
