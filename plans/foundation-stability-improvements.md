# Foundation Stability Improvements Plan

## Executive Summary

This plan addresses critical stability and reliability issues across the Sparlo frontend and backend codebases to create a robust foundation before adding new features. Based on comprehensive analysis of both codebases and their API interactions, this plan prioritizes fixes by severity and impact.

---

## Problem Areas Identified

### P0 - Critical (Must Fix)

| Issue | Location | Impact |
|-------|----------|--------|
| No timeout on chat API calls | Frontend: `page.tsx:509-562`, Backend: `chain.py:87-154` | User frozen indefinitely if backend hangs |
| Polling has no timeout/circuit breaker | Frontend: `use-sparlo.ts:460-563` | Orphaned polling threads, wasted resources |
| Race condition on first message | Frontend: `use-sparlo.ts:731-784` | Lost messages during report creation |
| No Error Boundary | Frontend: `page.tsx` | Crash = blank screen, no recovery |
| Backend streaming chat not implemented | Backend: `main.py` | Chat streaming silently fails |

### P1 - High Priority

| Issue | Location | Impact |
|-------|----------|--------|
| Giant component files | Frontend: `page.tsx` (1,315 lines), `use-sparlo.ts` (1,120 lines) | Hard to maintain, test, debug |
| 8+ useState calls in page | Frontend: `page.tsx:87-102` | State management complexity |
| No client-side rate limiting | Frontend: `page.tsx` | Can spam backend, hit rate limits |
| Full report sent on every chat | Frontend: `page.tsx:495-507` | Wasteful, potential token overflow |
| Clarification handling duplicated | Frontend: `use-sparlo.ts` (3 places) | Inconsistent behavior, bugs |

### P2 - Medium Priority

| Issue | Location | Impact |
|-------|----------|--------|
| Type coercions bypass safety | Frontend: `use-sparlo.ts:508`, server actions | Runtime type errors possible |
| Patent cache unbounded | Backend: `patent_grounding.py:28` | Memory growth over time |
| No offline detection | Frontend | Bad UX when network fails |
| TOC regeneration on every render | Frontend: `page.tsx:127-141` | Performance impact |

---

## Implementation Plan

### Phase 1: Critical Stability (P0 Fixes)

#### 1.1 Add Request Timeouts (Frontend + Backend)

**Frontend - Chat API timeout**

File: `apps/web/app/home/(user)/page.tsx`

```typescript
// Add AbortController with timeout for chat requests
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

try {
  const response = await fetch('/api/sparlo/chat', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message, conversationId }),
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  // ... handle response
} catch (error) {
  clearTimeout(timeoutId);
  if (error.name === 'AbortError') {
    dispatch({ type: 'SET_ERROR', payload: 'Request timed out. Please try again.' });
  } else {
    handleError(error);
  }
}
```

**Backend - LLM call timeout**

File: `sparlo-backend/chain.py`

```python
# In call_llm function, add timeout parameter
def call_llm(step: str, ..., timeout: float = 60.0) -> str:
    try:
        response = client.messages.create(
            model=model_name,
            max_tokens=max_tokens,
            messages=messages,
            timeout=timeout,  # Add explicit timeout
        )
    except anthropic.APITimeoutError:
        logger.error(f"LLM timeout in {step}")
        raise TimeoutError(f"LLM call timed out in {step}")
```

#### 1.2 Polling Circuit Breaker with Exponential Backoff

File: `apps/web/app/home/(user)/_lib/use-sparlo.ts`

