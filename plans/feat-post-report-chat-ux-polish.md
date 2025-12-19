# feat: Post-Report Chat UX Polish (Claude-Quality Experience)

## Overview

Transform the post-report chat from functional to delightful by implementing Claude.ai-quality UX patterns: beautiful markdown rendering, smart scroll behavior, stream cancellation, and persistent chat history.

## Problem Statement

The current chat implementation has several UX issues:
1. **No markdown rendering** - Chat bubbles show plain text only, no code highlighting or formatting
2. **Aggressive auto-scroll** - Forces user to bottom on every token, can't read history while streaming
3. **No cancellation** - Can't stop a long streaming response mid-generation
4. **History not loading** - Chat history exists in DB but doesn't load on component mount
5. **No visual polish** - Missing typing indicators, smooth animations, and modern chat patterns

## Current Implementation

**Files involved:**
- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx:76-658` - Chat UI & state
- `apps/web/app/api/sparlo/chat/route.ts` - SSE streaming API
- Database: `chat_history` JSONB column on `sparlo_reports` table (already exists)

**What works:**
- SSE streaming from Claude API
- Message append via `append_chat_messages` RPC function
- Rate limiting (30/hour, 150/day)
- Basic chat drawer UI with Framer Motion animations

**What's broken:**
- History not loaded on mount (line 92-98 - starts with empty array)
- No AbortController for cancellation
- No markdown in chat bubbles (line 609 - just `whitespace-pre-wrap`)
- Auto-scroll on every update (line 135-138)

---

## Proposed Solution

### Phase 1: Type Safety & Data Loading

**Goal:** Fix type mismatches, validate database data, load history correctly.

#### 1.1 Define Proper Types

```typescript
// apps/web/app/home/(user)/reports/[id]/_lib/schemas/chat.schema.ts
import { z } from 'zod';

// Database schema (matches JSONB storage)
export const ChatMessageDBSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string(),
});

export const ChatHistoryDBSchema = z.array(ChatMessageDBSchema);

export type ChatMessageDB = z.infer<typeof ChatMessageDBSchema>;

// Client-side type (includes runtime state)
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isStreaming?: boolean;
  cancelled?: boolean;
  error?: string;
}

// Transform DB → Client format
export function transformDBToClient(
  messages: ChatMessageDB[],
  baseTimestamp = Date.now()
): ChatMessage[] {
  return messages.map((msg, index) => ({
    id: `history-${index}-${baseTimestamp}`,
    role: msg.role,
    content: msg.content,
    isStreaming: false,
  }));
}
```

#### 1.2 Create Validated History Loader

```typescript
// apps/web/app/home/(user)/reports/[id]/_lib/server/chat.loader.ts
import 'server-only';
import { getSupabaseServerClient } from '@kit/supabase/server-client';
import { ChatHistoryDBSchema, transformDBToClient, type ChatMessage } from '../schemas/chat.schema';

export async function loadChatHistory(reportId: string): Promise<ChatMessage[]> {
  const client = getSupabaseServerClient();

  const { data, error } = await client
    .from('sparlo_reports')
    .select('chat_history')
    .eq('id', reportId)
    .single();

  if (error) {
    console.error('[loadChatHistory] Database error:', error);
    return []; // Graceful fallback
  }

  // Validate the database data with Zod
  const validation = ChatHistoryDBSchema.safeParse(data?.chat_history);

  if (!validation.success) {
    console.error('[loadChatHistory] Invalid chat history format:', validation.error);
    return []; // Graceful fallback for corrupt data
  }

  return transformDBToClient(validation.data);
}
```

#### 1.3 Update Page to Load History

```typescript
// apps/web/app/home/(user)/reports/[id]/page.tsx
import { loadChatHistory } from './_lib/server/chat.loader';

