---
title: "Supabase Migration Drift: Resolving Remote/Local Mismatch"
category: database-issues
date: 2026-01-07
component: supabase-cli
severity: medium
affects:
  - local-development
  - database-migrations
  - ci-cd-pipeline
tags:
  - supabase
  - migrations
  - cli
  - drift
  - repair
root_cause: "Parallel database changes applied directly to production without corresponding local migration files"
resolution_type: migration-repair
---

# Supabase Migration Drift: Resolving Remote/Local Mismatch

## Problem Summary

When attempting to push new local migrations to a remote Supabase database, the CLI blocked operations because the remote database contained migrations not present locally. This happens when database changes are made directly to production (via dashboard, direct SQL, or other processes) without creating corresponding local migration files.

## Symptoms

1. `supabase db push` fails with error:
   ```
   Remote migration versions not found in local migrations directory.
   ```

2. `supabase db pull` fails with similar drift error

3. `supabase migrations list` shows mismatched states:
   ```
   Local          | Remote         | Time (UTC)
   ---------------|----------------|---------------------
   20251215000000 | 20251215000000 | 2025-12-15 00:00:00
                  | 20251216000000 | 2025-12-16 00:00:00  <- Remote only
                  | 20251217000000 | 2025-12-17 00:00:00  <- Remote only
   20260107082024 |                | 2026-01-07 08:20:24  <- Local only
   ```

## Root Cause

Migrations were applied directly to the production database without going through the local migration file workflow. This creates a state where:
- Remote has migrations the CLI doesn't recognize locally
- Local has new migrations that can't be pushed due to the drift
- CLI safety checks prevent operations that could cause data loss

## Solution

### Step 1: Check Migration Status

```bash
pnpm --filter web supabase migrations list
```

This shows you exactly which migrations exist where.

### Step 2: Mark Remote-Only Migrations as "Reverted"

Use the `migration repair` command to tell the CLI to ignore the remote-only migrations. This does NOT actually revert them - the schema changes remain in place. It simply updates the migration tracking table.

```bash
pnpm supabase migration repair --status reverted \
  20251216000000 20251217000000 20251218000000 \
  [... all remote-only migration IDs]
```

The CLI will output the exact command with all migration IDs when `db push` or `db pull` fails.

### Step 3: Push Your New Migrations

```bash
pnpm supabase db push
```

Now the CLI will only apply your new local migrations that haven't been applied yet.

### Step 4: Regenerate Types from Remote

After pushing, regenerate TypeScript types from the remote database:

```bash
# Important: redirect stderr to avoid CLI output in the file
supabase gen types typescript --linked 2>/dev/null > packages/supabase/src/database.types.ts
supabase gen types typescript --linked 2>/dev/null > apps/web/lib/database.types.ts
```

**Gotcha**: The standard `pnpm supabase:typegen` script uses `--local` flag which generates types from your local database. If your local DB is out of sync, use `--linked` to generate from the remote.

## Complete Command Sequence

```bash
# 1. Check status
pnpm --filter web supabase migrations list

# 2. Mark remote-only migrations (CLI provides exact versions)
pnpm supabase migration repair --status reverted 20251216000000 20251217000000 ...

# 3. Push new migrations
pnpm supabase db push

# 4. Regenerate types from remote
supabase gen types typescript --linked 2>/dev/null > packages/supabase/src/database.types.ts
supabase gen types typescript --linked 2>/dev/null > apps/web/lib/database.types.ts

# 5. Verify
pnpm typecheck
```

## Why This Works

The `migration repair --status reverted` command updates the `supabase_migrations` tracking table in the remote database. It marks those migrations as "reverted" which tells the CLI:
- "Yes, I know these migrations exist in the history"
- "No, I don't have local files for them"
- "That's okay, proceed anyway"

The actual schema changes from those migrations remain intact - only the tracking metadata is updated.

## Prevention Strategies

1. **Always create migration files** for schema changes, even "quick fixes"
2. **Never run SQL directly** in production dashboard for schema changes
3. **Regular sync checks**: Run `supabase migrations list` weekly
4. **Use CI/CD**: Deploy migrations through pipelines, not manually
5. **Pull before creating new migrations**: `supabase db pull` to sync first

## Warning Signs

- `migrations list` showing gaps between local and remote
- Team members making direct SQL changes to production
- Types file not matching actual database schema
- RPC functions existing in production but not in types

## Related Documentation

- `/apps/web/supabase/CLAUDE.md` - Migration workflow documentation
- `/packages/supabase/CLAUDE.md` - Database security guidelines
- `/docs/solutions/integration-issues/postgrest-version-mismatch-makerkit-20251230.md` - Related type generation issue

## Key Takeaway

When you see migration drift, don't panic. The `migration repair` command is your friend - it lets you acknowledge the drift and move forward without losing any data or schema changes.
