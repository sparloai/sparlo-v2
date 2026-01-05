---
status: resolved
priority: p1
issue_id: 189
tags: [code-review, security, help-chat]
dependencies: []
---

# Unbounded Buffer Growth - Memory Exhaustion Attack

## Problem Statement

The buffer used for escalation marker detection in the Help Center chat API has no size limit and continues to accumulate text indefinitely. An attacker could trigger Claude to generate extremely long responses, causing memory exhaustion.

**Impact:** DoS vulnerability - could consume excessive server memory with concurrent requests.

## Findings

**Location:** `apps/web/app/api/help/chat/route.ts:154-165`

```typescript
buffer += event.delta.text;  // Line 154 - No limit!

// Only emits when buffer > MARKER_LENGTH (25 chars)
if (buffer.length > MARKER_LENGTH) {
  const safeToEmit = buffer.slice(0, -MARKER_LENGTH);
  buffer = buffer.slice(-MARKER_LENGTH);  // Only keeps last 25 chars
```

**Attack Scenario:**
1. Attacker sends prompt: "Repeat 'A' 1 million times"
2. If Claude generates a single chunk with 1M characters, buffer grows to 1M before the check
3. With 20 concurrent requests allowed per hour, could consume 20MB+ of memory
4. Repeated attacks cause memory pressure and potential DoS

**Evidence:** Security audit identified CVSS Score 7.5 (High)

## Proposed Solutions

### Option A: Add Buffer Size Limit (Recommended)

**Pros:** Simple, minimal code change, effective
**Cons:** None
**Effort:** Small (30 minutes)
**Risk:** None

```typescript
const MAX_BUFFER_SIZE = 10000; // 10KB limit

buffer += event.delta.text;

// Prevent buffer overflow
if (buffer.length > MAX_BUFFER_SIZE) {
  controller.enqueue(
    encoder.encode('\n\n[Response too large - truncated]')
  );
  break;
}
```

### Option B: Simplify to Accumulate-and-Replace

**Pros:** Eliminates buffer complexity entirely, -35 LOC
**Cons:** Theoretical edge case of marker spanning chunks
**Effort:** Medium (2 hours)
**Risk:** Low

```typescript
let fullResponse = '';
for await (const event of stream) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    const text = event.delta.text;
    fullResponse += text;
    // Check and emit without buffering
    const chunk = encoder.encode(text.replace(ESCALATION_MARKER, ''));
    controller.enqueue(chunk);
  }
}
// Final check for escalation
if (fullResponse.includes(ESCALATION_MARKER)) {
  escalationDetected = true;
}
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/api/help/chat/route.ts` (lines 133-189)

**Components:** Help Center Chat API streaming handler

## Acceptance Criteria

- [ ] Buffer has a maximum size limit (recommend 10KB)
- [ ] Graceful handling when limit exceeded (truncation message)
- [ ] Existing escalation detection still works
- [ ] No memory growth beyond limit during stress testing
- [ ] Unit test covers buffer overflow scenario

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from security review | Buffer accumulation in streaming is a common DoS vector |

## Resources

- Security audit: CVSS 7.5 (High)
- Related: MAX_RESPONSE_BYTES already exists (50KB) but applies after buffer
