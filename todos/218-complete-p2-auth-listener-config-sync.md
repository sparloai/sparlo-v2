---
status: complete
priority: p2
issue_id: "218"
tags: [code-review, architecture, auth]
dependencies: []
---

# Sync PUBLIC_PATHS_ON_SUBDOMAIN with Central Config

## Problem Statement

The `PUBLIC_PATHS_ON_SUBDOMAIN` constant in `use-auth-change-listener.ts` is hardcoded and diverges from the central config in `subdomain.config.ts`. This creates a maintenance burden and potential for bugs when paths change.

**Current divergence:**
- Auth listener has: `/auth`, `/api`, `/_next`, `/locales`, `/images`, `/assets`, `/healthcheck`
- Central config has: `/auth`, `/api`, `/share`, `/_next`, `/locales`, `/images`, `/assets`, `/healthcheck`
- Auth listener is **missing `/share`**

## Findings

- `packages/supabase/src/hooks/use-auth-change-listener.ts:49-57` - Hardcoded PUBLIC_PATHS_ON_SUBDOMAIN
- `apps/web/config/subdomain.config.ts:31-40` - Central PUBLIC_PATHS constant
- `apps/web/next.config.mjs:149-159` - APP_SUBDOMAIN_EXCLUDED_PATHS
- `apps/web/proxy.ts:289` - Uses `isPublicPath()` from config
- Comment at line 47 says "MUST match" but doesn't import from config

## Proposed Solutions

### Option 1: Import from Central Config (Recommended)

**Approach:** Import `PUBLIC_PATHS` from `~/config/subdomain.config` into the auth listener hook.

**Pros:**
- Single source of truth
- No manual sync needed
- Prevents future divergence

**Cons:**
- Creates dependency on app-specific config from a package
- May need path alias adjustment

**Effort:** 30 minutes

**Risk:** Low

---

### Option 2: Create Shared Package for Routing Constants

**Approach:** Create `packages/routing` with all path constants, import in all consumers.

**Pros:**
- Clean architecture
- Truly shared across packages
- Type-safe exports

**Cons:**
- More upfront work
- New package to maintain

**Effort:** 2-3 hours

**Risk:** Low

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `packages/supabase/src/hooks/use-auth-change-listener.ts:49-57`
- `apps/web/config/subdomain.config.ts` (source of truth)

**Related components:**
- Middleware (proxy.ts)
- Next.js config (next.config.mjs)

## Resources

- **Related plan:** `plans/fix-supabase-token-refresh-loop-429.md`
- **Similar patterns:** Config imports in other packages

## Acceptance Criteria

- [ ] PUBLIC_PATHS_ON_SUBDOMAIN imports from central config
- [ ] All three locations use same path list
- [ ] Auth works correctly on /share routes
- [ ] Typecheck passes

## Work Log

### 2026-01-05 - Code Review Discovery

**By:** Claude Code

**Actions:**
- Identified path divergence during auth fix review
- Found `/share` missing from auth listener
- Analyzed all config locations

**Learnings:**
- Multiple config files define same paths
- No automated sync or validation exists