```typescript
// Add circuit breaker constants
const INITIAL_POLL_INTERVAL = 3000;  // 3 seconds
const MAX_POLL_INTERVAL = 30000;     // 30 seconds max
const MAX_POLL_ERRORS = 5;           // Stop after 5 consecutive errors
const POLL_TIMEOUT = 600000;         // 10 minute total timeout

// Track polling state
const pollErrorCountRef = useRef(0);
const pollStartTimeRef = useRef<number | null>(null);
const currentIntervalRef = useRef(INITIAL_POLL_INTERVAL);

const poll = async () => {
  // Check total timeout
  if (pollStartTimeRef.current && Date.now() - pollStartTimeRef.current > POLL_TIMEOUT) {
    stopPolling();
    dispatch({ type: 'SET_ERROR', payload: 'Processing timed out after 10 minutes.' });
    return;
  }

  try {
    const status = await sparloApi.getStatus(backendConversationId);

    // Reset on success
    pollErrorCountRef.current = 0;
    currentIntervalRef.current = INITIAL_POLL_INTERVAL;

    // ... existing status handling
  } catch (error) {
    pollErrorCountRef.current++;

    if (pollErrorCountRef.current >= MAX_POLL_ERRORS) {
      stopPolling();
      dispatch({ type: 'SET_ERROR', payload: 'Connection lost. Please refresh the page.' });
      return;
    }

    // Exponential backoff
    currentIntervalRef.current = Math.min(
      currentIntervalRef.current * 2,
      MAX_POLL_INTERVAL
    );
  }
};
```

#### 1.3 Fix Race Condition on First Message

File: `apps/web/app/home/(user)/_lib/use-sparlo.ts`

```typescript
// Add message queue instead of flag
const pendingMessagesRef = useRef<string[]>([]);
const isProcessingMessageRef = useRef(false);

const processMessageQueue = async () => {
  if (isProcessingMessageRef.current || pendingMessagesRef.current.length === 0) {
    return;
  }

  isProcessingMessageRef.current = true;
  const message = pendingMessagesRef.current.shift()!;

  try {
    // Process message
    await handleMessage(message);
  } finally {
    isProcessingMessageRef.current = false;
    // Process next in queue if any
    if (pendingMessagesRef.current.length > 0) {
      processMessageQueue();
    }
  }
};

const sendMessage = useCallback((message: string) => {
  pendingMessagesRef.current.push(message);
  processMessageQueue();
}, []);
```

#### 1.4 Add Error Boundary

Create: `apps/web/app/home/(user)/_components/error-boundary.tsx`

```typescript
'use client';

import { Component, ReactNode } from 'react';
import { Button } from '@kit/ui/button';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class SparloErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Sparlo Error Boundary caught:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8">
          <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-xl font-semibold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-4">
            {this.state.error?.message || 'An unexpected error occurred'}
          </p>
          <Button onClick={() => this.setState({ hasError: false })}>
            Try Again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
```

Update: `apps/web/app/home/(user)/page.tsx`

```typescript
import { SparloErrorBoundary } from './_components/error-boundary';

export default function SparloPage() {
  return (
    <SparloErrorBoundary>
      <SparloPageContent />
    </SparloErrorBoundary>
  );
}
```

#### 1.5 Fix Backend Streaming Chat

File: `sparlo-backend/main.py`

```python
# Add streaming support for follow-up chat
from fastapi.responses import StreamingResponse

@app.post("/api/chat/stream")
@limiter.limit("20/minute")
async def chat_stream(request: Request, chat_request: ChatRequest):
    """Streaming endpoint for follow-up chat."""
    conversation_id = chat_request.conversation_id

    if not conversation_id or conversation_id not in conversations:
        raise HTTPException(status_code=404, detail="Conversation not found")

    state = conversations[conversation_id]
    if state.current_step != "complete":
        raise HTTPException(status_code=400, detail="Report not complete")

    async def generate():
        try:
            # Get context from state
            context = f"Report: {state.summary_markdown}\n\nUser question: {chat_request.message}"

            with client.messages.stream(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                messages=[{"role": "user", "content": context}]
            ) as stream:
                for text in stream.text_stream:
                    yield f"data: {json.dumps({'content': text})}\n\n"

            yield "data: [DONE]\n\n"
        except Exception as e:
            logger.error(f"Streaming error: {e}", exc_info=True)
            yield f"data: {json.dumps({'error': str(e)})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "Connection": "keep-alive"}
    )
```

