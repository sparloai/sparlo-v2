# Chat/Streaming API Security & Performance Checklist

**Quick reference for implementing secure, performant chat and streaming APIs**

---

## Pre-Implementation Checklist

Before starting a new chat/streaming feature:

- [ ] Read `/docs/HELP-CENTER-PREVENTION-STRATEGIES.md`
- [ ] Review existing implementation in `/apps/web/app/api/help/chat/route.ts`
- [ ] Check centralized config pattern in `/apps/web/lib/help/config.ts`
- [ ] Review React patterns in `/apps/web/components/help-widget/help-chat-widget.tsx`

---

## Server-Side API Implementation

### 1. Request Validation

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
    .refine(
      (arr) => arr.every((item, i) => i === 0 || item.role !== arr[i - 1]?.role),
      'History must alternate between user and assistant'
    )
    .refine(
      (arr) => arr.length === 0 || arr[arr.length - 1]?.role === 'assistant',
      'Last message in history must be from assistant'
    ),
});
```

**Required Checks**:
- [x] Max length on all strings
- [x] Array size limits
- [x] Content sanitization transform
- [x] Role alternation validation
- [x] Last message role validation

---

### 2. PII Detection

```typescript
import { validateNoPII } from '~/lib/security/pii-detector';

const piiError = validateNoPII(message);
if (piiError) {
  return new Response(JSON.stringify({ error: piiError }), {
    status: 400,
    headers: { 'Content-Type': 'application/json' },
  });
}
```

**Covered Patterns**:
- [x] Credit cards, bank accounts
- [x] SSN, EIN
- [x] Passwords, API keys, bearer tokens
- [x] Private keys
- [x] Emails, phone numbers

---

### 3. Rate Limiting

```typescript
import { checkRateLimit, getRateLimitHeaders } from '~/lib/security/rate-limit';

const rateResult = await checkRateLimit('chat', user.id);

if (!rateResult.success) {
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

**Required**:
- [x] Check rate limit before processing
- [x] Return 429 with Retry-After header
- [x] Include rate limit headers in response
- [x] Log violations for monitoring

---

### 4. Streaming Response Protection

```typescript
const { STREAM_TIMEOUT_MS, MAX_RESPONSE_BYTES, MAX_BUFFER_SIZE } = HELP_CENTER_CONFIG;

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

        buffer += event.delta.text;

        // 2. Buffer size check
        if (buffer.length > MAX_BUFFER_SIZE) {
          logger.warn({ ...ctx }, 'Buffer exceeded');
          controller.enqueue(encoder.encode('\n\n[Response truncated]'));
          break;
        }

        const chunk = encoder.encode(safeToEmit);
        totalBytes += chunk.length;

        // 3. Total size check
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
    stream.controller.abort();  // Cleanup on disconnect
  }
});
```

**Required Protections**:
- [x] Timeout limit (30 seconds)
- [x] Buffer size limit (10KB)
- [x] Total response size limit (50KB)
- [x] Error handling with logging
- [x] Cleanup on cancellation

---

### 5. Error Handling

```typescript
try {
  // ... processing
} catch (error) {
  logger.error({ ...ctx, error }, 'Chat request failed');

  if (error instanceof z.ZodError) {
    // Don't leak validation schema in production
    return new Response(
      JSON.stringify({
        error: 'Invalid request format. Please check your input.',
        ...(process.env.NODE_ENV === 'development' && {
          details: error.errors,
        }),
      }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({ error: 'An unexpected error occurred' }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**Required**:
- [x] User-friendly error messages
- [x] No stack traces in production
- [x] Appropriate HTTP status codes
- [x] Error logging with context

---

## Client-Side React Implementation

### 1. State Management

```typescript
const [messages, setMessages] = useState<ChatMessage[]>([]);
const [input, setInput] = useState('');
const [isStreaming, setIsStreaming] = useState(false);

const abortControllerRef = useRef<AbortController | null>(null);
const messagesEndRef = useRef<HTMLDivElement>(null);

// Use ref to avoid callback recreation
const messagesRef = useRef<ChatMessage[]>([]);

useEffect(() => {
  messagesRef.current = messages;
}, [messages]);
```

**Required**:
- [x] Use refs for array/object state in callbacks
- [x] AbortController for request cancellation
- [x] Cleanup on unmount

---

### 2. Stable Callbacks

```typescript
// ✅ CORRECT: Stable callback with useCallback
const handleFeedback = useCallback(async (
  messageContent: string,
  responseContent: string,
  rating: 'positive' | 'negative'
) => {
  try {
    await fetch('/api/help/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ messageContent, responseContent, rating }),
    });
  } catch {
    // Silently fail
  }
}, []); // No dependencies - endpoint is static

// ❌ WRONG: Callback without useCallback
const handleFeedback = async (...) => { ... };  // Recreated every render!
```

**Required**:
- [x] Wrap callbacks in useCallback when passed to children
- [x] Minimize dependencies (use refs where needed)
- [x] Memo child components receiving callbacks

---

### 3. Streaming Updates

```typescript
const STREAM_DEBOUNCE_MS = 50;
let lastUpdateTime = 0;

