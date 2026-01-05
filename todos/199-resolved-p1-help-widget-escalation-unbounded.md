---
status: pending
priority: p1
issue_id: 199
tags: [code-review, security, help-center]
dependencies: []
---

# Escalation Information Disclosure - Unbounded Conversation Submission

## Problem Statement

The escalation endpoint submits the entire conversation history without sanitization or size limits. This could expose sensitive information or allow attackers to create massive support tickets.

## Findings

**Location**: `apps/web/components/help-widget/help-chat-widget.tsx` (lines 189-194)

**Current Code**:
```typescript
body: JSON.stringify({
  subject: 'Chat Escalation: Needs human assistance',
  description: messages
    .map((m) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content}`)
    .join('\n\n'),
  category: 'general',
}),
```

**Exploit Vectors**:
1. Submit extremely long conversation (no length check)
2. Include malicious content that bypasses chat validation
3. No rate limiting specific to escalations

## Proposed Solutions

### Solution A: Client-Side Limits (Recommended)
**Pros**: Quick fix, reduces payload size immediately
**Cons**: Client-side limits can be bypassed
**Effort**: Small (10 min)
**Risk**: Low

```typescript
const description = messages
  .slice(-10) // Last 10 messages only
  .map((m) => `${m.role === 'user' ? 'User' : 'Bot'}: ${m.content.slice(0, 500)}`)
  .join('\n\n')
  .slice(0, 5000); // Max 5KB
```

### Solution B: Server-Side Validation
**Pros**: Cannot be bypassed, consistent enforcement
**Cons**: Requires API route modification
**Effort**: Medium
**Risk**: Low

Add validation in `/api/help/tickets/route.ts`:
```typescript
const TicketSchema = z.object({
  description: z.string().max(10000, 'Description too long'),
});
```

### Solution C: Both Client and Server Limits
**Pros**: Defense in depth
**Cons**: More code
**Effort**: Medium
**Risk**: Low

## Recommended Action

Implement Solution C - add both client-side truncation and server-side validation.

## Technical Details

- **Affected Files**:
  - `apps/web/components/help-widget/help-chat-widget.tsx`
  - `apps/web/app/api/help/tickets/route.ts`
- **Components**: HelpChatWidget escalation flow
- **Database Changes**: None

## Acceptance Criteria

- [ ] Escalation limited to last 10 messages
- [ ] Individual message content truncated to 500 chars
- [ ] Total description capped at 5KB client-side
- [ ] Server validates description length <=10KB
- [ ] Error handling for oversized submissions

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Security review finding |

## Resources

- PR: Current uncommitted changes
- Agent: security-sentinel review
