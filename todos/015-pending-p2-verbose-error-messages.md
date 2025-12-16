---
status: pending
priority: p2
issue_id: "015"
tags: [security, error-handling, frontend, backend]
dependencies: []
---

# Verbose Error Messages Expose Internal Details

Error messages in both frontend and backend expose internal implementation details.

## Problem Statement

Current error handling exposes:
- Stack traces in development/production
- Internal API structure
- Library names and versions
- File paths and line numbers

This information helps attackers understand system internals for targeted attacks.

**Severity:** P2 - Information disclosure, aids reconnaissance

## Findings

- **Frontend:** `apps/web/app/home/(user)/_lib/use-sparlo.ts`
- **Backend:** `sparlo-backend/main.py`

**Examples of verbose errors:**

```typescript
// Frontend - exposes internal structure
catch (error) {
  console.error('[useSparlo] Failed to fetch status:', error);
  // Full error object logged, may include stack traces
}
```

```python
# Backend - exposes internal details
except Exception as e:
    logger.error(f"Analysis failed: {str(e)}")
    raise HTTPException(status_code=500, detail=str(e))
    # str(e) may include file paths, library internals
```

**Information leaked:**
1. Internal function names (`[useSparlo]`)
2. API endpoint structure
3. Error stack traces
4. Library error messages (Anthropic API errors, etc.)
5. File paths in Python tracebacks

## Proposed Solutions

### Option 1: Standardized Error Response Format

**Approach:** Create consistent error format that hides internals

**Pros:**
- Consistent user experience
- Clear separation of user vs. internal errors
- Easy to implement

**Cons:**
- Debugging harder without full errors
- Must ensure logging still captures details

**Effort:** 2-3 hours

**Risk:** Low

**Implementation:**
```typescript
// Frontend error handler
function getSafeErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    // Known error types have safe messages
    return error.userMessage;
  }
  if (error instanceof TimeoutError) {
    return 'Request timed out. Please try again.';
  }
  // Generic fallback - never expose raw error
  return 'An unexpected error occurred. Please try again.';
}

// Log full error internally
console.error('[Internal]', error);
// Return safe message to UI
setError(getSafeErrorMessage(error));
```

```python
# Backend error handler
class SafeHTTPException(HTTPException):
    def __init__(self, status_code: int, user_message: str, internal_error: Exception = None):
        super().__init__(status_code=status_code, detail=user_message)
        if internal_error:
            logger.error(f"Internal error: {internal_error}", exc_info=True)

# Usage
try:
    result = await analyze(data)
except AnthropicError as e:
    raise SafeHTTPException(500, "Analysis service unavailable", e)
```

---

### Option 2: Error Code System

**Approach:** Use error codes instead of messages, map to user-friendly text

**Pros:**
- Complete separation of internal/external
- Easier i18n
- Debugging via error codes

**Cons:**
- More infrastructure
- Code lookup table needed
- More complex implementation

**Effort:** 4-5 hours

**Risk:** Low

---

### Option 3: Environment-Based Error Detail

**Approach:** Show verbose errors in dev, sanitized in prod

**Pros:**
- Best of both worlds
- Easy debugging in dev
- Secure in production

**Cons:**
- Different behavior dev/prod
- May miss bugs that only show in prod
- Must ensure env is correct

**Effort:** 2-3 hours

**Risk:** Medium (relies on env config)

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/use-sparlo.ts` - Frontend error handling
- `apps/web/app/home/(user)/_lib/api.ts` - API error classes
- `sparlo-backend/main.py` - Backend error responses
- `sparlo-backend/chain.py` - Analysis error handling

**Current error classes:**
- `TimeoutError` - Already has clean message
- `ApiError` - Needs safe message property
- Python `HTTPException` - Needs wrapper

## Resources

- **OWASP Error Handling:** https://cheatsheetseries.owasp.org/cheatsheets/Error_Handling_Cheat_Sheet.html
- **FastAPI Exception Handling:** https://fastapi.tiangolo.com/tutorial/handling-errors/

## Acceptance Criteria

- [ ] User-facing errors don't expose internal details
- [ ] Full error details logged for debugging
- [ ] Stack traces never shown to users
- [ ] API endpoint structure not revealed in errors
- [ ] Library-specific errors wrapped
- [ ] Consistent error format across frontend/backend

## Work Log

### 2025-12-15 - Initial Discovery

**By:** Claude Code (Security Review Agent)

**Actions:**
- Reviewed error handling in use-sparlo.ts
- Checked backend exception handling in main.py
- Identified information disclosure patterns
- Evaluated error response formats

**Learnings:**
- Frontend logs full errors to console (acceptable)
- Backend returns raw exception strings (not acceptable)
- TimeoutError already has good pattern
- Need consistent approach across codebase

## Notes

- Lower priority than auth issues but easy win
- Can be done incrementally
- Consider error monitoring service (Sentry) integration
- Related to Issue 009 - if auth exists, error info less useful to attackers
