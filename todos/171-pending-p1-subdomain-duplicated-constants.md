---
status: completed
priority: p1
issue_id: "171"
tags: [code-review, architecture, subdomain, dry]
dependencies: []
---

# Duplicated Constants Across 4 Files

## Problem Statement

`APP_SUBDOMAIN` and `PRODUCTION_DOMAIN` constants are duplicated in 4 separate files. This violates DRY principles and creates high risk of desynchronization when configuration changes.

**Why it matters**: Changing the subdomain or domain requires updates in 4 different files, with high risk of missing one and causing inconsistent behavior.

## Findings

**Agents**: architecture-strategist, code-simplicity-reviewer, pattern-recognition-specialist

**Duplicated Constants**:

| File | Lines | Declaration |
|------|-------|-------------|
| `apps/web/proxy.ts` | 21-22 | `const APP_SUBDOMAIN = 'app'; const PRODUCTION_DOMAIN = 'sparlo.ai';` |
| `apps/web/next.config.mjs` | 11-12 | `const APP_SUBDOMAIN = 'app'; const PRODUCTION_DOMAIN = 'sparlo.ai';` |
| `apps/web/app/auth/callback/route.ts` | 9-10 | `const APP_SUBDOMAIN = 'app'; const PRODUCTION_DOMAIN = 'sparlo.ai';` |
| `apps/web/app/auth/confirm/route.ts` | 9-10 | `const APP_SUBDOMAIN = 'app'; const PRODUCTION_DOMAIN = 'sparlo.ai';` |

**Additional Duplications Found**:
- `isAppPath()` function duplicated in callback/route.ts and confirm/route.ts
- `getAppSubdomainUrl()` function duplicated in both auth routes
- `MAIN_DOMAIN_PATHS` array has different names/contents across files

## Proposed Solutions

### Option 1: Create shared config file (Recommended)
```typescript
// apps/web/config/subdomain.config.ts
export const subdomainConfig = {
  app: process.env.NEXT_PUBLIC_APP_SUBDOMAIN || 'app',
  production: process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN || 'sparlo.ai',
  mainDomainPaths: ['/auth', '/share', '/api', '/healthcheck'],
  publicPaths: ['/auth', '/healthcheck', '/api', '/share', '/_next', '/locales', '/images', '/assets'],
} as const;

export function isAppSubdomain(host: string): boolean { /* ... */ }
export function isAppPath(path: string): boolean { /* ... */ }
export function getAppSubdomainUrl(path: string): string { /* ... */ }
```
- **Pros**: Single source of truth, environment variable support, all utilities in one place
- **Cons**: Requires updating 4 files to import from new location
- **Effort**: Small
- **Risk**: Low

### Option 2: Use environment variables only
```typescript
// In each file
const APP_SUBDOMAIN = process.env.NEXT_PUBLIC_APP_SUBDOMAIN!;
const PRODUCTION_DOMAIN = process.env.NEXT_PUBLIC_PRODUCTION_DOMAIN!;
```
- **Pros**: Environment-driven, easy to change per deployment
- **Cons**: Still duplicated logic, runtime errors if env vars missing
- **Effort**: Small
- **Risk**: Medium (env var management)

## Recommended Action

<!-- Leave blank - to be filled during triage -->

## Technical Details

**Files to Modify**:
- Create: `apps/web/config/subdomain.config.ts`
- Update: `apps/web/proxy.ts`
- Update: `apps/web/next.config.mjs`
- Update: `apps/web/app/auth/callback/route.ts`
- Update: `apps/web/app/auth/confirm/route.ts`

**Estimated LOC Reduction**: ~30 lines

## Acceptance Criteria

- [ ] Single configuration file for subdomain settings
- [ ] All 4 files import from shared config
- [ ] Environment variable support for different environments
- [ ] No duplicate function definitions (isAppPath, getAppSubdomainUrl)
- [ ] Tests pass with new configuration structure

## Work Log

| Date | Action | Learnings |
|------|--------|-----------|
| 2026-01-04 | Created from code review | Found via multiple agents |
| 2026-01-04 | Fixed | Created `config/subdomain.config.ts` with all shared constants and functions. Updated `proxy.ts`, `callback/route.ts`, and `confirm/route.ts` to import from shared config. Reduced ~60 lines of duplicated code. |

## Resources

- PR/Commit: 3042c09
