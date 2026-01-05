---
status: pending
priority: p3
issue_id: "217"
tags: [code-review, security, xss]
dependencies: []
---

# Sanitize URL Parameters in Analysis Forms

## Problem Statement

The `prefill` and `error` URL parameters are passed to form components without sanitization. While React's JSX escaping provides protection, this is defense-in-depth that should be explicitly implemented.

**Example attack vector:**
```
https://app.sparlo.com/home/reports/new?prefill=<script>steal_data()</script>&error=malicious
```

## Findings

- **Report Mode Selector:** `apps/web/app/home/(user)/reports/new/_components/report-mode-selector.tsx:83`
  ```typescript
  <TechnicalAnalysisForm prefill={prefill} error={error} />
  ```

- **Technical Form:** `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx:175`
  ```typescript
  problemText: prefill || '',  // Directly uses unsanitized URL param
  ```

- **Error Display:** Both forms render error prop in JSX
  - React escapes by default, so immediate XSS risk is low
  - However, if rendering pattern changes, risk increases

**Risk Assessment:** LOW - React's JSX escaping provides protection, but explicit sanitization is best practice.

## Proposed Solutions

### Option 1: Add Sanitization Function

**Approach:** Create and apply input sanitization.

```typescript
function sanitizeInput(input: string | undefined): string {
  if (!input) return '';
  return input
    .replace(/<script[^>]*>.*?<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .substring(0, 10000); // Length limit
}

// Usage
problemText: sanitizeInput(prefill),
showRefusalWarning: error === 'refusal', // Only allow known codes
```

**Pros:**
- Defense in depth
- Prevents future vulnerabilities

**Cons:**
- May strip legitimate content (rare)
- Slight overhead

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Validate Error Codes Only

**Approach:** Only allow known error code values, sanitize prefill minimally.

```typescript
const VALID_ERROR_CODES = ['refusal', 'rate-limit', 'usage-exceeded'] as const;
const validError = VALID_ERROR_CODES.includes(error) ? error : undefined;
```

**Pros:**
- Strict validation for error codes
- Minimal changes

**Cons:**
- Still passes prefill through

**Effort:** 15 minutes

**Risk:** Low

## Recommended Action

*To be filled during triage.*

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/reports/new/page.tsx` - URL param extraction
- `apps/web/app/home/(user)/reports/new/_components/report-mode-selector.tsx:83`
- `apps/web/app/home/(user)/reports/new/_components/technical-analysis-form.tsx:175`

## Acceptance Criteria

- [ ] URL params sanitized before use
- [ ] HTML tags stripped from prefill
- [ ] Error param validated against known codes
- [ ] Legitimate use cases still work
- [ ] Tests pass

## Work Log

### 2026-01-04 - Code Review Finding

**By:** Claude Code (security-sentinel agent)

**Actions:**
- Identified URL parameter flow
- Assessed XSS risk (low due to React escaping)
- Recommended defense-in-depth approach

**Learnings:**
- React provides default XSS protection
- Explicit sanitization is still best practice
- URL params should be treated as untrusted input

## Notes

- P3 priority - React already provides protection
- Part of defense-in-depth security posture
- Consider adding Content-Security-Policy headers as well
