---
status: completed
priority: p1
issue_id: "003"
tags: [code-review, duplication, maintainability, pr-22]
dependencies: ["002"]
---

# Duplicated Clarification Logic (3 Instances)

## Problem Statement

The exact same clarification handling logic appears in three different branches of the `sendMessage` function. This violates DRY principle and makes maintenance error-prone.

**Why it matters:** Changes must be made in 3 places, high risk of inconsistency bugs.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
**Lines:** 446-467, 552-570, 497-504

**Duplicated Pattern (appears 3x):**
```typescript
if (response.status === 'clarifying') {
  if (hasAskedClarification) {
    setClarificationQuestion(null);
    const skipResponse = await sparloApi.chat(
      'Please proceed with the analysis based on the information provided.',
      response.conversation_id,
    );
    setCurrentStep(skipResponse.current_step || 'AN1');
    setAppState('processing');
    startPolling(skipResponse.conversation_id, result.report.id);
  } else {
    setHasAskedClarification(true);
    setClarificationQuestion(response.message);
    setAppState('input');
  }
}
```

**Additional Duplication:**
- Polling cleanup logic (7 instances)
- Report state update pattern (3 instances)
- Message truncation logic (5 instances)

## Proposed Solutions

### Option A: Extract Shared Helper Functions (Recommended)

```typescript
const handleClarificationResponse = async (
  response: ChatResponse,
  reportId: string
) => {
  if (hasAskedClarification) {
    setClarificationQuestion(null);
    const skipResponse = await sparloApi.chat(
      SKIP_CLARIFICATION_MESSAGE,
      response.conversation_id,
    );
    setCurrentStep(skipResponse.current_step || PROCESSING_STEP);
    setAppState('processing');
    startPolling(skipResponse.conversation_id, reportId);
  } else {
    setHasAskedClarification(true);
    setClarificationQuestion(response.message);
    setAppState('input');
  }
};

const stopPolling = () => {
  if (pollingRef.current) {
    clearInterval(pollingRef.current);
    pollingRef.current = null;
  }
};

const truncateMessage = (msg: string, maxLength: number) =>
  msg.slice(0, maxLength) + (msg.length > maxLength ? '...' : '');
```

| Aspect | Assessment |
|--------|------------|
| Pros | Single source of truth, easier maintenance |
| Cons | Need to identify all duplications |
| Effort | Small |
| Risk | Low |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Functions to Extract:**
1. `handleClarificationResponse(response, reportId)` - 3 instances
2. `stopPolling()` - 7 instances
3. `updateReportAndLocalState(reportId, updateData)` - 3 instances
4. `addMessagePair(userContent, assistantContent, reportId)` - 2 instances
5. `truncateMessage(msg, maxLength)` - 5 instances

**Constants to Extract:**
```typescript
const SKIP_CLARIFICATION_MESSAGE = 'Please proceed with the analysis...';
const FORCE_SKIP_MESSAGE = 'I want to proceed without answering...';
const DEFAULT_STEP = 'AN0';
const PROCESSING_STEP = 'AN1';
const TITLE_MAX_LENGTH = 50;
const MESSAGE_PREVIEW_LENGTH = 100;
```

## Acceptance Criteria

- [ ] `handleClarificationResponse` extracted and used in all 3 locations
- [ ] `stopPolling` helper used everywhere
- [ ] Magic strings replaced with constants
- [ ] No duplicate logic blocks >5 lines

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Code simplicity reviewer found 7+ duplication patterns |

## Resources

- **PR:** #22
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
