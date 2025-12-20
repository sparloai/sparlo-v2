---
status: pending
priority: p2
issue_id: "087"
tags: [usage-tracking, configuration, maintenance]
dependencies: []
---

# Hardcoded Token Limits in increment_usage() Function

Token limits are hardcoded in the database function, making tier changes require a migration.

## Problem Statement

The `increment_usage()` function contains hardcoded tier limits:

```sql
CASE subscription_tier
  WHEN 'starter' THEN 1000000
  WHEN 'pro' THEN 10000000
  WHEN 'enterprise' THEN 999999999
END
```

This means:
1. Changing limits requires a database migration
2. No flexibility for custom limits per account
3. Difficult to A/B test different tier configurations
4. Product changes require code deployment

## Findings

- Limits hardcoded in SQL function
- No tier configuration table
- Same values duplicated in TypeScript constants
- Enterprise tier uses magic number (999999999)

## Proposed Solutions

### Option 1: Configuration Table

**Approach:** Create `tier_configurations` table with editable limits.

**Pros:**
- Limits changeable without migration
- Can add custom per-account overrides
- Audit trail of changes

**Cons:**
- Additional table to maintain
- Slightly more complex queries

**Effort:** 2-3 hours

**Risk:** Low

---

### Option 2: Environment-Based Configuration

**Approach:** Read limits from environment variables in TypeScript, validate in service layer.

**Pros:**
- Simple configuration management
- No database changes

**Cons:**
- Limits only enforced in TypeScript
- Database function still has hardcoded fallbacks

**Effort:** 1-2 hours

**Risk:** Medium

## Recommended Action

**To be filled during triage.**

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`
- `apps/web/app/home/(user)/_lib/server/usage.service.ts`

## Acceptance Criteria

- [ ] Tier limits configurable without migration
- [ ] TypeScript and SQL limits stay in sync
- [ ] Custom per-account limits possible (if Option 1)
- [ ] Typecheck passes

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Pattern Recognition)

**Actions:**
- Identified hardcoded limits in SQL function
- Found duplicate constants in TypeScript
- Proposed configuration-based solution

**Learnings:**
- Business rules in migrations are hard to change
- Configuration tables provide flexibility
- Consider feature flags for limit changes

## Notes

- IMPORTANT for product flexibility
- Lower priority than security issues
- Consider admin UI for limit management
