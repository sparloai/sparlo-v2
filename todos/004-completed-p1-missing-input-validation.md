---
status: completed
priority: p1
issue_id: "004"
tags: [code-review, security, validation, pr-22]
dependencies: []
---

# Missing Input Validation Before API Calls

## Problem Statement

User input (`message` parameter) in `sendMessage` is sent directly to the backend API without any client-side validation or sanitization. This creates security risks and poor UX.

**Why it matters:** XSS risk, potential injection attacks, DoS via large payloads, poor error handling for empty messages.

## Findings

### Evidence from Review

**File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
**Lines:** 380-397

**Current Code:**
```typescript
const sendMessage = useCallback(
  async (message: string) => {
    // No validation!
    const response = await sparloApi.chat(message, backendConversationId);
```

**Risks Identified:**
1. **XSS via stored messages** - Malicious scripts could be stored and executed
2. **Command injection** - Special characters could exploit backend
3. **DoS attacks** - No length limits allow arbitrarily large payloads
4. **Empty submissions** - No check for empty messages

## Proposed Solutions

### Option A: Add Client-Side Validation (Recommended)

```typescript
const MAX_MESSAGE_LENGTH = 10000;

const sendMessage = useCallback(async (message: string) => {
  // Validate input
  const trimmed = message.trim();

  if (!trimmed || trimmed.length === 0) {
    setError('Message cannot be empty');
    return;
  }

  if (trimmed.length > MAX_MESSAGE_LENGTH) {
    setError('Message is too long (max 10,000 characters)');
    return;
  }

  setIsLoading(true);
  setError(null);
  setPendingMessage(trimmed);

  try {
    const response = await sparloApi.chat(trimmed, backendConversationId);
    // ...
  }
}, []);
```

| Aspect | Assessment |
|--------|------------|
| Pros | Immediate feedback, prevents unnecessary API calls |
| Cons | Minimal |
| Effort | Small |
| Risk | Low |

### Option B: Add Validation Schema with Zod

```typescript
import { z } from 'zod';

const MessageSchema = z.object({
  content: z.string().trim().min(1).max(10000),
});

const sendMessage = async (message: string) => {
  const result = MessageSchema.safeParse({ content: message });
  if (!result.success) {
    setError(result.error.errors[0].message);
    return;
  }
  // Use result.data.content
};
```

| Aspect | Assessment |
|--------|------------|
| Pros | Reusable, type-safe, consistent with server actions |
| Cons | Additional dependency usage |
| Effort | Small |
| Risk | Low |

## Recommended Action

<!-- Filled during triage -->

## Technical Details

**Validation Rules:**
- Not empty after trim
- Max length: 10,000 characters
- Optional: Rate limiting (1 message per second)

**Related Files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts`
- `apps/web/app/home/(user)/_lib/api.ts`

## Acceptance Criteria

- [ ] Empty messages show user-friendly error
- [ ] Messages over max length rejected with clear error
- [ ] Validation happens before API call
- [ ] Rate limiting considered (P2 follow-up)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-15 | Created from PR #22 code review | Security reviewer flagged as P1 critical |

## Resources

- **PR:** #22
- **File:** `apps/web/app/home/(user)/_lib/use-sparlo.ts:380-397`
