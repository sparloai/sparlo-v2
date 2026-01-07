# App Route Migration Plan

## Goal

Switch from subdomain architecture (`app.sparlo.ai`) to path-based routing (`sparlo.ai/app/*`).

## URL Structure

```
sparlo.ai/              → Landing page
sparlo.ai/pricing       → Marketing pages
sparlo.ai/auth/sign-in  → Authentication
sparlo.ai/app           → Dashboard (auth required)
sparlo.ai/app/reports   → Reports list
sparlo.ai/app/reports/new → New report
sparlo.ai/app/settings  → User settings
sparlo.ai/app/billing   → Billing
sparlo.ai/app/acme-corp → Team workspace
sparlo.ai/app/acme-corp/members → Team members
```

## Directory Structure

### Current (Broken)
```
apps/web/app/
├── (marketing)/
├── home/
│   ├── (user)/          # Route group competing with [account]
│   │   ├── reports/
│   │   ├── settings/
│   │   └── ...
│   └── [account]/       # Catches /home/reports as account='reports'
└── (auth)/
```

### Target (Fixed)
```
apps/web/app/
├── (marketing)/         # sparlo.ai/* (unchanged)
│   ├── page.tsx
│   ├── pricing/
│   └── layout.tsx
│
├── app/                 # sparlo.ai/app/* (real folder, NOT route group)
│   ├── layout.tsx       # Auth-required, user workspace
│   ├── page.tsx         # Dashboard
│   ├── loading.tsx
│   │
│   ├── reports/         # Explicit - no collision with [account]
│   ├── settings/
│   ├── billing/
│   ├── billing-2/
│   ├── teams/
│   ├── archived/
│   ├── help/
│   │
│   ├── [account]/       # Team workspaces - only catches actual slugs
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   ├── billing/
│   │   ├── members/
│   │   ├── settings/
│   │   └── help/
│   │
│   ├── _components/
│   ├── _lib/
│   └── _hooks/
│
└── (auth)/              # sparlo.ai/auth/* (unchanged)
```

## Implementation

### Step 1: Create app directory and move files

```bash
# Create the app directory
mkdir -p apps/web/app/app

# Move user routes
mv apps/web/app/home/\(user\)/reports apps/web/app/app/
mv apps/web/app/home/\(user\)/settings apps/web/app/app/
mv apps/web/app/home/\(user\)/billing apps/web/app/app/
mv apps/web/app/home/\(user\)/billing-2 apps/web/app/app/
mv apps/web/app/home/\(user\)/teams apps/web/app/app/
mv apps/web/app/home/\(user\)/archived apps/web/app/app/
mv apps/web/app/home/\(user\)/help apps/web/app/app/

# Move pages
mv apps/web/app/home/\(user\)/page.tsx apps/web/app/app/
mv apps/web/app/home/\(user\)/loading.tsx apps/web/app/app/

# Move shared resources
mv apps/web/app/home/\(user\)/_components apps/web/app/app/
mv apps/web/app/home/\(user\)/_lib apps/web/app/app/
mv apps/web/app/home/\(user\)/_hooks apps/web/app/app/

# Move layout (will need editing)
mv apps/web/app/home/\(user\)/layout.tsx apps/web/app/app/

# Move team routes
mv apps/web/app/home/\[account\] apps/web/app/app/

# Delete old structure
rm -rf apps/web/app/home
```

### Step 2: Update paths.config.ts

```typescript
// apps/web/config/paths.config.ts
const pathsConfig = PathsSchema.parse({
  auth: {
    signIn: '/auth/sign-in',
    signUp: '/auth/sign-up',
    verifyMfa: '/auth/verify',
    callback: '/auth/callback',
    passwordReset: '/auth/password-reset',
    passwordUpdate: '/update-password',
  },
  app: {
    home: '/app',
    personalAccountSettings: '/app/settings',
    personalAccountBilling: '/app/billing',
    personalAccountBillingReturn: '/app/billing/return',
    personalAccountTeams: '/app/teams',
    accountHome: '/app/[account]',
    accountSettings: '/app/[account]/settings',
    accountBilling: '/app/[account]/billing',
    accountMembers: '/app/[account]/members',
    accountBillingReturn: '/app/[account]/billing/return',
    accountHelp: '/app/[account]/help',
    joinTeam: '/app/join',
  },
});
```

### Step 3: Update internal links

Search and replace across codebase:
- `'/home'` → `'/app'`
- `'/home/` → `'/app/`
- `"/home"` → `"/app"`
- `"/home/` → `"/app/`

Files to update (~60 files):
```bash
grep -r "'/home" apps/web --include="*.tsx" --include="*.ts" -l
grep -r '"/home' apps/web --include="*.tsx" --include="*.ts" -l
```

### Step 4: Remove subdomain logic

#### 4a. Simplify proxy.ts

Remove:
- `isAppSubdomain()` checks
- `protectedRouteHandler` subdomain redirects
- `getAppSubdomainUrl()` usage
- App subdomain pattern matching

Keep:
- CSRF protection
- Auth checks (but redirect to `/app` not subdomain)
- Admin middleware
- MFA verification

#### 4b. Update next.config.mjs

Remove `getRewrites()` - no longer needed:
```javascript
async function getRewrites() {
  return [];
}
```

