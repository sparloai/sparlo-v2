# Help Center Security & Performance - Prevention Strategies

**Purpose**: Prevent recurrence of security vulnerabilities, performance issues, and architectural flaws identified during Help Center development.

**Last Updated**: 2026-01-04

---

## 1. Prevention Strategies by Issue Category

### 1.1 Security Vulnerabilities

#### **History Injection Prevention**

**Issue Fixed**: Attacker could inject fake assistant messages by manipulating the history array.

**Prevention Strategy**:
```typescript
// ALWAYS validate conversation history structure
const RequestSchema = z.object({
  history: z.array(...)
    // ✅ REQUIRED: Verify alternating roles
    .refine(
      (arr) => arr.every((item, i) => i === 0 || item.role !== arr[i - 1]?.role),
      'History must alternate between user and assistant'
    )
    // ✅ REQUIRED: Last message must be from assistant
    .refine(
      (arr) => arr.length === 0 || arr[arr.length - 1]?.role === 'assistant',
      'Last message in history must be from assistant'
    )
});
```

**Rule**: Never trust client-provided conversation history without server-side validation of:
1. Role alternation (no consecutive messages from same role)
2. Conversation state (must end with assistant if non-empty)
3. Content sanitization (use `sanitizeForPrompt()`)

---

#### **Unbounded Data Submission Prevention (DoS)**

**Issue Fixed**: Escalation endpoint accepted unlimited conversation data, enabling DoS attacks.

**Prevention Strategy**:

**Client-Side Limits** (UX optimization):
```typescript
// Truncate before sending
chatHistory: messages
  .slice(-20)                    // Last 20 messages only
  .map((m) => ({
    role: m.role,
    content: m.content.slice(0, 2000)  // Max 2KB per message
  }))
```

**Server-Side Validation** (security enforcement):
```typescript
const EscalateSchema = z.object({
  chatHistory: z
    .array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(2000)  // Per-message limit
    }))
    .max(20),  // Max messages
  reason: z.string().max(500)
});
```

**Rule**: Implement defense-in-depth for user-submitted data:
1. Client-side truncation (UX - avoids failed submissions)
2. Server-side validation (security - cannot be bypassed)
3. Never trust client-side limits alone

---

#### **XSS via Protocol Injection Prevention**

**Issue Fixed**: `javascript:` and `data:` URLs could bypass markdown sanitization.

**Prevention Strategy**:

**Layer 1 - Sanitization Schema**:
```typescript
export const STRICT_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
  tagNames: ['p', 'strong', 'em', 'code', 'pre', 'ul', 'ol', 'li', 'blockquote', 'a'],
  attributes: {
    a: ['href', 'title'],  // Only safe attributes
  },
  protocols: {
    href: ['http', 'https', 'mailto'],  // ✅ Whitelist only
  },
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
};
```

**Layer 2 - Component-Level Validation**:
```typescript
a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
  // Defense-in-depth: validate protocol even after rehype-sanitize
  const isValidProtocol =
    !href ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:');

  if (!isValidProtocol) {
    return <span className="text-zinc-600">{children}</span>;
  }

  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}
```

**Rule**: For AI-generated content (untrusted):
1. Use strict sanitization schemas (whitelist approach)
2. Add component-level protocol validation (defense-in-depth)
3. Always include `rel="noopener noreferrer"` for external links
4. Never use default/permissive sanitization for untrusted content

---

#### **PII Detection - Comprehensive Pattern Coverage**

**Issue Fixed**: PII patterns only covered US formats (SSN, credit cards).

**Prevention Strategy**:
```typescript
const PII_PATTERNS: Record<string, RegExp> = {
  // Financial
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  bankAccount: /\b\d{8,17}\b/g,

  // Government IDs
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  ein: /\b\d{2}-\d{7}\b/g,

  // Credentials
  password: /password\s*[:=]\s*['"]?([^\s'"]+)/gi,
  apiKey: /\b(sk-|pk-|api[_-]?key|secret[_-]?key)[a-z0-9_-]{20,}\b/gi,
  bearer: /bearer\s+[a-z0-9_-]{20,}/gi,
  privateKey: /-----BEGIN\s+(RSA\s+)?PRIVATE KEY-----/gi,

  // Contact (high risk)
  phoneUS: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  email: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
};
```

