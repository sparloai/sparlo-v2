---
status: pending
priority: p3
issue_id: "080"
tags: [code-review, type-safety, technical-debt]
dependencies: []
---

# Type Assertions Masking Missing Database Types

## Problem Statement

Multiple `(client.rpc as CallableFunction)` type assertions exist throughout the usage service code. This indicates database types haven't been regenerated after the migration was applied.

**Why it matters:**
- No compile-time type checking for RPC calls
- Parameter mismatches won't be caught until runtime
- Increased risk of breaking changes

## Findings

### Evidence from Architecture Review

**Locations:**
- `usage.service.ts:38` - `check_usage_allowed` call
- `usage.service.ts:134` - `increment_usage` call
- `usage.service.ts:172` - `get_or_create_usage_period` call
- `usage.loader.ts:27` - `check_usage_allowed` call

**Comment in code:**
```typescript
// Type assertion needed until migration is applied and types regenerated
```

## Proposed Solutions

### Solution 1: Regenerate Types (Required)
**Pros:** Restores type safety
**Cons:** None
**Effort:** Small (5 mins)
**Risk:** Low

```bash
pnpm supabase:web:typegen
```

Then remove all `as CallableFunction` assertions.

## Recommended Action

Run typegen and clean up assertions.

## Technical Details

**Affected files:**
- `apps/web/app/home/(user)/_lib/server/usage.service.ts`
- `apps/web/app/home/(user)/_lib/server/usage.loader.ts`
- `packages/supabase/src/database.types.ts`

## Acceptance Criteria

- [ ] Types regenerated with new RPC functions
- [ ] All `as CallableFunction` assertions removed
- [ ] TypeScript compiles without errors

## Work Log

| Date | Action | Notes |
|------|--------|-------|
| 2025-12-19 | Created | From architecture review |

## Resources

- PR Branch: `feat/token-based-usage-tracking`
- Architecture Review Agent: Identified as type safety gap
