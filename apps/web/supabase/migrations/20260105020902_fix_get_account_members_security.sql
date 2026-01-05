-- Fix security vulnerability in get_account_members function
-- Previously, any authenticated user could query any account's members
-- Now, the function verifies the caller is a member of the account

-- Drop and recreate the function with membership verification
create or replace function public.get_account_members (account_slug text) returns table (
  id uuid,
  user_id uuid,
  account_id uuid,
  role varchar(50),
  role_hierarchy_level int,
  primary_owner_user_id uuid,
  name varchar,
  email varchar,
  picture_url varchar,
  created_at timestamptz,
  updated_at timestamptz
) language plpgsql
set search_path = '' as $$
declare
  target_account_id uuid;
begin
    -- First, get the account ID from the slug
    select a.id into target_account_id
    from public.accounts a
    where a.slug = account_slug
    and a.is_personal_account = false;

    -- If no account found, return empty result
    if target_account_id is null then
        return;
    end if;

    -- SECURITY: Verify the caller is a member of this account
    if not exists (
        select 1 from public.accounts_memberships
        where account_id = target_account_id
        and user_id = auth.uid()
    ) then
        -- User is not a member, return empty result (don't leak that account exists)
        return;
    end if;

    -- User is verified as a member, return the members list
    return QUERY
    select
        acc.id,
        am.user_id,
        am.account_id,
        am.account_role,
        r.hierarchy_level,
        a.primary_owner_user_id,
        acc.name,
        acc.email,
        acc.picture_url,
        am.created_at,
        am.updated_at
    from
        public.accounts_memberships am
        join public.accounts a on a.id = am.account_id
        join public.accounts acc on acc.id = am.user_id
        join public.roles r on r.name = am.account_role
    where
        a.slug = account_slug;

end;
$$;

-- Also update the schema file comment to document the security requirement
comment on function public.get_account_members(text) is
  'Get members of a team account by slug. Only returns data if the caller is a member of the account.';
