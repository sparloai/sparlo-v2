-- Add missing SELECT RLS policy to accounts table
-- This fixes 406 errors when querying accounts directly

-- Policy: Users can SELECT their own personal account
-- OR accounts where they are a member (team accounts)
create policy accounts_select on public.accounts
for select
  to authenticated using (
    -- Personal account: user is the primary owner
    (is_personal_account = true and primary_owner_user_id = auth.uid())
    or
    -- Team account: user is a member of the account
    (is_personal_account = false and exists (
      select 1 from public.accounts_memberships
      where account_id = accounts.id
      and user_id = auth.uid()
    ))
  );
