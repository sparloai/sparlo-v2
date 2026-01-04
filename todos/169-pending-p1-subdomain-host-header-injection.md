---
status: completed
priority: p1
issue_id: "169"
tags: [code-review, security, subdomain]
dependencies: []
---

# Host Header Injection in Subdomain Detection

## Problem Statement

The `isAppSubdomain()` function in the middleware uses `startsWith()` to check the host header, which is user-controlled. This creates multiple attack vectors including authentication bypass.

**Why it matters**: Attackers can bypass subdomain protection by manipulating the Host header (e.g., `app.sparlo.ai.attacker.com` passes the check).

## Findings

**Agent**: security-sentinel

**Location**: `/apps/web/proxy.ts:28-31`

```typescript
function isAppSubdomain(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? '';
  return host.startsWith(`${APP_SUBDOMAIN}.${PRODUCTION_DOMAIN}`);
}
```

**Attack Scenarios**:
1. `Host: app.sparlo.ai.attacker.com` → passes check, bypasses main domain auth
2. DNS rebinding with similar host patterns
3. Cache poisoning if responses are cached by host header

## Proposed Solutions

### Option 1: Use exact hostname match (Recommended)
```typescript
function isAppSubdomain(request: NextRequest): boolean {
  const host = request.headers.get('host') ?? '';
  const hostname = host.split(':')[0]; // Remove port

  const allowedHosts = new Set(['app.sparlo.ai']);
  return allowedHosts.has(hostname);
}
```
- **Pros**: Simple, secure, prevents all host header attacks
- **Cons**: Need to update allowlist for new subdomains
- **Effort**: Small
- **Risk**: Low

### Option 2: Regex with end anchor
```typescript
const pattern = new RegExp(`^${APP_SUBDOMAIN}\\.${PRODUCTION_DOMAIN.replace('.', '\\.')}(:\\d+)?$`);
return pattern.test(host);
```
- **Pros**: Handles port numbers
- **Cons**: More complex, regex overhead
- **Effort**: Small
- **Risk**: Medium (regex complexity)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/proxy.ts`

**Related Constants**:
- `APP_SUBDOMAIN = 'app'`
- `PRODUCTION_DOMAIN = 'sparlo.ai'`

## Acceptance Criteria

- [ ] Host header is validated with exact match, not prefix
- [ ] Port numbers are handled correctly
- [ ] Security tests added for host header manipulation
- [ ] No regression in legitimate subdomain detection

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via security-sentinel agent |
| 2026-01-04 | Fixed | Created `isAppSubdomainHost()` in `config/subdomain.config.ts` with exact hostname matching using a Set. Updated `proxy.ts` to use the shared function. |

## Resources

- PR/Commit: 3042c09
- OWASP Host Header Injection: https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/07-Input_Validation_Testing/17-Testing_for_HTTP_Incoming_Requests
