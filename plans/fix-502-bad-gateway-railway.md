# fix: 502 Bad Gateway on Railway Deployment

**Priority:** P0 - Production Down
**Type:** Bug Fix
**Created:** 2025-12-23

## Problem Statement

The sparlo-v2 application deployed on Railway is returning 502 Bad Gateway errors. The site is not accessible in production.

## Root Cause Analysis

Based on investigation of the codebase and Railway deployment best practices, there are **two likely causes**:

### Cause 1: Missing HOSTNAME Environment Variable (Most Likely - 80% of cases)

**Problem:** Next.js standalone server binds to `localhost` (127.0.0.1) by default. Railway containers cannot access localhost from outside the container.

**Evidence:**
- `nixpacks.toml` starts the server with: `node apps/web/.next/standalone/apps/web/server.js`
- No `HOSTNAME` environment variable is being passed
- Railway documentation explicitly states this causes 502 errors

**Fix:** Add `HOSTNAME=0.0.0.0` to Railway environment variables.

### Cause 2: Missing NEXT_PUBLIC_SITE_URL (Possible)

**Problem:** The app validates that `NEXT_PUBLIC_SITE_URL` must be a valid HTTPS URL in production.

**Evidence:**
- File: `apps/web/config/app.config.ts` (line 52)
- Build-time validation could fail silently, resulting in no standalone output

**Fix:** Ensure `NEXT_PUBLIC_SITE_URL=https://sparlo.ai` is set in Railway.

## Configuration Verification

### Current Configuration (Correct)

**next.config.mjs:**
```javascript
output: 'standalone',  // Line 36 - Correct
```

**nixpacks.toml:**
```toml
[phases.build]
cmds = [
  "pnpm --filter web build",
  "cp -r apps/web/.next/static apps/web/.next/standalone/apps/web/.next/static",
  "cp -r apps/web/public apps/web/.next/standalone/apps/web/public"
]

[start]
cmd = "node apps/web/.next/standalone/apps/web/server.js"
```

The build configuration is correct. Static files are being copied properly.

## Acceptance Criteria

- [ ] Site loads without 502 error
- [ ] All pages render correctly
- [ ] API routes respond properly
- [ ] Health checks pass

## Implementation Plan

### Phase 1: Immediate Fix (5 minutes)

1. **Add HOSTNAME to Railway Environment Variables**
   - Go to Railway Dashboard → Project → Variables
   - Add: `HOSTNAME=0.0.0.0`

2. **Verify NEXT_PUBLIC_SITE_URL**
   - Ensure `NEXT_PUBLIC_SITE_URL=https://sparlo.ai` exists

3. **Trigger Redeploy**
   - Environment variable changes require a new deployment

### Phase 2: Verify Fix

1. Check Railway deployment logs for:
   - "Ready in Xms" message
   - No SIGTERM signals
   - No connection errors

2. Test the site:
   - Homepage loads
   - API endpoints respond
   - No console errors

### Phase 3: Optional Code Fix (If Environment Variables Don't Work)

Update `nixpacks.toml` to explicitly set environment variables:

```toml
[start]
cmd = "HOSTNAME=0.0.0.0 node apps/web/.next/standalone/apps/web/server.js"
```

Or update `package.json` start script:

```json
{
  "scripts": {
    "start": "HOSTNAME=0.0.0.0 node apps/web/.next/standalone/apps/web/server.js"
  }
}
```

## Required Environment Variables for Railway

| Variable | Value | Required |
|----------|-------|----------|
| `HOSTNAME` | `0.0.0.0` | **YES - Missing** |
| `PORT` | (auto-injected by Railway) | Auto |
| `NEXT_PUBLIC_SITE_URL` | `https://sparlo.ai` | YES |
| `NODE_ENV` | `production` | YES |
| `INNGEST_EVENT_KEY` | (your key) | YES |
| `INNGEST_SIGNING_KEY` | (your key) | YES |

## Debugging Commands

If the fix doesn't work, check:

```bash
# Railway logs should show:
# - Local: http://localhost:3000
# - Network: http://0.0.0.0:3000  <-- This must appear

# If only localhost appears, HOSTNAME isn't set correctly
```

## References

- [Railway: Application Failed to Respond](https://docs.railway.com/reference/errors/application-failed-to-respond)
- [Next.js Standalone Output Mode](https://nextjs.org/docs/app/api-reference/config/next-config-js/output)
- [Railway + Next.js 502 Issues](https://station.railway.com/questions/successful-deployment-but-502-bad-gatewa-83650254)

## Files Referenced

- `/Users/alijangbar/sparlo-v2/nixpacks.toml` - Deployment configuration
- `/Users/alijangbar/sparlo-v2/apps/web/next.config.mjs` - Next.js config (line 36)
- `/Users/alijangbar/sparlo-v2/apps/web/config/app.config.ts` - Environment validation (line 52)
- `/Users/alijangbar/sparlo-v2/package.json` - Build/start scripts
