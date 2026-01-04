-- Migration: Fix security and data integrity issues in get_team_member_usage
-- Fixes:
--   P1: Authorization bypass (add has_role_on_account check)
--   P1: INNER JOIN excludes zero-report members (use LEFT JOIN from memberships)
--   P1: Missing composite index for performance
--   P2: Correlated EXISTS subquery (replace with LEFT JOIN)
--   P2: GROUP BY on JSONB column (remove raw_user_meta_data)
--   P2: Former members not tracked (include with is_current_member = false)

-- 1. Add composite index for usage query performance
create index concurrently if not exists idx_sparlo_reports_usage_tracking
  on public.sparlo_reports(created_by, account_id, status, created_at desc)
  where status = 'complete';

comment on index idx_sparlo_reports_usage_tracking is
  'Optimizes team member usage queries - filters on created_by + account_id + status + created_at';

-- 2. Replace function with secure, corrected implementation
create or replace function public.get_team_member_usage(
  p_account_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns table (
  user_id uuid,
  user_name text,
  user_email text,
  reports_count bigint,
  is_current_member boolean
)
language plpgsql
security definer
set search_path = ''
as $$
begin
  -- CRITICAL: Verify caller has access to this account
  -- This prevents unauthorized access to team member data
  if not public.has_role_on_account(p_account_id) then
    raise exception 'Access denied: You do not have permission to view this account''s usage data'
      using errcode = 'insufficient_privilege';
  end if;

  -- Return all current members (including those with 0 reports)
  -- PLUS former members who have reports in the period
  return query
  with current_members as (
    -- All current team members with their report counts
    select
      u.id as user_id,
      coalesce(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1),
        'Unknown User'
      ) as user_name,
      u.email as user_email,
      count(r.id) as reports_count,
      true as is_current_member
    from public.accounts_memberships am
    inner join auth.users u on u.id = am.user_id
    left join public.sparlo_reports r on r.created_by = u.id
      and r.account_id = p_account_id
      and r.status = 'complete'
      and r.created_at >= p_period_start
      and r.created_at < p_period_end  -- Exclusive upper bound to avoid double-counting
    where am.account_id = p_account_id
    group by u.id, u.email
  ),
  former_members as (
    -- Former members who created reports during this period
    select
      u.id as user_id,
      coalesce(
        u.raw_user_meta_data->>'full_name',
        u.raw_user_meta_data->>'name',
        split_part(u.email, '@', 1),
        'Unknown User'
      ) as user_name,
      u.email as user_email,
      count(r.id) as reports_count,
      false as is_current_member
    from auth.users u
    inner join public.sparlo_reports r on r.created_by = u.id
      and r.account_id = p_account_id
      and r.status = 'complete'
      and r.created_at >= p_period_start
      and r.created_at < p_period_end
    where not exists (
      select 1 from public.accounts_memberships am
      where am.account_id = p_account_id
      and am.user_id = u.id
    )
    group by u.id, u.email
  )
  select * from current_members
  union all
  select * from former_members
  order by reports_count desc, user_name asc;
end;
$$;

comment on function public.get_team_member_usage is
  'Returns per-member report counts for a team account within a billing period.
   Includes all current members (even with 0 reports) and former members with reports.
   Requires caller to be a member of the account (enforced via has_role_on_account).';