**Rule**: PII detection must cover:
1. Financial data (cards, accounts)
2. Government IDs (SSN, EIN, passport numbers)
3. Authentication credentials (passwords, API keys, tokens, JWTs)
4. Contact info (emails, phones)
5. Cryptographic material (private keys, certificates)

**User-Friendly Error Messages**:
```typescript
if (result.hasPII) {
  return `Your message contains sensitive information (${result.detectedTypes.join(', ')}). Please remove it before sending.`;
}
```

---

### 1.2 Performance Issues

#### **React Re-render Prevention During Streaming**

**Issues Fixed**:
1. ChatBubble memoization defeated by unstable callbacks
2. sendMessage recreated on every message update
3. Scroll animation conflicts during streaming

**Prevention Strategy**:

**Pattern 1 - Stable Callbacks**:
```typescript
// ✅ CORRECT: useCallback with stable dependencies
const handleFeedback = useCallback(async (
  messageContent: string,
  responseContent: string,
  rating: 'positive' | 'negative'
) => {
  await fetch('/api/help/feedback', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ messageContent, responseContent, rating }),
  });
}, []); // Empty deps - endpoint is static

// ❌ WRONG: Callback without useCallback
const handleFeedback = async (...) => { ... };  // Recreated every render!
```

**Pattern 2 - Refs for State in Callbacks**:
```typescript
// ✅ CORRECT: Use ref to avoid callback recreation
const messagesRef = useRef<ChatMessage[]>([]);

useEffect(() => {
  messagesRef.current = messages;
}, [messages]);

const sendMessage = useCallback(async () => {
  // Use messagesRef.current instead of messages
  body: JSON.stringify({
    message: userMessage.content,
    history: messagesRef.current.map(...)  // No messages dependency!
  })
}, [input, isStreaming]);  // messages NOT in deps

// ❌ WRONG: Include array state in callback deps
const sendMessage = useCallback(async () => {
  history: messages.map(...)
}, [input, isStreaming, messages]);  // Recreates on every message!
```

**Pattern 3 - Conditional Scroll Behavior**:
```typescript
// ✅ CORRECT: Different scroll behavior for streaming vs. complete
useEffect(() => {
  if (isStreaming) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  } else {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages, isStreaming]);

// ❌ WRONG: Always smooth scroll (causes animation conflicts)
useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
}, [messages]);  // Triggers every 50ms during streaming!
```

**Pattern 4 - Debounced State Updates**:
```typescript
// Debounce streaming updates to reduce re-renders
const STREAM_DEBOUNCE_MS = 50;

let lastUpdateTime = 0;
const now = Date.now();

if (now - lastUpdateTime >= STREAM_DEBOUNCE_MS) {
  lastUpdateTime = now;
  setMessages((prev) => {
    const updated = [...prev];
    const lastIdx = updated.length - 1;
    if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
      updated[lastIdx] = { ...updated[lastIdx], content: fullResponse };
    }
    return updated;
  });
}
```

**Rules for Chat/Streaming Components**:
1. **Always wrap callbacks in `useCallback`** when passed to memoized children
2. **Use refs for array/object state** in callbacks to avoid recreation
3. **Use instant scroll during streaming**, smooth scroll on completion
4. **Debounce state updates** during streaming (50-100ms interval)
5. **Memo child components** that receive callbacks (ChatBubble, etc.)

---

#### **Unbounded Buffer Growth Prevention (DoS)**

**Issue Fixed**: Streaming buffer accumulated indefinitely, allowing memory exhaustion attacks.

