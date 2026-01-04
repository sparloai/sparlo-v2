---
title: "Build Failure - Missing Modules (Untracked Files)"
date: 2026-01-04
category: build-errors
severity: critical
tags: [git, modules, imports, build]
affected_components:
  - Various imported files not in git
prevention_documented: true
---

# Build Failure - Missing Modules (Untracked Files)

## Problem Summary

Build fails with "Module not found" errors for files that exist locally but aren't tracked in git.

## Symptoms

```
Module not found: Can't resolve '@/components/cookie-consent-banner'
Module not found: Can't resolve '@/components/analytics-events'
Module not found: Can't resolve '@/app/home/(user)/reports/new/_components/new-analysis-form'
```

Build works locally but fails in CI/CD.

## Root Cause

Files are:
1. Created during development
2. Imported by other files
3. **Not committed to git**

When building in CI/CD or fresh clone:
- Git checkout doesn't include untracked files
- Import resolution fails
- Build crashes

## Solution

### 1. Check Untracked Files

```bash
git status
```

Look for files that are:
- Listed under "Untracked files"
- Match the missing module paths

### 2. Add Missing Files

```bash
git add apps/web/components/cookie-consent-banner.tsx
git add apps/web/components/analytics-events.tsx
# ... add all missing files
```

### 3. Commit and Push

```bash
git commit -m "fix: add missing component files"
git push
```

### 4. Verify Build

```bash
pnpm build
```

## Files That Were Missing (This Incident)

- `apps/web/components/cookie-consent-banner.tsx`
- `apps/web/components/analytics-events.tsx`
- `apps/web/app/home/(user)/reports/new/_components/new-analysis-form.tsx`
- `apps/web/app/home/(user)/reports/new/_components/page-skeleton.tsx`
- `apps/web/app/home/(user)/reports/new/_components/token-gate-screen.tsx`
- `apps/web/app/home/(user)/reports/new/error.tsx`
- `packages/analytics/src/client.ts`
- `packages/analytics/src/posthog-client-service.ts`
- `packages/analytics/src/posthog-server-service.ts`

## Prevention

### Pre-Push Check

Before pushing:
```bash
git status
# Verify no important files are untracked
```

### Local Build Test

Before deploying:
```bash
pnpm build
# If it works locally, files might still be untracked
```

### CI Awareness

Remember that CI starts from a clean git clone:
- No untracked files
- No local-only modifications
- Only committed files exist

### .gitignore Review

Ensure essential files aren't accidentally ignored:
```bash
git check-ignore apps/web/components/my-file.tsx
# Should return nothing for tracked files
```

## Related

- Git workflow best practices
- CI/CD build troubleshooting
