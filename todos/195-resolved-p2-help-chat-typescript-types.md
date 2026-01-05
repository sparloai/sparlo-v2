---
status: resolved
priority: p2
issue_id: 195
tags: [code-review, typescript, help-chat]
dependencies: []
---

# Missing TypeScript Types for Anthropic Stream Events

## Problem Statement

The streaming code lacks explicit type annotations for Anthropic SDK events, potentially allowing `any` types to sneak in and defeating TypeScript's purpose.

**Impact:** Type safety reduced, potential runtime errors, poor IntelliSense.

## Findings

**Location 1:** `apps/web/app/api/help/chat/route.ts:104`
```typescript
let stream; // Type is 'any'
```

**Location 2:** `apps/web/app/api/help/chat/route.ts:141`
```typescript
for await (const event of stream) {
  // 'event' is likely typed as 'any' depending on Anthropic SDK version
  if (
    event.type === 'content_block_delta' &&
    event.delta.type === 'text_delta'
  ) {
```

**Location 3:** `apps/web/app/api/help/chat/route.ts:154`
```typescript
buffer += event.delta.text; // What if text is undefined?
```

## Proposed Solutions

### Option A: Add Explicit Types from Anthropic SDK (Recommended)

**Pros:** Full type safety, better IntelliSense
**Cons:** None
**Effort:** Small (30 minutes)
**Risk:** None

```typescript
import type { Stream } from '@anthropic-ai/sdk/lib/streaming';
import type { MessageStreamEvent } from '@anthropic-ai/sdk/resources/messages';

let stream: Stream<Anthropic.Messages.MessageStreamEvent> | undefined;

// In streaming loop
for await (const event of stream as AsyncIterable<MessageStreamEvent>) {
  if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
    const deltaText = event.delta.text ?? '';
    buffer += deltaText;
```

### Option B: Type Guard Functions

**Pros:** Cleaner code, reusable
**Cons:** Additional code
**Effort:** Small (45 minutes)
**Risk:** None

```typescript
function isTextDelta(event: MessageStreamEvent): event is ContentBlockDeltaEvent {
  return event.type === 'content_block_delta' && event.delta.type === 'text_delta';
}

for await (const event of stream) {
  if (isTextDelta(event)) {
    buffer += event.delta.text; // Type narrowed correctly
  }
}
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/api/help/chat/route.ts` (lines 104, 141, 154)

## Acceptance Criteria

- [ ] No implicit `any` types in streaming code
- [ ] TypeScript strict mode passes
- [ ] IntelliSense works for event properties
- [ ] Null checks on optional properties

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from TypeScript review | External SDK types need explicit annotation |

## Resources

- Anthropic SDK types: `@anthropic-ai/sdk/resources/messages`
