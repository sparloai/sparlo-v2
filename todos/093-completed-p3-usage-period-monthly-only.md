---
status: pending
priority: p3
issue_id: "093"
tags: [usage-tracking, flexibility, future]
dependencies: []
---

# Usage Period Hardcoded to Monthly

Usage periods are always monthly with no flexibility for different billing cycles.

## Problem Statement

The `get_or_create_usage_period()` function hardcodes monthly periods:

```sql
v_period_start := date_trunc('month', NOW());
```

This means:
1. No support for custom billing cycles
2. Annual or weekly plans not possible
3. Pro-rated periods difficult
4. All accounts locked to calendar month

## Findings

- `date_trunc('month', NOW())` hardcoded
- No period configuration per account/tier
- Schema supports different periods technically
- Would require function changes for flexibility

## Proposed Solutions

### Option 1: Keep Monthly (Current)

**Approach:** Accept monthly-only limitation for now.

**Pros:**
- No changes needed
- Simple mental model
- Standard SaaS pattern

**Cons:**
- Limited flexibility

**Effort:** 0

**Risk:** None

---

### Option 2: Configurable Period Length

**Approach:** Add period_type column and handle different intervals.

**Pros:**
- Future flexibility
- Supports various billing models

**Cons:**
- YAGNI - may never need
- Adds complexity

**Effort:** 4-6 hours

**Risk:** Low

## Recommended Action

Keep as monthly for MVP. Revisit if business requirements change.

## Technical Details

**Affected files:**
- `apps/web/supabase/migrations/20251219000000_add_usage_tracking.sql`

## Acceptance Criteria

- [ ] Document monthly-only limitation
- [ ] Create ticket for future flexibility if needed

## Work Log

### 2025-12-19 - Initial Discovery

**By:** Claude Code (Pattern Recognition)

**Actions:**
- Identified monthly-only period limitation
- Assessed flexibility needs
- Recommended deferring for YAGNI

**Learnings:**
- Monthly billing is standard
- Avoid over-engineering for hypothetical needs
- Document decisions for future reference

## Notes

- NICE-TO-HAVE in future
- Monthly periods are industry standard
- Defer until actual requirement exists
