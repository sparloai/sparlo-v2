---
status: ready
priority: p1
issue_id: "037"
tags: [security, validation, input]
dependencies: []
---

# Add Max Length Validation on Input Fields

No maximum length validation allows oversized inputs that could exhaust resources.

## Problem Statement

The `createReport` server action accepts a `designChallenge` field with only minimum length validation (50 chars). Without max length:
- User could submit megabytes of text
- LLM context window exceeded
- Database bloat from large JSONB fields
- Memory exhaustion during processing

## Findings

- File: `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- Schema: `designChallenge: z.string().min(50)` - no max!
- Claude context window: ~200K tokens
- Reasonable max for design challenge: 10,000 characters

**Current vulnerable schema:**
```typescript
const CreateReportSchema = z.object({
  accountId: z.string().uuid(),
  designChallenge: z.string().min(50),  // ❌ No max
});
```

**Potential attack:**
```typescript
// Malicious input
const input = {
  accountId: 'valid-uuid',
  designChallenge: 'A'.repeat(100_000_000), // 100MB string
};
```

## Proposed Solutions

### Option 1: Add Max Length to Zod Schema (Recommended)

**Approach:** Add `.max()` validation to all text fields.

```typescript
const CreateReportSchema = z.object({
  accountId: z.string().uuid(),
  designChallenge: z.string()
    .min(50, 'Please provide at least 50 characters')
    .max(10000, 'Design challenge must be under 10,000 characters'),
});
```

**Pros:**
- Simple fix
- Validation at schema level
- Clear error messages
- Works client and server side

**Cons:**
- Need to choose appropriate limits

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Add Length Validation at Multiple Layers

**Approach:** Validate at form, API, and database levels.

```typescript
// Form level (client)
<textarea maxLength={10000} />

// Schema level (Zod)
z.string().max(10000)

// Database level (constraint)
ALTER TABLE sparlo_reports
ADD CONSTRAINT check_title_length CHECK (char_length(title) <= 1000);
```

**Pros:**
- Defense in depth
- Database constraint prevents bypass

**Cons:**
- More code
- Triple maintenance

**Effort:** 1-2 hours

**Risk:** Low

## Recommended Action

Implement Option 1 immediately, consider Option 2 for production:

1. Add `.max(10000)` to `designChallenge` schema
2. Add max length to title: `.max(200)`
3. Add max length to clarification answer: `.max(5000)`
4. Update form textarea with `maxLength` attribute

**Suggested limits:**
| Field | Max Length | Reason |
|-------|------------|--------|
| designChallenge | 10,000 | Reasonable problem description |
| title | 200 | UI display constraints |
| clarification answer | 5,000 | Follow-up answers |
| chat message | 5,000 | Chat interactions |

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/server/sparlo-reports-server-actions.ts`
- `apps/web/app/home/(user)/reports/new/_components/new-report-form.tsx`

**Schema updates needed:**
- `CreateReportSchema`
- `AnswerClarificationSchema`
- `RenameReportSchema`
- Any chat message schemas

## Acceptance Criteria

- [ ] All text input schemas have max length
- [ ] Form textareas have maxLength attribute
- [ ] Error messages are user-friendly
- [ ] Oversized inputs rejected with 400
- [ ] Test: 100KB input is rejected

## Work Log

### 2025-12-16 - Security Review Discovery

**By:** Claude Code (Security Sentinel Agent)

**Actions:**
- Identified missing max length validation
- Calculated potential resource exhaustion impact
- Documented appropriate limits per field

**Learnings:**
- Always validate both min and max for text inputs
- Claude context window limits provide natural ceiling
- Form maxLength provides immediate UX feedback
