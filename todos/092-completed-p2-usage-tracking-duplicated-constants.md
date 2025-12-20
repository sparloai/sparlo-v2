---
status: pending
priority: p2
issue_id: "092"
tags: [usage-tracking, code-quality, maintenance]
dependencies: []
---

# Usage Tracking Constants Duplicated Across SQL and TypeScript

Tier limits and configuration values are duplicated between database migration and TypeScript code.

## Problem Statement

The same tier configuration values appear in multiple places:

1. SQL migration: Hardcoded in CASE statements
2. TypeScript: Constants in usage.service.ts
3. No single source of truth
4. Easy for values to drift out of sync

## Findings

- `increment_usage()` has hardcoded tier limits
- TypeScript service has equivalent constants
- No automated sync mechanism
- Manual coordination required for changes

**Duplicated values:**
```sql
-- In SQL
WHEN 'starter' THEN 1000000
WHEN 'pro' THEN 10000000
WHEN 'enterprise' THEN 999999999
```
```typescript
// In TypeScript
const TIER_LIMITS = {
  starter: { input: 1000000, output: 1000000 },
  pro: { input: 10000000, output: 10000000 },
  enterprise: { input: 999999999, output: 999999999 },
};
```

## Proposed Solutions

### Option 1: Configuration Table (Single Source of Truth)

**Approach:** Store limits in `tier_configurations` table, read from there in both SQL and TypeScript.

**Pros:**
- Single source of truth
- Runtime configurable
- No code duplication

**Cons:**
- Additional database queries
- Migration needed

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: TypeScript as Source, Validate at Runtime

**Approach:** Keep TypeScript as authoritative, validate SQL matches at test/startup.

**Pros:**
- Less infrastructure change
- TypeScript-first approach

**Cons:**
- Still requires sync
- SQL must be updated manually

**Effort:** 1-2 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`
- `apps/web/app/home/(user)/_lib/server/usage.service.ts`

## Acceptance Criteria

- [ ] Single source of truth for tier limits
- [ ] Changes in one place reflected everywhere
- [ ] No manual sync required
- [ ] Typecheck passes

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Pattern Recognition)

**Actions:**
- Identified duplicate tier constants
- Traced values in SQL and TypeScript
- Proposed configuration table solution

**Learnings:**
- Cross-language constants are maintenance burden
- Configuration tables enable runtime changes
- Single source of truth prevents drift

## Notes

- IMPORTANT for maintainability
- Related to issue 087 (hardcoded limits)
- Consider combining with 087 fix
