---
status: completed
priority: p1
issue_id: "002"
tags: [code-review, architecture, maintainability, pr-22]
dependencies: []
---

# sendMessage Function Too Complex (258+ Lines)

## Problem Statement

The `sendMessage` function in `useSparlo` hook is 258 lines with cyclomatic complexity ~25+. It handles 6+ distinct responsibilities making it nearly impossible to understand, test, or modify safely.

**Why it matters:** High bug risk, impossible to unit test, blocks future development, makes code reviews ineffective.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
**Lines:** 378-640

**Responsibilities Mixed:**
1. Message validation and preparation
2. Three distinct code paths (new report, creation in progress, existing report)
3. Database operations via `startTransition`
4. Status-based branching (6 different status types)
5. Clarification flow logic
6. Race condition handling
7. Error handling

**Structure (simplified):**
```typescript
async sendMessage(message: string) {
  // Setup (5 lines)
  try {
    // Get conversation ID (10 lines)
    const response = await sparloApi.chat(...);
    // Set ref immediately (4 lines)

    if (!activeReportId && !reportCreationInProgressRef.current) {
      // Path 1: Create new report (75 lines)
      startTransition(async () => {
        // 50 lines of nested logic
      });
    } else if (!activeReportId && reportCreationInProgressRef.current) {
      // Path 2: Race condition during creation (26 lines)
    } else {
      // Path 3: Update existing report (119 lines)
      // Nested: clarifying, processing, confirm_rerun, complete, other
    }
  } catch (err) {
    // Error handling
  }
}
```

## Proposed Solutions

### Option A: Extract Handler Functions (Recommended)

**Approach:** Split into focused handler functions

```typescript
const sendMessage = async (message: string) => {
  setIsLoading(true);
  setError(null);
  setPendingMessage(message);

  try {
    const backendConversationId = getBackendConversationId();
    const response = await sparloApi.chat(message, backendConversationId);

    if (response.conversation_id) {
      conversationIdRef.current = response.conversation_id;
    }

    if (shouldCreateNewReport()) {
      await handleNewReportCreation(message, response);
    } else if (isReportCreationInProgress()) {
      handleSubsequentMessageDuringCreation(response);
    } else {
      await handleExistingReportUpdate(message, response);
    }
  } catch (err) {
    handleSendMessageError(err);
  } finally {
    setIsLoading(false);
  }
};
```

| Aspect | Assessment |
|--------|------------|
| Pros | Each function testable, clear responsibilities, easier debugging |
| Cons | More functions to navigate |
| Effort | Medium |
| Risk | Low (refactor only) |

### Option B: State Machine Pattern

**Approach:** Use XState or reducer for state transitions

| Aspect | Assessment |
|--------|------------|
| Pros | Explicit state transitions, visual debugging tools |
| Cons | Learning curve, more boilerplate |
| Effort | Large |
| Risk | Medium |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts`

**Suggested New Functions:**
- `handleNewReportCreation(message, response)`
- `handleSubsequentMessageDuringCreation(response)`
- `handleExistingReportUpdate(message, response)`
- `handleClarificationResponse(response, reportId)`
- `handleStatusResponse(response, reportId)`

## Acceptance Criteria

- [ ] `sendMessage` reduced to <50 lines
- [ ] Each extracted function is <50 lines
- [ ] All existing functionality preserved
- [ ] Unit tests added for each handler
- [ ] Cyclomatic complexity <10

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Multiple reviewers flagged complexity |

## Resources

- **PR:** #22
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts:378-640`
