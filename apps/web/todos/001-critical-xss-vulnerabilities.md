---
id: "001"
title: "Fix XSS vulnerabilities in PDF HTML rendering"
priority: P1
status: completed
category: security
created: 2024-12-30
files:
  - app/api/reports/[id]/print/_lib/render-report-html.ts
---

# Critical: XSS Vulnerabilities in Class Attributes

## Problem

The `render-report-html.ts` file has XSS vulnerabilities where user-controlled data is inserted directly into HTML class attributes without sanitization:

```typescript
// VULNERABLE - risk.severity injected directly into class
<div class="risk-item risk-${risk.severity}">

// VULNERABLE - gap.status injected directly into class
<div class="gap-item gap-${gap.status}">
```

An attacker could craft malicious data like:
```
severity: '" onclick="alert(1)" data-x="'
```

This would break out of the class attribute and inject arbitrary event handlers.

## Required Fix

Create a whitelist sanitizer for these values:

```typescript
const VALID_SEVERITIES = ['high', 'medium', 'low'] as const;
const VALID_STATUSES = ['open', 'closed', 'in-progress'] as const;

function sanitizeSeverity(severity: string): string {
  const normalized = severity.toLowerCase();
  return VALID_SEVERITIES.includes(normalized as any) ? normalized : 'medium';
}

function sanitizeStatus(status: string): string {
  const normalized = status.toLowerCase();
  return VALID_STATUSES.includes(normalized as any) ? normalized : 'open';
}
```

## Acceptance Criteria

- [ ] All dynamic values in class attributes are whitelisted
- [ ] Invalid values fall back to safe defaults
- [ ] No user-controlled data is interpolated into HTML attributes without sanitization
