---
status: pending
priority: p3
issue_id: "025"
tags: [typescript, code-quality, maintainability, code-review]
dependencies: []
---

# Timestamp Conversion Logic Scattered Across Files

## Problem Statement

Date/string timestamp conversions are duplicated across multiple files with no single source of truth. This creates:
- Easy-to-miss conversion bugs
- Inconsistent handling patterns
- Type confusion between ChatMessage and ChatHistoryMessage

**Why it matters:**
- Maintenance burden - changes needed in multiple places
- Bug risk - easy to forget conversion in new features
- No compile-time guarantee conversions are correct

## Findings

**Locations with timestamp conversion:**
1. `use-chat.ts:77-80` - Date to ISO string
2. `page.tsx:66-69` - ISO string to Date
3. `use-sparlo.ts:1199-1204` - Returns raw ISO strings

**Current dual types:**
```typescript
// use-chat.ts
interface ChatMessage {
  timestamp: Date;  // Client-side
}

// server-actions.ts
interface ChatHistoryMessage {
  timestamp: string;  // DB storage
}
```

## Proposed Solutions

### Option A: Create Converter Utility (Recommended)

```typescript
// NEW FILE: _lib/chat-types.ts
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  isStreaming?: boolean;
}

export interface ChatMessageDTO {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string; // ISO 8601
}

export const ChatMessageConverter = {
  toDTO(message: ChatMessage): ChatMessageDTO {
    return {
      id: message.id,
      role: message.role,
      content: message.content,
      timestamp: message.timestamp.toISOString(),
    };
  },

  fromDTO(dto: ChatMessageDTO): ChatMessage {
    return {
      id: dto.id,
      role: dto.role,
      content: dto.content,
      timestamp: new Date(dto.timestamp),
    };
  },

  toDTOArray(messages: ChatMessage[]): ChatMessageDTO[] {
    return messages.map(m => this.toDTO(m));
  },

  fromDTOArray(dtos: ChatMessageDTO[]): ChatMessage[] {
    return dtos.map(d => this.fromDTO(d));
  },
};
```

**Pros:** Single source of truth, type-safe, testable
**Cons:** New file to maintain
**Effort:** Small (30 min)
**Risk:** Very Low

### Option B: Keep Timestamps as Strings Everywhere

Simplify by not converting - use ISO strings throughout and only format for display.

**Pros:** Removes all conversion logic
**Cons:** Less ergonomic for date arithmetic
**Effort:** Medium (1 hour)
**Risk:** Low

## Recommended Action

Implement Option A for better type safety and maintainability.

## Technical Details

**Affected files:**
- NEW: `apps/web/app/home/(user)/_lib/chat-types.ts`
- `apps/web/app/home/(user)/_lib/use-chat.ts`
- `apps/web/app/home/(user)/page.tsx`
- `apps/web/app/home/(user)/_lib/use-sparlo.ts`

## Acceptance Criteria

- [ ] Single ChatMessageConverter utility created
- [ ] All timestamp conversions use the converter
- [ ] No raw Date/string conversions scattered in code
- [ ] TypeScript compiles without errors
- [ ] Existing behavior unchanged

## Work Log

### 2025-12-15 - Code Review Finding

**By:** Claude Code

**Actions:**
- Identified via TypeScript and simplicity reviews
- Documented scattered conversion points
- Proposed centralized converter

**Learnings:**
- Dual types at boundaries need explicit converters
- Single source of truth prevents conversion bugs

## Resources

- TypeScript Review findings
- Code Simplicity Review findings
