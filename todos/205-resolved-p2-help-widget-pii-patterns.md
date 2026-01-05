---
status: pending
priority: p2
issue_id: 205
tags: [code-review, security, help-center]
dependencies: []
---

# PII Detection Limited to US Formats

## Problem Statement

The PII patterns in the security module are limited to common US formats (credit cards, SSN) and miss important sensitive data types like email addresses, phone numbers, JWT tokens, and international formats.

## Findings

**Location**: `apps/web/lib/security/pii-detector.ts` (lines 3-8)

**Current Patterns**:
```typescript
const PII_PATTERNS: Record<string, RegExp> = {
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  password: /password\s*[:=]\s*['"]?([^\s'"]+)/gi,
  apiKey: /\b(sk-|pk-|api[_-]?key)[a-z0-9_-]{20,}\b/gi,
};
```

**Missing Patterns**:
- Email addresses
- Phone numbers
- Internal IP addresses
- JWT tokens
- OAuth tokens

## Proposed Solutions

### Solution A: Expand PII Patterns (Recommended)
**Pros**: Better coverage, catches more sensitive data
**Cons**: More regex complexity, slight performance impact
**Effort**: Small (15 min)
**Risk**: Low (may have false positives)

```typescript
const PII_PATTERNS: Record<string, RegExp> = {
  // Existing
  creditCard: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g,
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,
  password: /password\s*[:=]\s*['"]?([^\s'"]+)/gi,
  apiKey: /\b(sk-|pk-|api[_-]?key)[a-z0-9_-]{20,}\b/gi,

  // New patterns
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  phone: /\b(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g,
  internalIp: /\b(?:10\.|172\.(1[6-9]|2[0-9]|3[01])\.|192\.168\.)\d{1,3}\.\d{1,3}\b/g,
  jwt: /eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/g,
};
```

## Technical Details

- **Affected Files**: `apps/web/lib/security/pii-detector.ts`
- **Components**: validateNoPII function
- **Database Changes**: None

## Acceptance Criteria

- [ ] Email pattern added and tested
- [ ] Phone pattern added (US format at minimum)
- [ ] Internal IP pattern added
- [ ] JWT pattern added
- [ ] User-friendly error messages for each type
- [ ] No false positives on common text

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Security review finding |

## Resources

- Agent: security-sentinel review
