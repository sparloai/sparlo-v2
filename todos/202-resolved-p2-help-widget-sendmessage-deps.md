---
status: pending
priority: p2
issue_id: 202
tags: [code-review, performance, help-center]
dependencies: []
---

# sendMessage Callback Recreated on Every Message

## Problem Statement

The `sendMessage` callback includes the entire `messages` array as a dependency, causing it to be recreated on every message update. This leads to callback recreation 20+ times per conversation and potential memory issues from retained closures.

## Findings

**Location**: `apps/web/components/help-widget/help-chat-widget.tsx` (line 74)

**Current Code**:
```typescript
const sendMessage = useCallback(async () => {
  // ...
  body: JSON.stringify({
    message: userMessage.content,
    history: messages.map((m) => ({ role: m.role, content: m.content })),
  }),
  // ...
}, [input, isStreaming, messages]); // messages causes recreation
```

**Performance Impact**:
- Callback recreated 20+ times per conversation
- At 10x scale: 200 callback recreations + closure overhead
- Memory bloat from retained closures until GC

## Proposed Solutions

### Solution A: Use Ref for Messages (Recommended)
**Pros**: Eliminates dependency, no callback recreation
**Cons**: Slightly more code
**Effort**: Small (10 min)
**Risk**: Low

```typescript
const messagesRef = useRef<ChatMessage[]>([]);

useEffect(() => {
  messagesRef.current = messages;
}, [messages]);

const sendMessage = useCallback(async () => {
  // Use messagesRef.current instead of messages
  body: JSON.stringify({
    message: userMessage.content,
    history: messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
  }),
}, [input, isStreaming]); // messages removed from dependencies
```

## Technical Details

- **Affected Files**: `apps/web/components/help-widget/help-chat-widget.tsx`
- **Components**: sendMessage callback
- **Database Changes**: None

## Acceptance Criteria

- [ ] messagesRef created and synced with messages state
- [ ] sendMessage uses messagesRef.current instead of messages
- [ ] messages removed from sendMessage dependencies
- [ ] Functionality unchanged

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Performance review finding |

## Resources

- Agent: performance-oracle review
