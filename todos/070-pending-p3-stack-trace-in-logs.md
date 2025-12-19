---
status: completed
priority: p3
issue_id: "070"
tags: [code-review, security, logging]
dependencies: []
---

# Stack Traces in Console Logs May Leak Information

## Problem Statement

The onFailure handler logs stack traces which could be captured by log aggregation:
```typescript
console.error('Report generation failed:', {
  reportId,
  error: error.message,
  stack: error.stack, // <-- Exposes internal structure
});
```

## Findings

### Location: generate-report.ts (lines 73-77)

```typescript
console.error('Report generation failed:', {
  reportId,
  error: error.message,
  stack: error.stack,
});
```

**Risk Assessment**: LOW-MEDIUM
- Stack traces reveal file paths and code structure
- Logged data persists in monitoring systems
- Not directly user-facing, but could be in log UIs

**Context**: This is a server-side Inngest function, so logs go to:
- Inngest dashboard
- Server logs (Vercel, etc.)
- Any log aggregation service

## Proposed Solutions

### Option A: Conditional Stack Logging (Recommended)
Only log stack traces in development or to secure logging service.

```typescript
console.error('Report generation failed:', {
  reportId,
  error: error.message,
  ...(process.env.NODE_ENV === 'development' && { stack: error.stack }),
});
```

**Pros**: Stack available in dev, hidden in prod
**Cons**: Less debugging info in production
**Effort**: Small (5 min)
**Risk**: Low

### Option B: Structured Error Logging
Send to dedicated error monitoring service (Sentry, etc.).

**Pros**: Better error management, secure storage
**Cons**: Requires service setup
**Effort**: Medium (2 hours)
**Risk**: Low

## Recommended Action

Option A for quick fix. Consider Option B as part of broader observability effort.

## Technical Details

**Affected files**:
- `apps/web/lib/inngest/functions/generate-report.ts`

## Acceptance Criteria

- [ ] Stack traces not logged in production console.error
- [ ] Error message still logged for debugging
- [ ] Development retains full stack traces

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2024-12-19 | Created | From security review |

## Resources

- PR: Current branch changes
- OWASP Logging Guide
