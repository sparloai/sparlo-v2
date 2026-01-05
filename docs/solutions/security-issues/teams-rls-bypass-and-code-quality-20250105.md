---
module: Team Accounts
date: 2025-01-05
problem_type: security_issue
component: database
symptoms:
  - "get_account_members RPC function returns data for any account without membership verification"
  - "Custom TeamsIcon SVG instead of Lucide library icons"
  - "Hardcoded text instead of i18n translations"
  - "Prop drilling isPaidPlan through 3 component layers"
  - "N+1 query pattern when loading team member counts"
root_cause: missing_permission
resolution_type: code_fix
severity: critical
tags: [rls, security, authorization, teams, prop-drilling, n-plus-one, i18n]
---

# Troubleshooting: Teams Page RLS Bypass and Code Quality Issues

## Problem

The `get_account_members` RPC function had no membership verification, allowing any authenticated user to query member data for any team account. Additionally, the Teams feature implementation had multiple P2/P3 code quality issues including prop drilling, N+1 queries, and missing i18n.

## Environment

- Module: Team Accounts
- Rails Version: N/A (Next.js/Supabase)
- Affected Component: Database RPC function, React components, data loaders
- Date: 2025-01-05

## Symptoms

- **P1 (Critical):** Any authenticated user could call `get_account_members('any-slug')` and get member data for accounts they don't belong to
- **P2:** Custom SVG icons instead of using Lucide React library
- **P2:** Hardcoded English text instead of i18n translations
- **P2:** `isPaidPlan` prop passed through layout → NavHeader → NavSidebar (prop drilling)
- **P2:** N+1 query: separate `get_account_members` RPC call for each team to get member count
- **P2:** Missing layout file for Teams page
- **P3:** Missing path config for teams route

## What Didn't Work

**Direct solution:** The problems were identified through code review and fixed on first attempt.

## Solution

### P1: RLS Bypass Fix

Created migration `20260105020902_fix_get_account_members_security.sql`:

```sql
-- Before (broken):
create or replace function public.get_account_members (account_slug text)
returns table (...) language plpgsql as $$
begin
    return QUERY
    select ... from public.accounts_memberships am
    join public.accounts a on a.id = am.account_id
    where a.slug = account_slug;  -- No membership check!
end;
$$;

-- After (fixed):
create or replace function public.get_account_members (account_slug text)
returns table (...) language plpgsql as $$
declare
  target_account_id uuid;
begin
    -- Get account ID
    select a.id into target_account_id
    from public.accounts a
    where a.slug = account_slug
    and a.is_personal_account = false;

    if target_account_id is null then
        return;
    end if;

    -- SECURITY: Verify caller is a member
    if not exists (
        select 1 from public.accounts_memberships
        where account_id = target_account_id
        and user_id = auth.uid()
    ) then
        return;  -- Empty result, don't leak that account exists
    end if;

    -- Safe to return data
    return QUERY select ...;
end;
$$;
```

### P2: Replace Custom Icon with Lucide

```tsx
// Before:
function TeamsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" ...>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6..." />
    </svg>
  );
}

// After:
import { Users } from 'lucide-react';

<Users className="h-[18px] w-[18px]" strokeWidth={1.5} />
```

### P2: Add i18n Translations

Added to `common.json`:
```json
"teams": {
  "title": "Teams",
  "description": "Manage your team members and invitations.",
  "noTeams": "No teams yet",
  "noTeamsDescription": "You're not a member of any teams...",
  "manageMembers": "Manage Members",
  "memberCount": "{{count}} member",
  "memberCount_plural": "{{count}} members"
}
```

Used in components:
```tsx
<Trans i18nKey="common:teams.title" />
<Trans i18nKey="common:teams.memberCount" values={{ count: team.memberCount }} />
```

### P2: Replace Prop Drilling with Context

```tsx
// Before: isPaidPlan passed through 3 layers
// layout.tsx → NavHeader → NavSidebar

// After: NavSidebar uses context directly
import { useAppWorkspace } from '../../_lib/app-workspace-context';

export const NavSidebar = memo(function NavSidebar({ ... }) {
  const { isPaidPlan } = useAppWorkspace();  // Get from context
  // ...
});
```

### P2: Fix N+1 Query with Cache and Parallel Counts

```typescript
// Before: N+1 - one RPC call per team
const teamsWithCounts = await Promise.all(
  accounts.map(async (account) => {
    const { data: members } = await client.rpc('get_account_members', {
      account_slug: account.slug,
    });
    return { ...account, memberCount: members?.length ?? 0 };
  })
);

// After: Parallel count queries with cache wrapper
export const loadTeamsPageData = cache(teamsPageLoader);

async function teamsPageLoader(client) {
  const { data: accounts } = await client
    .from('user_accounts')
    .select('id, name, slug, picture_url')
    .not('slug', 'is', null);

  // Parallel count queries (more efficient than full member fetch)
  const memberCountPromises = validAccounts.map(async (account) => {
    const { count } = await client
      .from('accounts_memberships')
      .select('*', { count: 'exact', head: true })
      .eq('account_id', account.id);
    return { accountId: account.id, count: count ?? 0 };
  });

  const memberCounts = await Promise.all(memberCountPromises);
  // ...
}
```

### P2: Add Layout File

Created `teams/layout.tsx`:
```tsx
async function TeamsLayout(props: React.PropsWithChildren) {
  const workspace = await loadUserWorkspace();

  if (!workspace.isPaidPlan) {
    redirect('/home/billing');
  }

  return (
    <>
      <HomeLayoutPageHeader
        title={<Trans i18nKey="common:teams.title" />}
        description={<AppBreadcrumbs />}
      />
      {props.children}
    </>
  );
}
```

### P3: Add Path Config

```typescript
// paths.config.ts
app: {
  // ...
  personalAccountTeams: '/home/teams',
}
```

## Why This Works

1. **RLS Bypass:** The original function had no authorization check. By verifying `auth.uid()` exists in `accounts_memberships` before returning data, we ensure only legitimate team members can access member information. Returning empty results (not errors) prevents attackers from discovering which account slugs exist.

2. **Lucide Icons:** Consistent with the rest of the codebase, reduces bundle size, and provides standardized icon styling.

3. **i18n:** Enables localization and maintains consistency with the rest of the app.

4. **Context vs Prop Drilling:** The `AppWorkspaceProvider` already wraps the entire user layout, so `isPaidPlan` is available to all descendants without explicitly passing it through intermediate components.

5. **N+1 Fix:** Using `count: 'exact', head: true` returns only the count without fetching actual rows. This is more efficient than fetching all members just to count them. The `cache()` wrapper ensures the loader is deduplicated within a single request.

6. **Layout File:** Centralizes access control and header rendering, following the pattern of other pages like `/settings` and `/billing`.

## Prevention

- **Always add membership verification** to RPC functions that return team-specific data
- **Use existing UI libraries** (Lucide) instead of custom SVGs
- **Use i18n from the start** for all user-facing text
- **Prefer context over prop drilling** when data is needed 3+ levels deep
- **Use count queries** instead of fetching full records when only counting
- **Create layout files** for new page directories to centralize access control

## Related Issues

- See also: [p1-security-fixes-code-review-20251223.md](./p1-security-fixes-code-review-20251223.md) - Previous P1 security fixes from code review
- See also: [share-button-security-refactor-20251229.md](./share-button-security-refactor-20251229.md) - Share button security improvements
