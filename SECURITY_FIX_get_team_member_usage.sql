-- SECURE VERSION: Add authorization check
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
language plpgsql  -- Changed to plpgsql to add authorization logic
security definer
set search_path = ''
as $$
begin
  -- CRITICAL: Verify caller is a member of the account
  if not exists (
    select 1
    from public.accounts_memberships am
    where am.account_id = p_account_id
      and am.user_id = auth.uid()
  ) then
    raise exception 'Access denied: You are not a member of this account'
      using errcode = 'insufficient_privilege';
  end if;

  -- OPTIONAL: Add role-based check if only admins should access this
  -- if not exists (
  --   select 1
  --   from public.accounts_memberships am
  --   where am.account_id = p_account_id
  --     and am.user_id = auth.uid()
  --     and am.role in ('owner', 'admin')
  -- ) then
  --   raise exception 'Access denied: Admin privileges required'
  --     using errcode = 'insufficient_privilege';
  -- end if;

  return query
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
      select 1 from public.accounts_memberships am2
      where am2.account_id = p_account_id
      and am2.user_id = u.id
    ) as is_current_member
  from auth.users u
  inner join public.sparlo_reports r on r.created_by = u.id
    and r.account_id = p_account_id
    and r.status = 'complete'
    and r.created_at >= p_period_start
    and r.created_at <= p_period_end
  group by u.id, u.email, u.raw_user_meta_data
  order by count(r.id) desc;
end;
$$;

-- Keep the same grant
grant execute on function public.get_team_member_usage(uuid, timestamptz, timestamptz) to authenticated;

-- Add security comment
comment on function public.get_team_member_usage is
  'Returns team member usage statistics. Requires caller to be a member of the account.';
