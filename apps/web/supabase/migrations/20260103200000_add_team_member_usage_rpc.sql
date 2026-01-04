-- Migration: Add RPC for per-member usage tracking in team accounts
-- This function returns report counts per user for a given team and period

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
language sql
security definer
set search_path = ''
as $$
  select
    u.id as user_id,
    coalesce(
      u.raw_user_meta_data->>'full_name',
      u.raw_user_meta_data->>'name',
      split_part(u.email, '@', 1)
    ) as user_name,
    u.email as user_email,
    count(r.id) as reports_count,
    exists(
      select 1 from public.accounts_memberships am
      where am.account_id = p_account_id
      and am.user_id = u.id
    ) as is_current_member
  from auth.users u
  inner join public.sparlo_reports r on r.created_by = u.id
    and r.account_id = p_account_id
    and r.status = 'complete'
    and r.created_at >= p_period_start
    and r.created_at <= p_period_end
  group by u.id, u.email, u.raw_user_meta_data
  order by count(r.id) desc;
$$;

-- Grant access to authenticated users
grant execute on function public.get_team_member_usage(uuid, timestamptz, timestamptz) to authenticated;

comment on function public.get_team_member_usage is
  'Returns per-member report counts for a team account within a billing period. Used for team usage display.';
