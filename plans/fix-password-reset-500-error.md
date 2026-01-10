# Fix: Password Reset 500 Error

**Type:** Bug Fix (Critical)
**Date:** 2026-01-09

## Problem Statement

Users receive a 500 error when requesting a password reset. The error occurs when calling Supabase's `/auth/v1/recover` endpoint, not during the password update step.

### Error Details
```
byxbftlbhyiouvnbpeiy.supabase.co/auth/v1/recover?redirect_to=https%3A%2F%2Fsparlo.ai%2Fauth%2Fcallback%3Fnext%3D%2Fupdate-password
Failed to load resource: the server responded with a status of 500 ()
```

### User-Facing Error
"Sorry, we could not authenticate you. We have encountered an error. Please ensure you have a working internet connection and try again"

## Root Cause Analysis

### Different from Previous Fix

The previous fix (`26104c1d`) addressed `AuthSessionMissingError` during password **update** (step 2 of the flow). The current issue is at password reset **request** (step 1).

### Password Reset Flow
```
Step 1: User enters email → calls resetPasswordForEmail() → Supabase /auth/v1/recover
        ↓
        500 ERROR HERE ❌
        ↓
Step 2: (Never reached) Email sent with reset link
        ↓
Step 3: (Never reached) User clicks link, sets new password
```

### Likely Cause: Edge Function Not Deployed

The project uses a custom Supabase Edge Function (`send-auth-email/index.ts`) to send auth emails via Resend API instead of Supabase's built-in email.

**Recent Change:** Commit `250c8063` modified the edge function to add plain text email versions for deliverability.

**Problem:** The CI/CD workflow (`.github/workflows/workflow.yml`) only runs:
- TypeScript checks
- Linting
- E2E tests

**It does NOT deploy Supabase Edge Functions.**

If the edge function:
1. Wasn't deployed after the recent change
2. Has configuration issues (missing secrets)
3. Is returning errors

...then Supabase's `/auth/v1/recover` will fail with 500.

### Edge Function Dependencies
```typescript
// Required environment variables in Supabase Dashboard
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');
const HOOK_SECRET = Deno.env.get('SEND_EMAIL_HOOK_SECRET');
const SITE_URL = Deno.env.get('SITE_URL'); // Should be 'https://sparlo.ai'
const FROM_EMAIL = Deno.env.get('FROM_EMAIL'); // Should be 'Sparlo <noreply@sparlo.ai>'
```

## Diagnosis Steps

### 1. Check Supabase Dashboard - Edge Functions

Go to: **Supabase Dashboard → Edge Functions**

- [ ] Is `send-auth-email` listed?
- [ ] What's the deployment status?
- [ ] Check logs for recent invocations - any errors?

### 2. Check Edge Function Secrets

Go to: **Supabase Dashboard → Edge Functions → send-auth-email → Settings**

Verify these secrets are set:
- [ ] `RESEND_API_KEY` - Resend API key
- [ ] `SEND_EMAIL_HOOK_SECRET` - Webhook secret for auth hooks
- [ ] `SITE_URL` - Should be `https://sparlo.ai`
- [ ] `FROM_EMAIL` - Should be `Sparlo <noreply@sparlo.ai>`

### 3. Check Auth Hook Configuration

Go to: **Supabase Dashboard → Auth → Hooks**

- [ ] Is there a hook configured for sending auth emails?
- [ ] Is it pointing to the `send-auth-email` edge function?
- [ ] Is the hook enabled?

### 4. Check Redirect URL Whitelist

Go to: **Supabase Dashboard → Auth → URL Configuration**

- [ ] Is `https://sparlo.ai` in the Site URL?
- [ ] Is `https://sparlo.ai/auth/callback` in Additional Redirect URLs?

## Fix Options

### Option A: Deploy Edge Function (If Not Deployed)

```bash
cd apps/web

# Link to production project
supabase link --project-ref byxbftlbhyiouvnbpeiy

# Deploy the edge function
supabase functions deploy send-auth-email

# Verify deployment
supabase functions list
```

### Option B: Fix Edge Function Secrets (If Missing)

In Supabase Dashboard → Edge Functions → send-auth-email → Settings:

```
RESEND_API_KEY=re_xxxxx
SEND_EMAIL_HOOK_SECRET=v1,whsec_xxxxx
SITE_URL=https://sparlo.ai
FROM_EMAIL=Sparlo <noreply@sparlo.ai>
```

### Option C: Use Supabase Built-in Email (Temporary Workaround)

If the edge function is problematic, temporarily disable the custom hook and use Supabase's built-in email:

1. Go to **Auth → Hooks**
2. Disable the custom email hook
3. Go to **Auth → Email Templates**
4. Configure SMTP or use Supabase's built-in sender

### Option D: Check Resend API Status

If the edge function is deployed and configured correctly, the issue might be with Resend:

1. Check Resend dashboard for API status
2. Verify the API key is valid
3. Check if the sending domain is verified

## Implementation Plan

1. **Immediate:** Check Supabase Dashboard for edge function status and logs
2. **If not deployed:** Deploy edge function with `supabase functions deploy send-auth-email`
3. **If secrets missing:** Configure required environment variables
4. **If hook misconfigured:** Re-configure the auth email hook
5. **Test:** Attempt password reset on production

## Files Involved

| File | Purpose |
|------|---------|
| `apps/web/supabase/functions/send-auth-email/index.ts` | Edge function for sending auth emails |
| `apps/web/supabase/templates/reset-password.html` | Email template (used by local dev) |
| `packages/supabase/src/hooks/use-request-reset-password.ts` | Client hook that calls resetPasswordForEmail |
| `packages/features/auth/src/components/password-reset-request-container.tsx` | Password reset form component |

## Prevention

Add edge function deployment to CI/CD or document manual deployment requirements:

```yaml
# Suggested addition to .github/workflows/workflow.yml
deploy-functions:
  name: Deploy Edge Functions
  runs-on: ubuntu-latest
  needs: typescript
  if: github.ref == 'refs/heads/main'
  steps:
    - uses: supabase/setup-cli@v1
    - run: supabase link --project-ref ${{ secrets.SUPABASE_PROJECT_REF }}
    - run: supabase functions deploy send-auth-email
```

## References

- Edge function: `apps/web/supabase/functions/send-auth-email/index.ts:246-311`
- Password reset hook: `packages/supabase/src/hooks/use-request-reset-password.ts:22-36`
- Recent email fix commit: `250c8063`
- Previous password update fix: `26104c1d`
