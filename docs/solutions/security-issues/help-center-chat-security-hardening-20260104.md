---
module: Help Center
date: 2026-01-04
problem_type: security_issue
component: help_chat_widget
symptoms:
  - "History injection attack - validation allows consecutive user messages enabling prompt injection"
  - "Escalation DoS vector - unbounded conversation submission without size limits"
  - "Broken escalation flow - AI marker detection logs but takes no action"
  - "ChatBubble re-render cascade - 400 renders/second during streaming"
  - "Protocol XSS risk - markdown sanitizer missing explicit javascript:/data: blocklist"
  - "Limited PII detection - US-only patterns miss emails, phones, JWTs"
  - "Configuration duplication - escalation marker defined in two locations"
root_cause: incomplete_security_validation
resolution_type: code_fix
severity: critical
tags: [security, performance, architecture, help-center, P1, P2, code-review, prompt-injection, dos, xss, pii]
related_issues:
  - chat-api-backend-service-integration-hardening.md
prevention_strategies:
  - "Add server-side refinement validation for chat history"
  - "Implement dual-layer size limits: client truncation + server validation"
  - "Create dedicated endpoints for distinct operations"
  - "Wrap callbacks in useCallback with stable dependencies"
  - "Use ref pattern for frequently-changing state in callbacks"
  - "Add explicit protocol blocklist to markdown renderer"
  - "Expand PII patterns to cover common credentials and contact info"
  - "Extract constants to single source of truth"
---

# Help Center Chat Security Hardening

## Problem Statement

Code review of the Help Center implementation discovered 14 issues (3 P1 critical, 8 P2 important, 3 P3 low). This document captures the P1 and P2 fixes implemented.

## Investigation

The Help Center consists of:
- Help Chat Widget (`apps/web/components/help-widget/help-chat-widget.tsx`)
- Help Chat API (`apps/web/app/api/help/chat/route.ts`)
- Escalation Endpoint (`apps/web/app/api/help/escalate/route.ts`)
- Markdown Components (`apps/web/lib/shared/markdown-components.tsx`)
- PII Detection (`apps/web/lib/security/pii-detector.ts`)
- Config (`apps/web/lib/help/config.ts`)

## P1 Fixes (Critical)

### 1. History Injection Attack

**Issue**: Chat API allowed consecutive user messages in history, enabling prompt injection attacks.

**Fix**: Added Zod refinement requiring last message be from assistant.

```typescript
// apps/web/app/api/help/chat/route.ts
.refine(
  (arr) => arr.length === 0 || arr[arr.length - 1]?.role === 'assistant',
  'Last message in history must be from assistant',
),
```

### 2. Escalation Unbounded Submission

**Issue**: No limits on chat history size when escalating, allowing DoS attacks.

**Fix**: Client-side truncation (20 messages, 2000 chars each) + server validation.

```typescript
// apps/web/components/help-widget/help-chat-widget.tsx
chatHistory: messages.slice(-20).map((m) => ({
  role: m.role,
  content: m.content.slice(0, 2000),
})),
```

### 3. Escalation Flow Broken

**Issue**: AI-detected escalation marker was logged but never called `escalateChat()`. Manual escalation used wrong endpoint.

**Fix**: Created dedicated `/api/help/escalate` endpoint.

```typescript
// apps/web/app/api/help/escalate/route.ts (new file)
export const POST = enhanceRouteHandler(
  async ({ request, user }) => {
    const service = createPlainService();
    const result = await service.escalateChat({
      email: userEmail,
      fullName: user.user_metadata?.full_name || userEmail.split('@')[0],
      chatHistory: data.chatHistory,
      reason: data.reason,
    });
    return new Response(JSON.stringify({ success: true, threadId: result.threadId }));
  },
  { auth: true },
);
```

## P2 Fixes (Important)

### 4. ChatBubble Memoization

**Issue**: `handleFeedback` recreated every render, defeating `memo()`.

**Fix**: Wrapped in `useCallback` with empty deps.

```typescript
const handleFeedback = useCallback(
  async (messageContent, responseContent, rating) => {
    await fetch('/api/help/feedback', { /* ... */ });
  },
  [], // Empty deps - no external state needed
);
```

### 5. sendMessage Dependencies

**Issue**: `sendMessage` depended on `messages` array, recreated on every message.

**Fix**: Use `messagesRef` pattern.

```typescript
const messagesRef = useRef<ChatMessage[]>([]);

useEffect(() => {
  messagesRef.current = messages;
}, [messages]);

const sendMessage = useCallback(async () => {
  // Use messagesRef.current instead of messages
  history: messagesRef.current.map((m) => ({ role: m.role, content: m.content })),
}, [input, isStreaming]); // Removed messages from deps
```

### 6. Scroll Jank During Streaming

**Issue**: Smooth scroll animations conflicted with streaming updates.

**Fix**: Use `instant` scroll during streaming.

```typescript
useEffect(() => {
  if (isStreaming) {
    messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
  } else {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }
}, [messages, isStreaming]);
```

### 7. AbortController Cleanup

**Fix**: Clear ref on unmount for GC.

```typescript
useEffect(() => {
  return () => {
    abortControllerRef.current?.abort();
    abortControllerRef.current = null; // Clear for GC
  };
}, []);
```

### 8. XSS Protocol Validation

**Issue**: Relied solely on rehype-sanitize, missing defense-in-depth.

**Fix**: Added explicit protocol check in component.

```typescript
// apps/web/lib/shared/markdown-components.tsx
a: ({ children, href }) => {
  const isValidProtocol =
    !href ||
    href.startsWith('http://') ||
    href.startsWith('https://') ||
    href.startsWith('mailto:');

  if (!isValidProtocol) {
    return <span className="text-zinc-600">{children}</span>;
  }
  return <a href={href} target="_blank" rel="noopener noreferrer">{children}</a>;
},
```

### 9. PII Patterns Expansion

**Issue**: Only detected credit cards, SSN, passwords, API keys.

**Fix**: Added 7 new patterns.

```typescript
// apps/web/lib/security/pii-detector.ts
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
  // Contact info
  phoneUS: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g,
  email: /\b[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}\b/gi,
};
```

### 10. Config Duplication

**Issue**: `ESCALATION_MARKER` defined in both `config.ts` and `prompt-builder.ts`.

**Fix**: Single source of truth.

```typescript
// apps/web/lib/rag/prompt-builder.ts
import { HELP_CENTER_CONFIG } from '~/lib/help/config';
const { ESCALATION_MARKER } = HELP_CENTER_CONFIG;
```

## Verification

All changes pass typecheck and formatting:

```bash
pnpm typecheck  # Pass
pnpm format:fix # Applied
```

## Prevention Checklist

For future chat/streaming features:

- [ ] Validate message history alternates user/assistant
- [ ] Ensure last history message is from assistant (prevents injection)
- [ ] Implement size limits on both client and server
- [ ] Create dedicated endpoints for distinct operations
- [ ] Use `useCallback` for callbacks passed to memoized children
- [ ] Use ref pattern for frequently-changing state in callbacks
- [ ] Add defense-in-depth validation for untrusted content
- [ ] Expand PII detection for your user base
- [ ] Centralize configuration constants

## Related Documentation

- `/docs/solutions/integration-issues/chat-api-backend-service-integration-hardening.md`
- `/apps/web/lib/help/config.ts` - Centralized Help Center config
- `/apps/web/lib/security/rate-limit.ts` - Rate limiting implementation
