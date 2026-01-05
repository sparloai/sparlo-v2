---
status: pending
priority: p2
issue_id: "148"
tags: [security, dd-mode, logging, privacy]
dependencies: []
---

# DD Mode v2: JSON Parsing Error Information Disclosure

## Problem Statement

Detailed error logging exposes sensitive information about LLM responses, including response previews that may contain confidential startup data. This data may be accessible to support staff or logging services.

## Findings

**Location:** `/apps/web/lib/llm/client.ts:473-495`

**Vulnerable code:**
```typescript
console.error(`[JSON Parse Error] ${context}:`, {
  originalLength: response.length,
  extractedLength: jsonStr.length,
  preview: jsonStr.slice(0, 500),  // May contain sensitive data
  ending: jsonStr.slice(-200),      // May contain sensitive data
});
```

**Impact:**
- Information Disclosure: Sensitive startup data logged
- Competitive Intelligence: Logs may be accessible
- Compliance Risk: GDPR/privacy violations

## Proposed Solutions

### Option A: Redact Sensitive Data (Recommended)
- Create redaction function for logging
- Remove emails, phone numbers, long strings
- Pros: Keeps debugging ability, protects data
- Cons: Minor code addition
- Effort: Low (1-2 hours)
- Risk: Low

## Acceptance Criteria

- [ ] Sensitive data redacted from error logs
- [ ] Preview size reduced to 200 characters
- [ ] Emails and phone numbers masked
- [ ] Long strings truncated with [REDACTED]

## Work Log

### 2026-01-03 - Issue Created

**By:** Claude Code

**Actions:**
- Identified during DD Mode v2 security review
- Analyzed logging patterns
- Proposed redaction approach
