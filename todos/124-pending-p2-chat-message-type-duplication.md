---
status: completed
priority: p2
issue_id: 124
tags: [code-review, typescript, architecture, chat-components]
dependencies: []
---

# Type Duplication: Message vs ChatMessage

## Problem Statement

The `Message` interface is defined locally in `chat-messages.tsx` but duplicates `ChatMessage` from `chat.schema.ts`. This violates DRY and creates maintenance burden.

**Why it matters**: Schema drift, inconsistent types across components, harder maintenance.

## Findings

**Location 1**: `/apps/web/app/home/(user)/reports/[id]/_components/chat/chat-messages.tsx` (lines 10-17)
```typescript
interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  isStreaming?: boolean;
  cancelled?: boolean;
  error?: string;
}
```

**Location 2**: `/apps/web/app/home/(user)/reports/[id]/_lib/schemas/chat.schema.ts`
```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  // ... similar fields
}
```

## Proposed Solutions

### Option A: Import from schema (Recommended)
```typescript
// chat-messages.tsx
import type { ChatMessage } from '../../_lib/schemas/chat.schema';

interface ChatMessagesProps {
  messages: ChatMessage[];  // Single source of truth
  isStreaming: boolean;
  error?: string | null;
  onRetry?: () => void;
}
```

**Pros**: Single source of truth, no duplication
**Cons**: Need to ensure schema has all required fields
**Effort**: 15 minutes
**Risk**: Low

## Recommended Action

Import `ChatMessage` type from schema file instead of duplicating.

## Technical Details

**Affected files**:
- `/apps/web/app/home/(user)/reports/[id]/_components/chat/chat-messages.tsx`
- `/apps/web/app/home/(user)/reports/[id]/_lib/schemas/chat.schema.ts`

## Acceptance Criteria

- [ ] `Message` interface removed from chat-messages.tsx
- [ ] `ChatMessage` imported from schema
- [ ] All usages updated
- [ ] Typecheck passes

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2025-12-29 | Created from code review | Architecture and TypeScript reviewers both flagged |

## Resources

- Commit: 91f42b1
