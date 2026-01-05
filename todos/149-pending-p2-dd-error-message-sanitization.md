---
status: pending
priority: p2
issue_id: "149"
tags: [security, dd-mode, error-handling, ux]
dependencies: []
---

# DD Mode v2: Inadequate Error Message Sanitization

## Problem Statement

Generic error messages don't distinguish between user errors and system failures. Users get unhelpful "Your report failed" messages without actionable feedback, while system details may leak in development mode.

## Findings

**Location:** `/apps/web/lib/inngest/utils/report-failure-handler.ts:29-30`

**Current behavior:**
```typescript
error_message:
  'Your report failed. Please submit a new analysis request and contact support if it happens repeatedly.',
```

**Issues:**
- No categorization of error types
- No actionable feedback for fixable errors (too large input, rate limit)
- Detailed stack traces may leak in development

## Proposed Solutions

### Option A: Error Categorization (Recommended)
- Map error types to user-friendly messages
- Provide actionable guidance for common errors
- Hide system details in production
- Pros: Better UX, proper security
- Cons: Requires error type mapping
- Effort: Medium (2-3 hours)
- Risk: Low

## Acceptance Criteria

- [ ] Token budget errors show size reduction guidance
- [ ] Rate limit errors show retry timing
- [ ] Internal errors hide system details
- [ ] Development mode shows stack traces safely
- [ ] Error types logged for analytics

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 security review
- Analyzed error message patterns
- Proposed categorization approach
