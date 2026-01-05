---
status: pending
priority: p1
issue_id: 200
tags: [code-review, architecture, help-center]
dependencies: []
---

# Escalation Flow Design Flaw - Marker Detection Without Action

## Problem Statement

The escalation mechanism has a critical architectural inconsistency. When Claude includes the `__SYSTEM_ESCALATE_7a8b9c__` marker in responses (indicating user needs human help), the system detects it, logs it, but **does nothing**. The `escalateChat()` method in Plain service exists but is never called.

## Findings

**Two escalation paths exist, neither works correctly:**

### Path A: AI-Detected Escalation (Marker-based)
**Location**: `apps/web/app/api/help/chat/route.ts` (lines 169-206)
```typescript
if (escalationDetected) {
  logger.info({ ...ctx }, 'User escalated to human support');
  // Just logs - NO ACTION TAKEN
}
```

### Path B: Manual Escalation (Button)
**Location**: `apps/web/components/help-widget/help-chat-widget.tsx` (lines 181-210)
```typescript
const response = await fetch('/api/help/tickets', { /* ... */ });
// Uses generic ticket creation, NOT escalateChat()
```

### Unused Code
**Location**: `apps/web/lib/plain/plain-service.ts` (lines 128-208)
```typescript
async escalateChat(params: EscalateChatParams): Promise<PlainTicketResult> {
  // Formats chat history nicely
  // Includes escalation reason
  // Creates properly categorized thread
  // NEVER CALLED
}
```

## Proposed Solutions

### Solution A: Fix Both Paths (Recommended)
**Pros**: Uses existing well-designed code, proper escalation
**Cons**: More changes required
**Effort**: Medium (1-2 hours)
**Risk**: Low

1. Create `/api/help/escalate` endpoint using `escalateChat()`
2. Update chat widget to call new endpoint
3. Auto-trigger escalation when marker detected

### Solution B: Unify to Manual Only
**Pros**: Simpler, one path
**Cons**: Loses AI-detected escalation, wasted effort on marker detection
**Effort**: Small
**Risk**: Low

### Solution C: Unify to AI-Detected Only
**Pros**: Seamless UX, AI handles escalation decision
**Cons**: Removes user agency, users may want to escalate earlier
**Effort**: Medium
**Risk**: Medium

## Recommended Action

Implement Solution A:

1. Create `/api/help/escalate` route:
```typescript
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
```

2. Update chat widget `handleEscalate` to call `/api/help/escalate`

3. In chat route, trigger escalation when marker detected:
```typescript
if (escalationDetected) {
  const service = createPlainService();
  await service.escalateChat({...});
}
```

## Technical Details

- **Affected Files**:
  - `apps/web/app/api/help/escalate/route.ts` (new)
  - `apps/web/app/api/help/chat/route.ts`
  - `apps/web/components/help-widget/help-chat-widget.tsx`
- **Components**: Escalation flow, Plain.com integration
- **Database Changes**: None

## Acceptance Criteria

- [ ] `/api/help/escalate` endpoint created and functional
- [ ] Manual "Talk to a human" button uses new endpoint
- [ ] AI marker detection triggers automatic escalation
- [ ] User receives confirmation when escalated
- [ ] Plain.com tickets properly categorized

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Architecture review finding |

## Resources

- PR: Current uncommitted changes
- Agent: architecture-strategist review