**Prevention Strategy**:
```typescript
const MAX_BUFFER_SIZE = 10000;  // 10KB limit

for await (const event of stream) {
  buffer += event.delta.text;

  // ✅ REQUIRED: Check buffer size BEFORE processing
  if (buffer.length > MAX_BUFFER_SIZE) {
    logger.warn({ ...ctx }, 'Buffer size exceeded, truncating');
    controller.enqueue(encoder.encode('\n\n[Response truncated]'));
    break;  // Stop processing
  }

  // ... rest of processing
}
```

**Rule**: For any accumulating buffer:
1. Define maximum size based on use case (10KB for marker detection)
2. Check size limit BEFORE processing chunk
3. Gracefully terminate with user-friendly message
4. Log the event for monitoring
5. Consider both per-request and global memory limits

---

### 1.3 Architectural Issues

#### **Configuration Duplication Prevention**

**Issue Fixed**: Escalation marker defined in two places, risking silent breakage.

**Prevention Strategy**:

**Centralized Configuration**:
```typescript
// lib/help/config.ts - Single source of truth
export const HELP_CENTER_CONFIG = {
  ESCALATION_MARKER: '__SYSTEM_ESCALATE_7a8b9c__',
  STREAM_TIMEOUT_MS: 30000,
  MAX_RESPONSE_BYTES: 50000,
  MAX_BUFFER_SIZE: 10000,

  RATE_LIMITS: {
    CHAT_PER_HOUR: 20,
    TICKETS_PER_DAY: 5,
    FEEDBACK_PER_HOUR: 20,
  },

  RAG: {
    TOP_K: 5,
    FUZZY_THRESHOLD: 0.3,
  },
} as const;

// Derived constants
export const MARKER_LENGTH = HELP_CENTER_CONFIG.ESCALATION_MARKER.length;
```

**Import Pattern**:
```typescript
// ✅ CORRECT: Import from config
import { HELP_CENTER_CONFIG, MARKER_LENGTH } from '~/lib/help/config';
const { ESCALATION_MARKER } = HELP_CENTER_CONFIG;

// ❌ WRONG: Define locally
const ESCALATION_MARKER = '__SYSTEM_ESCALATE_7a8b9c__';  // Duplication!
```

**Rules**:
1. Create `{feature}/config.ts` for all feature constants
2. Use `as const` for type safety
3. Export derived constants (like `MARKER_LENGTH`)
4. Mark server-only configs with `import 'server-only'`
5. Never define magic strings/numbers inline

---

#### **Missing API Endpoint Design**

**Issue Fixed**: Escalation mechanism detected but didn't call proper service method.

**Prevention Strategy**:

**Complete Flow Implementation**:
```typescript
// 1. Service method exists
async escalateChat(params: EscalateChatParams): Promise<PlainTicketResult> {
  // Well-designed, properly formats data
}

// 2. API endpoint uses service
export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const service = createPlainService();
    const result = await service.escalateChat({
      email: user.email,
      fullName: user.user_metadata?.full_name,
      chatHistory: data.chatHistory,
      reason: data.reason,
    });
    return Response.json({ success: true, threadId: result.threadId });
  },
  { auth: true, schema: EscalateSchema }
);

// 3. Client calls API endpoint
const response = await fetch('/api/help/escalate', {
  method: 'POST',
  body: JSON.stringify({ chatHistory, reason })
});
```

**Rules for Feature Implementation**:
1. **Design flow first**: Service → API → Client
2. **Implement all layers**: Don't leave service methods unused
3. **Test end-to-end**: Verify complete user flow works
4. **Delete unused code**: If not called, remove it
5. **Document flow**: Add comments explaining the path

---

## 2. Best Practices for Chat/Streaming APIs

### 2.1 Request Validation

