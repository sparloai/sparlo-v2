---
status: complete
priority: p3
issue_id: "222"
tags: [code-review, auth, config]
dependencies: ["218"]
---

# Add /share to PUBLIC_PATHS_ON_SUBDOMAIN

## Problem Statement

The `/share` path is missing from `PUBLIC_PATHS_ON_SUBDOMAIN` in the auth listener, but is present in the central config. This could cause authentication issues on share URLs.

## Findings

- `apps/web/config/subdomain.config.ts:34` - Has `/share` in PUBLIC_PATHS
- `packages/supabase/src/hooks/use-auth-change-listener.ts:49-57` - Missing `/share`
- Share routes: `apps/web/app/share/` - Public report sharing functionality

## Proposed Solutions

### Option 1: Add /share to Auth Listener (Quick Fix)

**Approach:** Add `/share` to the hardcoded list.

**Effort:** 2 minutes

**Risk:** Low

---

### Option 2: Import from Config (Recommended)

**Approach:** This is covered by todo #218 - sync with central config.

**Effort:** Part of #218

**Risk:** Low

## Recommended Action

**Depends on #218.** If importing from config, this is automatically resolved.

## Acceptance Criteria

- [ ] /share routes work without auth redirect
- [ ] Config sync resolved (per #218)

## Work Log

### 2026-01-05 - Architecture Review

**By:** Claude Code (Architecture Strategist Agent)

**Actions:**
- Identified missing /share path
- Linked to config sync issue #218
