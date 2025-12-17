---
status: ready
priority: p1
issue_id: "047"
tags: [agent-native, api-design, chat, developer-experience]
dependencies: []
---

# Chat API SSE-Only Format is Agent-Unfriendly

## Problem Statement

The chat API only supports Server-Sent Events (SSE) streaming format. This makes it difficult for:
1. AI agents to consume responses (need to parse SSE chunks)
2. Automated testing
3. Simple integrations that just want JSON response
4. Tools like curl, Postman for debugging

**Developer Impact:** MEDIUM - Harder to integrate and test.

## Findings

- **File:** `apps/web/app/api/sparlo/chat/route.ts:132-138`
- Only returns `text/event-stream` content type
- No option for JSON response
- Agents must implement SSE parsing logic

**Current response format:**
```
data: {"text":"Hello"}

data: {"text":" world"}

data: [DONE]
```

**Agent-friendly format would be:**
```json
{
  "response": "Hello world",
  "saved": true
}
```

## Proposed Solutions

### Option 1: Accept Header Negotiation

**Approach:** Check `Accept` header, return JSON if `application/json`, SSE if `text/event-stream`.

```typescript
const acceptsJson = request.headers.get('Accept')?.includes('application/json');

if (acceptsJson) {
  const message = await anthropic.messages.create({ ... });
  // Save and return JSON
  return Response.json({ response: message.content[0].text, saved: true });
} else {
  // Existing SSE logic
}
```

**Pros:**
- Standard HTTP content negotiation
- Backwards compatible
- Agent chooses format

**Cons:**
- Code duplication for save logic
- Need to maintain two paths

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: Query Parameter for Format

**Approach:** Add `?format=json` query parameter option.

```typescript
const url = new URL(request.url);
const format = url.searchParams.get('format') || 'stream';

if (format === 'json') {
  // Non-streaming JSON response
}
```

**Pros:**
- Explicit and obvious
- Easy to test with curl
- No header complexity

**Cons:**
- Non-standard approach
- URL parameter for format is unusual

**Effort:** 2 hours

**Risk:** Low

---

### Option 3: Separate JSON Endpoint

**Approach:** Create `/api/sparlo/chat/sync` for non-streaming.

**Pros:**
- Clear separation of concerns
- Can optimize each independently
- No conditional logic

**Cons:**
- Code duplication
- Two endpoints to maintain
- More complex API surface

**Effort:** 3-4 hours

**Risk:** Low

## Recommended Action

Implement Option 1 (Accept header negotiation):

1. Check `Accept` header at request start
2. For `application/json`: use non-streaming `messages.create()`, return JSON
3. For `text/event-stream` (default): existing SSE logic
4. Share save logic between both paths

## Technical Details

**Affected files:**
- `apps/web/app/api/sparlo/chat/route.ts` - Add JSON response path

**JSON response schema:**
```typescript
interface ChatJsonResponse {
  response: string;
  saved: boolean;
  error?: string;
}
```

**Usage:**
```bash
# Agent usage (JSON)
curl -X POST /api/sparlo/chat \
  -H "Accept: application/json" \
  -d '{"reportId":"...","message":"..."}'

# Browser usage (SSE, default)
fetch('/api/sparlo/chat', { ... })
```

## Resources

- **Commit:** `fefb735` (fix: chat API)
- **RFC 7231:** HTTP Accept header semantics

## Acceptance Criteria

- [ ] JSON format available via `Accept: application/json`
- [ ] SSE remains default (no Accept or text/event-stream)
- [ ] Both formats save chat history
- [ ] Both return same error formats
- [ ] Test: curl with JSON works
- [ ] Test: Browser SSE continues working

## Work Log

### 2025-12-17 - Initial Discovery

**By:** Claude Code (Code Review)

**Actions:**
- Identified SSE-only limitation during agent-native review
- Analyzed agent consumption patterns
- Documented 3 solution approaches

**Learnings:**
- SSE parsing adds friction for agent integrations
- Accept header is standard approach for format negotiation
- Non-streaming good for simple request/response agents
