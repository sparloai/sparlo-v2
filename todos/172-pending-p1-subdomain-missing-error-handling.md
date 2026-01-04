---
status: completed
priority: p1
issue_id: "172"
tags: [code-review, security, error-handling, subdomain]
dependencies: []
---

# Missing Error Handling in Auth Callbacks

## Problem Statement

The auth callback routes lack try/catch blocks around authentication operations. If `exchangeCodeForSession()` or `verifyTokenHash()` fails, unhandled promise rejections crash the server or show cryptic errors.

**Why it matters**: Auth failures should be handled gracefully with user-friendly error messages, not cause server crashes or expose stack traces.

## Findings

**Agents**: pattern-recognition-specialist, security-sentinel

**Location 1**: `/apps/web/app/auth/callback/route.ts:43-61`
```typescript
export async function GET(request: NextRequest) {
  const service = createAuthCallbackService(getSupabaseServerClient());

  const { nextPath } = await service.exchangeCodeForSession(request, {
    joinTeamPath: pathsConfig.app.joinTeam,
    redirectPath: pathsConfig.app.home,
  });
  // No try/catch - what if exchangeCodeForSession fails?
```

**Location 2**: `/apps/web/app/auth/confirm/route.ts:84-96`
```typescript
if (authCode) {
  const { nextPath } = await service.exchangeCodeForSession(request, {
    joinTeamPath: pathsConfig.app.joinTeam,
    redirectPath,
  });
  // Still no try/catch for network/auth errors
```

**Additional Issue**: CSRF error uses wrong HTTP status code
- Location: `/apps/web/proxy.ts:102-104`
- Uses `401 Unauthorized` but comment says "403 response"
- CSRF errors should return `403 Forbidden`

## Proposed Solutions

### Option 1: Add try/catch with redirect to error page (Recommended)
```typescript
export async function GET(request: NextRequest) {
  try {
    const service = createAuthCallbackService(getSupabaseServerClient());
    const { nextPath } = await service.exchangeCodeForSession(request, {
      joinTeamPath: pathsConfig.app.joinTeam,
      redirectPath: pathsConfig.app.home,
    });
    // ... rest of logic
  } catch (error) {
    console.error('Auth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
    return redirect(`/auth/callback/error?error=${encodeURIComponent(errorMessage)}`);
  }
}
```
- **Pros**: User-friendly error page, logged errors for debugging
- **Cons**: Slightly more code
- **Effort**: Small
- **Risk**: Low

### Option 2: Return JSON for API clients
```typescript
const isApiClient = request.headers.get('accept')?.includes('application/json');

if (isApiClient) {
  return NextResponse.json({ error: 'Authentication failed' }, { status: 401 });
}
return redirect('/auth/callback/error?error=...');
```
- **Pros**: Supports both browser and API clients
- **Cons**: More complex logic
- **Effort**: Medium
- **Risk**: Low

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Affected Files**:
- `apps/web/app/auth/callback/route.ts`
- `apps/web/app/auth/confirm/route.ts`
- `apps/web/proxy.ts` (CSRF status code fix)

## Acceptance Criteria

- [ ] All auth operations wrapped in try/catch
- [ ] Errors logged with sufficient context for debugging
- [ ] User-friendly error messages displayed
- [ ] CSRF error returns 403 Forbidden (not 401)
- [ ] No stack traces exposed to users

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via pattern-recognition-specialist |
| 2026-01-04 | Fixed | Added try/catch blocks to both `callback/route.ts` and `confirm/route.ts`. Errors are logged and users are redirected to `/auth/callback/error` with encoded error message. Also fixed CSRF error status code from 401 to 403 in `proxy.ts`. |

## Resources

- PR/Commit: 3042c09
