---
status: pending
priority: p2
issue_id: 201
tags: [code-review, performance, help-center]
dependencies: []
---

# ChatBubble Memoization Defeated by Unstable Callback

## Problem Statement

The `ChatBubble` component uses `memo()` but has an unstable callback dependency that defeats memoization. The `handleFeedback` callback is recreated on every parent render, causing all ChatBubble components to re-render during streaming.

## Findings

**Location**: `apps/web/components/help-widget/help-chat-widget.tsx`

**Unstable callback** (lines 212-226):
```typescript
const handleFeedback = async (
  messageContent: string,
  responseContent: string,
  rating: 'positive' | 'negative',
) => {
  // ... recreated on every render
};
```

**Performance Impact**:
- At 20 messages: 20 unnecessary re-renders every 50ms during streaming
- 400 renders/second during streaming
- Markdown parsing executed unnecessarily for stable messages

## Proposed Solutions

### Solution A: Wrap in useCallback (Recommended)
**Pros**: Simple, fixes memoization, minimal change
**Cons**: None
**Effort**: Small (5 min)
**Risk**: None

```typescript
const handleFeedback = useCallback(async (
  messageContent: string,
  responseContent: string,
  rating: 'positive' | 'negative',
) => {
  try {
    await fetch('/api/help/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageContent, responseContent, rating }),
    });
  } catch {
    // Silently fail
  }
}, []); // No dependencies - feedback endpoint is static
```

**Expected Performance Gain**: 90-95% reduction in re-renders for non-streaming messages.

## Technical Details

- **Affected Files**: `apps/web/components/help-widget/help-chat-widget.tsx`
- **Components**: handleFeedback, ChatBubble
- **Database Changes**: None

## Acceptance Criteria

- [ ] handleFeedback wrapped in useCallback with empty deps
- [ ] ChatBubble memoization verified working
- [ ] No regression in feedback functionality

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Performance review finding |

## Resources

- Agent: performance-oracle review
