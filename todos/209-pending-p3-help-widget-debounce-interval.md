---
status: pending
priority: p3
issue_id: 209
tags: [code-review, performance, help-center]
dependencies: []
---

# Debounce Interval Could Be More Aggressive

## Problem Statement

The streaming debounce is set to 50ms, but humans can't perceive differences below 100ms for text rendering. Increasing the interval would reduce React reconciliation overhead by 50%.

## Findings

**Location**: `apps/web/components/help-widget/help-chat-widget.tsx` (line 26)

```typescript
const STREAM_DEBOUNCE_MS = 50;
```

**Current Behavior**: UI updates every 50ms during streaming (20 updates/second)

**Analysis**:
- Human perception threshold: ~100-150ms for smooth text rendering
- Current 50ms provides minimal UX benefit over 100ms
- Each update triggers React reconciliation + DOM updates

## Proposed Solutions

### Solution A: Increase to 100ms (Recommended)
**Pros**: 50% fewer updates, no perceptible UX degradation
**Cons**: None
**Effort**: Trivial (1 min)
**Risk**: None

```typescript
const STREAM_DEBOUNCE_MS = 100;
```

**Expected Performance Gain**:
- 50% fewer React reconciliation passes during streaming
- 50% fewer DOM updates
- Improved battery life on mobile devices

## Technical Details

- **Affected Files**: `apps/web/components/help-widget/help-chat-widget.tsx`
- **Components**: Streaming debounce
- **Database Changes**: None

## Acceptance Criteria

- [ ] Debounce increased to 100ms
- [ ] No perceptible UX change in streaming
- [ ] A/B test if concerned (optional)

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Performance review finding |

## Resources

- Agent: performance-oracle review