Add redirects for old URLs:
```javascript
async function getRedirects() {
  return [
    // Redirect old /home/* URLs
    {
      source: '/home/:path*',
      destination: '/app/:path*',
      permanent: true,
    },
    {
      source: '/home',
      destination: '/app',
      permanent: true,
    },
    // Existing redirects...
    {
      source: '/server-sitemap.xml',
      destination: '/sitemap.xml',
      permanent: true,
    },
  ];
}
```

#### 4c. Simplify subdomain.config.ts

Can be deleted or simplified to just:
```typescript
// No longer needed - delete file or keep minimal helpers
export const PRODUCTION_DOMAIN = 'sparlo.ai';
```

### Step 5: Update auth redirects

In proxy.ts `protectedRouteHandler`:
```typescript
async function protectedRouteHandler(req: NextRequest, res: NextResponse) {
  const { data } = await getUser(req, res);
  const { origin, pathname } = req.nextUrl;

  if (!data?.claims) {
    const signInPath = `/auth/sign-in?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(new URL(signInPath, origin));
  }

  const requiresMfa = requiresMfaVerification(data.claims as Record<string, unknown>);

  if (requiresMfa) {
    const mfaPath = `/auth/verify?next=${encodeURIComponent(pathname)}`;
    return NextResponse.redirect(new URL(mfaPath, origin));
  }
}
```

### Step 6: Update middleware patterns

In proxy.ts `getPatterns()`:
```typescript
async function getPatterns(request: NextRequest) {
  // ... URLPattern setup ...

  return [
    {
      pattern: new URLPattern({ pathname: '/admin/*?' }),
      handler: adminMiddleware,
    },
    {
      pattern: new URLPattern({ pathname: '/auth/*?' }),
      handler: authMiddleware,  // Redirect logged-in users away from auth
    },
    {
      pattern: new URLPattern({ pathname: '/app/*?' }),
      handler: protectedRouteHandler,  // Require auth for /app/*
    },
  ];
}
```

### Step 7: Remove RESERVED_SLUGS hack

In `team-account-workspace.loader.ts`, delete:
```typescript
// DELETE THIS ENTIRE BLOCK
const RESERVED_SLUGS = new Set([
  'reports',
  'settings',
  // ...
]);

// DELETE THIS CHECK
if (RESERVED_SLUGS.has(accountSlug)) {
  console.warn(...);
  notFound();
}
```

### Step 8: Update navigation configs

#### personal-account-navigation.config.tsx
Update all paths to use `/app` prefix via `pathsConfig`

#### team-account-navigation.config.tsx
Update all paths to use `/app/[account]` prefix via `pathsConfig`

### Step 9: Update marketing CTAs

In `engineering-hero.tsx`:
```typescript
<Link href="/app">  {/* was /home */}
  Run Analysis
</Link>
```

## Files to Modify

### Config Files
- [ ] `config/paths.config.ts` - Update all paths
- [ ] `config/personal-account-navigation.config.tsx` - Update nav paths
- [ ] `config/team-account-navigation.config.tsx` - Update nav paths
- [ ] `next.config.mjs` - Remove rewrites, add redirects

### Middleware
- [ ] `proxy.ts` - Remove subdomain logic, update patterns
- [ ] `config/subdomain.config.ts` - Delete or simplify

### Route Files
- [ ] `app/app/layout.tsx` - Verify imports work after move
- [ ] `app/app/[account]/layout.tsx` - Verify imports
- [ ] `app/app/[account]/_lib/server/team-account-workspace.loader.ts` - Remove RESERVED_SLUGS

### Components (~60 files with /home references)
Run search/replace for `/home` → `/app`

## Testing Checklist

### Routes
- [ ] `sparlo.ai/` - Landing page
- [ ] `sparlo.ai/pricing` - Marketing
- [ ] `sparlo.ai/app` - Dashboard (requires auth)
- [ ] `sparlo.ai/app/reports` - Reports list
- [ ] `sparlo.ai/app/reports/new` - New report form
- [ ] `sparlo.ai/app/settings` - Settings
- [ ] `sparlo.ai/app/billing` - Billing
- [ ] `sparlo.ai/app/teams` - Teams
- [ ] `sparlo.ai/app/acme-corp` - Team workspace
- [ ] `sparlo.ai/app/acme-corp/members` - Team members

### Auth Flow
- [ ] Unauthenticated visit to `/app/*` → redirects to `/auth/sign-in`
- [ ] Sign in → redirects to `/app` or `?next` param
- [ ] Sign out → redirects to `/`
- [ ] MFA required → redirects to `/auth/verify`

### Redirects
- [ ] `/home` → `/app` (301)
- [ ] `/home/reports` → `/app/reports` (301)
- [ ] `/home/acme-corp` → `/app/acme-corp` (301)

### Development
- [ ] `pnpm dev` works
- [ ] All routes work on `localhost:3000`
- [ ] No subdomain simulation needed

## Rollback

If issues arise:
```bash
git revert HEAD
```

The redirects in `next.config.mjs` mean old `/home/*` URLs still work as fallback.

## Benefits of This Approach

1. **No subdomain complexity** - Single domain, simple cookies
2. **Works in dev** - `localhost:3000/app/*` just works
3. **No middleware rewrites** - Routes are where URLs expect them
4. **No route collisions** - Explicit folders beat `[account]` dynamic segment
5. **Simple mental model** - `/app/*` = authenticated, everything else = public