**Comprehensive Schema**:
```typescript
const RequestSchema = z.object({
  message: z
    .string()
    .min(1, 'Message cannot be empty')
    .max(2000, 'Message too long')
    .transform((val) => sanitizeForPrompt(val)),

  history: z
    .array(z.object({
      role: z.enum(['user', 'assistant']),
      content: z.string().max(10000).transform(sanitizeForPrompt)
    }))
    .max(20, 'History too long')
    .refine(/* role alternation */)
    .refine(/* last message validation */),
});
```

**Checklist**:
- [ ] Max length on all string inputs
- [ ] Array size limits (history, attachments)
- [ ] Content sanitization transforms
- [ ] Role/structure validation refinements
- [ ] PII detection on user input

---

### 2.2 Rate Limiting

**Implementation Pattern**:
```typescript
// Before processing request
const rateResult = await checkRateLimit('chat', user.id);

if (!rateResult.success) {
  logger.warn({ ...ctx }, 'Rate limit exceeded');
  return new Response(
    JSON.stringify({
      error: 'Rate limit exceeded. Please try again later.',
      retryAfter: rateResult.reset,
    }),
    {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        ...getRateLimitHeaders(rateResult),
      },
    }
  );
}
```

**Rate Limit Configuration**:
```typescript
RATE_LIMITS: {
  CHAT_PER_HOUR: 20,        // Message sending
  TICKETS_PER_DAY: 5,       // Escalations
  FEEDBACK_PER_HOUR: 20,    // Feedback submissions
  DOCS_SEARCH_PER_MINUTE: 60,
}
```

**Best Practices**:
1. Apply different limits per action type
2. Include `Retry-After` header in 429 responses
3. Log rate limit violations for monitoring
4. Consider user type (free vs. paid) in limits
5. Return remaining quota in response headers

---

### 2.3 Streaming Response Protection

**Complete Safety Pattern**:
```typescript
const startTime = Date.now();
let totalBytes = 0;
let buffer = '';

const readable = new ReadableStream({
  async start(controller) {
    try {
      for await (const event of stream) {
        // 1. Timeout check
        if (Date.now() - startTime > STREAM_TIMEOUT_MS) {
          controller.enqueue(encoder.encode('\n\n[Response timeout]'));
          break;
        }

        const deltaText = event.delta.text ?? '';
        buffer += deltaText;

        // 2. Buffer size check
        if (buffer.length > MAX_BUFFER_SIZE) {
          logger.warn({ ...ctx }, 'Buffer exceeded');
          controller.enqueue(encoder.encode('\n\n[Response truncated]'));
          break;
        }

        // 3. Total size check
        const chunk = encoder.encode(safeToEmit);
        totalBytes += chunk.length;

        if (totalBytes > MAX_RESPONSE_BYTES) {
          controller.enqueue(encoder.encode('\n\n[Response truncated]'));
          break;
        }

        controller.enqueue(chunk);
      }

      controller.close();
    } catch (error) {
      logger.error({ ...ctx, error }, 'Stream processing error');
      controller.error(error);
    }
  },

  cancel() {
    stream.controller.abort();  // Cleanup on client disconnect
  }
});
```

**Required Protections**:
1. ✅ Timeout limit (30 seconds)
2. ✅ Buffer size limit (10KB for marker detection)
3. ✅ Total response size limit (50KB)
4. ✅ Error handling with logging
5. ✅ Cleanup on cancellation

---

### 2.4 AI Response Sanitization

**Marker Detection Pattern**:
```typescript
// Safe marker detection without blocking response
if (buffer.includes(ESCALATION_MARKER)) {
  escalationDetected = true;
  buffer = buffer.replace(ESCALATION_MARKER, '');  // Remove from output
}

// Only emit when buffer is safely past marker length
if (buffer.length > MARKER_LENGTH) {
  const safeToEmit = buffer.slice(0, -MARKER_LENGTH);
  buffer = buffer.slice(-MARKER_LENGTH);  // Keep potential partial marker

  controller.enqueue(encoder.encode(safeToEmit));
}

// Final emit (clean remaining buffer)
if (buffer.length > 0) {
  const cleanedBuffer = buffer.replace(ESCALATION_MARKER, '');
  if (cleanedBuffer.length > 0) {
    controller.enqueue(encoder.encode(cleanedBuffer));
  }
}
```