export default async function ReportPage({ params }: Props) {
  const { id } = await params;
  const report = await loadReport(id);

  // Load chat history in parallel with report
  const initialChatHistory = await loadChatHistory(id);

  return (
    <ReportDisplay
      report={report}
      initialChatHistory={initialChatHistory}
    />
  );
}
```

#### 1.4 Update Component Props & State

```typescript
// report-display.tsx
import type { ChatMessage } from '../_lib/schemas/chat.schema';

interface ReportDisplayProps {
  report: Report;
  isProcessing?: boolean;
  initialChatHistory?: ChatMessage[];
}

export function ReportDisplay({
  report,
  isProcessing,
  initialChatHistory = []
}: ReportDisplayProps) {
  // Initialize with validated history
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(initialChatHistory);
  // ... rest of component
}
```

---

### Phase 2: Stream Cancellation with Proper Error Handling

**Goal:** User can stop streaming with robust error handling and state management.

#### 2.1 Add AbortController with Safe Cleanup

```typescript
// report-display.tsx - Add to component
const abortControllerRef = useRef<AbortController | null>(null);

const cancelStream = useCallback(() => {
  abortControllerRef.current?.abort();
  abortControllerRef.current = null;
}, []);

// Cleanup on unmount
useEffect(() => {
  return () => cancelStream();
}, [cancelStream]);
```

#### 2.2 Update handleChatSubmit with Error Handling

```typescript
const handleChatSubmit = useCallback(async (e: React.FormEvent) => {
  e.preventDefault();
  if (!chatInput.trim() || isChatLoading) return;

  const userMessage = chatInput.trim();
  setChatInput('');

  // Cancel any existing stream
  cancelStream();
  abortControllerRef.current = new AbortController();

  const userMessageId = `user-${Date.now()}`;
  const assistantMessageId = `assistant-${Date.now()}`;

  // Add user message
  setChatMessages(prev => [
    ...prev,
    { id: userMessageId, role: 'user', content: userMessage }
  ]);

  // Add empty assistant message (streaming placeholder)
  setChatMessages(prev => [
    ...prev,
    { id: assistantMessageId, role: 'assistant', content: '', isStreaming: true }
  ]);

  setIsChatLoading(true);

  try {
    const response = await fetch('/api/sparlo/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reportId: report.id, message: userMessage }),
      signal: abortControllerRef.current.signal,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();
    let assistantContent = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const parsed = JSON.parse(line.slice(6));
            if (parsed.text) {
              assistantContent += parsed.text;
              setChatMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: assistantContent }
                    : msg
                )
              );
            }
            if (parsed.done) {
              // Mark as complete
              setChatMessages(prev =>
                prev.map(msg =>
                  msg.id === assistantMessageId
                    ? { ...msg, isStreaming: false }
                    : msg
                )
              );
              if (parsed.saved === false) {
                toast.warning('Message may not be saved to history');
              }
            }
          } catch {
            // Ignore parse errors for partial chunks
          }
        }
      }
    }
  } catch (err) {
    // Handle user-initiated cancellation
    if (err instanceof Error && err.name === 'AbortError') {
      setChatMessages(prev =>
        prev.map(msg =>
          msg.id === assistantMessageId
            ? { ...msg, isStreaming: false, cancelled: true }
            : msg
        )
      );
      return; // Don't show error for intentional cancellation
    }

    // Handle other errors
    console.error('[Chat] Error:', err);
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';

    setChatMessages(prev =>
      prev.map(msg =>
        msg.id === assistantMessageId
          ? { ...msg, isStreaming: false, error: errorMessage }
          : msg
        )
    );

    toast.error('Failed to send message. Please try again.');
  } finally {
    setIsChatLoading(false);
    abortControllerRef.current = null;
  }
}, [chatInput, isChatLoading, report.id, cancelStream]);
```

#### 2.3 Cancel Button UI

```tsx
// In the form area - replace send button during streaming
{isChatLoading ? (
  <Button
    type="button"
    variant="ghost"
    size="icon"
    onClick={cancelStream}
    className="hover:bg-destructive/10"
  >
    <Square className="h-4 w-4 fill-current" />
    <span className="sr-only">Stop generating</span>
  </Button>
) : (
  <Button
    type="submit"
    size="icon"
    disabled={!chatInput.trim()}
  >
    <Send className="h-4 w-4" />
    <span className="sr-only">Send message</span>
  </Button>
)}
```

#### 2.4 Error & Cancelled State UI

```tsx
// In message rendering
{message.cancelled && (
  <span className="text-xs text-muted-foreground italic block mt-1">
    Response stopped
  </span>
)}