---

### Phase 2: Component Refactoring (P1 Fixes)

#### 2.1 Split page.tsx into Smaller Components

Current: 1,315 lines in one file

Target structure:
```
apps/web/app/home/(user)/
├── page.tsx (200 lines - orchestration only)
├── _components/
│   ├── input-phase.tsx (300 lines)
│   ├── clarification-form.tsx (150 lines)
│   ├── processing-screen.tsx (200 lines)
│   ├── report-view.tsx (400 lines)
│   ├── chat-drawer.tsx (200 lines)
│   ├── toc-sidebar.tsx (100 lines)
│   └── error-boundary.tsx (80 lines)
```

#### 2.2 Split use-sparlo.ts into Smaller Hooks

Current: 1,120 lines in one file

Target structure:
```
apps/web/app/home/(user)/_lib/
├── use-sparlo.ts (200 lines - composition hook)
├── hooks/
│   ├── use-polling.ts (200 lines)
│   ├── use-conversations.ts (250 lines)
│   ├── use-messages.ts (200 lines)
│   └── use-report.ts (150 lines)
├── utils/
│   ├── error-handling.ts (100 lines)
│   └── state-helpers.ts (100 lines)
```

#### 2.3 Consolidate State with useReducer

File: `apps/web/app/home/(user)/page.tsx`

Replace 8+ useState calls with single state object:

```typescript
interface PageState {
  input: string;
  activeSection: string;
  showToc: boolean;
  isChatOpen: boolean;
  chatInput: string;
  chatMessages: ChatMessage[];
  isChatLoading: boolean;
  clarificationResponse: string;
  elapsedSeconds: number;
}

const initialState: PageState = {
  input: '',
  activeSection: 'executive-summary',
  showToc: true,
  isChatOpen: false,
  chatInput: '',
  chatMessages: [],
  isChatLoading: false,
  clarificationResponse: '',
  elapsedSeconds: 0,
};

type PageAction =
  | { type: 'SET_INPUT'; payload: string }
  | { type: 'SET_ACTIVE_SECTION'; payload: string }
  | { type: 'TOGGLE_TOC' }
  | { type: 'OPEN_CHAT' }
  | { type: 'CLOSE_CHAT' }
  | { type: 'SET_CHAT_INPUT'; payload: string }
  | { type: 'ADD_CHAT_MESSAGE'; payload: ChatMessage }
  | { type: 'SET_CHAT_LOADING'; payload: boolean }
  | { type: 'SET_CLARIFICATION_RESPONSE'; payload: string }
  | { type: 'INCREMENT_ELAPSED' }
  | { type: 'RESET_ELAPSED' };

function pageReducer(state: PageState, action: PageAction): PageState {
  switch (action.type) {
    case 'SET_INPUT':
      return { ...state, input: action.payload };
    // ... other cases
    default:
      return state;
  }
}
```

#### 2.4 Add Client-Side Rate Limiting

File: `apps/web/app/home/(user)/_lib/use-sparlo.ts`

```typescript
// Debounce submit button
const SUBMIT_DEBOUNCE_MS = 500;
const lastSubmitRef = useRef<number>(0);

const sendMessage = useCallback(async (message: string) => {
  const now = Date.now();
  if (now - lastSubmitRef.current < SUBMIT_DEBOUNCE_MS) {
    console.warn('Message rate limited');
    return;
  }
  lastSubmitRef.current = now;

  // ... existing logic
}, []);
```

#### 2.5 Optimize Chat Context

File: `apps/web/app/home/(user)/page.tsx`

Instead of sending full report on every chat message:

```typescript
// First chat message: include report context
const isFirstMessage = chatMessages.length === 0;

const chatPayload = isFirstMessage
  ? {
      conversation_id: state.activeConversation?.backendConversationId,
      message: chatInput,
      context: reportData?.report_markdown, // Only on first message
    }
  : {
      conversation_id: state.activeConversation?.backendConversationId,
      message: chatInput,
      // Backend already has context from first message
    };
```

