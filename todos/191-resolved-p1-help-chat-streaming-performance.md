---
status: resolved
priority: p1
issue_id: 191
tags: [code-review, performance, help-chat]
dependencies: []
---

# Excessive Re-renders During Streaming - O(n²) Performance

## Problem Statement

The Help Center chat triggers a full React re-render on every streaming chunk. Each chunk also causes ReactMarkdown to re-parse the entire accumulated content. For a 1000-character response with 100 chunks, this means parsing 500,000 total characters cumulatively.

**Impact:** UI blocking during streaming, poor perceived performance, battery drain on mobile.

## Findings

**Location:** `apps/web/app/home/[account]/help/_components/help-chat.tsx:166-173`

```typescript
setMessages((prev) => {
  const updated = [...prev];  // ❌ Full array copy on every chunk
  const lastIdx = updated.length - 1;
  if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
    updated[lastIdx] = { ...updated[lastIdx], content: fullResponse };
  }
  return updated;
});
```

**Projected Impact:**
- 2000-char response: ~2ms per chunk × 100 chunks = **200ms UI blocking**
- 10 concurrent chats: **2 seconds of combined parsing time**

**Complexity Analysis:**
- Time: O(n²) where n = response length
- Space: O(n×m) where m = message count

## Proposed Solutions

### Option A: Debounced State Updates (Recommended)

**Pros:** 85% reduction in re-renders, minimal code change
**Cons:** Slight delay in UI updates (50ms)
**Effort:** Small (2 hours)
**Risk:** Very low

```typescript
const debouncedUpdate = useMemo(
  () => debounce((content: string) => {
    setMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
        updated[lastIdx] = { ...updated[lastIdx], content };
      }
      return updated;
    });
  }, 50), // Update UI every 50ms instead of every chunk
  []
);

// In streaming loop:
fullResponse += text;
debouncedUpdate(fullResponse);
```

### Option B: Separate Streaming State

**Pros:** Optimal - avoids re-parsing history entirely
**Cons:** More complex state management
**Effort:** Medium (3 hours)
**Risk:** Low

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [streamingMessage, setStreamingMessage] = useState<string | null>(null);

// Render streaming message separately
{messages.map(msg => <ChatBubble message={msg} />)}
{streamingMessage && <ChatBubble message={{ content: streamingMessage, role: 'assistant' }} isStreaming />}
```

### Option C: Delay Markdown Parsing Until Complete

**Pros:** 80% reduction in parsing overhead
**Cons:** No markdown formatting during stream
**Effort:** Tiny (30 minutes)
**Risk:** None

```typescript
{isStreaming ? (
  <pre className="whitespace-pre-wrap">{message.content}</pre>
) : (
  <ReactMarkdown>{message.content}</ReactMarkdown>
)}
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/home/[account]/help/_components/help-chat.tsx` (lines 156-173, 362-367)

**Components:** HelpChat, ChatBubble

## Acceptance Criteria

- [ ] Re-render frequency reduced by 80%+
- [ ] No visible lag during streaming
- [ ] Final message renders correctly with markdown
- [ ] Performance benchmark: <50ms total blocking for 2000-char response
- [ ] Memory usage stable during long streams

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from performance review | String concatenation + ReactMarkdown = O(n²) nightmare |

## Resources

- Performance audit estimated 70-90% reduction in CPU with these fixes
- React useDeferredValue/useTransition could also help