{message.error && (
  <div className="text-xs text-destructive mt-1 flex items-center gap-2">
    <span>Error: {message.error}</span>
    <Button
      size="sm"
      variant="ghost"
      className="h-6 px-2 text-xs"
      onClick={() => {
        // Remove failed message and retry
        setChatMessages(prev => prev.filter(m => m.id !== message.id));
        // Re-trigger with the original user message
        const userMsg = chatMessages.find(
          (m, i) => m.role === 'user' && chatMessages[i + 1]?.id === message.id
        );
        if (userMsg) {
          setChatInput(userMsg.content);
        }
      }}
    >
      Retry
    </Button>
  </div>
)}
```

---

### Phase 3: Smart Scroll Behavior

**Goal:** User can scroll up during streaming without being auto-dragged down.

#### 3.1 Optimized Scroll Detection (No Re-render Per Pixel)

```typescript
// Use ref to track scroll state without causing re-renders
const isUserNearBottomRef = useRef(true);
const chatContainerRef = useRef<HTMLDivElement>(null);

// Check scroll position only when we need to auto-scroll
const checkAndAutoScroll = useCallback(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  const threshold = 100;
  const isNearBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

  if (isNearBottom) {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, []);

// Auto-scroll when messages update (if user is near bottom)
useEffect(() => {
  checkAndAutoScroll();
}, [chatMessages, checkAndAutoScroll]);
```

#### 3.2 Scroll-to-Bottom Button (Shows When Scrolled Up During Streaming)

```typescript
const [showScrollButton, setShowScrollButton] = useState(false);

// Throttled scroll handler for button visibility only
const handleScroll = useCallback(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  const threshold = 100;
  const isNearBottom =
    container.scrollHeight - container.scrollTop - container.clientHeight < threshold;

  isUserNearBottomRef.current = isNearBottom;

  // Only show button when scrolled up AND actively streaming
  setShowScrollButton(!isNearBottom && isChatLoading);
}, [isChatLoading]);

// Attach scroll listener
useEffect(() => {
  const container = chatContainerRef.current;
  if (!container) return;

  container.addEventListener('scroll', handleScroll, { passive: true });
  return () => container.removeEventListener('scroll', handleScroll);
}, [handleScroll]);
```

```tsx
// Scroll-to-bottom button UI
<AnimatePresence>
  {showScrollButton && (
    <motion.button
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      onClick={() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        setShowScrollButton(false);
      }}
      className="absolute bottom-20 right-4 rounded-full bg-primary p-2 shadow-lg hover:bg-primary/90 transition-colors"
    >
      <ArrowDown className="h-4 w-4 text-primary-foreground" />
      <span className="sr-only">Scroll to latest</span>
    </motion.button>
  )}
</AnimatePresence>
```

---

### Phase 4: Markdown Rendering

**Goal:** Chat messages render with beautiful markdown like Claude.ai.

#### 4.1 Install Syntax Highlighting

```bash
pnpm add react-syntax-highlighter --filter @kit/web
pnpm add -D @types/react-syntax-highlighter --filter @kit/web
```

#### 4.2 Create Markdown Component (Inline in report-display.tsx)

```typescript
// At the top of report-display.tsx, add imports
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';
import type { Components } from 'react-markdown';

