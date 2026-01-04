---
status: complete
priority: p1
issue_id: "183"
tags: [pdf, docraptor, security, error-handling]
dependencies: []
---

# P1: DocRaptor Error Messages May Leak API Key

## Problem Statement

DocRaptor API error responses may contain the API key in error messages (e.g., "Invalid credentials: YOUR_API_KEY_HERE"). These errors are:
1. Logged to console (captured by logging services)
2. Thrown as exceptions (may be exposed in non-production)
3. Could leak via error monitoring (Sentry, etc.)

## Findings

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx:113-117`

```typescript
if (!response.ok) {
  const errorText = await response.text();
  console.error('[PDF Export] DocRaptor API error:', response.status, errorText); // ❌ May log API key
  throw new Error(`DocRaptor API error: ${response.status} - ${errorText}`);  // ❌ May expose API key
}
```

## Proposed Solutions

### Option 1: Sanitize Error Messages (Recommended)

Map HTTP status codes to generic messages, don't log raw error body.

```typescript
if (!response.ok) {
  // Don't log raw error - may contain credentials
  console.error('[PDF Export] DocRaptor API error:', response.status);

  const statusMessages: Record<number, string> = {
    401: 'PDF service authentication failed',
    402: 'PDF service quota exceeded',
    429: 'PDF service rate limit exceeded',
    500: 'PDF service internal error',
  };

  const safeMessage = statusMessages[response.status] || 'PDF generation service error';
  throw new Error(safeMessage);
}
```

**Pros:**
- No credential exposure risk
- User-friendly error messages
- Still logs status code for debugging

**Cons:**
- Loses detailed error info (acceptable for security)

**Effort:** Small (15 min)
**Risk:** Low

## Recommended Action

_To be filled during triage_

## Technical Details

**Affected files:**
- `apps/web/app/api/reports/[id]/pdf/route.tsx`

## Acceptance Criteria

- [ ] Raw error text not logged to console
- [ ] Raw error text not included in thrown exception
- [ ] Status code still logged for debugging
- [ ] User-friendly error messages for common status codes

## Work Log

### 2026-01-04 - Initial Finding

**By:** Code Review Agent (security-sentinel)

**Actions:**
- Identified potential API key leak in error messages
- Analyzed DocRaptor error response format
- Proposed sanitization approach

**Learnings:**
- Third-party APIs may include credentials in error messages
- Always sanitize error responses before logging or exposing

### 2026-01-04 - Fixed

**By:** Claude Code

**Actions:**
- Added DOCRAPTOR_ERROR_MESSAGES map for status code → message (lines 81-91)
- Log only status code, not raw error body (line 134)
- Throw sanitized error message from map (lines 135-138)

**File:** `apps/web/app/api/reports/[id]/pdf/route.tsx`
