---
status: ready
priority: p1
issue_id: "033"
tags: [database, data-integrity, migration]
dependencies: []
---

# Add Missing Foreign Key Constraint on created_by Column

The `created_by` column lacks proper ON DELETE handling for referential integrity.

## Problem Statement

The `sparlo_reports.created_by` foreign key to `auth.users` has no ON DELETE clause. When a user is deleted:
- Reports become orphaned with invalid `created_by` reference
- Queries joining to auth.users will fail
- Data integrity is compromised

Additionally, the column should probably be NOT NULL since every report must have a creator.

## Findings

- File: `apps/web/supabase/migrations/20251216000000_sparlo_reports_v2_enhancements.sql`
- `created_by UUID NOT NULL REFERENCES auth.users(id)` - missing ON DELETE
- Should specify: `ON DELETE CASCADE` or `ON DELETE SET NULL`
- Need to decide behavior: delete reports with user, or preserve reports

**Current DDL:**
```sql
created_by UUID NOT NULL REFERENCES auth.users(id),
-- Missing: ON DELETE CASCADE or ON DELETE SET NULL
```

## Proposed Solutions

### Option 1: ON DELETE CASCADE (Recommended for Sparlo)

**Approach:** When user is deleted, delete their reports too.

```sql
ALTER TABLE sparlo_reports
DROP CONSTRAINT sparlo_reports_created_by_fkey,
ADD CONSTRAINT sparlo_reports_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
```

**Pros:**
- Clean data - no orphaned reports
- Simple to implement
- Consistent with "user owns their data" model

**Cons:**
- Reports lost when user deleted
- May need backup before user deletion

**Effort:** 30 minutes

**Risk:** Medium (data deletion)

---

### Option 2: ON DELETE SET NULL (Preserves Reports)

**Approach:** Keep reports but set creator to NULL.

```sql
-- Must make column nullable first
ALTER TABLE sparlo_reports ALTER COLUMN created_by DROP NOT NULL;

ALTER TABLE sparlo_reports
DROP CONSTRAINT sparlo_reports_created_by_fkey,
ADD CONSTRAINT sparlo_reports_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE SET NULL;
```

**Pros:**
- Preserves report data
- Useful for audit trails

**Cons:**
- Orphaned reports with no owner
- Complicates ownership checks
- Must handle NULL in code

**Effort:** 1 hour

**Risk:** Low

---

### Option 3: ON DELETE RESTRICT

**Approach:** Prevent user deletion if they have reports.

**Pros:**
- Forces explicit cleanup
- No data loss risk

**Cons:**
- Poor UX for user deletion
- Requires manual cleanup workflow

**Effort:** 30 minutes

**Risk:** Low

## Recommended Action

Implement Option 1 (CASCADE) for Sparlo:
- Reports are user-owned data
- When user leaves, their reports should go with them
- Team reports are tied to `account_id` anyway

Create new migration:
```sql
-- Migration: add_created_by_cascade.sql
ALTER TABLE sparlo_reports
DROP CONSTRAINT IF EXISTS sparlo_reports_created_by_fkey;

ALTER TABLE sparlo_reports
ADD CONSTRAINT sparlo_reports_created_by_fkey
FOREIGN KEY (created_by) REFERENCES auth.users(id) ON DELETE CASCADE;
```

## Technical Details

**Affected files:**
- Create: `apps/web/supabase/migrations/20251217_add_created_by_cascade.sql`

**Testing:**
1. Create test user
2. Create report as test user
3. Delete test user
4. Verify report is also deleted

## Acceptance Criteria

- [ ] Migration created with ON DELETE CASCADE
- [ ] Migration applied successfully
- [ ] Test: deleting user deletes their reports
- [ ] No orphaned reports possible
- [ ] TypeScript types regenerated

## Work Log

### 2025-12-16 - Data Integrity Review Discovery

**By:** Claude Code (Data Integrity Guardian Agent)

**Actions:**
- Identified missing ON DELETE clause on foreign key
- Analyzed implications of orphaned records
- Recommended CASCADE based on product requirements

**Learnings:**
- Always specify ON DELETE behavior for foreign keys
- CASCADE vs SET NULL depends on data ownership model
- Migration needed to fix existing constraint
