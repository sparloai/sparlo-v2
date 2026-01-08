# Fix: Auth Redirect to Deprecated app.sparlo.ai Subdomain

**Priority:** CRITICAL - Blocking launch tomorrow
**Type:** Bug Fix
**Created:** 2026-01-08

---

## Overview

When users sign in at `sparlo.ai`, they are being redirected to `app.sparlo.ai` (deprecated subdomain) after authentication. This prevents users from accessing the application.

**User's assertion:** Supabase is NOT the issue - no redirects to the subdomain configured there.

---

## Problem Statement

Users cannot access the application after signing in because they are redirected to a deprecated subdomain that no longer serves the app.

**Flow:**
1. User visits `https://sparlo.ai/auth/sign-in`
2. User clicks OAuth provider (Google, GitHub, etc.)
3. User authenticates with provider
4. **BUG:** User lands on `https://app.sparlo.ai/*` instead of `https://sparlo.ai/*`

---

## Research Findings

### Code Status: CLEAN

All hardcoded references to `app.sparlo.ai` were **already removed** in commit `0efe83e8` (Jan 7, 2026):

| File | Line | Status |
|------|------|--------|
| `packages/supabase/src/auth-callback.service.ts` | 192-197 | ✅ `ALLOWED_HOSTS` excludes app.sparlo.ai |
| `packages/supabase/src/hooks/use-auth-change-listener.ts` | 19 | ✅ No app.sparlo.ai references |
| `apps/web/config/subdomain.config.ts` | 50-54 | ✅ app.sparlo.ai removed |
| `packages/features/auth/src/components/oauth-providers.tsx` | 80-107 | ✅ Uses `window.location.origin` |
| `apps/web/.env` | 8 | ✅ `NEXT_PUBLIC_SITE_URL=https://sparlo.ai` |

### Remaining Suspects (Configuration-Based)

Since code is clean, the redirect MUST come from **configuration** in one of these locations:

#### 1. OAuth Provider Dashboards (HIGHEST PROBABILITY)

OAuth providers (Google, GitHub) have their own callback URL settings that **override** what the client code requests:

- **Google Cloud Console** → Credentials → OAuth 2.0 Client → Authorized redirect URIs
- **GitHub** → Developer Settings → OAuth Apps → Authorization callback URL

If these contain `https://app.sparlo.ai/auth/callback`, the provider will redirect there regardless of client code.

#### 2. Supabase Dashboard (4 Separate Settings)

There are **4 different URL configuration locations** in Supabase:

| Setting | Location | What to Check |
|---------|----------|---------------|
| Site URL | Authentication → Settings | Must be `https://sparlo.ai` |
| Redirect URLs | Authentication → URL Configuration | Must NOT include `app.sparlo.ai` |
| Per-Provider Callback | Authentication → Providers → [Provider] | Must be `https://sparlo.ai/auth/callback` |
| Email Templates | Authentication → Email Templates | Must use `{{ .RedirectTo }}` not hardcoded URLs |

#### 3. Infrastructure/DNS Redirects

- **Railway** project settings may have redirect rules
- **DNS CNAME** records might redirect
- **CDN** (if any) could have edge redirect rules

#### 4. Browser Cache

- Cached 301/302 redirects persist in browsers
- Old bookmarks pointing to `app.sparlo.ai`
- localStorage/sessionStorage with old URLs

---

## Proposed Solution

### Phase 1: Verify Configuration (15 minutes)

#### Task 1.1: Verify Supabase Dashboard Settings

**Location:** Supabase Dashboard → Authentication

Check ALL of these:

```
1. Settings → Site URL
   Expected: https://sparlo.ai

2. URL Configuration → Redirect URLs
   Expected: Should NOT contain app.sparlo.ai
   Should contain: https://sparlo.ai/**

3. Providers → Google → Callback URL
   Expected: https://sparlo.ai/auth/callback

4. Providers → GitHub → Callback URL (if enabled)
   Expected: https://sparlo.ai/auth/callback

5. Email Templates → Check all templates
   Expected: {{ .RedirectTo }} (not {{ .SiteURL }} or hardcoded URLs)
```

#### Task 1.2: Verify OAuth Provider Dashboards

**Google Cloud Console:**
1. Go to: https://console.cloud.google.com/apis/credentials
2. Click your OAuth 2.0 Client ID
3. Check "Authorized redirect URIs"
4. **Remove** any `https://app.sparlo.ai/*` entries
5. **Ensure** `https://sparlo.ai/auth/callback` is present

**GitHub Developer Settings:**
1. Go to: https://github.com/settings/developers
2. Click your OAuth App
3. Check "Authorization callback URL"
4. **Update** to `https://sparlo.ai/auth/callback` if incorrect