// Memoized markdown components (define once, outside component)
const markdownComponents: Components = {
  code({ inline, className, children, ...props }) {
    const match = /language-(\w+)/.exec(className ?? '');
    const language = match?.[1];
    const codeString = Array.isArray(children)
      ? children.join('')
      : String(children).replace(/\n$/, '');

    if (!inline && language) {
      return (
        <div className="relative group my-2">
          <button
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(codeString);
                toast.success('Copied to clipboard');
              } catch {
                toast.error('Failed to copy');
              }
            }}
            className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity p-1.5 rounded bg-white/10 hover:bg-white/20"
          >
            <Copy className="h-3.5 w-3.5 text-gray-300" />
          </button>
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="rounded-lg !my-0"
            {...props}
          >
            {codeString}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
        {children}
      </code>
    );
  },
  p: ({ children }) => <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc pl-5 space-y-1">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal pl-5 space-y-1">{children}</ol>,
  li: ({ children }) => <li className="leading-relaxed">{children}</li>,
  a: ({ href, children }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline hover:no-underline"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="border-l-4 border-muted pl-4 italic my-3">
      {children}
    </blockquote>
  ),
};
```

#### 4.3 Render Markdown in Messages

```tsx
// In message rendering
{message.role === 'assistant' ? (
  <div className="prose prose-sm dark:prose-invert max-w-none">
    <ReactMarkdown components={markdownComponents}>
      {message.content}
    </ReactMarkdown>
    {message.isStreaming && (
      <span className="inline-block w-2 h-4 bg-foreground/70 animate-pulse ml-0.5" />
    )}
  </div>
) : (
  <p className="whitespace-pre-wrap">{message.content}</p>
)}
```

---

### Phase 5: Visual Polish & Accessibility

**Goal:** Match Claude.ai's smooth, polished feel with proper accessibility.

#### 5.1 Typing Indicator (CSS-only, inline)

```tsx
// Show when streaming and content is empty
{message.isStreaming && !message.content && (
  <div className="flex items-center gap-1.5 py-1">
    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse" />
    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:150ms]" />
    <span className="h-2 w-2 rounded-full bg-muted-foreground/60 animate-pulse [animation-delay:300ms]" />
  </div>
)}
```

#### 5.2 Message Animations

```tsx
// Wrap message list with AnimatePresence
<AnimatePresence mode="sync" initial={false}>
  {chatMessages.map((message, index) => {
    const isNewMessage = index === chatMessages.length - 1;

    return (
      <motion.div
        key={message.id}
        initial={isNewMessage ? { opacity: 0, y: 8 } : false}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
        className={cn(
          'flex',
          message.role === 'user' ? 'justify-end' : 'justify-start'
        )}
      >
        {/* Message bubble */}
      </motion.div>
    );
  })}
</AnimatePresence>
```

#### 5.3 Keyboard Shortcuts

```tsx
const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
  // Send on Cmd/Ctrl + Enter
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter' && chatInput.trim()) {
    e.preventDefault();
    handleChatSubmit(e as unknown as React.FormEvent);
    return;
  }

  // Cancel on Escape (only if streaming)
  if (e.key === 'Escape' && isChatLoading) {
    e.preventDefault();
    cancelStream();
  }
}, [chatInput, isChatLoading, handleChatSubmit, cancelStream]);
```

#### 5.4 Accessibility (ARIA)

```tsx
// Chat container
<div
  ref={chatContainerRef}
  role="log"
  aria-live="polite"
  aria-label="Chat conversation"
  className="flex-1 overflow-y-auto p-4 space-y-4"
>
  {chatMessages.map((message) => (
    <div
      key={message.id}
      role="article"
      aria-label={`${message.role === 'user' ? 'You' : 'AI'}: ${message.content.slice(0, 50)}...`}
    >
      {/* Message content */}
    </div>
  ))}
</div>

// Input area
<form onSubmit={handleChatSubmit} aria-label="Send message">
  <label htmlFor="chat-input" className="sr-only">
    Your message
  </label>
  <Textarea
    id="chat-input"
    value={chatInput}
    onChange={(e) => setChatInput(e.target.value)}
    onKeyDown={handleKeyDown}
    placeholder="Ask about your report..."
    disabled={isChatLoading}
    aria-busy={isChatLoading}
  />
