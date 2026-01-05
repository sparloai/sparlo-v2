---
status: pending
priority: p2
issue_id: 203
tags: [code-review, performance, help-center]
dependencies: []
---

# Auto-Scroll Causes Janky Animation During Streaming

## Problem Statement

The chat widget triggers smooth scroll animation on every message update during streaming. With 50ms debounce intervals, this causes scroll animation conflicts and janky behavior on lower-end devices.

## Findings

**Location**: `apps/web/components/help-widget/help-chat-widget.tsx` (lines 70-72)

**Current Code**:
```typescript
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);
```

**Performance Impact**:
- During streaming with 50ms debounce: Scroll animation triggered every 50ms
- Browser compositor layer thrashing
- Can cause janky animations on lower-end devices

## Proposed Solutions

### Solution A: Instant Scroll During Streaming (Recommended)
**Pros**: Eliminates animation conflicts, smooth final scroll
**Cons**: None
**Effort**: Small (5 min)
**Risk**: None

```typescript
useEffect(() => {
  if (isStreaming) {
    // Instant scroll during streaming to avoid animation conflicts
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  } else {
    // Smooth scroll for final message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages, isStreaming]);
```

## Technical Details

- **Affected Files**: `apps/web/components/help-widget/help-chat-widget.tsx`
- **Components**: Auto-scroll effect
- **Database Changes**: None

## Acceptance Criteria

- [ ] Scroll uses `instant` behavior during streaming
- [ ] Scroll uses `smooth` behavior when streaming ends
- [ ] No visual regression in scroll behavior

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Performance review finding |

## Resources

- Agent: performance-oracle review
