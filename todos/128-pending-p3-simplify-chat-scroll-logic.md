---
status: pending
priority: p3
issue_id: 128
tags: [code-review, simplicity, yagni, chat-components]
dependencies: []
---

# Simplify Chat Auto-Scroll Logic

## Problem Statement

The scroll tracking logic uses complex refs and effects with a 100px threshold to detect if user has scrolled up. This is premature optimization for uncertain value.

**Why it matters**: Adds 20 lines of complexity for a feature that may not be needed. Standard chat UX auto-scrolls.

## Findings

**Location**: `/apps/web/app/home/(user)/reports/[id]/_components/chat/chat-messages.tsx` (lines 32-57)

**Current** (23 lines):
```typescript
const bottomRef = useRef<HTMLDivElement>(null);
const containerRef = useRef<HTMLDivElement>(null);
const userScrolledRef = useRef(false);

useEffect(() => {
  const container = containerRef.current;
  if (!container) return;
  const handleScroll = () => {
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
    userScrolledRef.current = !isNearBottom;
  };
  container.addEventListener('scroll', handleScroll, { passive: true });
  return () => container.removeEventListener('scroll', handleScroll);
}, []);

useEffect(() => {
  if (!userScrolledRef.current) {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages.length, isStreaming]);
```

**Simplified** (5 lines):
```typescript
const endRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  endRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages.length]);
```

## Proposed Solutions

### Option A: Simple auto-scroll (Recommended)
Remove scroll tracking, always auto-scroll on new messages.

**Pros**: 18 lines saved, simpler to understand
**Cons**: Loses "preserve scroll" feature
**Effort**: 10 minutes
**Risk**: Low

### Option B: Keep as-is
Current implementation works, just complex.

**Pros**: Preserves scroll position feature
**Cons**: YAGNI - may not be used
**Effort**: None
**Risk**: None

## Recommended Action

Implement Option A - most chat apps auto-scroll and users expect it.

## Technical Details

**Affected files**:
- `/apps/web/app/home/(user)/reports/[id]/_components/chat/chat-messages.tsx`

## Acceptance Criteria

- [ ] Scroll tracking logic removed
- [ ] Simple auto-scroll on new messages
- [ ] 15+ lines removed
- [ ] Functionality verified

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Simplicity reviewer identified as YAGNI |

## Resources

- Commit: 91f42b1