#### Task 1.3: Check Infrastructure Redirects

```bash
# Test for HTTP redirects
curl -I https://sparlo.ai/auth/sign-in

# Check DNS records
dig sparlo.ai
dig app.sparlo.ai

# Check Railway settings for redirect rules
# (Manual check in Railway dashboard)
```

### Phase 2: Apply Fixes Based on Findings

#### If OAuth Provider Callback URL is Wrong:

**Google:**
1. Remove: `https://app.sparlo.ai/auth/callback`
2. Add (if missing): `https://sparlo.ai/auth/callback`
3. Save changes (takes effect immediately)

**GitHub:**
1. Update callback URL to: `https://sparlo.ai/auth/callback`
2. Save changes

#### If Supabase Site URL is Wrong:

1. Go to Authentication → Settings
2. Update Site URL to: `https://sparlo.ai`
3. Save

#### If Supabase Redirect URLs Include app.sparlo.ai:

1. Go to Authentication → URL Configuration
2. Remove any `app.sparlo.ai` entries
3. Ensure `https://sparlo.ai/**` is present
4. Save

#### If Email Templates Have Wrong URLs:

Update all email templates to use `{{ .RedirectTo }}`:

```html
<!-- Confirmation email -->
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=email">
  Confirm your email
</a>

<!-- Magic link -->
<a href="{{ .RedirectTo }}/auth/confirm?token_hash={{ .TokenHash }}&type=magiclink">
  Sign in
</a>
```

#### If Railway Has Redirect Rules:

1. Go to Railway dashboard
2. Check project settings → Domains
3. Remove any redirect rules pointing to `app.sparlo.ai`

### Phase 3: Test the Fix

```bash
# 1. Clear browser cache completely (or use Incognito)

# 2. Navigate to production sign-in
# Open: https://sparlo.ai/auth/sign-in

# 3. Open DevTools → Network tab → Enable "Preserve log"

# 4. Click OAuth provider button

# 5. Complete OAuth flow

# 6. Verify final URL is https://sparlo.ai/* (NOT app.sparlo.ai)
```

### Phase 4: Fallback Code Fix (If Configuration Doesn't Resolve)

If after fixing all configurations the issue persists, add explicit domain enforcement:

**File:** `packages/features/auth/src/components/oauth-providers.tsx`

```typescript
// Line 81 - Change from:
const origin = window.location.origin;

// To:
const origin = process.env.NEXT_PUBLIC_SITE_URL || 'https://sparlo.ai';
```

This forces the redirect URL to always use the configured site URL rather than trusting `window.location.origin`.

---

## Acceptance Criteria

- [ ] Users signing in at `sparlo.ai` remain on `sparlo.ai` after authentication
- [ ] OAuth flow (Google, GitHub) redirects to `https://sparlo.ai/auth/callback`
- [ ] Magic link emails contain `https://sparlo.ai/*` URLs
- [ ] No references to `app.sparlo.ai` in any configuration
- [ ] Tested in fresh browser (Incognito mode)

---

## Files to Modify

Only if configuration fixes don't work:

| File | Change |
|------|--------|
| `packages/features/auth/src/components/oauth-providers.tsx:81` | Use `NEXT_PUBLIC_SITE_URL` instead of `window.location.origin` |

---

## Configuration Checklist

### Supabase Dashboard
- [ ] Site URL = `https://sparlo.ai`
- [ ] Redirect URLs does NOT contain `app.sparlo.ai`
- [ ] Google provider callback = `https://sparlo.ai/auth/callback`
- [ ] GitHub provider callback = `https://sparlo.ai/auth/callback`
- [ ] Email templates use `{{ .RedirectTo }}`

### OAuth Provider Dashboards
- [ ] Google OAuth redirect URIs - NO `app.sparlo.ai` entries
- [ ] GitHub OAuth callback URL = `https://sparlo.ai/auth/callback`

### Infrastructure
- [ ] Railway - no redirect rules to `app.sparlo.ai`
- [ ] DNS - no CNAME redirecting to `app.sparlo.ai`

---

## Testing Plan

1. **Incognito Test:** Fresh browser, full OAuth flow
2. **Email Test:** Send magic link, verify URL in email source
3. **Multi-Provider Test:** Test all enabled OAuth providers
4. **Mobile Test:** Test on mobile device (different cache)

---

## Rollback Plan

If code changes cause issues:
```bash
git revert HEAD
```

Configuration changes can be reverted in respective dashboards.

---

## References

- Supabase Auth Redirect Docs: https://supabase.com/docs/guides/auth/redirect-urls
- Previous fix commit: `0efe83e8` (Jan 7, 2026)
- Related plan: `plans/fix-app-subdomain-refresh-loop.md`