</form>
```

---

## Acceptance Criteria

### Functional Requirements

- [ ] Chat history loads from database when component mounts
- [ ] Invalid/corrupt chat history gracefully falls back to empty array
- [ ] User can scroll up during streaming without being auto-dragged down
- [ ] "Scroll to latest" button appears when scrolled up during streaming
- [ ] Stop button cancels streaming response mid-generation
- [ ] Cancelled messages show "Response stopped" indicator
- [ ] Failed messages show error with retry option
- [ ] All markdown renders correctly (code blocks, lists, links, bold, italic)
- [ ] Code blocks have syntax highlighting
- [ ] Code blocks have copy-to-clipboard button
- [ ] Typing indicator (dots) shows while waiting for first token
- [ ] Streaming cursor shows during active streaming
- [ ] Messages animate smoothly on entrance
- [ ] Cmd/Ctrl + Enter sends message
- [ ] Escape cancels streaming

### Non-Functional Requirements

- [ ] Renders 100 messages without noticeable lag
- [ ] Scroll detection doesn't cause re-renders on every pixel
- [ ] No layout shift during streaming
- [ ] Accessible: ARIA roles, keyboard navigation, screen reader support

### Quality Gates

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint:fix` passes
- [ ] Manual test: Load report with existing history
- [ ] Manual test: Load report with corrupt history (should show empty)
- [ ] Manual test: Scroll up during streaming
- [ ] Manual test: Cancel mid-stream
- [ ] Manual test: Network error during stream (shows error + retry)
- [ ] Manual test: Code block rendering and copy

---

## Technical Considerations

### Dependencies to Add

```bash
pnpm add react-syntax-highlighter --filter @kit/web
pnpm add -D @types/react-syntax-highlighter --filter @kit/web
```

**Note:** `react-markdown` and `zod` are already installed.

### Files to Create

```
apps/web/app/home/(user)/reports/[id]/
└── _lib/
    ├── schemas/
    │   └── chat.schema.ts      # Zod schemas + types + transform
    └── server/
        └── chat.loader.ts      # Validated history loader
```

### Files to Modify

- `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx`
  - Accept `initialChatHistory` prop
  - Add AbortController logic
  - Add smart scroll behavior
  - Add markdown rendering
  - Add accessibility attributes

- `apps/web/app/home/(user)/reports/[id]/page.tsx`
  - Load chat history in server component
  - Pass to client component

---

## References

### Internal References

- Current chat implementation: `apps/web/app/home/(user)/reports/[id]/_components/report-display.tsx:76-658`
- Chat API route: `apps/web/app/api/sparlo/chat/route.ts`
- Database migration: `apps/web/supabase/migrations/20251215000000_add_chat_history.sql`
- Atomic append function: `apps/web/supabase/migrations/20251217185148_chat_atomic_append.sql`
- Project conventions: `CLAUDE.md`, `apps/web/CLAUDE.md`

### External References

- [react-markdown docs](https://github.com/remarkjs/react-markdown)
- [react-syntax-highlighter themes](https://github.com/react-syntax-highlighter/react-syntax-highlighter/blob/master/AVAILABLE_STYLES_PRISM.MD)
- [AbortController API - MDN](https://developer.mozilla.org/en-US/docs/Web/API/AbortController)
- [Framer Motion AnimatePresence](https://motion.dev/docs/react-animate-presence)

---

## Edge Cases Handled

1. **Empty history** - Returns empty array, component renders normally
2. **Malformed JSONB** - Zod validation fails gracefully, returns empty array, logs error
3. **Network interruption** - Shows error state on message with retry button
4. **User cancellation** - Marks message as cancelled, no error toast
5. **Concurrent messages** - Cancels previous stream before starting new one
6. **Component unmount during stream** - AbortController cleanup in useEffect
7. **Clipboard permission denied** - Shows error toast, doesn't crash
8. **Very long messages** - Prose styles handle overflow, no virtualization needed for <100 messages