**Key Points**:
1. Check for markers BEFORE emitting to client
2. Handle markers that span chunk boundaries
3. Remove markers from output (internal signals only)
4. Clean final buffer before closing stream

---

## 3. Testing Recommendations

### 3.1 Security Testing

**Required Test Cases**:

```typescript
describe('Chat API Security', () => {
  describe('History Injection Prevention', () => {
    it('rejects history ending with user message', async () => {
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'New question',
          history: [
            { role: 'user', content: 'Hello' },
            { role: 'assistant', content: 'Hi' },
            { role: 'user', content: 'Malicious' },  // Last is user!
          ],
        }),
      });

      expect(response.status).toBe(400);
    });

    it('rejects non-alternating roles', async () => {
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Question',
          history: [
            { role: 'user', content: 'First' },
            { role: 'user', content: 'Second' },  // Two user messages!
          ],
        }),
      });

      expect(response.status).toBe(400);
    });
  });

  describe('XSS Prevention', () => {
    it('blocks javascript: protocol in links', async () => {
      const maliciousContent = '[Click](javascript:alert(1))';
      // Render markdown and verify link is stripped
      const rendered = renderMarkdown(maliciousContent);
      expect(rendered).not.toContain('javascript:');
      expect(rendered).toContain('<span>'); // Should render as plain text
    });

    it('blocks data: URIs', async () => {
      const maliciousContent = '[XSS](data:text/html,<script>alert(1)</script>)';
      const rendered = renderMarkdown(maliciousContent);
      expect(rendered).not.toContain('data:');
    });
  });

  describe('DoS Prevention', () => {
    it('rejects oversized history', async () => {
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'Test',
          history: Array(100).fill({  // Exceeds max 20
            role: 'user',
            content: 'message',
          }),
        }),
      });

      expect(response.status).toBe(400);
    });

    it('truncates streaming response at buffer limit', async () => {
      // Mock Claude to return response > MAX_BUFFER_SIZE
      // Verify truncation message appears
      // Verify no memory leak
    });
  });

  describe('PII Detection', () => {
    it('detects credit card numbers', async () => {
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'My card is 4532-1234-5678-9010',
          history: [],
        }),
      });

      expect(response.status).toBe(400);
      const data = await response.json();
      expect(data.error).toContain('creditCard');
    });

    it('detects API keys', async () => {
      const response = await fetch('/api/help/chat', {
        method: 'POST',
        body: JSON.stringify({
          message: 'My key is sk-abc123xyz456',
          history: [],
        }),
      });

      expect(response.status).toBe(400);
    });
  });
});
```

---

### 3.2 Performance Testing

**React Component Tests**:

```typescript
describe('ChatBubble Performance', () => {
  it('does not re-render when parent updates unrelated state', () => {
    const handleFeedback = jest.fn();
    const { rerender } = render(
      <ChatBubble
        message={{ id: '1', role: 'assistant', content: 'Hello' }}
        onFeedback={handleFeedback}
      />
    );

    const renderCount = getRenderCount();

    // Parent updates with same props
    rerender(
      <ChatBubble
        message={{ id: '1', role: 'assistant', content: 'Hello' }}
        onFeedback={handleFeedback}  // Same stable callback
      />
    );

    expect(getRenderCount()).toBe(renderCount);  // No re-render!
  });

  it('handleFeedback callback remains stable across renders', () => {
    const { result, rerender } = renderHook(() => {
      const handleFeedback = useCallback(async (...) => {}, []);
      return handleFeedback;
    });

    const firstCallback = result.current;
    rerender();
    const secondCallback = result.current;

    expect(firstCallback).toBe(secondCallback);  // Same reference
  });
});

describe('Streaming Performance', () => {
  it('debounces state updates during streaming', async () => {
    const setMessagesSpy = jest.fn();

    // Simulate 100 chunks arriving
    for (let i = 0; i < 100; i++) {
      await processStreamChunk(`chunk ${i}`);
    }

    // With 50ms debounce and ~5ms per chunk, expect ~10 updates instead of 100
    expect(setMessagesSpy).toHaveBeenCalledTimes(toBeLessThan(20));
  });
});
```