while (true) {
  const { done, value } = await reader.read();
  if (done) break;

  const text = decoder.decode(value, { stream: true });
  fullResponse += text;

  // Debounce updates
  const now = Date.now();
  if (now - lastUpdateTime >= STREAM_DEBOUNCE_MS) {
    lastUpdateTime = now;
    const contentSnapshot = fullResponse;

    setMessages((prev) => {
      const updated = [...prev];
      const lastIdx = updated.length - 1;
      if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
        updated[lastIdx] = { ...updated[lastIdx], content: contentSnapshot };
      }
      return updated;
    });
  }
}

// Final update
setMessages((prev) => {
  const updated = [...prev];
  const lastIdx = updated.length - 1;
  if (lastIdx >= 0 && updated[lastIdx]?.role === 'assistant') {
    updated[lastIdx] = { ...updated[lastIdx], content: fullResponse };
  }
  return updated;
});
```

**Required**:
- [x] Debounce updates (50-100ms)
- [x] Final update after stream completes
- [x] Immutable state updates

---

### 4. Auto-Scroll Behavior

```typescript
// Conditional scroll: instant during streaming, smooth after
useEffect(() => {
  if (isStreaming) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  } else {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages, isStreaming]);
```

**Required**:
- [x] Instant scroll during streaming (avoids animation conflicts)
- [x] Smooth scroll on completion
- [x] Scroll on message changes

---

### 5. Cleanup

```typescript
useEffect(() => {
  return () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null; // Clear reference for GC
  };
}, []);
```

**Required**:
- [x] Abort pending requests on unmount
- [x] Clear refs for garbage collection
- [x] Cancel timeouts

---

### 6. Memoized Components

```typescript
const ChatBubble = memo(function ChatBubble({
  message,
  previousMessage,
  isStreaming,
  onFeedback,  // Must be stable callback!
}: ChatBubbleProps) {
  const [feedbackGiven, setFeedbackGiven] = useState(false);

  // ... component logic
});
```

**Required**:
- [x] Memo expensive children
- [x] Ensure props are stable (especially callbacks)
- [x] Display name for debugging

---

## Markdown Sanitization

### 1. Strict Sanitization Schema

```typescript
import type { Options as RehypeSanitizeOptions } from 'rehype-sanitize';

export const STRICT_SANITIZE_SCHEMA: RehypeSanitizeOptions = {
  tagNames: [
    'p', 'br', 'hr', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'ul', 'ol', 'li', 'strong', 'em', 'b', 'i', 'u', 's', 'del',
    'code', 'pre', 'blockquote', 'a'
  ],
  attributes: {
    a: ['href', 'title'],
  },
  protocols: {
    href: ['http', 'https', 'mailto'],  // Whitelist only
  },
  strip: ['script', 'style', 'iframe', 'object', 'embed', 'form', 'input'],
};
```

**Required**:
- [x] Whitelist safe tags only
- [x] Protocol whitelist (no javascript:, data:)
- [x] Strip dangerous tags
- [x] Minimal attributes

---

### 2. Component-Level Validation

```typescript
a: ({ children, href }: { children?: React.ReactNode; href?: string }) => {
  // Defense-in-depth: validate even after sanitization
  const isValidProtocol =
    !href ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:');

  if (!isValidProtocol) {
    return <span className="text-zinc-600">{children}</span>;
  }

  return (
    <a
      href={href}
      className="..."
      target="_blank"
      rel="noopener noreferrer"
    >
      {children}
    </a>
  );
}
```

**Required**:
- [x] Protocol validation in component
- [x] Fallback to plain text for invalid URLs
- [x] target="_blank" with rel="noopener noreferrer"

---

### 3. Usage

```typescript
<ReactMarkdown
  rehypePlugins={[[rehypeSanitize, STRICT_SANITIZE_SCHEMA]]}
  components={MARKDOWN_COMPONENTS}
>
  {message.content}
</ReactMarkdown>
```

**Required**:
- [x] Use STRICT schema for untrusted content
- [x] Pass schema to rehypeSanitize plugin
- [x] Use validated components

---

## Configuration Management

### 1. Centralized Config

```typescript
// lib/{feature}/config.ts
import 'server-only';  // If server-only

export const FEATURE_CONFIG = {
  CONSTANT_NAME: 'value',
  TIMEOUT_MS: 30000,

  LIMITS: {
    MAX_SIZE: 1000,
  },
} as const;

// Derived constants
export const DERIVED_CONSTANT = FEATURE_CONFIG.CONSTANT_NAME.length;

export type FeatureConfig = typeof FEATURE_CONFIG;
```

**Required**:
- [x] Single file for all feature constants
- [x] Use `as const` for type safety
- [x] Export derived constants
- [x] Mark server-only if needed

---

### 2. Import Pattern

```typescript
// ✅ CORRECT
import { FEATURE_CONFIG } from '~/lib/{feature}/config';
const { CONSTANT_NAME } = FEATURE_CONFIG;