#### 2.6 Extract Clarification Handler

File: `apps/web/app/home/(user)/_lib/utils/clarification-handler.ts`

```typescript
export interface ClarificationResult {
  shouldProceed: boolean;
  response?: ChatResponse;
  error?: string;
}

export async function processClarification(
  conversationId: string,
  message: string,
  isSkip: boolean
): Promise<ClarificationResult> {
  const payload = isSkip
    ? { message: SKIP_CLARIFICATION_MESSAGE, conversation_id: conversationId }
    : { message, conversation_id: conversationId };

  try {
    const response = await sparloApi.chat(payload.message, payload.conversation_id);
    return { shouldProceed: true, response };
  } catch (error) {
    return { shouldProceed: false, error: getSafeErrorMessage(error) };
  }
}
```

---

### Phase 3: Quality Improvements (P2 Fixes)

#### 3.1 Fix Type Coercions

File: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`

```typescript
// Replace unsafe coercions with runtime validation
import { z } from 'zod';

const SparloReportSchema = z.object({
  id: z.string(),
  account_id: z.string(),
  conversation_id: z.string(),
  title: z.string(),
  status: z.enum(['clarifying', 'processing', 'complete', 'error']),
  report_data: z.record(z.unknown()).nullable(),
  messages: z.array(z.unknown()),
  // ... rest of fields
});

// Use in server action
const validated = SparloReportSchema.safeParse(report);
if (!validated.success) {
  throw new Error(`Invalid report data: ${validated.error.message}`);
}
return { success: true, report: validated.data };
```

#### 3.2 Add LRU Cache for Patents

File: `sparlo-backend/patent_grounding.py`

```python
from functools import lru_cache
from datetime import datetime, timedelta

# Replace dict cache with LRU cache
@lru_cache(maxsize=1000)
def get_cached_patent_search(query: str, timestamp_hour: int) -> list:
    """Cache patent searches with 1-hour TTL."""
    # timestamp_hour forces cache invalidation every hour
    return _perform_patent_search(query)

def search_patents(query: str) -> list:
    # Round timestamp to nearest hour for cache key
    timestamp_hour = int(datetime.now().timestamp() // 3600)
    return get_cached_patent_search(query, timestamp_hour)
```

#### 3.3 Add Offline Detection

File: `apps/web/app/home/(user)/_lib/use-sparlo.ts`

```typescript
// Add online/offline detection
const [isOnline, setIsOnline] = useState(true);

useEffect(() => {
  const handleOnline = () => setIsOnline(true);
  const handleOffline = () => setIsOnline(false);

  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', handleOffline);

  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', handleOffline);
  };
}, []);

// Show offline indicator
if (!isOnline) {
  dispatch({ type: 'SET_ERROR', payload: 'You appear to be offline. Please check your connection.' });
}
```

#### 3.4 Memoize TOC Generation

File: `apps/web/app/home/(user)/page.tsx`

```typescript
// Cache regex outside component
const HEADING_REGEX = /^##\s+(.+)$/gm;