---

### 3.3 Integration Testing

**End-to-End Chat Flow**:

```typescript
test('complete chat escalation flow', async ({ page }) => {
  // 1. Send message
  await page.fill('[data-test="chat-input"]', 'I need help');
  await page.click('[data-test="chat-submit"]');

  // 2. Verify response
  await expect(page.locator('[data-test="chat-message"]').last()).toContainText('How can I assist');

  // 3. Escalate to human
  await page.click('[data-test="escalate-button"]');

  // 4. Verify escalation success
  await expect(page.locator('[data-test="escalation-success"]')).toBeVisible();

  // 5. Verify API call was made
  const escalateRequest = await page.waitForRequest(req =>
    req.url().includes('/api/help/escalate') && req.method() === 'POST'
  );

  const postData = escalateRequest.postDataJSON();
  expect(postData.chatHistory).toHaveLength(toBeLessThan(21));  // Max 20
  expect(postData.chatHistory[0].content.length).toBeLessThan(2001);  // Max 2KB
});
```

---

## 4. Code Review Checklist

### 4.1 Security Review

**Chat/Streaming APIs**:
- [ ] Input validation schema includes max lengths
- [ ] History structure validated (alternation, last message)
- [ ] PII detection applied to user input
- [ ] Rate limiting implemented and configured
- [ ] Content sanitization (sanitizeForPrompt) applied
- [ ] Markdown sanitization uses strict schema
- [ ] Protocol whitelist enforced for links
- [ ] No sensitive data logged (PII, credentials)

**Streaming Implementation**:
- [ ] Timeout limit enforced
- [ ] Buffer size limit checked
- [ ] Total response size limit enforced
- [ ] Error handling with appropriate user messages
- [ ] Cleanup on stream cancellation

---

### 4.2 Performance Review

**React Components**:
- [ ] Callbacks wrapped in `useCallback` when passed to children
- [ ] Child components memoized where appropriate
- [ ] Array/object state accessed via refs in callbacks (if needed)
- [ ] Scroll behavior conditional (instant during stream, smooth after)
- [ ] No unnecessary dependencies in useCallback/useMemo/useEffect

**State Updates**:
- [ ] Streaming updates debounced (50-100ms)
- [ ] State updates batched where possible
- [ ] No O(n²) operations in render path
- [ ] Expensive computations memoized

---

### 4.3 Architecture Review

**Configuration**:
- [ ] No magic strings/numbers defined inline
- [ ] Constants centralized in `{feature}/config.ts`
- [ ] Derived constants exported (not recalculated)
- [ ] Server-only configs marked with `import 'server-only'`
- [ ] Config uses `as const` for type safety

**API Design**:
- [ ] Service methods actually called by API endpoints
- [ ] Client components call implemented endpoints
- [ ] Complete flow tested end-to-end
- [ ] Unused code removed (or explained why kept)
- [ ] Flow documented (comments or diagrams)

