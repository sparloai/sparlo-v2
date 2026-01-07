/*
 * Remove MFA requirement from is_super_admin function
 * This allows super admins to access admin pages without MFA enabled
 */

create or replace function public.is_super_admin() returns boolean
    set search_path = '' as
$$
declare
    is_super_admin boolean;
begin
    -- Removed MFA (aal2) requirement
    select (auth.jwt() ->> 'app_metadata')::jsonb ->> 'role' = 'super-admin' into is_super_admin;

    return coalesce(is_super_admin, false);
end
$$ language plpgsql;
