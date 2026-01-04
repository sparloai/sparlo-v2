---
title: "@hookform/resolvers Zod Version Mismatch"
date: 2026-01-04
category: build-errors
severity: high
tags: [dependency, zod, hookform, pnpm, monorepo]
affected_components:
  - pnpm-workspace.yaml
  - Form validation across application
prevention_documented: true
---

# @hookform/resolvers Zod Version Mismatch

## Problem Summary

Build fails with `Cannot find module 'zod/v4/core'` error when `@hookform/resolvers@5.x` is installed with Zod v3.

## Symptoms

```
Module not found: Can't resolve 'zod/v4/core'
Import trace for requested module:
./node_modules/@hookform/resolvers/zod/src/zod.ts
```

Build fails completely, blocking deployment.

## Root Cause

Version incompatibility:
- `@hookform/resolvers@5.x` requires Zod v4 (uses `zod/v4/core` import)
- Project uses Zod `3.25.74` (stable v3)
- The v4 import path doesn't exist in Zod v3

This is a peer dependency mismatch that pnpm doesn't block by default.

## Solution

### 1. Add @hookform/resolvers to pnpm Catalog

Edit `pnpm-workspace.yaml`:
```yaml
catalog:
  '@hookform/resolvers': 3.10.0  # Compatible with Zod v3
  zod: 3.25.74
```

### 2. Update All package.json Files

Change from hardcoded version to catalog:
```json
// Before
"@hookform/resolvers": "^5.2.2"

// After
"@hookform/resolvers": "catalog:"
```

Files updated:
- `apps/web/package.json`
- `apps/dev-tool/package.json`
- `packages/ui/package.json`
- `packages/features/team-accounts/package.json`
- `packages/features/auth/package.json`
- `packages/features/accounts/package.json`
- `packages/features/admin/package.json`
- `packages/otp/package.json`
- `packages/billing/gateway/package.json`

### 3. Reinstall Dependencies

```bash
pnpm install
```

### 4. Verify Build

```bash
pnpm typecheck
pnpm build
```

## Why This Works

- `@hookform/resolvers@3.10.0` uses Zod v3 API (no `zod/v4/core` imports)
- Centralizing version in catalog ensures consistency across monorepo
- v3.10.0 is the latest version compatible with Zod v3

## Prevention

### Use pnpm Catalog for Shared Dependencies

All shared dependencies should use `catalog:` to ensure version consistency:

```yaml
# pnpm-workspace.yaml
catalog:
  '@hookform/resolvers': 3.10.0
  zod: 3.25.74
  react: 19.2.3
  # ... other shared deps
```

### Check Peer Dependencies Before Upgrading

Before upgrading any package:
```bash
npm info @hookform/resolvers peerDependencies
```

### Monitor pnpm Install Warnings

Watch for peer dependency warnings during install:
```
WARN  Issues with peer dependencies found
└─┬ @hookform/resolvers 5.2.2
  └── ✕ unmet peer zod@"^4.0.0": found 3.25.74
```

## Related

- [Monorepo Build Failures](/docs/solutions/build-errors/)
- Project uses pnpm workspaces with catalog for version management