// ❌ WRONG
const CONSTANT_NAME = 'value';  // Duplication!
```

---

## Testing Requirements

### 1. Security Tests

```typescript
describe('Security', () => {
  it('rejects history ending with user message');
  it('rejects non-alternating roles');
  it('blocks javascript: protocol');
  it('blocks data: URIs');
  it('rejects oversized input');
  it('detects PII (credit cards, API keys, emails)');
  it('enforces rate limits');
  it('truncates at buffer limit');
});
```

---

### 2. Performance Tests

```typescript
describe('Performance', () => {
  it('does not re-render memoized children unnecessarily');
  it('callback remains stable across renders');
  it('debounces state updates during streaming');
  it('updates at most once per debounce interval');
});
```

---

### 3. Integration Tests

```typescript
test('complete chat flow', async ({ page }) => {
  await page.fill('[data-test="chat-input"]', 'Test message');
  await page.click('[data-test="chat-submit"]');

  await expect(page.locator('[data-test="chat-message"]').last())
    .toContainText('response');

  // Verify API request format
  const request = await page.waitForRequest(req =>
    req.url().includes('/api/help/chat')
  );

  const postData = request.postDataJSON();
  expect(postData.history.length).toBeLessThan(21);
});
```

---

## Code Review Checklist

### Before Submitting PR

**Security**:
- [ ] Input validation with max lengths
- [ ] PII detection applied
- [ ] Rate limiting configured
- [ ] Content sanitization applied
- [ ] Markdown uses STRICT schema
- [ ] Protocol whitelist enforced
- [ ] No sensitive data logged

**Performance**:
- [ ] Callbacks wrapped in useCallback
- [ ] Children memoized where needed
- [ ] Refs used for state in callbacks
- [ ] Scroll behavior conditional
- [ ] Streaming updates debounced

**Architecture**:
- [ ] Constants in centralized config
- [ ] Complete flow implemented (service → API → client)
- [ ] Unused code removed
- [ ] Documentation updated
- [ ] Tests added

**Streaming**:
- [ ] Timeout limit enforced
- [ ] Buffer size limit checked
- [ ] Total size limit enforced
- [ ] Error handling with logging
- [ ] Cleanup on cancellation

---

## Common Pitfalls

### ❌ Don't Do This

```typescript
// 1. Callback without useCallback
const callback = () => { ... };

// 2. Array state in callback deps
useCallback(() => { messages.map(...) }, [messages]);

// 3. Smooth scroll during streaming
messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });

// 4. No buffer limit
buffer += text;  // Can grow indefinitely!

// 5. Default sanitization for AI content
<ReactMarkdown rehypePlugins={[rehypeSanitize]}>

// 6. Magic strings inline
const MARKER = '__SYSTEM_ESCALATE_7a8b9c__';

// 7. No PII detection
// Just send user input directly

// 8. No rate limiting
// Process all requests
```

---

### ✅ Do This Instead

```typescript
// 1. Stable callback
const callback = useCallback(() => { ... }, []);

// 2. Ref for array state
const messagesRef = useRef([]);
useCallback(() => { messagesRef.current.map(...) }, []);

// 3. Conditional scroll
if (isStreaming) { scrollIntoView({ behavior: 'instant' }) }

// 4. Buffer limit
if (buffer.length > MAX_BUFFER_SIZE) { break; }

// 5. Strict sanitization
<ReactMarkdown rehypePlugins={[[rehypeSanitize, STRICT_SANITIZE_SCHEMA]]}>

// 6. Centralized config
import { HELP_CENTER_CONFIG } from '~/lib/help/config';

// 7. PII detection
const piiError = validateNoPII(message);

// 8. Rate limiting
const rateResult = await checkRateLimit('chat', user.id);
```

---

## Quick Reference Values

### Security Limits
```typescript
STREAM_TIMEOUT_MS: 30000        // 30 seconds
MAX_RESPONSE_BYTES: 50000       // 50KB
MAX_BUFFER_SIZE: 10000          // 10KB

message: max 2000 chars
history: max 20 messages
per message: max 10000 chars
```

### Rate Limits
```typescript
CHAT_PER_HOUR: 20
TICKETS_PER_DAY: 5
FEEDBACK_PER_HOUR: 20
```

### Performance Tuning
```typescript
STREAM_DEBOUNCE_MS: 50          // 50ms update interval
```

---

## Related Documentation

- **Full Prevention Guide**: `/docs/HELP-CENTER-PREVENTION-STRATEGIES.md`
- **Fixes Summary**: `/docs/HELP-CENTER-FIXES-SUMMARY.md`
- **Implementation Examples**:
  - Server: `/apps/web/app/api/help/chat/route.ts`
  - Client: `/apps/web/components/help-widget/help-chat-widget.tsx`
  - Config: `/apps/web/lib/help/config.ts`
  - Markdown: `/apps/web/lib/shared/markdown-components.tsx`

---

**Last Updated**: 2026-01-04
**Maintainer**: Development Team