**Error Handling**:
- [ ] User-friendly error messages (no stack traces)
- [ ] Errors logged with context (user ID, action)
- [ ] Appropriate HTTP status codes
- [ ] Retry-After header for rate limits
- [ ] Graceful degradation (e.g., RAG failure doesn't break chat)

---

## 5. Monitoring & Alerting

### 5.1 Security Metrics

**Track**:
- Rate limit violations (per user, per endpoint)
- PII detection triggers (which patterns, frequency)
- Invalid request attempts (malformed history, oversized input)
- Buffer/response truncations (potential DoS attempts)

**Alert On**:
- Spike in rate limit violations from single user (> 5/hour)
- PII detection rate > 1% of messages
- Buffer truncations > 5/hour (abnormal AI behavior)

---

### 5.2 Performance Metrics

**Track**:
- Streaming response time (p50, p95, p99)
- Re-render counts during streaming
- Memory usage during long conversations
- Debounce effectiveness (updates/second during stream)

**Alert On**:
- p95 streaming latency > 5 seconds
- Memory growth > 50MB per chat session
- Re-render rate > 30/second during streaming

---

### 5.3 Escalation Metrics

**Track**:
- Escalation rate (escalations / total chats)
- AI-detected escalations vs. manual
- Escalation success rate (tickets created)
- Time to first human response

**Alert On**:
- Escalation rate > 20% (AI not helpful)
- Escalation API failures > 1% (integration broken)

---

## 6. Documentation Requirements

### 6.1 Code Documentation

**For Each Security Fix**:
```typescript
// P1 Fix: Prevent history injection attack
// Validates that conversation history alternates roles and ends with assistant.
// Attack vector: Attacker could inject multiple consecutive user messages
// with malicious prompts. Last message validation ensures client can't
// manipulate conversation state to trick AI.
.refine(
  (arr) => arr.length === 0 || arr[arr.length - 1]?.role === 'assistant',
  'Last message in history must be from assistant'
)
```

**For Each Performance Optimization**:
```typescript
// P2 Fix: Prevent callback recreation that defeats ChatBubble memoization
// Using useCallback with empty deps because feedback endpoint is static.
// Without this, handleFeedback recreates on every render, causing all
// ChatBubble components to re-render during streaming (400+ renders/sec).
const handleFeedback = useCallback(async (...) => {
  // ...
}, []);
```

---

### 6.2 Decision Documentation

**For Architectural Decisions**:
Create ADR (Architecture Decision Record):

```markdown
# ADR: Centralized Help Center Configuration

## Context
Escalation marker was defined in two places (prompt-builder.ts and config.ts).
Risk: Updates to one but not the other would break escalation silently.

## Decision
Create single source of truth in `lib/help/config.ts`.
All constants (markers, timeouts, limits) centralized.

## Consequences
- Positive: Single update point, type-safe derived constants
- Negative: Additional import required
- Mitigation: Lint rule to prevent duplicate constant definitions

## Alternatives Considered
1. Keep distributed (rejected - too risky)
2. Environment variables (rejected - runtime vs. build-time values)
```

---

## 7. Quick Reference

### Security Checklist (Before Merge)
- [ ] Input validation with max lengths
- [ ] PII detection on user input
- [ ] Rate limiting configured
- [ ] Content sanitization applied
- [ ] Markdown sanitization uses STRICT schema
- [ ] Streaming protections (timeout, size limits)
- [ ] Error messages user-friendly (no leaks)

### Performance Checklist (Before Merge)
- [ ] Callbacks stable (useCallback with minimal deps)
- [ ] Children memoized if receiving callbacks
- [ ] State updates debounced during streaming
- [ ] Refs used for array/object state in callbacks
- [ ] No O(n²) operations in hot paths

### Architecture Checklist (Before Merge)
- [ ] Constants centralized in config file
- [ ] Complete flow implemented (service → API → client)
- [ ] Unused code removed
- [ ] Documentation updated
- [ ] Tests added for new functionality

---

## 8. Related Documentation

- `/docs/SPARLO-DESIGN-SYSTEM.md` - UI/UX patterns
- `/apps/web/CLAUDE.md` - Web app conventions
- `/apps/e2e/CLAUDE.md` - E2E testing patterns
- `/todos/*-help-*.md` - Issue tracking and resolution

---

**Maintainer**: Development Team
**Review Cycle**: After each major feature or security fix
**Last Security Audit**: 2026-01-04
