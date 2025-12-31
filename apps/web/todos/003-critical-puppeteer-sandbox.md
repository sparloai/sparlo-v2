---
id: "003"
title: "Address Puppeteer sandbox security"
priority: P1
status: completed
category: security
created: 2024-12-30
files:
  - app/api/reports/[id]/pdf/route.tsx
---

# Critical: Puppeteer Sandbox Disabled

## Problem

The Puppeteer configuration disables the Chrome sandbox with `--no-sandbox` and `--disable-setuid-sandbox`. Combined with XSS vulnerabilities, this could allow remote code execution if malicious content is rendered.

```typescript
args: [
  '--no-sandbox',           // DANGEROUS
  '--disable-setuid-sandbox', // DANGEROUS
  // ...
],
```

## Context

Railway runs containers without full root capabilities, which is why `--no-sandbox` was added. However, this creates a security risk.

## Options

### Option A: Fix XSS First (Minimum)
If XSS vulnerabilities (todo #001) are fixed, the sandbox risk is significantly reduced since we control the HTML being rendered.

### Option B: Use Container Isolation (Preferred)
Ensure Railway container runs with proper isolation:
- Use non-root user
- Drop unnecessary capabilities
- Consider using `--disable-setuid-sandbox` only (not `--no-sandbox`)

### Option C: Use Seccomp Profile
Add a seccomp profile to the container that restricts syscalls.

## Acceptance Criteria

- [ ] XSS vulnerabilities are fixed first (dependency on #001)
- [ ] Document the security trade-offs in code comments
- [ ] Consider adding container security configuration for Railway
- [ ] Remove `--single-process` flag (it conflicts with sandbox anyway)
