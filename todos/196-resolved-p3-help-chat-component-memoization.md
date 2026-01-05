---
status: resolved
priority: p3
issue_id: 196
tags: [code-review, performance, help-chat]
dependencies: [191]
---

# Add Component Memoization to Prevent Cascading Re-renders

## Problem Statement

The ChatBubble component re-renders on every parent update, including when other messages change. This causes unnecessary ReactMarkdown parsing for unchanged messages.

**Impact:** Wasted CPU cycles, slower UI updates, poor performance with many messages.

## Findings

**Location:** `apps/web/app/home/[account]/help/_components/help-chat.tsx:337`

```typescript
function ChatBubble({ message, previousMessage, isStreaming, onFeedback }: ChatBubbleProps) {
  // Re-renders on every parent update, even for unchanged messages
}
```

**Issue:** When streaming updates the last message, all previous messages also re-render (due to array spread in state update).

## Proposed Solutions

### Option A: React.memo with Custom Comparison (Recommended)

**Pros:** Prevents re-rendering of unchanged messages
**Cons:** Adds complexity to prop comparison
**Effort:** Small (30 minutes)
**Risk:** Very low

```typescript
const ChatBubble = memo(({
  message,
  previousMessage,
  isStreaming,
  onFeedback
}: ChatBubbleProps) => {
  // ... component implementation
}, (prevProps, nextProps) => {
  // Custom comparison: only re-render if this message changed
  return (
    prevProps.message.content === nextProps.message.content &&
    prevProps.isStreaming === nextProps.isStreaming
  );
});
```

### Option B: Stable Keys + Default Memo

**Pros:** Simpler implementation
**Cons:** Less control over comparison
**Effort:** Tiny (15 minutes)
**Risk:** None

```typescript
const ChatBubble = memo(function ChatBubble({ ... }: ChatBubbleProps) {
  // ... implementation
});

// Ensure stable message IDs as keys
{messages.map(msg => <ChatBubble key={msg.id} message={msg} />)}
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/home/[account]/help/_components/help-chat.tsx` (line 337)

**Dependencies:** Should be implemented after streaming performance fix (#191)

## Acceptance Criteria

- [ ] Unchanged messages don't re-render during streaming
- [ ] React DevTools shows reduced render count
- [ ] No visual regressions
- [ ] Feedback buttons still work

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from performance review | memo() requires stable props/keys |

## Resources

- React.memo docs
- Related: #191 (streaming performance)
