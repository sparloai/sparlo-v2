-- Set super-admin role for alijangbar@gmail.com
UPDATE auth.users
SET raw_app_meta_data = raw_app_meta_data || '{"role": "super-admin"}'::jsonb
WHERE email = 'alijangbar@gmail.com';
