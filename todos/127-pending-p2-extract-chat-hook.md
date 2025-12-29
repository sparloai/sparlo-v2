---
status: completed
priority: p2
issue_id: 127
tags: [code-review, architecture, agent-native, chat-components]
dependencies: [123]
---

# Extract Chat Business Logic to useChat Hook

## Problem Statement

All chat logic (streaming, error handling, API calls) is embedded in `report-display.tsx` (154 lines). This prevents reuse, makes testing difficult, and violates agent-native principles.

**Why it matters**:
- Cannot reuse chat logic in other components
- Agents cannot programmatically access chat functionality
- Testing requires full component rendering

## Findings

**Location**: `/apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx` (lines 541-695)

**Current embedded logic**:
- Message state management
- Streaming response handling
- AbortController for cancellation
- Error handling and retry
- API fetch logic

## Proposed Solutions

### Option A: Create useChat hook (Recommended)
```typescript
// _lib/hooks/use-chat.ts
export function useChat(reportId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(async (content: string) => {
    // Extract streaming logic from report-display.tsx
  }, [reportId]);

  const cancelStream = useCallback(() => {
    abortControllerRef.current?.abort();
  }, []);

  return { messages, isLoading, error, sendMessage, cancelStream };
}
```

**Pros**: Reusable, testable, agent-native compliant
**Cons**: Requires refactoring
**Effort**: 2-3 hours
**Risk**: Medium

### Option B: Create chat client utility
```typescript
// _lib/client/chat-client.ts
export async function sendChatMessage(reportId: string, message: string) {
  // Non-streaming mode for agents
}
```

**Pros**: Simple programmatic access
**Cons**: Doesn't include streaming
**Effort**: 1 hour
**Risk**: Low

## Recommended Action

Implement Option A - full hook extraction for comprehensive reusability.

## Technical Details

**Affected files**:
- Create: `/apps/web/app/home/(user)/reports/[id]/_lib/hooks/use-chat.ts`
- Modify: `/apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`

## Acceptance Criteria

- [ ] useChat hook created with full functionality
- [ ] report-display.tsx refactored to use hook
- [ ] Hook exported from barrel export
- [ ] Existing functionality preserved
- [ ] Typecheck passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Architecture + agent-native reviewers both flagged |

## Resources

- Commit: 91f42b1
