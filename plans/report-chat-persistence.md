# feat: Persistent Report Chat with Claude Opus 4.5

> **Simplified based on DHH, Kieran, and Simplicity reviews**

## Overview

Enable persistent chat functionality on completed reports. Chat history saved per-report in DB, users can return later and continue conversations.

## Problem Statement

**Current:** Chat history lost on page refresh (stored only in `useState`)
**Desired:** User opens report → sees previous chat → continues seamlessly

## Minimal Implementation (3 Changes)

### 1. Database Migration

**File:** `apps/web/supabase/migrations/YYYYMMDDHHMMSS_add_chat_history.sql`

```sql
ALTER TABLE sparlo_reports ADD COLUMN chat_history JSONB DEFAULT '[]'::jsonb;
```

### 2. Modify `use-chat.ts`

Pass `reportId` and `initialMessages`. Hook owns its own persistence.

```typescript
interface UseChatProps {
  reportId: string | null;
  reportMarkdown: string | null;
  conversationTitle: string;
  initialMessages?: ChatMessage[];
}

export function useChat({
  reportId,
  reportMarkdown,
  conversationTitle,
  initialMessages = [],
}: UseChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);

  // Save when messages change (hook owns persistence)
  useEffect(() => {
    if (messages.length > 0 && reportId) {
      updateReport({ id: reportId, chat_history: messages }).catch(console.error);
    }
  }, [messages, reportId]);

  // ... existing streaming logic
}
```

### 3. Update `page.tsx`

```typescript
const chatHistory = currentReport?.chat_history ?? [];

const chat = useChat({
  reportId: state.activeReportId,
  initialMessages: chatHistory,
  reportMarkdown: reportData?.report_markdown ?? null,
  conversationTitle: activeConversation?.title ?? 'Report',
});
```

## Technical Details

### Timestamp Serialization

Store as ISO strings in DB, use Date objects in UI:

```typescript
// When saving (in useChat effect)
const serialized = messages.map(m => ({
  ...m,
  timestamp: m.timestamp instanceof Date ? m.timestamp.toISOString() : m.timestamp,
}));

// When loading (in page.tsx)
const chatHistory = (currentReport?.chat_history ?? []).map(m => ({
  ...m,
  timestamp: new Date(m.timestamp),
}));
```

### Abort Controller for Report Switching

Prevent messages from wrong report being saved:

```typescript
const abortControllerRef = useRef<AbortController | null>(null);

useEffect(() => {
  return () => {
    abortControllerRef.current?.abort();
  };
}, [reportId]);
```

## Acceptance Criteria

- [ ] Chat messages persist across page refresh
- [ ] Chat messages persist across browser sessions
- [ ] Opening report from sidebar loads chat history
- [ ] Messages saved after each exchange
- [ ] TypeScript compiles with no errors

## What's NOT in MVP (Deferred)

Per reviewer feedback, these are explicitly deferred:

- ❌ GIN index on JSONB (add when search is built)
- ❌ Loading spinner for chat history (report loading handles it)
- ❌ History indicator dot on button
- ❌ Conditional suggested prompts
- ❌ Retry logic (Supabase is reliable)
- ❌ Pagination (add when someone hits 100 messages)
- ❌ Zod validation on load (trust our own DB)

## Files to Change

| File | Change |
|------|--------|
| `supabase/migrations/xxx_add_chat_history.sql` | Add column |
| `_lib/use-chat.ts` | Accept reportId + initialMessages, add persistence |
| `page.tsx` | Pass chat history to useChat |
| `server/sparlo-reports-server-actions.ts` | Add chat_history to schema |
| `server/sparlo-reports.loader.ts` | Select chat_history column |

## References

- Chat hook: `apps/web/app/home/(user)/_lib/use-chat.ts`
- Server actions: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- PR #25: Foundation stability improvements

---

*Plan updated: 2025-12-15 (simplified per code review)*
