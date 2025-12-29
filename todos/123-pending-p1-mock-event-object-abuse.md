---
status: completed
priority: p1
issue_id: 123
tags: [code-review, typescript, chat-components]
dependencies: []
---

# Mock Event Object Abuse in Chat Submit Handler

## Problem Statement

The `report-display.tsx` creates a fake event object instead of properly separating submission logic from event handling. This defeats TypeScript's purpose and creates maintainability issues.

**Why it matters**: Creates incomplete mock objects, violates type safety, and makes code harder to test and understand.

## Findings

**Location**: `/apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` (lines 790-791, 1041-1042)

**Current code**:
```typescript
onSubmit={() =>
  handleChatSubmit({ preventDefault: () => {} } as React.FormEvent)
}
```

**Problems**:
1. Creates incomplete mock event object
2. Uses `as` type assertion to bypass TypeScript
3. If `handleChatSubmit` ever needs other event properties, it will fail silently
4. Cannot be properly tested

## Proposed Solutions

### Option A: Separate submission logic (Recommended)
```typescript
// Extract the submission logic
const submitChatMessage = useCallback(async () => {
  if (!chatInput.trim() || isChatLoading) return;
  // ... rest of submission logic
}, [chatInput, isChatLoading, report.id]);

const handleChatSubmit = useCallback((e: React.FormEvent) => {
  e.preventDefault();
  void submitChatMessage();
}, [submitChatMessage]);

// In ChatInput:
<ChatInput
  onSubmit={submitChatMessage}  // Direct function call, no mock event
/>
```

**Pros**: Clean separation, testable, type-safe
**Cons**: Requires minor refactoring
**Effort**: 30 minutes
**Risk**: Low

### Option B: Update ChatInput interface
```typescript
interface ChatInputProps {
  onSubmit: () => void;  // Already this way - issue is in parent
}
```

**Pros**: Interface is already correct
**Cons**: Still need to fix parent
**Effort**: Same as Option A
**Risk**: Low

## Recommended Action

Implement Option A - extract submission logic into a separate function.

## Technical Details

**Affected files**:
- `/apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`

## Acceptance Criteria

- [ ] No mock event objects created
- [ ] `handleChatSubmit` only handles event, delegates to `submitChatMessage`
- [ ] ChatInput receives `submitChatMessage` directly
- [ ] Typecheck passes without `as` assertions for events

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | TypeScript reviewer identified as "terrible practice" |

## Resources

- Commit: 91f42b1
