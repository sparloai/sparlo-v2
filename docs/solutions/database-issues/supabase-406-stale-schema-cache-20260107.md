---
title: Supabase 406 Error - Stale Schema Cache
date: 2026-01-07
problem_type: api_error
component: supabase_postgrest
symptoms:
  - "406 Not Acceptable error from Supabase REST API"
  - "Page not rendering due to failed data fetch"
  - "Query selecting valid columns returns 406"
root_cause: stale_schema_cache
severity: moderate
tags: [supabase, postgrest, 406, schema-cache, api-error]
related:
  - docs/solutions/database-issues/supabase-rls-permission-errors-401-406-pgrst116.md
---

# Supabase 406 Error - Stale Schema Cache

## Problem

Settings page (or any page with Supabase queries) fails to render with 406 errors in the console:

```
Failed to load resource: the server responded with a status of 406 ()
```

**URL pattern:**
```
[project].supabase.co/rest/v1/accounts?select=id%2Cname%2Cpicture_url%2Cpublic_data&...
```

## Key Differentiator from PGRST116

This is **NOT** an RLS policy issue. The 406 error here has no PGRST error code - it's a schema cache sync issue.

| Symptom | This Issue | PGRST116 Issue |
|---------|------------|----------------|
| Error code | None (plain 406) | PGRST116 |
| Cause | Stale PostgREST schema cache | Missing RLS policies |
| Schema valid? | Yes | Yes |
| RLS policies exist? | Yes | No or insufficient |

## Root Cause

PostgREST maintains an in-memory cache of the database schema for performance. When the database schema changes (migrations, column additions, etc.), this cache can become stale if not automatically refreshed.

When stale, PostgREST may reject valid queries because it doesn't recognize columns or tables that exist in the actual database.

## Solution

### Via Supabase Dashboard (Recommended)

1. Go to **Supabase Dashboard** for your project
2. Navigate to **Project Settings** (gear icon)
3. Click **API** in the sidebar
4. Click **"Reload schema"** button

### Via SQL (Alternative)

```sql
NOTIFY pgrst, 'reload schema';
```

## Prevention

1. **After applying migrations to production**, always reload the schema cache
2. **Monitor for 406 errors** after deployments that include database changes
3. **Consider automatic schema reload** in CI/CD pipelines after migration steps

## Investigation Checklist

When encountering 406 errors from Supabase:

1. **Check for PGRST error code** in response body
   - If PGRST116 present → RLS policy issue (see related doc)
   - If no error code → likely schema cache issue (this doc)

2. **Verify column exists** in database schema
   ```bash
   pnpm supabase:web:typegen  # Regenerate types to confirm schema
   ```

3. **Check recent migrations** - was one recently applied to production?

4. **Reload schema cache** as first fix attempt

## Related Issues

- [PGRST116 RLS/Permission Errors](./supabase-rls-permission-errors-401-406-pgrst116.md) - Different cause: missing RLS policies vs stale cache