// Use stable reference for expensive computation
const tocItems = useMemo((): TocItem[] => {
  if (!reportData?.report_markdown) return [];

  const items: TocItem[] = [];
  let match;

  // Reset regex lastIndex
  HEADING_REGEX.lastIndex = 0;

  while ((match = HEADING_REGEX.exec(reportData.report_markdown)) !== null) {
    items.push({
      id: match[1].toLowerCase().replace(/\s+/g, '-'),
      title: match[1],
    });
  }

  return items;
}, [reportData?.report_markdown]);
```

---

## Files to Modify

### Frontend (`/Users/alijangbar/Desktop/sparlo/apps/web/`)

| File | Changes |
|------|---------|
| `app/home/(user)/page.tsx` | Split into components, add Error Boundary, consolidate useState |
| `app/home/(user)/_lib/use-sparlo.ts` | Add timeouts, circuit breaker, rate limiting, split into hooks |
| `app/home/(user)/_lib/api.ts` | Add request timeout wrapper |
| `app/home/(user)/_components/error-boundary.tsx` | NEW - Error Boundary component |
| `app/home/(user)/_components/input-phase.tsx` | NEW - Extracted from page.tsx |
| `app/home/(user)/_components/processing-screen.tsx` | NEW - Extracted from page.tsx |
| `app/home/(user)/_components/report-view.tsx` | NEW - Extracted from page.tsx |
| `app/home/(user)/_components/chat-drawer.tsx` | NEW - Extracted from page.tsx |
| `app/api/sparlo/chat/route.ts` | Add timeout, fix streaming proxy |

### Backend (`/Users/alijangbar/Desktop/sparlo-backend/`)

| File | Changes |
|------|---------|
| `main.py` | Add `/api/chat/stream` endpoint |
| `chain.py` | Add timeout parameter to `call_llm()` |
| `patent_grounding.py` | Replace dict cache with LRU cache |

---

## Acceptance Criteria

### Phase 1 (P0)
- [ ] Chat requests timeout after 30 seconds with user-friendly error
- [ ] Polling stops after 5 consecutive errors or 10 minutes total
- [ ] Multiple rapid messages are queued, not lost
- [ ] Page crashes show error boundary with retry option
- [ ] Streaming chat works end-to-end

### Phase 2 (P1)
- [ ] No file exceeds 400 lines
- [ ] page.tsx uses single useReducer for local state
- [ ] Submit button debounced (500ms)
- [ ] Chat context optimized (report sent once)
- [ ] Clarification logic in single utility function

### Phase 3 (P2)
- [ ] No `as unknown as` type coercions in production code
- [ ] Patent cache limited to 1000 entries with hourly TTL
- [ ] Offline state detected and shown to user
- [ ] TOC generation doesn't re-run on unrelated state changes

---

## Test Plan

### P0 Tests
1. **Timeout test**: Simulate slow backend, verify 30s timeout fires
2. **Circuit breaker test**: Kill backend mid-polling, verify stops after 5 errors
3. **Race condition test**: Rapidly click submit, verify messages queued
4. **Error boundary test**: Throw error in child component, verify boundary catches
5. **Streaming test**: Send chat message, verify SSE stream works

### P1 Tests
1. **Component render test**: Each extracted component renders independently
2. **State consolidation test**: All actions update state correctly
3. **Rate limit test**: Spam submit button, verify debounce works
4. **Context optimization test**: Verify report sent only on first chat

### P2 Tests
1. **Type safety test**: TypeScript strict mode passes
2. **Cache test**: Patent searches cached and expire after 1 hour
3. **Offline test**: Disable network, verify error shown
4. **Performance test**: TOC doesn't re-render on chat state changes

---

## Implementation Order

1. **Week 1**: Phase 1 (P0 Critical)
   - Day 1-2: Timeouts (frontend + backend)
   - Day 3: Circuit breaker + exponential backoff
   - Day 4: Race condition fix + Error Boundary
   - Day 5: Backend streaming endpoint

2. **Week 2**: Phase 2 (P1 High Priority)
   - Day 1-2: Split page.tsx into components
   - Day 3: Split use-sparlo.ts into hooks
   - Day 4: Consolidate useState → useReducer
   - Day 5: Rate limiting + context optimization

3. **Week 3**: Phase 3 (P2 Medium Priority)
   - Day 1: Type safety fixes
   - Day 2: Patent cache LRU
   - Day 3: Offline detection
   - Day 4: Performance optimizations
   - Day 5: Testing and polish

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Component split breaks existing functionality | Medium | High | Incremental extraction with tests |
| Timeout values too aggressive | Low | Medium | Make configurable via env vars |
| Circuit breaker triggers false positives | Medium | Medium | Tune error threshold in staging |
| Streaming endpoint security | Low | High | Reuse existing auth checks |
| State refactor introduces bugs | Medium | High | Keep old code as fallback branch |
