---
status: resolved
priority: p3
issue_id: 197
tags: [code-review, security, help-chat]
dependencies: []
---

# Information Disclosure via Zod Validation Errors

## Problem Statement

Zod validation errors expose internal schema details to clients, helping attackers understand validation rules and craft bypass payloads.

**Impact:** Information leakage, easier attack crafting.

## Findings

**Location:** `apps/web/app/api/help/chat/route.ts:219-224`

```typescript
if (error instanceof z.ZodError) {
  return new Response(
    JSON.stringify({ error: 'Invalid request', details: error.errors }),  // ⚠️ Leaks schema
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
}
```

**Information Leaked:**
```json
{
  "error": "Invalid request",
  "details": [
    {
      "code": "too_big",
      "maximum": 2000,
      "path": ["message"],
      "message": "Message too long"
    }
  ]
}
```

## Proposed Solutions

### Option A: Generic Error in Production (Recommended)

**Pros:** Secure, helpful in development
**Cons:** Harder to debug production issues
**Effort:** Tiny (15 minutes)
**Risk:** None

```typescript
if (error instanceof z.ZodError) {
  logger.warn({ userId: user.id, errors: error.errors }, 'Validation failed');

  return new Response(
    JSON.stringify({
      error: 'Invalid request format. Please check your input.',
      ...(process.env.NODE_ENV === 'development' && { details: error.errors })
    }),
    { status: 400, headers: { 'Content-Type': 'application/json' } },
  );
}
```

## Recommended Action

<!-- To be filled during triage -->

## Technical Details

**Affected Files:**
- `apps/web/app/api/help/chat/route.ts` (lines 219-224)

## Acceptance Criteria

- [ ] Production responses don't include validation details
- [ ] Development responses still show details
- [ ] Errors logged server-side for debugging
- [ ] User-friendly error messages displayed

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from security review | Validation errors are information disclosure |

## Resources

- OWASP: Error Handling
